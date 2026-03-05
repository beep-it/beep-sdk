import axios, { AxiosInstance } from 'axios';
import { LLMProvider } from './base';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  TokenUsage,
} from '../types';

export class OpenAIProvider extends LLMProvider {
  readonly name = 'openai';
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    super();
    this.client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        Authorization: `Bearer ${apiKey || ''}`,
        'Content-Type': 'application/json',
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
        stream_options: { include_usage: true },
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
