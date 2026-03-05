import { createA402Middleware } from '../../src/middleware/a402';
import { GatewayConfig, ModelDefinition } from '../../src/types';
import { LLMRouter } from '../../src/router';
import { createSession, creditSession, getSession } from '../../src/settlement/preauth';

// Mock axios for verifyPayment
jest.mock('axios', () => ({
  post: jest.fn(),
}));

const axios = require('axios');

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
  recipientAddress: '0xrecipient',
  beepApiKey: 'test-key',
  beepServerUrl: 'https://api.test.com',
  providers: { openai: 'sk-test' },
  costMultiplier: 1.05,
};

// Mock router
const mockRouter = {
  getModel: jest.fn(),
} as unknown as LLMRouter;

function createMockReq(overrides: any = {}) {
  return {
    body: { model: 'test/model', messages: [{ role: 'user', content: 'hi' }] },
    headers: {},
    query: {},
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('a402 Middleware', () => {
  let middleware: ReturnType<typeof createA402Middleware>;

  beforeEach(() => {
    jest.clearAllMocks();
    (mockRouter.getModel as jest.Mock).mockReturnValue(testModel);
    middleware = createA402Middleware(testConfig, mockRouter);
  });

  describe('model resolution', () => {
    it('returns 400 for unknown model', async () => {
      (mockRouter.getModel as jest.Mock).mockReturnValue(undefined);
      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'model_not_found' }),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('stores resolved model on request', async () => {
      const session = createSession();
      creditSession(session.id, 100);
      const req = createMockReq({
        headers: { 'x-session-id': session.id },
      });
      const res = createMockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(req.resolvedModel).toEqual(testModel);
    });
  });

  describe('payment receipt flow', () => {
    it('credits session on valid payment receipt', async () => {
      axios.post.mockResolvedValueOnce({
        data: { verified: true, amount: '0.5' },
      });

      const receipt = JSON.stringify({ txDigest: 'tx123', sessionId: 'sess_old' });
      const req = createMockReq({
        headers: { 'payment-receipt': receipt },
      });
      const res = createMockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.sessionId).toBeDefined();
      // Verify the session was credited
      const session = getSession(req.sessionId);
      expect(session!.balance).toBe(0.5);
    });

    it('falls through to 402 on invalid receipt JSON', async () => {
      const req = createMockReq({
        headers: { 'payment-receipt': 'not-json' },
      });
      const res = createMockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(402);
      expect(next).not.toHaveBeenCalled();
    });

    it('falls through to 402 when verification fails', async () => {
      axios.post.mockResolvedValueOnce({
        data: { verified: false },
      });

      const receipt = JSON.stringify({ txDigest: 'bad', sessionId: 'sess_x' });
      const req = createMockReq({
        headers: { 'payment-receipt': receipt },
      });
      const res = createMockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(402);
    });
  });

  describe('existing session flow', () => {
    it('allows request with sufficient session balance via header', async () => {
      const session = createSession();
      creditSession(session.id, 100);

      const req = createMockReq({
        headers: { 'x-session-id': session.id },
      });
      const res = createMockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.sessionId).toBe(session.id);
    });

    it('allows request with session ID in query param', async () => {
      const session = createSession();
      creditSession(session.id, 100);

      const req = createMockReq({
        query: { session_id: session.id },
      });
      const res = createMockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('falls through to 402 when session balance insufficient', async () => {
      const session = createSession();
      // balance = 0, insufficient

      const req = createMockReq({
        headers: { 'x-session-id': session.id },
      });
      const res = createMockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(402);
      expect(next).not.toHaveBeenCalled();
    });

    it('falls through to 402 for non-existent session', async () => {
      const req = createMockReq({
        headers: { 'x-session-id': 'sess_nonexistent' },
      });
      const res = createMockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(402);
    });
  });

  describe('402 Payment Required response', () => {
    it('returns 402 with payment_request', async () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(402);
      const body = res.json.mock.calls[0][0];
      expect(body.error.code).toBe('a402_payment_required');
      expect(body.payment_request).toBeDefined();
      expect(body.payment_request.token).toBe('USDC');
      expect(body.payment_request.chain).toBe('SUI');
      expect(body.payment_request.recipient).toBe('0xrecipient');
      expect(body.payment_request.sessionId).toMatch(/^sess_/);
    });
  });
});
