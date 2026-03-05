import { ModelDefinition, ProviderType } from '../types';

/**
 * Default model registry with base per-token costs in USD.
 *
 * Gateway operators earn revenue through the platform fee, which defaults
 * to 5% (`costMultiplier: 1.05`). Operators can adjust this freely:
 *   - 1.0  = zero platform fee (pass-through pricing)
 *   - 1.05 = 5% platform fee (default)
 *   - 1.10 = 10% platform fee
 *   - etc.
 *
 * The platform fee is applied automatically during cost estimation and
 * settlement. Base prices listed here are the raw provider costs.
 */
const DEFAULT_MODELS: ModelDefinition[] = [
  // ──────────────────────────────────────────────
  // OpenAI
  // ──────────────────────────────────────────────
  {
    id: 'openai/gpt-5.3-chat',
    provider: 'openai',
    providerModelId: 'openai/gpt-5.3-chat',
    pricing: { inputPerToken: 0.00000175, outputPerToken: 0.000014 },
    maxTokens: 128_000,
    displayName: 'GPT-5.3 Chat',
  },
  {
    id: 'openai/gpt-5.3-codex',
    provider: 'openai',
    providerModelId: 'openai/gpt-5.3-codex',
    pricing: { inputPerToken: 0.00000175, outputPerToken: 0.000014 },
    maxTokens: 400_000,
    displayName: 'GPT-5.3 Codex',
  },
  {
    id: 'openai/gpt-5.2-pro',
    provider: 'openai',
    providerModelId: 'openai/gpt-5.2-pro',
    pricing: { inputPerToken: 0.000021, outputPerToken: 0.000168 },
    maxTokens: 400_000,
    displayName: 'GPT-5.2 Pro',
  },
  {
    id: 'openai/gpt-5.2',
    provider: 'openai',
    providerModelId: 'openai/gpt-5.2',
    pricing: { inputPerToken: 0.00000175, outputPerToken: 0.000014 },
    maxTokens: 400_000,
    displayName: 'GPT-5.2',
  },
  {
    id: 'openai/gpt-5.2-chat',
    provider: 'openai',
    providerModelId: 'openai/gpt-5.2-chat',
    pricing: { inputPerToken: 0.00000175, outputPerToken: 0.000014 },
    maxTokens: 128_000,
    displayName: 'GPT-5.2 Chat',
  },
  {
    id: 'openai/gpt-5.1-codex-max',
    provider: 'openai',
    providerModelId: 'openai/gpt-5.1-codex-max',
    pricing: { inputPerToken: 0.00000125, outputPerToken: 0.00001 },
    maxTokens: 400_000,
    displayName: 'GPT-5.1 Codex Max',
  },
  {
    id: 'openai/gpt-audio',
    provider: 'openai',
    providerModelId: 'openai/gpt-audio',
    pricing: { inputPerToken: 0.0000025, outputPerToken: 0.00001 },
    maxTokens: 128_000,
    displayName: 'GPT Audio',
  },
  {
    id: 'openai/gpt-audio-mini',
    provider: 'openai',
    providerModelId: 'openai/gpt-audio-mini',
    pricing: { inputPerToken: 0.0000006, outputPerToken: 0.0000024 },
    maxTokens: 128_000,
    displayName: 'GPT Audio Mini',
  },

  // ──────────────────────────────────────────────
  // Anthropic
  // ──────────────────────────────────────────────
  {
    id: 'anthropic/claude-opus-4.6',
    provider: 'anthropic',
    providerModelId: 'anthropic/claude-opus-4.6',
    pricing: { inputPerToken: 0.000005, outputPerToken: 0.000025 },
    maxTokens: 1_000_000,
    displayName: 'Claude Opus 4.6',
  },
  {
    id: 'anthropic/claude-opus-4.5',
    provider: 'anthropic',
    providerModelId: 'anthropic/claude-opus-4.5',
    pricing: { inputPerToken: 0.000005, outputPerToken: 0.000025 },
    maxTokens: 200_000,
    displayName: 'Claude Opus 4.5',
  },
  {
    id: 'anthropic/claude-sonnet-4.6',
    provider: 'anthropic',
    providerModelId: 'anthropic/claude-sonnet-4.6',
    pricing: { inputPerToken: 0.000003, outputPerToken: 0.000015 },
    maxTokens: 1_000_000,
    displayName: 'Claude Sonnet 4.6',
  },

  // ──────────────────────────────────────────────
  // Google
  // ──────────────────────────────────────────────
  {
    id: 'google/gemini-3-pro-preview',
    provider: 'google',
    providerModelId: 'google/gemini-3-pro-preview',
    pricing: { inputPerToken: 0.000002, outputPerToken: 0.000012 },
    maxTokens: 1_048_576,
    displayName: 'Gemini 3 Pro Preview',
  },
  {
    id: 'google/gemini-3-flash-preview',
    provider: 'google',
    providerModelId: 'google/gemini-3-flash-preview',
    pricing: { inputPerToken: 0.0000005, outputPerToken: 0.000003 },
    maxTokens: 1_048_576,
    displayName: 'Gemini 3 Flash Preview',
  },
  {
    id: 'google/gemini-3.1-pro-preview',
    provider: 'google',
    providerModelId: 'google/gemini-3.1-pro-preview',
    pricing: { inputPerToken: 0.000002, outputPerToken: 0.000012 },
    maxTokens: 1_048_576,
    displayName: 'Gemini 3.1 Pro Preview',
  },
  {
    id: 'google/gemini-3.1-flash-lite-preview',
    provider: 'google',
    providerModelId: 'google/gemini-3.1-flash-lite-preview',
    pricing: { inputPerToken: 0.00000025, outputPerToken: 0.0000015 },
    maxTokens: 1_048_576,
    displayName: 'Gemini 3.1 Flash Lite Preview',
  },

  // ──────────────────────────────────────────────
  // DeepSeek
  // ──────────────────────────────────────────────
  {
    id: 'deepseek/deepseek-v3.2',
    provider: 'deepseek',
    providerModelId: 'deepseek/deepseek-v3.2',
    pricing: { inputPerToken: 0.00000025, outputPerToken: 0.0000004 },
    maxTokens: 163_840,
    displayName: 'DeepSeek V3.2',
  },
  {
    id: 'deepseek/deepseek-v3.2-speciale',
    provider: 'deepseek',
    providerModelId: 'deepseek/deepseek-v3.2-speciale',
    pricing: { inputPerToken: 0.0000004, outputPerToken: 0.0000012 },
    maxTokens: 163_840,
    displayName: 'DeepSeek V3.2 Speciale',
  },

  // ──────────────────────────────────────────────
  // Qwen
  // ──────────────────────────────────────────────
  {
    id: 'qwen/qwen3.5-plus-02-15',
    provider: 'qwen',
    providerModelId: 'qwen/qwen3.5-plus-02-15',
    pricing: { inputPerToken: 0.00000026, outputPerToken: 0.00000156 },
    maxTokens: 1_000_000,
    displayName: 'Qwen3.5 Plus',
  },
  {
    id: 'qwen/qwen3.5-flash-02-23',
    provider: 'qwen',
    providerModelId: 'qwen/qwen3.5-flash-02-23',
    pricing: { inputPerToken: 0.0000001, outputPerToken: 0.0000004 },
    maxTokens: 1_000_000,
    displayName: 'Qwen3.5 Flash',
  },
  {
    id: 'qwen/qwen3.5-397b-a17b',
    provider: 'qwen',
    providerModelId: 'qwen/qwen3.5-397b-a17b',
    pricing: { inputPerToken: 0.00000039, outputPerToken: 0.00000234 },
    maxTokens: 262_144,
    displayName: 'Qwen3.5 397B A17B',
  },
  {
    id: 'qwen/qwen3.5-122b-a10b',
    provider: 'qwen',
    providerModelId: 'qwen/qwen3.5-122b-a10b',
    pricing: { inputPerToken: 0.00000026, outputPerToken: 0.00000208 },
    maxTokens: 262_144,
    displayName: 'Qwen3.5 122B A10B',
  },
  {
    id: 'qwen/qwen3.5-35b-a3b',
    provider: 'qwen',
    providerModelId: 'qwen/qwen3.5-35b-a3b',
    pricing: { inputPerToken: 0.0000001625, outputPerToken: 0.0000013 },
    maxTokens: 262_144,
    displayName: 'Qwen3.5 35B A3B',
  },
  {
    id: 'qwen/qwen3.5-27b',
    provider: 'qwen',
    providerModelId: 'qwen/qwen3.5-27b',
    pricing: { inputPerToken: 0.000000195, outputPerToken: 0.00000156 },
    maxTokens: 262_144,
    displayName: 'Qwen3.5 27B',
  },
  {
    id: 'qwen/qwen3-max-thinking',
    provider: 'qwen',
    providerModelId: 'qwen/qwen3-max-thinking',
    pricing: { inputPerToken: 0.00000078, outputPerToken: 0.0000039 },
    maxTokens: 262_144,
    displayName: 'Qwen3 Max Thinking',
  },
  {
    id: 'qwen/qwen3-coder-next',
    provider: 'qwen',
    providerModelId: 'qwen/qwen3-coder-next',
    pricing: { inputPerToken: 0.00000012, outputPerToken: 0.00000075 },
    maxTokens: 262_144,
    displayName: 'Qwen3 Coder Next',
  },

  // ──────────────────────────────────────────────
  // Mistral
  // ──────────────────────────────────────────────
  {
    id: 'mistralai/mistral-large-2512',
    provider: 'mistral',
    providerModelId: 'mistralai/mistral-large-2512',
    pricing: { inputPerToken: 0.0000005, outputPerToken: 0.0000015 },
    maxTokens: 262_144,
    displayName: 'Mistral Large 3',
  },
  {
    id: 'mistralai/devstral-2512',
    provider: 'mistral',
    providerModelId: 'mistralai/devstral-2512',
    pricing: { inputPerToken: 0.0000004, outputPerToken: 0.000002 },
    maxTokens: 262_144,
    displayName: 'Devstral 2',
  },
  {
    id: 'mistralai/ministral-14b-2512',
    provider: 'mistral',
    providerModelId: 'mistralai/ministral-14b-2512',
    pricing: { inputPerToken: 0.0000002, outputPerToken: 0.0000002 },
    maxTokens: 262_144,
    displayName: 'Ministral 3 14B',
  },
  {
    id: 'mistralai/ministral-8b-2512',
    provider: 'mistral',
    providerModelId: 'mistralai/ministral-8b-2512',
    pricing: { inputPerToken: 0.00000015, outputPerToken: 0.00000015 },
    maxTokens: 262_144,
    displayName: 'Ministral 3 8B',
  },
  {
    id: 'mistralai/ministral-3b-2512',
    provider: 'mistral',
    providerModelId: 'mistralai/ministral-3b-2512',
    pricing: { inputPerToken: 0.0000001, outputPerToken: 0.0000001 },
    maxTokens: 131_072,
    displayName: 'Ministral 3 3B',
  },
  {
    id: 'mistralai/mistral-small-creative',
    provider: 'mistral',
    providerModelId: 'mistralai/mistral-small-creative',
    pricing: { inputPerToken: 0.0000001, outputPerToken: 0.0000003 },
    maxTokens: 32_768,
    displayName: 'Mistral Small Creative',
  },

  // ──────────────────────────────────────────────
  // xAI
  // ──────────────────────────────────────────────
  {
    id: 'x-ai/grok-4.1-fast',
    provider: 'xai',
    providerModelId: 'x-ai/grok-4.1-fast',
    pricing: { inputPerToken: 0.0000002, outputPerToken: 0.0000005 },
    maxTokens: 2_000_000,
    displayName: 'Grok 4.1 Fast',
  },

  // ──────────────────────────────────────────────
  // ByteDance Seed
  // ──────────────────────────────────────────────
  {
    id: 'bytedance-seed/seed-2.0-mini',
    provider: 'bytedance',
    providerModelId: 'bytedance-seed/seed-2.0-mini',
    pricing: { inputPerToken: 0.0000001, outputPerToken: 0.0000004 },
    maxTokens: 262_144,
    displayName: 'Seed 2.0 Mini',
  },
  {
    id: 'bytedance-seed/seed-1.6-flash',
    provider: 'bytedance',
    providerModelId: 'bytedance-seed/seed-1.6-flash',
    pricing: { inputPerToken: 0.000000075, outputPerToken: 0.0000003 },
    maxTokens: 262_144,
    displayName: 'Seed 1.6 Flash',
  },
  {
    id: 'bytedance-seed/seed-1.6',
    provider: 'bytedance',
    providerModelId: 'bytedance-seed/seed-1.6',
    pricing: { inputPerToken: 0.00000025, outputPerToken: 0.000002 },
    maxTokens: 262_144,
    displayName: 'Seed 1.6',
  },

  // ──────────────────────────────────────────────
  // MiniMax
  // ──────────────────────────────────────────────
  {
    id: 'minimax/minimax-m2.5',
    provider: 'minimax',
    providerModelId: 'minimax/minimax-m2.5',
    pricing: { inputPerToken: 0.000000295, outputPerToken: 0.0000012 },
    maxTokens: 196_608,
    displayName: 'MiniMax M2.5',
  },
  {
    id: 'minimax/minimax-m2.1',
    provider: 'minimax',
    providerModelId: 'minimax/minimax-m2.1',
    pricing: { inputPerToken: 0.00000027, outputPerToken: 0.00000095 },
    maxTokens: 196_608,
    displayName: 'MiniMax M2.1',
  },

  // ──────────────────────────────────────────────
  // MoonshotAI
  // ──────────────────────────────────────────────
  {
    id: 'moonshotai/kimi-k2.5',
    provider: 'moonshot',
    providerModelId: 'moonshotai/kimi-k2.5',
    pricing: { inputPerToken: 0.00000045, outputPerToken: 0.0000022 },
    maxTokens: 262_144,
    displayName: 'Kimi K2.5',
  },

  // ──────────────────────────────────────────────
  // Others
  // ──────────────────────────────────────────────
  {
    id: 'liquid/lfm-2-24b-a2b',
    provider: 'liquid',
    providerModelId: 'liquid/lfm-2-24b-a2b',
    pricing: { inputPerToken: 0.00000003, outputPerToken: 0.00000012 },
    maxTokens: 32_768,
    displayName: 'LFM2 24B A2B',
  },
  {
    id: 'amazon/nova-2-lite-v1',
    provider: 'amazon',
    providerModelId: 'amazon/nova-2-lite-v1',
    pricing: { inputPerToken: 0.0000003, outputPerToken: 0.0000025 },
    maxTokens: 1_000_000,
    displayName: 'Amazon Nova 2 Lite',
  },
  {
    id: 'upstage/solar-pro-3',
    provider: 'upstage',
    providerModelId: 'upstage/solar-pro-3',
    pricing: { inputPerToken: 0.00000015, outputPerToken: 0.0000006 },
    maxTokens: 128_000,
    displayName: 'Solar Pro 3',
  },
  {
    id: 'writer/palmyra-x5',
    provider: 'writer',
    providerModelId: 'writer/palmyra-x5',
    pricing: { inputPerToken: 0.0000006, outputPerToken: 0.000006 },
    maxTokens: 1_040_000,
    displayName: 'Palmyra X5',
  },
];

export class ModelRegistry {
  private models: Map<string, ModelDefinition> = new Map();

  constructor(customModels?: ModelDefinition[]) {
    // Load default models
    for (const model of DEFAULT_MODELS) {
      this.models.set(model.id, model);
    }

    // Override/add custom models
    if (customModels) {
      for (const model of customModels) {
        this.models.set(model.id, model);
      }
    }
  }

  getModel(modelId: string): ModelDefinition | undefined {
    return this.models.get(modelId);
  }

  listModels(): ModelDefinition[] {
    return Array.from(this.models.values());
  }

  listModelsByProvider(provider: ProviderType): ModelDefinition[] {
    return this.listModels().filter((m) => m.provider === provider);
  }

  addModel(model: ModelDefinition): void {
    this.models.set(model.id, model);
  }

  removeModel(modelId: string): boolean {
    return this.models.delete(modelId);
  }
}
