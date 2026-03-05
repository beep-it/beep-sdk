import { loadConfig, validateConfig, DEFAULT_PLATFORM_FEE, applySealKeys } from '../src/config';
import { GatewayConfig } from '../src/types';
import { ProviderKeys } from '../src/plugins/seal-vault-types';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('loads defaults when no env vars set', () => {
    delete process.env.GATEWAY_PORT;
    delete process.env.GATEWAY_HOST;
    delete process.env.RECIPIENT_ADDRESS;
    delete process.env.BEEP_API_KEY;
    delete process.env.BEEP_SERVER_URL;
    delete process.env.COST_MULTIPLIER;
    delete process.env.REPORT_USAGE_FOR_POINTS;

    const config = loadConfig();
    expect(config.port).toBe(3402);
    expect(config.host).toBe('0.0.0.0');
    expect(config.beepServerUrl).toBe('https://api.justbeep.it');
    expect(config.costMultiplier).toBe(DEFAULT_PLATFORM_FEE);
    expect(config.reportUsageForPoints).toBe(false);
  });

  it('reads env vars', () => {
    process.env.GATEWAY_PORT = '8080';
    process.env.GATEWAY_HOST = '127.0.0.1';
    process.env.RECIPIENT_ADDRESS = '0xabc';
    process.env.BEEP_API_KEY = 'key123';
    process.env.BEEP_SERVER_URL = 'https://custom.api.com';
    process.env.OPENAI_API_KEY = 'sk-openai';
    process.env.ANTHROPIC_API_KEY = 'sk-anthropic';
    process.env.COST_MULTIPLIER = '1.10';
    process.env.REPORT_USAGE_FOR_POINTS = 'true';

    const config = loadConfig();
    expect(config.port).toBe(8080);
    expect(config.host).toBe('127.0.0.1');
    expect(config.recipientAddress).toBe('0xabc');
    expect(config.beepApiKey).toBe('key123');
    expect(config.beepServerUrl).toBe('https://custom.api.com');
    expect(config.providers.openai).toBe('sk-openai');
    expect(config.providers.anthropic).toBe('sk-anthropic');
    expect(config.costMultiplier).toBe(1.10);
    expect(config.reportUsageForPoints).toBe(true);
  });

  it('overrides take priority over env vars', () => {
    process.env.GATEWAY_PORT = '8080';
    const config = loadConfig({ port: 9999 });
    expect(config.port).toBe(9999);
  });

  it('REPORT_USAGE_FOR_POINTS only true for exact string "true"', () => {
    process.env.REPORT_USAGE_FOR_POINTS = 'false';
    expect(loadConfig().reportUsageForPoints).toBe(false);

    process.env.REPORT_USAGE_FOR_POINTS = '1';
    expect(loadConfig().reportUsageForPoints).toBe(false);

    process.env.REPORT_USAGE_FOR_POINTS = 'true';
    expect(loadConfig().reportUsageForPoints).toBe(true);
  });
});

describe('validateConfig', () => {
  const validConfig: GatewayConfig = {
    port: 3402,
    host: '0.0.0.0',
    recipientAddress: '0xrecipient',
    beepApiKey: 'test-key',
    beepServerUrl: 'https://api.test.com',
    providers: { openai: 'sk-test' },
  };

  it('returns empty array for valid config', () => {
    expect(validateConfig(validConfig)).toEqual([]);
  });

  it('errors when recipientAddress is missing', () => {
    const config = { ...validConfig, recipientAddress: '' };
    const errors = validateConfig(config);
    expect(errors.some((e) => e.includes('RECIPIENT_ADDRESS'))).toBe(true);
  });

  it('errors when beepApiKey is missing', () => {
    const config = { ...validConfig, beepApiKey: '' };
    const errors = validateConfig(config);
    expect(errors.some((e) => e.includes('BEEP_API_KEY'))).toBe(true);
  });

  it('errors when no providers configured', () => {
    const config = { ...validConfig, providers: {} as any };
    const errors = validateConfig(config);
    expect(errors.some((e) => e.includes('provider'))).toBe(true);
  });

  it('passes with only anthropic key', () => {
    const config = {
      ...validConfig,
      providers: { anthropic: 'sk-anthropic' } as any,
    };
    expect(validateConfig(config)).toEqual([]);
  });

  it('passes with only aggregator key', () => {
    const config = {
      ...validConfig,
      providers: { aggregatorApiKey: 'agg-key' } as any,
    };
    expect(validateConfig(config)).toEqual([]);
  });

  it('returns multiple errors at once', () => {
    const config: GatewayConfig = {
      port: 3402,
      host: '0.0.0.0',
      recipientAddress: '',
      beepApiKey: '',
      beepServerUrl: '',
      providers: {} as any,
    };
    const errors = validateConfig(config);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('applySealKeys', () => {
  const baseConfig: GatewayConfig = {
    port: 3402,
    host: '0.0.0.0',
    recipientAddress: '0x123',
    beepApiKey: 'key',
    beepServerUrl: 'https://api.test.com',
    providers: {
      openai: 'env-openai',
      anthropic: 'env-anthropic',
    },
  };

  it('merges seal keys into config', () => {
    const sealKeys: ProviderKeys = {
      openai: 'seal-openai',
      anthropic: 'seal-anthropic',
    };
    const result = applySealKeys(baseConfig, sealKeys);
    expect(result.providers.openai).toBe('seal-openai');
    expect(result.providers.anthropic).toBe('seal-anthropic');
  });

  it('seal keys take precedence over env', () => {
    const sealKeys: ProviderKeys = { openai: 'seal-key' };
    const result = applySealKeys(baseConfig, sealKeys);
    expect(result.providers.openai).toBe('seal-key');
  });

  it('falls back to env when seal key is undefined', () => {
    const sealKeys: ProviderKeys = {};
    const result = applySealKeys(baseConfig, sealKeys);
    expect(result.providers.openai).toBe('env-openai');
    expect(result.providers.anthropic).toBe('env-anthropic');
  });

  it('does not mutate original config', () => {
    const sealKeys: ProviderKeys = { openai: 'new' };
    applySealKeys(baseConfig, sealKeys);
    expect(baseConfig.providers.openai).toBe('env-openai');
  });
});
