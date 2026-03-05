import axios, { AxiosInstance } from 'axios';
import { v4 as uuid } from 'uuid';
import { LLMProvider } from './base';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ChatMessage,
  TokenUsage,
} from '../types';

/** Convert OpenAI-format messages to Anthropic format */
function toAnthropicMessages(messages: ChatMessage[]): {
  system?: string;
  messages: Array<{ role: string; content: string }>;
} {
  let system: string | undefined;
  const anthropicMessages: Array<{ role: string; content: string }> = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      system = msg.content || '';
    } else {
      anthropicMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content || '',
      });
    }
  }

  return { system, messages: anthropicMessages };
}

export class AnthropicProvider extends LLMProvider {
  readonly name = 'anthropic';
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    super();
    this.client = axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      headers: {
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    });
  }

  isAvailable(): boolean {
    return !!this.client.defaults.headers['x-api-key'] &&
      this.client.defaults.headers['x-api-key'] !== '';
  }

  supportsModel(_providerModelId: string): boolean {
    return this.isAvailable();
  }

  async chatCompletion(
    request: ChatCompletionRequest,
    providerModelId: string,
  ): Promise<ChatCompletionResponse> {
    const { system, messages } = toAnthropicMessages(request.messages);
    const response = await this.client.post('/messages', {
      model: providerModelId,
      messages,
      system,
      max_tokens: request.max_tokens || 4096,
      temperature: request.temperature,
      top_p: request.top_p,
      stop_sequences: request.stop
        ? Array.isArray(request.stop) ? request.stop : [request.stop]
        : undefined,
    });

    const data = response.data;
    const completionId = `chatcmpl-${uuid()}`;

    return {
      id: completionId,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: data.content
              .filter((b: { type: string }) => b.type === 'text')
              .map((b: { text: string }) => b.text)
              .join(''),
          },
          finish_reason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason || 'stop',
        },
      ],
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }

  async chatCompletionStream(
    request: ChatCompletionRequest,
    providerModelId: string,
    onChunk: (chunk: ChatCompletionChunk) => void,
  ): Promise<TokenUsage> {
    const { system, messages } = toAnthropicMessages(request.messages);
    const response = await this.client.post(
      '/messages',
      {
        model: providerModelId,
        messages,
        system,
        max_tokens: request.max_tokens || 4096,
        temperature: request.temperature,
        top_p: request.top_p,
        stream: true,
      },
      { responseType: 'stream' },
    );

    return new Promise((resolve, reject) => {
      const completionId = `chatcmpl-${uuid()}`;
      let usage: TokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const event = JSON.parse(trimmed.slice(6));

            if (event.type === 'content_block_delta' && event.delta?.text) {
              onChunk({
                id: completionId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: request.model,
                choices: [
                  {
                    index: 0,
                    delta: { content: event.delta.text },
                    finish_reason: null,
                  },
                ],
              });
            }

            if (event.type === 'message_delta') {
              usage = {
                prompt_tokens: event.usage?.input_tokens || usage.prompt_tokens,
                completion_tokens: event.usage?.output_tokens || usage.completion_tokens,
                total_tokens:
                  (event.usage?.input_tokens || usage.prompt_tokens) +
                  (event.usage?.output_tokens || usage.completion_tokens),
              };

              onChunk({
                id: completionId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: request.model,
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason: 'stop',
                  },
                ],
                usage,
              });
            }

            if (event.type === 'message_start' && event.message?.usage) {
              usage.prompt_tokens = event.message.usage.input_tokens;
            }
          } catch {
            // Skip malformed events
          }
        }
      });

      response.data.on('end', () => resolve(usage));
      response.data.on('error', reject);
    });
  }
}
