import { createGatewayServer } from '../src/server';
import { GatewayConfig } from '../src/types';
import { createSession, creditSession } from '../src/settlement/preauth';

// Mock axios globally — need .create for providers and .post for a402/points
jest.mock('axios', () => {
  const createMockInstance = (config: any = {}) => ({
    post: jest.fn().mockResolvedValue({ data: {} }),
    get: jest.fn().mockResolvedValue({ data: {} }),
    defaults: {
      headers: { ...config.headers },
    },
  });
  return {
    __esModule: true,
    default: {
      create: jest.fn((config: any) => createMockInstance(config)),
      post: jest.fn().mockResolvedValue({ data: {} }),
      get: jest.fn().mockResolvedValue({ data: {} }),
    },
    create: jest.fn((config: any) => createMockInstance(config)),
    post: jest.fn().mockResolvedValue({ data: {} }),
  };
});

const testConfig: GatewayConfig = {
  port: 3402,
  host: '0.0.0.0',
  recipientAddress: '0xrecipient',
  beepApiKey: 'test-key',
  beepServerUrl: 'https://api.test.com',
  providers: { openai: 'sk-test' },
  costMultiplier: 1.05,
};

// Use inline supertest-like request helper since supertest may not be installed
function makeRequest(app: any) {
  const http = require('http');
  const server = http.createServer(app);

  return {
    get: (path: string, headers: Record<string, string> = {}) =>
      makeHttpRequest(server, 'GET', path, undefined, headers),
    post: (path: string, body?: any, headers: Record<string, string> = {}) =>
      makeHttpRequest(server, 'POST', path, body, headers),
    close: () => server.close(),
  };
}

function makeHttpRequest(
  server: any,
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: any; headers: any }> {
  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const port = server.address().port;
      const http = require('http');
      const bodyStr = body ? JSON.stringify(body) : undefined;

      const req = http.request(
        {
          hostname: 'localhost',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        },
        (res: any) => {
          let data = '';
          res.on('data', (chunk: string) => (data += chunk));
          res.on('end', () => {
            server.close();
            try {
              resolve({
                status: res.statusCode,
                body: data ? JSON.parse(data) : null,
                headers: res.headers,
              });
            } catch {
              resolve({ status: res.statusCode, body: data, headers: res.headers });
            }
          });
        },
      );

      req.on('error', (err: Error) => {
        server.close();
        reject(err);
      });

      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  });
}

describe('Gateway Server', () => {
  describe('GET /health', () => {
    it('returns ok status', async () => {
      const app = createGatewayServer(testConfig);
      const res = await makeRequest(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.version).toBe('0.1.0');
    });
  });

  describe('GET /v1/models', () => {
    it('returns model list', async () => {
      const app = createGatewayServer(testConfig);
      const res = await makeRequest(app).get('/v1/models');
      expect(res.status).toBe(200);
      expect(res.body.object).toBe('list');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('each model has required fields', async () => {
      const app = createGatewayServer(testConfig);
      const res = await makeRequest(app).get('/v1/models');
      const model = res.body.data[0];
      expect(model.id).toBeDefined();
      expect(model.object).toBe('model');
      expect(model.pricing).toBeDefined();
      expect(model.pricing.input_per_token).toBeDefined();
      expect(model.pricing.output_per_token).toBeDefined();
    });
  });

  describe('POST /v1/estimate', () => {
    it('returns cost estimate for valid model', async () => {
      const app = createGatewayServer(testConfig);
      const res = await makeRequest(app).post('/v1/estimate', {
        model: 'openai/gpt-5.3-chat',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(res.status).toBe(200);
      expect(res.body.model).toBe('openai/gpt-5.3-chat');
      expect(res.body.estimated_tokens).toBeDefined();
      expect(res.body.estimated_cost_usdc).toBeDefined();
      expect(res.body.price_per_token).toBeDefined();
      expect(res.body.cost_multiplier).toBe(1.05);
    });

    it('returns 400 for unknown model', async () => {
      const app = createGatewayServer(testConfig);
      const res = await makeRequest(app).post('/v1/estimate', {
        model: 'nonexistent/model',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('model_not_found');
    });
  });

  describe('GET /v1/session/:sessionId', () => {
    it('returns session data', async () => {
      const session = createSession('0xwallet');
      creditSession(session.id, 1.5);

      const app = createGatewayServer(testConfig);
      const res = await makeRequest(app).get(`/v1/session/${session.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(session.id);
      expect(res.body.balance).toBe('1.500000');
      expect(res.body.total_paid).toBe('1.500000');
      expect(res.body.request_count).toBe(0);
    });

    it('returns 404 for non-existent session', async () => {
      const app = createGatewayServer(testConfig);
      const res = await makeRequest(app).get('/v1/session/sess_nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('session_not_found');
    });
  });

  describe('POST /v1/chat/completions', () => {
    it('returns 402 without payment or session', async () => {
      const app = createGatewayServer(testConfig);
      const res = await makeRequest(app).post('/v1/chat/completions', {
        model: 'openai/gpt-5.3-chat',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(res.status).toBe(402);
      expect(res.body.payment_request).toBeDefined();
      expect(res.body.payment_request.token).toBe('USDC');
      expect(res.body.payment_request.chain).toBe('SUI');
    });

    it('returns 400 for unknown model', async () => {
      const app = createGatewayServer(testConfig);
      const res = await makeRequest(app).post('/v1/chat/completions', {
        model: 'nonexistent/model',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(res.status).toBe(400);
    });
  });
});
