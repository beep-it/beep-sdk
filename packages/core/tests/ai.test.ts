import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BeepClient } from '../src';

const GATEWAY_URL = 'https://ai.testgateway.com';
const COMPLETIONS_URL = `${GATEWAY_URL}/v1/chat/completions`;

const makeChatBody = (overrides?: Record<string, any>) => ({
  model: 'claude-sonnet-4-20250514',
  messages: [{ role: 'user' as const, content: 'Hello' }],
  ...overrides,
});

const makeCompletionResponse = (overrides?: Record<string, any>) => ({
  id: 'chatcmpl-123',
  model: 'claude-sonnet-4-20250514',
  choices: [{ message: { role: 'assistant', content: 'Hi there!' } }],
  usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  ...overrides,
});

const makePaymentRequest = (overrides?: Record<string, any>) => ({
  amount: '0.01',
  token: 'USDC',
  chain: 'SUI',
  recipient: '0xrecipient',
  paymentUrl: 'https://api.beep.com/v1/payment/a402/pay',
  sessionId: 'session-abc',
  ...overrides,
});

describe('AI Module', () => {
  let client: BeepClient;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    client = new BeepClient({
      apiKey: 'test-api-key',
      serverUrl: 'https://test-api.beep.com',
    });
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('chat — happy path (no 402)', () => {
    it('returns parsed response when gateway returns 200', async () => {
      const completionData = makeCompletionResponse();

      mockAxios.onPost(COMPLETIONS_URL).reply(200, completionData, {
        'x-session-id': 'session-xyz',
      });

      const result = await client.ai.chat({
        ...makeChatBody(),
        gatewayUrl: GATEWAY_URL,
      });

      expect(result.id).toBe('chatcmpl-123');
      expect(result.model).toBe('claude-sonnet-4-20250514');
      expect(result.content).toBe('Hi there!');
      expect(result.usage).toEqual({
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      });
      expect(result.sessionId).toBe('session-xyz');
    });

    it('parses remaining_balance from response body', async () => {
      mockAxios
        .onPost(COMPLETIONS_URL)
        .reply(200, makeCompletionResponse({ remaining_balance: '0.99' }), {
          'x-session-id': 'session-xyz',
        });

      const result = await client.ai.chat({
        ...makeChatBody(),
        gatewayUrl: GATEWAY_URL,
      });

      expect(result.remainingBalance).toBe('0.99');
    });
  });

  describe('chat — a402 payment flow', () => {
    it('handles full 402 → pay → retry flow', async () => {
      const paymentRequest = makePaymentRequest();

      // First call: 402 with payment_request
      mockAxios.onPost(COMPLETIONS_URL).replyOnce(402, {
        payment_request: paymentRequest,
      });

      // Payment execution
      mockAxios.onPost('/v1/payment/a402/pay').replyOnce(200, {
        txDigest: 'tx-digest-123',
      });

      // Retry after payment: 200
      mockAxios
        .onPost(COMPLETIONS_URL)
        .replyOnce(200, makeCompletionResponse(), { 'x-session-id': 'session-abc' });

      const result = await client.ai.chat({
        ...makeChatBody(),
        gatewayUrl: GATEWAY_URL,
      });

      expect(result.content).toBe('Hi there!');
      expect(result.sessionId).toBe('session-abc');

      // Verify payment request was sent correctly
      expect(mockAxios.history.post.length).toBe(3);
      const payBody = JSON.parse(mockAxios.history.post[1].data);
      expect(payBody).toEqual({
        amount: '0.01',
        token: 'USDC',
        chain: 'SUI',
        recipient: '0xrecipient',
      });

      // Verify retry includes Payment-Receipt header
      const retryHeaders = mockAxios.history.post[2].headers;
      const receipt = JSON.parse(retryHeaders!['Payment-Receipt']);
      expect(receipt.txDigest).toBe('tx-digest-123');
      expect(receipt.sessionId).toBe('session-abc');

      // Verify retry includes X-Session-Id header
      expect(retryHeaders!['X-Session-Id']).toBe('session-abc');
    });

    it('caches session ID after 402 flow', async () => {
      mockAxios.onPost(COMPLETIONS_URL).replyOnce(402, {
        payment_request: makePaymentRequest(),
      });
      mockAxios.onPost('/v1/payment/a402/pay').replyOnce(200, {
        txDigest: 'tx-123',
      });
      mockAxios
        .onPost(COMPLETIONS_URL)
        .replyOnce(200, makeCompletionResponse(), { 'x-session-id': 'session-abc' });

      await client.ai.chat({ ...makeChatBody(), gatewayUrl: GATEWAY_URL });

      expect(client.ai.getSessionId(GATEWAY_URL)).toBe('session-abc');
    });
  });

  describe('session caching', () => {
    it('caches session ID after successful call', async () => {
      mockAxios.onPost(COMPLETIONS_URL).reply(200, makeCompletionResponse(), {
        'x-session-id': 'session-cached',
      });

      await client.ai.chat({ ...makeChatBody(), gatewayUrl: GATEWAY_URL });

      expect(client.ai.getSessionId(GATEWAY_URL)).toBe('session-cached');
    });

    it('sends cached session ID on subsequent calls', async () => {
      mockAxios.onPost(COMPLETIONS_URL).reply(200, makeCompletionResponse(), {
        'x-session-id': 'session-reused',
      });

      // First call — caches session
      await client.ai.chat({ ...makeChatBody(), gatewayUrl: GATEWAY_URL });
      // Second call — should include cached session
      await client.ai.chat({ ...makeChatBody(), gatewayUrl: GATEWAY_URL });

      const secondCallHeaders = mockAxios.history.post[1].headers;
      expect(secondCallHeaders!['X-Session-Id']).toBe('session-reused');
    });

    it('clearSession removes the cached session', async () => {
      mockAxios.onPost(COMPLETIONS_URL).reply(200, makeCompletionResponse(), {
        'x-session-id': 'session-to-clear',
      });

      await client.ai.chat({ ...makeChatBody(), gatewayUrl: GATEWAY_URL });
      expect(client.ai.getSessionId(GATEWAY_URL)).toBe('session-to-clear');

      client.ai.clearSession(GATEWAY_URL);
      expect(client.ai.getSessionId(GATEWAY_URL)).toBeUndefined();
    });

    it('uses sessionId from options over cached session', async () => {
      mockAxios.onPost(COMPLETIONS_URL).reply(200, makeCompletionResponse(), {
        'x-session-id': 'session-from-options',
      });

      await client.ai.chat({
        ...makeChatBody(),
        gatewayUrl: GATEWAY_URL,
        sessionId: 'explicit-session',
      });

      const headers = mockAxios.history.post[0].headers;
      expect(headers!['X-Session-Id']).toBe('explicit-session');
    });
  });

  describe('error handling', () => {
    it('propagates non-402 errors', async () => {
      mockAxios.onPost(COMPLETIONS_URL).reply(500, { error: 'Internal server error' });

      await expect(
        client.ai.chat({ ...makeChatBody(), gatewayUrl: GATEWAY_URL }),
      ).rejects.toThrow();
    });

    it('throws descriptive error when 402 has no payment_request', async () => {
      mockAxios.onPost(COMPLETIONS_URL).reply(402, { error: 'Payment required' });

      await expect(client.ai.chat({ ...makeChatBody(), gatewayUrl: GATEWAY_URL })).rejects.toThrow(
        'Gateway returned 402 without a payment_request',
      );
    });
  });

  describe('response parsing edge cases', () => {
    it('returns empty content when no choices', async () => {
      mockAxios
        .onPost(COMPLETIONS_URL)
        .reply(200, makeCompletionResponse({ choices: [] }), { 'x-session-id': 'session-1' });

      const result = await client.ai.chat({
        ...makeChatBody(),
        gatewayUrl: GATEWAY_URL,
      });

      expect(result.content).toBe('');
    });

    it('defaults usage to zeros when missing', async () => {
      const { usage: _usage, ...noUsage } = makeCompletionResponse();
      mockAxios.onPost(COMPLETIONS_URL).reply(200, noUsage, {
        'x-session-id': 'session-1',
      });

      const result = await client.ai.chat({
        ...makeChatBody(),
        gatewayUrl: GATEWAY_URL,
      });

      expect(result.usage).toEqual({
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      });
    });

    it('returns empty sessionId when header is missing', async () => {
      mockAxios.onPost(COMPLETIONS_URL).reply(200, makeCompletionResponse());

      const result = await client.ai.chat({
        ...makeChatBody(),
        gatewayUrl: GATEWAY_URL,
      });

      expect(result.sessionId).toBe('');
    });
  });
});
