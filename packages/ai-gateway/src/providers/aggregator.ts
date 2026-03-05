import axios, { AxiosInstance } from 'axios';
import { LLMProvider } from './base';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  TokenUsage,
} from '../types';

const DEFAULT_AGGREGATOR_URL = 'https://openrouter.ai/api/v1';

/**
 * Aggregator provider that routes requests through any OpenAI-compatible
 * multi-model aggregation service. Supports any endpoint that exposes
 * an OpenAI-compatible /chat/completions API.
 */
export class AggregatorProvider extends LLMProvider {
  readonly name = 'aggregator';
  private client: AxiosInstance;

  constructor(apiKey?: string, baseUrl?: string) {
    super();
    this.client = axios.create({
      baseURL: baseUrl || DEFAULT_AGGREGATOR_URL,
      headers: {
        Authorization: `Bearer ${apiKey || ''}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://justbeep.it',
        'X-Title': 'Beep AI Gateway',
      },
    });
  }

  isAvailable(): boolean {
    return !!this.client.defaults.headers.Authorization &&
      this.client.defaults.headers.Authorization !== 'Bearer ';
  }

  supportsModel(_providerModelId: string): boolean {
    return this.isAvailable();
  }

  async chatCompletion(
    request: ChatCompletionRequest,
    providerModelId: string,
  ): Promise<ChatCompletionResponse> {
    const response = await this.client.post('/chat/completions', {
      ...request,
      model: providerModelId,
      stream: false,
    });

    return response.data;
  }

  async chatCompletionStream(
    request: ChatCompletionRequest,
    providerModelId: string,
    onChunk: (chunk: ChatCompletionChunk) => void,
  ): Promise<TokenUsage> {
    const response = await this.client.post(
      '/chat/completions',
      {
        ...request,
        model: providerModelId,
        stream: true,
      },
      { responseType: 'stream' },
    );

    return new Promise((resolve, reject) => {
      let usage: TokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data) as ChatCompletionChunk;
            if (parsed.usage) {
              usage = parsed.usage;
            }
            onChunk(parsed);
          } catch {
            // Skip malformed chunks
          }
        }
      });

      response.data.on('end', () => resolve(usage));
      response.data.on('error', reject);
    });
  }
}
