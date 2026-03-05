import { settleRequest, reportUsageForPoints } from '../../src/settlement/postsettle';
import { createSession, creditSession, getSession } from '../../src/settlement/preauth';
import { GatewayConfig, ModelDefinition, TokenUsage } from '../../src/types';

jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: { data: { pointsGranted: '100' } } }),
}));

const axios = require('axios');

const testModel: ModelDefinition = {
  id: 'test/model',
  provider: 'openai',
  providerModelId: 'test-model',
  pricing: { inputPerToken: 0.000005, outputPerToken: 0.000025 },
  maxTokens: 4096,
};

const testUsage: TokenUsage = {
  prompt_tokens: 100,
  completion_tokens: 50,
  total_tokens: 150,
};

const testConfig: GatewayConfig = {
  port: 3402,
  host: '0.0.0.0',
  recipientAddress: '0xrecipient',
  beepApiKey: 'test-api-key',
  beepServerUrl: 'https://api.test.com',
  providers: { openai: 'sk-test' },
  costMultiplier: 1.0,
  reportUsageForPoints: true,
};

describe('settleRequest', () => {
  it('debits actual cost from session', () => {
    const session = createSession();
    creditSession(session.id, 1.0);

    const result = settleRequest(session.id, testModel, testUsage);
    expect(result).not.toBeNull();
    // 100 * 0.000005 + 50 * 0.000025 = 0.0005 + 0.00125 = 0.00175
    expect(result!.actualCost).toBeCloseTo(0.00175, 6);
    expect(result!.remainingBalance).toBeCloseTo(1.0 - 0.00175, 6);
  });

  it('applies cost multiplier', () => {
    const session = createSession();
    creditSession(session.id, 1.0);

    const result = settleRequest(session.id, testModel, testUsage, 1.5);
    expect(result!.actualCost).toBeCloseTo(0.00175 * 1.5, 6);
  });

  it('returns null for non-existent session', () => {
    expect(settleRequest('nonexistent', testModel, testUsage)).toBeNull();
  });

  it('returns settlement result with session ID', () => {
    const session = createSession();
    creditSession(session.id, 1.0);

    const result = settleRequest(session.id, testModel, testUsage);
    expect(result!.sessionId).toBe(session.id);
  });

  it('handles zero usage', () => {
    const session = createSession();
    creditSession(session.id, 1.0);

    const zeroUsage: TokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const result = settleRequest(session.id, testModel, zeroUsage);
    expect(result!.actualCost).toBe(0);
    expect(result!.remainingBalance).toBe(1.0);
  });

  it('allows balance to go negative', () => {
    const session = createSession();
    // No credit — balance is 0
    const result = settleRequest(session.id, testModel, testUsage);
    expect(result!.remainingBalance).toBeLessThan(0);
  });
});

describe('reportUsageForPoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when reportUsageForPoints is false', () => {
    const session = createSession('0xwallet');
    const config = { ...testConfig, reportUsageForPoints: false };
    reportUsageForPoints(config, session.id, testModel, testUsage, 0.001);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('does nothing when session has no wallet', () => {
    const session = createSession(); // no wallet
    reportUsageForPoints(testConfig, session.id, testModel, testUsage, 0.001);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('posts to beep-server when enabled with wallet', () => {
    const session = createSession('0xwallet123');
    reportUsageForPoints(testConfig, session.id, testModel, testUsage, 0.001);

    expect(axios.post).toHaveBeenCalledWith(
      'https://api.test.com/v1/rewards/gateway-usage',
      expect.objectContaining({
        walletAddress: '0xwallet123',
        model: 'test/model',
        promptTokens: 100,
        completionTokens: 50,
        costUsdc: '0.001000',
        sessionId: session.id,
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'test-api-key',
        }),
        timeout: 5000,
      }),
    );
  });

  it('does not throw on HTTP error (fire-and-forget)', () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));
    const session = createSession('0xwallet');
    // Should not throw
    expect(() => {
      reportUsageForPoints(testConfig, session.id, testModel, testUsage, 0.001);
    }).not.toThrow();
  });
});
