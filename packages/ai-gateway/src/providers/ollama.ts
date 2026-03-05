import axios, { AxiosInstance } from 'axios';
import { LLMProvider } from './base';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  TokenUsage,
} from '../types';

export class OllamaProvider extends LLMProvider {
  readonly name = 'ollama';
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    super();
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  isAvailable(): boolean {
    return !!this.baseUrl;
  }

  supportsModel(_providerModelId: string): boolean {
    return this.isAvailable();
  }

  async chatCompletion(
    request: ChatCompletionRequest,
    providerModelId: string,
  ): Promise<ChatCompletionResponse> {
    // Ollama has an OpenAI-compatible endpoint
    const response = await this.client.post('/v1/chat/completions', {
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
      '/v1/chat/completions',
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
