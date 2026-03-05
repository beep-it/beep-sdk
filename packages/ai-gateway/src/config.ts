import { GatewayConfig } from './types';
import type { SealVaultConfig, ProviderKeys } from './plugins/seal-vault-types';

/** Default platform fee: 5% on top of base model costs */
export const DEFAULT_PLATFORM_FEE = 1.05;

/** Load gateway configuration from environment variables */
export function loadConfig(overrides?: Partial<GatewayConfig>): GatewayConfig {
  const config: GatewayConfig = {
    port: parseInt(process.env.GATEWAY_PORT || '3402', 10),
    host: process.env.GATEWAY_HOST || '0.0.0.0',
    recipientAddress: process.env.RECIPIENT_ADDRESS || '',
    beepApiKey: process.env.BEEP_API_KEY || '',
    beepServerUrl: process.env.BEEP_SERVER_URL || 'https://api.justbeep.it',
    providers: {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      aggregatorApiKey: process.env.AGGREGATOR_API_KEY,
      aggregatorBaseUrl: process.env.AGGREGATOR_BASE_URL,
      ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    },
    costMultiplier: parseFloat(process.env.COST_MULTIPLIER || String(DEFAULT_PLATFORM_FEE)),
    reportUsageForPoints: process.env.REPORT_USAGE_FOR_POINTS === 'true',
    ...overrides,
  };

  return config;
}

/**
 * Load provider keys from a Seal vault if configured.
 * Falls back gracefully — returns null if Seal is not configured.
 */
export async function loadProviderKeysFromSeal(): Promise<ProviderKeys | null> {
  // Dynamic import so the plugin doesn't break builds without @mysten/seal
  const { loadSealVaultConfig, SealKeyVault } = await import('./plugins/seal-vault');
  const sealConfig = loadSealVaultConfig();
  if (!sealConfig) return null;

  console.log('[seal] Loading provider keys from Seal vault...');
  const vault = new SealKeyVault(sealConfig);
  const keys = await vault.loadKeys();
  const keyNames = Object.entries(keys)
    .filter(([_, v]) => v)
    .map(([k]) => k);
  console.log(`[seal] Loaded ${keyNames.length} keys: ${keyNames.join(', ')}`);
  return keys;
}

/**
 * Apply Seal vault keys to the gateway config, merging with env-based providers.
 * Seal keys take precedence over env vars.
 */
export function applySealKeys(config: GatewayConfig, keys: ProviderKeys): GatewayConfig {
  return {
    ...config,
    providers: {
      ...config.providers,
      openai: keys.openai || config.providers.openai,
      anthropic: keys.anthropic || config.providers.anthropic,
      aggregatorApiKey: keys.aggregatorApiKey || config.providers.aggregatorApiKey,
      aggregatorBaseUrl: keys.aggregatorBaseUrl || config.providers.aggregatorBaseUrl,
      ollamaUrl: keys.ollamaUrl || config.providers.ollamaUrl,
    },
  };
}

/** Validate that required config is present */
export function validateConfig(config: GatewayConfig): string[] {
  const errors: string[] = [];

  if (!config.recipientAddress) {
    errors.push('RECIPIENT_ADDRESS is required (Sui wallet address to receive payments)');
  }

  if (!config.beepApiKey) {
    errors.push('BEEP_API_KEY is required for payment verification');
  }

  const hasProvider =
    config.providers.openai ||
    config.providers.anthropic ||
    config.providers.aggregatorApiKey ||
    config.providers.ollamaUrl;

  if (!hasProvider) {
    errors.push('At least one provider API key must be configured');
  }

  return errors;
}
