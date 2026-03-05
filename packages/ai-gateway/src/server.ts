import express, { Express, Request, Response } from 'express';
import { GatewayConfig, ChatCompletionRequest, ChatCompletionChunk, ModelDefinition } from './types';
import { LLMRouter } from './router';
import { createA402Middleware } from './middleware/a402';
import { settleRequest, reportUsageForPoints } from './settlement/postsettle';
import { getSession } from './settlement/preauth';
import { estimateInputTokens, estimateCost, estimateMaxOutput, formatUsdcAmount } from './router/cost';

export function createGatewayServer(config: GatewayConfig): Express {
  const app = express();
  const router = new LLMRouter(config);

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', version: '0.1.0' });
  });

  // List available models (OpenAI-compatible)
  app.get('/v1/models', (_req: Request, res: Response) => {
    const models = router.listAvailableModels();
    res.json({
      object: 'list',
      data: models.map((m) => ({
        id: m.id,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: m.provider,
        pricing: {
          input_per_token: m.pricing.inputPerToken,
          output_per_token: m.pricing.outputPerToken,
        },
        display_name: m.displayName,
        max_tokens: m.maxTokens,
      })),
    });
  });

  // Chat completions endpoint (OpenAI-compatible)
  // a402 middleware gates this endpoint
  const a402 = createA402Middleware(config, router);

  app.post('/v1/chat/completions', a402, async (req: Request, res: Response) => {
    const body = req.body as ChatCompletionRequest;
    const model = (req as any).resolvedModel as ModelDefinition;
    const sessionId = (req as any).sessionId as string;

    try {
      if (body.stream) {
        // Streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Session-Id', sessionId);

        const usage = await router.chatCompletionStream(body, model, (chunk: ChatCompletionChunk) => {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        });

        res.write('data: [DONE]\n\n');
        res.end();

        // Post-settle: debit actual cost from session
        const settlement = settleRequest(sessionId, model, usage, config.costMultiplier);
        if (settlement) {
          console.log(
            `[settlement] session=${sessionId} actual_cost=$${settlement.actualCost.toFixed(6)} remaining=$${settlement.remainingBalance.toFixed(6)}`,
          );
          reportUsageForPoints(config, sessionId, model, usage, settlement.actualCost);
        }
      } else {
        // Non-streaming response
        const completion = await router.chatCompletion(body, model);

        // Post-settle
        const settlement = settleRequest(
          sessionId,
          model,
          completion.usage,
          config.costMultiplier,
        );

        res.setHeader('X-Session-Id', sessionId);
        if (settlement) {
          res.setHeader('X-Remaining-Balance', formatUsdcAmount(settlement.remainingBalance));
          console.log(
            `[settlement] session=${sessionId} actual_cost=$${settlement.actualCost.toFixed(6)} remaining=$${settlement.remainingBalance.toFixed(6)}`,
          );
          reportUsageForPoints(config, sessionId, model, completion.usage, settlement.actualCost);
        }

        res.json(completion);
      }
    } catch (error: any) {
      console.error(`[error] ${error.message}`);
      const status = error.response?.status || 500;
      res.status(status).json({
        error: {
          message: error.message || 'Internal server error',
          type: 'server_error',
          code: 'provider_error',
        },
      });
    }
  });

  // Price estimation endpoint (no payment required)
  app.post('/v1/estimate', (req: Request, res: Response) => {
    const body = req.body as ChatCompletionRequest;
    const model = router.getModel(body.model);

    if (!model) {
      res.status(400).json({
        error: {
          message: `Model '${body.model}' not found.`,
          type: 'invalid_request_error',
          code: 'model_not_found',
        },
      });
      return;
    }

    const inputTokens = estimateInputTokens(body.messages);
    const outputTokens = estimateMaxOutput(body.max_tokens, model.maxTokens);
    const cost = estimateCost(model, inputTokens, outputTokens, config.costMultiplier);

    res.json({
      model: model.id,
      estimated_tokens: { input: inputTokens, output: outputTokens },
      estimated_cost_usdc: formatUsdcAmount(cost),
      price_per_token: {
        input: model.pricing.inputPerToken,
        output: model.pricing.outputPerToken,
      },
      cost_multiplier: config.costMultiplier || 1.0,
    });
  });

  // Session balance check
  app.get('/v1/session/:sessionId', (req: Request, res: Response) => {
    const session = getSession(req.params.sessionId);
    if (!session) {
      res.status(404).json({
        error: { message: 'Session not found', type: 'not_found', code: 'session_not_found' },
      });
      return;
    }

    res.json({
      id: session.id,
      balance: formatUsdcAmount(session.balance),
      total_paid: formatUsdcAmount(session.totalPaid),
      total_spent: formatUsdcAmount(session.totalSpent),
      request_count: session.requestCount,
      created_at: session.createdAt.toISOString(),
      last_activity_at: session.lastActivityAt.toISOString(),
    });
  });

  return app;
}
