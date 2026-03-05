import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  GatewayConfig,
  ModelDefinition,
  TokenUsage,
} from '../types';
import { ModelRegistry } from './registry';
import {
  LLMProvider,
  OpenAIProvider,
  AnthropicProvider,
  AggregatorProvider,
  OllamaProvider,
} from '../providers';

export class LLMRouter {
  private registry: ModelRegistry;
  private providers: Map<string, LLMProvider> = new Map();

  constructor(config: GatewayConfig) {
    this.registry = new ModelRegistry(config.customModels);

    // Initialize available providers
    if (config.providers.openai) {
      this.providers.set('openai', new OpenAIProvider(config.providers.openai));
    }
    if (config.providers.anthropic) {
      this.providers.set('anthropic', new AnthropicProvider(config.providers.anthropic));
    }
    if (config.providers.aggregatorApiKey) {
      this.providers.set(
        'aggregator',
        new AggregatorProvider(config.providers.aggregatorApiKey, config.providers.aggregatorBaseUrl),
      );
    }
    if (config.providers.ollamaUrl) {
      this.providers.set('ollama', new OllamaProvider(config.providers.ollamaUrl));
    }
  }

  getRegistry(): ModelRegistry {
    return this.registry;
  }

  getModel(modelId: string): ModelDefinition | undefined {
    return this.registry.getModel(modelId);
  }

  /**
   * Resolve which provider to use for a given model.
   * Tries the direct provider first (openai, anthropic), then
   * falls back to the aggregator for any other provider type.
   */
  resolveProvider(model: ModelDefinition): LLMProvider | null {
    // Try direct providers first (openai, anthropic, ollama)
    const direct = this.providers.get(model.provider);
    if (direct?.isAvailable() && direct.supportsModel(model.providerModelId)) {
      return direct;
    }

    // Fall back to the aggregator for all other providers
    const aggregator = this.providers.get('aggregator');
    if (aggregator?.isAvailable()) {
      return aggregator;
    }

    return null;
  }

  async chatCompletion(
    request: ChatCompletionRequest,
    model: ModelDefinition,
  ): Promise<ChatCompletionResponse> {
    const provider = this.resolveProvider(model);
    if (!provider) {
      throw new Error(`No available provider for model ${model.id}`);
    }

    // The providerModelId already contains the full model path (e.g., "google/gemini-3-pro-preview")
    return provider.chatCompletion(request, model.providerModelId);
  }

  async chatCompletionStream(
    request: ChatCompletionRequest,
    model: ModelDefinition,
    onChunk: (chunk: ChatCompletionChunk) => void,
  ): Promise<TokenUsage> {
    const provider = this.resolveProvider(model);
    if (!provider) {
      throw new Error(`No available provider for model ${model.id}`);
    }

    return provider.chatCompletionStream(request, model.providerModelId, onChunk);
  }

  listAvailableModels(): ModelDefinition[] {
    return this.registry.listModels().filter((model) => {
      return this.resolveProvider(model) !== null;
    });
  }
}
