import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  TokenUsage,
} from '../types';

/** Abstract base class for LLM providers */
export abstract class LLMProvider {
  abstract readonly name: string;

  /** Check if this provider is configured and available */
  abstract isAvailable(): boolean;

  /** Check if this provider supports a given model */
  abstract supportsModel(providerModelId: string): boolean;

  /** Execute a non-streaming chat completion */
  abstract chatCompletion(
    request: ChatCompletionRequest,
    providerModelId: string,
  ): Promise<ChatCompletionResponse>;

  /** Execute a streaming chat completion */
  abstract chatCompletionStream(
    request: ChatCompletionRequest,
    providerModelId: string,
    onChunk: (chunk: ChatCompletionChunk) => void,
  ): Promise<TokenUsage>;
}
