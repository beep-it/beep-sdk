/**
 * Types for the Seal Key Vault plugin.
 *
 * Seal is a Decentralized Secrets Management system on Sui that uses
 * Identity-Based Encryption (IBE) with threshold key servers.
 * See: https://github.com/MystenLabs/seal
 */

/** Configuration for connecting to a Seal vault */
export interface SealVaultConfig {
  /** Seal Move package ID on Sui */
  packageId: string;
  /** Seal key server URLs for threshold decryption */
  sealServers: string[];
  /** Minimum number of key servers required for decryption */
  threshold: number;
  /** Path to the operator's Sui keypair file (same format as `sui client`) */
  operatorKeypairPath: string;
  /** Object ID of the encrypted vault stored on-chain */
  vaultObjectId: string;
  /** Sui RPC URL (defaults to mainnet) */
  suiRpcUrl?: string;
}

/** Provider API keys stored in the vault */
export interface ProviderKeys {
  openai?: string;
  anthropic?: string;
  aggregatorApiKey?: string;
  aggregatorBaseUrl?: string;
  ollamaUrl?: string;
}

/** Result of storing keys to the vault */
export interface VaultStoreResult {
  /** On-chain object ID of the encrypted vault */
  vaultObjectId: string;
  /** Number of keys stored */
  keyCount: number;
  /** Sui transaction digest */
  txDigest: string;
}
