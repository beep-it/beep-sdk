#!/usr/bin/env node

import { Command } from 'commander';
import { createGatewayServer } from '../server';
import { loadConfig, validateConfig, DEFAULT_PLATFORM_FEE, loadProviderKeysFromSeal, applySealKeys } from '../config';

const program = new Command();

program
  .name('beep-ai')
  .description('Beep AI Gateway — Open-source LLM inference gateway with a402 payment on Sui')
  .version('0.1.0');

program
  .command('start')
  .description('Start the AI gateway server')
  .option('-p, --port <port>', 'Port to listen on', '3402')
  .option('-h, --host <host>', 'Host to bind to', '0.0.0.0')
  .option('--recipient <address>', 'Sui wallet address to receive payments')
  .option('--beep-api-key <key>', 'Beep API key for payment verification')
  .option('--beep-server-url <url>', 'Beep server URL')
  .option('--cost-multiplier <multiplier>', 'Platform fee multiplier (1.05 = 5% fee, 1.0 = no fee)', String(DEFAULT_PLATFORM_FEE))
  .option('--seal-vault <objectId>', 'Seal vault object ID for encrypted provider keys')
  .action(async (options) => {
    let config = loadConfig({
      port: parseInt(options.port, 10),
      host: options.host,
      recipientAddress: options.recipient,
      beepApiKey: options.beepApiKey,
      beepServerUrl: options.beepServerUrl,
      costMultiplier: parseFloat(options.costMultiplier),
    });

    // If --seal-vault is specified, override the env var
    if (options.sealVault) {
      process.env.SEAL_VAULT_OBJECT_ID = options.sealVault;
    }

    // Try loading keys from Seal vault (env or CLI flag)
    try {
      const sealKeys = await loadProviderKeysFromSeal();
      if (sealKeys) {
        config = applySealKeys(config, sealKeys);
      }
    } catch (err: any) {
      console.warn(`[seal] Failed to load keys from Seal vault: ${err.message}`);
      console.warn('[seal] Falling back to environment variable provider keys.');
    }

    const errors = validateConfig(config);
    if (errors.length > 0) {
      console.error('Configuration errors:');
      for (const err of errors) {
        console.error(`  - ${err}`);
      }
      console.error('\nSet these via environment variables or CLI flags.');
      process.exit(1);
    }

    const app = createGatewayServer(config);

    app.listen(config.port, config.host, () => {
      console.log(`
  ____                      _    ___    ____       _
 | __ )  ___  ___ _ __     / \\  |_ _|  / ___| __ _| |_ _____      ____ _ _   _
 |  _ \\ / _ \\/ _ \\ '_ \\   / _ \\  | |  | |  _ / _\` | __/ _ \\ \\ /\\ / / _\` | | | |
 | |_) |  __/  __/ |_) | / ___ \\ | |  | |_| | (_| | ||  __/\\ V  V / (_| | |_| |
 |____/ \\___|\\___| .__/ /_/   \\_\\___|  \\____|\\__,_|\\__\\___| \\_/\\_/ \\__,_|\\__, |
                 |_|                                                      |___/

  Open-source AI inference gateway powered by a402 on Sui

  Server:       http://${config.host}:${config.port}
  Recipient:    ${config.recipientAddress}
  Platform fee: ${((config.costMultiplier || DEFAULT_PLATFORM_FEE) - 1) * 100}%
  Providers:    ${Object.entries(config.providers)
    .filter(([_, v]) => v)
    .map(([k]) => k)
    .join(', ')}
  Points:       ${config.reportUsageForPoints ? 'enabled' : 'disabled'}

  Endpoints:
    GET  /v1/models              List available models
    POST /v1/chat/completions    Chat completions (a402-gated)
    POST /v1/estimate            Estimate cost (free)
    GET  /v1/session/:id         Check session balance
    GET  /health                 Health check
      `);
    });
  });

// Seal vault management commands
const vault = program
  .command('vault')
  .description('Manage Seal key vault for encrypted provider key storage');

vault
  .command('store')
  .description('Encrypt and store provider API keys to a Seal vault on Sui')
  .option('--openai <key>', 'OpenAI API key')
  .option('--anthropic <key>', 'Anthropic API key')
  .option('--aggregator-key <key>', 'Aggregator API key')
  .option('--aggregator-url <url>', 'Aggregator base URL')
  .option('--ollama-url <url>', 'Ollama URL')
  .action(async (options) => {
    const { SealKeyVault, loadSealVaultConfig } = await import('../plugins/seal-vault');

    const sealConfig = loadSealVaultConfig();
    if (!sealConfig) {
      console.error('Seal vault not configured. Set SEAL_PACKAGE_ID, SEAL_SERVER_URLS, OPERATOR_KEYPAIR_PATH.');
      process.exit(1);
    }

    const keys: Record<string, string | undefined> = {};
    if (options.openai) keys.openai = options.openai;
    if (options.anthropic) keys.anthropic = options.anthropic;
    if (options.aggregatorKey) keys.aggregatorApiKey = options.aggregatorKey;
    if (options.aggregatorUrl) keys.aggregatorBaseUrl = options.aggregatorUrl;
    if (options.ollamaUrl) keys.ollamaUrl = options.ollamaUrl;

    if (Object.keys(keys).length === 0) {
      console.error('No keys provided. Use --openai, --anthropic, etc.');
      process.exit(1);
    }

    console.log(`Encrypting ${Object.keys(keys).length} key(s) with Seal...`);

    const vault = new SealKeyVault(sealConfig);
    const result = await vault.storeKeys(keys);

    console.log(`\nVault created successfully!`);
    console.log(`  Object ID: ${result.vaultObjectId}`);
    console.log(`  Keys stored: ${result.keyCount}`);
    console.log(`  Tx digest: ${result.txDigest}`);
    console.log(`\nTo use this vault, set:`);
    console.log(`  SEAL_VAULT_OBJECT_ID=${result.vaultObjectId}`);
    console.log(`\nOr start with:`);
    console.log(`  beep-ai start --seal-vault ${result.vaultObjectId}`);
  });

vault
  .command('show')
  .description('Show which keys are stored in the Seal vault (names only, not values)')
  .action(async () => {
    const { SealKeyVault, loadSealVaultConfig } = await import('../plugins/seal-vault');

    const sealConfig = loadSealVaultConfig();
    if (!sealConfig) {
      console.error('Seal vault not configured. Set SEAL_VAULT_OBJECT_ID and related env vars.');
      process.exit(1);
    }

    console.log(`Loading vault ${sealConfig.vaultObjectId}...`);

    const sealVault = new SealKeyVault(sealConfig);
    const keyNames = await sealVault.listStoredKeys();

    console.log(`\nStored keys (${keyNames.length}):`);
    for (const name of keyNames) {
      console.log(`  - ${name}`);
    }
  });

program.parse();
