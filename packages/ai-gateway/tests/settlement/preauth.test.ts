import {
  createSession,
  getSession,
  getAllSessions,
  creditSession,
  debitSession,
  generatePaymentRequest,
  hassufficientBalance,
} from '../../src/settlement/preauth';
import { ChatCompletionRequest, GatewayConfig, ModelDefinition } from '../../src/types';

const testModel: ModelDefinition = {
  id: 'test/model',
  provider: 'openai',
  providerModelId: 'test-model',
  pricing: { inputPerToken: 0.000005, outputPerToken: 0.000025 },
  maxTokens: 4096,
};

const testConfig: GatewayConfig = {
  port: 3402,
  host: '0.0.0.0',
  recipientAddress: '0xrecipient123',
  beepApiKey: 'test-key',
  beepServerUrl: 'https://api.test.com',
  providers: { openai: 'sk-test' },
  costMultiplier: 1.05,
};

const testRequest: ChatCompletionRequest = {
  model: 'test/model',
  messages: [
    { role: 'user', content: 'Hello, world!' },
  ],
};

describe('Session Management', () => {
  describe('createSession', () => {
    it('creates a session with sess_ prefix ID', () => {
      const session = createSession();
      expect(session.id).toMatch(/^sess_/);
    });

    it('creates session with zero balance', () => {
      const session = createSession();
      expect(session.balance).toBe(0);
      expect(session.totalPaid).toBe(0);
      expect(session.totalSpent).toBe(0);
      expect(session.requestCount).toBe(0);
    });

    it('stores wallet address when provided', () => {
      const session = createSession('0xwallet');
      expect(session.walletAddress).toBe('0xwallet');
    });

    it('wallet is undefined when not provided', () => {
      const session = createSession();
      expect(session.walletAddress).toBeUndefined();
    });

    it('sets timestamps', () => {
      const before = new Date();
      const session = createSession();
      expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(session.lastActivityAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('getSession', () => {
    it('returns created session', () => {
      const created = createSession();
      const fetched = getSession(created.id);
      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(created.id);
    });

    it('returns undefined for non-existent session', () => {
      expect(getSession('sess_nonexistent')).toBeUndefined();
    });
  });

  describe('getAllSessions', () => {
    it('returns array of sessions', () => {
      const sessions = getAllSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('includes newly created sessions', () => {
      const before = getAllSessions().length;
      createSession();
      expect(getAllSessions().length).toBe(before + 1);
    });
  });
});

describe('creditSession', () => {
  it('increases balance and totalPaid', () => {
    const session = createSession();
    creditSession(session.id, 1.5);
    const updated = getSession(session.id)!;
    expect(updated.balance).toBe(1.5);
    expect(updated.totalPaid).toBe(1.5);
  });

  it('accumulates across multiple credits', () => {
    const session = createSession();
    creditSession(session.id, 1.0);
    creditSession(session.id, 0.5);
    const updated = getSession(session.id)!;
    expect(updated.balance).toBe(1.5);
    expect(updated.totalPaid).toBe(1.5);
  });

  it('updates lastActivityAt', () => {
    const session = createSession();
    const before = session.lastActivityAt;
    creditSession(session.id, 1.0);
    const updated = getSession(session.id)!;
    expect(updated.lastActivityAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('returns undefined for non-existent session', () => {
    expect(creditSession('nonexistent', 1.0)).toBeUndefined();
  });
});

describe('debitSession', () => {
  it('decreases balance and increases totalSpent', () => {
    const session = createSession();
    creditSession(session.id, 1.0);
    debitSession(session.id, 0.3);
    const updated = getSession(session.id)!;
    expect(updated.balance).toBeCloseTo(0.7, 6);
    expect(updated.totalSpent).toBeCloseTo(0.3, 6);
  });

  it('increments requestCount', () => {
    const session = createSession();
    creditSession(session.id, 1.0);
    debitSession(session.id, 0.1);
    debitSession(session.id, 0.1);
    expect(getSession(session.id)!.requestCount).toBe(2);
  });

  it('allows negative balance (debt)', () => {
    const session = createSession();
    debitSession(session.id, 0.5);
    expect(getSession(session.id)!.balance).toBe(-0.5);
  });

  it('returns undefined for non-existent session', () => {
    expect(debitSession('nonexistent', 1.0)).toBeUndefined();
  });
});

describe('generatePaymentRequest', () => {
  it('returns a valid payment request', () => {
    const pr = generatePaymentRequest(testRequest, testModel, testConfig);
    expect(pr.token).toBe('USDC');
    expect(pr.chain).toBe('SUI');
    expect(pr.recipient).toBe('0xrecipient123');
    expect(pr.resource).toBe('/v1/chat/completions');
    expect(pr.sessionId).toMatch(/^sess_/);
  });

  it('includes estimated tokens', () => {
    const pr = generatePaymentRequest(testRequest, testModel, testConfig);
    expect(pr.estimatedTokens.input).toBeGreaterThan(0);
    expect(pr.estimatedTokens.output).toBeGreaterThan(0);
  });

  it('formats amount as USDC string', () => {
    const pr = generatePaymentRequest(testRequest, testModel, testConfig);
    // Should be a string with decimals
    expect(typeof pr.amount).toBe('string');
    expect(pr.amount).toMatch(/^\d+\.\d{6}$/);
  });

  it('includes price per token with multiplier', () => {
    const pr = generatePaymentRequest(testRequest, testModel, testConfig);
    expect(typeof pr.pricePerToken.input).toBe('string');
    expect(typeof pr.pricePerToken.output).toBe('string');
    // With 1.05x multiplier: 0.000005 * 1.05 = 0.00000525
    expect(parseFloat(pr.pricePerToken.input)).toBeCloseTo(0.00000525, 9);
  });

  it('includes payment URL from config', () => {
    const pr = generatePaymentRequest(testRequest, testModel, testConfig);
    expect(pr.paymentUrl).toBe('https://api.test.com/v1/payment/request-payment');
  });

  it('creates a new session', () => {
    const before = getAllSessions().length;
    generatePaymentRequest(testRequest, testModel, testConfig);
    expect(getAllSessions().length).toBe(before + 1);
  });
});

describe('hassufficientBalance', () => {
  it('returns true when balance covers estimated cost', () => {
    const session = createSession();
    creditSession(session.id, 10.0); // Way more than needed
    expect(hassufficientBalance(session.id, testRequest, testModel, 1.05)).toBe(true);
  });

  it('returns false when balance is zero', () => {
    const session = createSession();
    expect(hassufficientBalance(session.id, testRequest, testModel)).toBe(false);
  });

  it('returns false for non-existent session', () => {
    expect(hassufficientBalance('nonexistent', testRequest, testModel)).toBe(false);
  });

  it('accounts for cost multiplier', () => {
    const session = createSession();
    // Credit just enough for base cost but not with high multiplier
    const pr = generatePaymentRequest(testRequest, testModel, { ...testConfig, costMultiplier: 1.0 });
    creditSession(session.id, parseFloat(pr.amount));
    // With 2x multiplier, should be insufficient
    expect(hassufficientBalance(session.id, testRequest, testModel, 2.0)).toBe(false);
  });
});
