/**
 * Seal Key Vault Plugin
 *
 * Optional plugin that uses MystenLabs/Seal for on-chain encrypted storage
 * of provider API keys. Operators who don't want to manage .env files can
 * encrypt their keys on Sui with policy-gated decryption.
 *
 * Dependencies (@mysten/seal, @mysten/sui) are optional peer deps loaded
 * via dynamic import — the gateway works without them.
 */

import { readFileSync } from 'fs';
import type { SealVaultConfig, ProviderKeys, VaultStoreResult } from './seal-vault-types';

export class SealKeyVault {
  private config: SealVaultConfig;

  constructor(config: SealVaultConfig) {
    this.config = config;
  }

  /**
   * Load and decrypt provider API keys from the Seal vault.
   * Uses the operator's Sui keypair for decryption via allowlist policy.
   */
  async loadKeys(): Promise<ProviderKeys> {
    const { SealClient } = await this.importSeal();
    const { SuiClient } = await this.importSui();
    const keypair = await this.loadKeypair();

    const suiClient = new SuiClient({
      url: this.config.suiRpcUrl || 'https://fullnode.mainnet.sui.io:443',
    });

    const sealClient = new SealClient({
      suiClient,
      serverObjectIds: this.config.sealServers,
      verifyKeyServers: true,
    });

    // Fetch the encrypted vault object from Sui
    const vaultObject = await suiClient.getObject({
      id: this.config.vaultObjectId,
      options: { showContent: true },
    });

    if (!vaultObject.data?.content || vaultObject.data.content.dataType !== 'moveObject') {
      throw new Error(`Seal vault object ${this.config.vaultObjectId} not found or invalid`);
    }

    // Extract encrypted data from the Move object fields
    const fields = vaultObject.data.content.fields as Record<string, any>;
    const encryptedData = fields.encrypted_data;

    if (!encryptedData) {
      throw new Error('Vault object does not contain encrypted_data field');
    }

    const encryptedBytes = typeof encryptedData === 'string'
      ? Uint8Array.from(Buffer.from(encryptedData, 'base64'))
      : new Uint8Array(encryptedData);

    // Decrypt using Seal — this calls seal_approve on the allowlist policy contract
    const decryptedBytes = await sealClient.decrypt({
      data: encryptedBytes,
      sessionKey: keypair,
      txBytes: await this.buildDecryptTx(suiClient, keypair),
    });

    const decryptedJson = new TextDecoder().decode(decryptedBytes);
    const keys: ProviderKeys = JSON.parse(decryptedJson);

    return keys;
  }

  /**
   * Encrypt and store provider API keys to Seal on Sui.
   * Creates a new vault object using the allowlist policy.
   */
  async storeKeys(keys: ProviderKeys): Promise<VaultStoreResult> {
    const { SealClient } = await this.importSeal();
    const { SuiClient } = await this.importSui();
    const keypair = await this.loadKeypair();

    const suiClient = new SuiClient({
      url: this.config.suiRpcUrl || 'https://fullnode.mainnet.sui.io:443',
    });

    const sealClient = new SealClient({
      suiClient,
      serverObjectIds: this.config.sealServers,
      verifyKeyServers: true,
    });

    // Serialize keys to JSON bytes
    const keyJson = JSON.stringify(keys);
    const plaintext = new TextEncoder().encode(keyJson);

    // Encrypt using Seal with the operator's address as the policy ID
    const policyObjectBytes = new TextEncoder().encode(this.config.packageId);
    const encrypted = await sealClient.encrypt({
      threshold: this.config.threshold,
      packageId: this.config.packageId,
      id: policyObjectBytes,
      data: plaintext,
    });

    // Store encrypted blob on-chain via Move call
    const { Transaction } = await this.importSuiTransactions();
    const tx = new Transaction();
    tx.setSender(keypair.toSuiAddress());

    // Call the vault store function that creates the encrypted object
    tx.moveCall({
      target: `${this.config.packageId}::vault::store`,
      arguments: [
        tx.pure.vector('u8', Array.from(encrypted)),
      ],
    });

    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: { showObjectChanges: true },
    });

    // Find the created vault object ID
    const created = result.objectChanges?.find(
      (change: any) => change.type === 'created',
    );

    if (!created || created.type !== 'created') {
      throw new Error('Failed to create vault object on-chain');
    }

    const keyCount = Object.values(keys).filter(Boolean).length;

    return {
      vaultObjectId: created.objectId,
      keyCount,
      txDigest: result.digest,
    };
  }

  /**
   * List which key names are stored in the vault (without revealing values).
   */
  async listStoredKeys(): Promise<string[]> {
    const keys = await this.loadKeys();
    return Object.entries(keys)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key]) => key);
  }

  // ---- Private helpers ----

  /**
   * Build the transaction bytes needed for Seal decryption approval.
   * This calls seal_approve on the allowlist policy contract.
   */
  private async buildDecryptTx(
    suiClient: any,
    keypair: any,
  ): Promise<Uint8Array> {
    const { Transaction } = await this.importSuiTransactions();
    const tx = new Transaction();
    tx.setSender(keypair.toSuiAddress());

    tx.moveCall({
      target: `${this.config.packageId}::vault::seal_approve`,
      arguments: [
        tx.pure.address(this.config.vaultObjectId),
      ],
    });

    const builtTx = await tx.build({ client: suiClient });
    return builtTx;
  }

  /**
   * Load the operator's Sui keypair from the configured file path.
   */
  private async loadKeypair(): Promise<any> {
    const { Ed25519Keypair } = await this.importSuiKeypairs();
    const keypairData = readFileSync(this.config.operatorKeypairPath, 'utf-8').trim();

    // Support both raw base64 and Sui CLI keystore format (array of base64 keys)
    let decoded: string;
    try {
      const parsed = JSON.parse(keypairData);
      // Sui CLI keystore format: array of base64-encoded keypairs
      decoded = Array.isArray(parsed) ? parsed[0] : keypairData;
    } catch {
      decoded = keypairData;
    }

    return Ed25519Keypair.fromSecretKey(decoded);
  }

  /**
   * Dynamic import of @mysten/seal (optional peer dependency).
   */
  private async importSeal(): Promise<any> {
    try {
      return await import('@mysten/seal');
    } catch {
      throw new Error(
        'Seal Key Vault requires @mysten/seal. Install it with: pnpm add @mysten/seal',
      );
    }
  }

  /**
   * Dynamic import of @mysten/sui/client (optional peer dependency).
   */
  private async importSui(): Promise<any> {
    try {
      return await import('@mysten/sui/client');
    } catch {
      throw new Error(
        'Seal Key Vault requires @mysten/sui. Install it with: pnpm add @mysten/sui',
      );
    }
  }

  /**
   * Dynamic import of @mysten/sui/transactions.
   */
  private async importSuiTransactions(): Promise<any> {
    try {
      return await import('@mysten/sui/transactions');
    } catch {
      throw new Error(
        'Seal Key Vault requires @mysten/sui. Install it with: pnpm add @mysten/sui',
      );
    }
  }

  /**
   * Dynamic import of @mysten/sui/keypairs/ed25519.
   */
  private async importSuiKeypairs(): Promise<any> {
    try {
      return await import('@mysten/sui/keypairs/ed25519');
    } catch {
      throw new Error(
        'Seal Key Vault requires @mysten/sui. Install it with: pnpm add @mysten/sui',
      );
    }
  }
}

/**
 * Load Seal vault configuration from environment variables.
 * Returns null if SEAL_VAULT_OBJECT_ID is not set (Seal not configured).
 */
export function loadSealVaultConfig(): SealVaultConfig | null {
  const vaultObjectId = process.env.SEAL_VAULT_OBJECT_ID;
  if (!vaultObjectId) return null;

  const packageId = process.env.SEAL_PACKAGE_ID;
  if (!packageId) {
    throw new Error('SEAL_PACKAGE_ID is required when SEAL_VAULT_OBJECT_ID is set');
  }

  const operatorKeypairPath = process.env.OPERATOR_KEYPAIR_PATH;
  if (!operatorKeypairPath) {
    throw new Error('OPERATOR_KEYPAIR_PATH is required when SEAL_VAULT_OBJECT_ID is set');
  }

  const serverUrls = process.env.SEAL_SERVER_URLS;
  if (!serverUrls) {
    throw new Error('SEAL_SERVER_URLS is required when SEAL_VAULT_OBJECT_ID is set (comma-separated object IDs)');
  }

  return {
    packageId,
    sealServers: serverUrls.split(',').map((s) => s.trim()),
    threshold: parseInt(process.env.SEAL_THRESHOLD || '2', 10),
    operatorKeypairPath,
    vaultObjectId,
    suiRpcUrl: process.env.SUI_RPC_URL,
  };
}
