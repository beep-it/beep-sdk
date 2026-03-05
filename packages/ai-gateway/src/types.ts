/** Supported LLM providers */
export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'qwen'
  | 'mistral'
  | 'xai'
  | 'bytedance'
  | 'minimax'
  | 'moonshot'
  | 'liquid'
  | 'amazon'
  | 'upstage'
  | 'writer'
  | 'ollama'
  | 'custom';

/** Model pricing per token (in USD) */
export interface ModelPricing {
  inputPerToken: number;
  outputPerToken: number;
}

/** Model definition in the registry */
export interface ModelDefinition {
  id: string;
  provider: ProviderType;
  /** Provider-specific model identifier (e.g., "gpt-4o" for OpenAI) */
  providerModelId: string;
  pricing: ModelPricing;
  maxTokens: number;
  /** Human-readable display name */
  displayName?: string;
}

/** OpenAI-compatible chat message */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/** OpenAI-compatible chat completion request */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
}

/** Token usage reported by providers */
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/** OpenAI-compatible chat completion response */
export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: TokenUsage;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

/** Streaming chunk */
export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
  usage?: TokenUsage | null;
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: Partial<ChatMessage>;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

/** a402 payment request included in 402 response */
export interface PaymentRequest {
  amount: string;
  token: string;
  chain: string;
  recipient: string;
  resource: string;
  estimatedTokens: {
    input: number;
    output: number;
  };
  pricePerToken: {
    input: string;
    output: string;
  };
  paymentUrl: string;
  sessionId: string;
}

/** Payment receipt sent by the client */
export interface PaymentReceipt {
  txDigest: string;
  sessionId: string;
}

/** Session tracking for billing */
export interface Session {
  id: string;
  walletAddress?: string;
  balance: number;
  totalPaid: number;
  totalSpent: number;
  requestCount: number;
  createdAt: Date;
  lastActivityAt: Date;
}

/** Provider response (normalized) */
export interface ProviderResponse {
  completion: ChatCompletionResponse;
  usage: TokenUsage;
}

/** Streaming provider response */
export interface ProviderStreamCallbacks {
  onChunk: (chunk: ChatCompletionChunk) => void;
  onDone: (usage: TokenUsage) => void;
  onError: (error: Error) => void;
}

/** Gateway configuration */
export interface GatewayConfig {
  port: number;
  host: string;
  /** Sui wallet address to receive payments */
  recipientAddress: string;
  /** Beep API key for payment verification */
  beepApiKey: string;
  /** Beep server URL */
  beepServerUrl: string;
  /** Provider API keys */
  providers: {
    openai?: string;
    anthropic?: string;
    /** API key for the aggregator service that routes to multiple providers */
    aggregatorApiKey?: string;
    /** Base URL for the aggregator (any OpenAI-compatible multi-model endpoint) */
    aggregatorBaseUrl?: string;
    ollamaUrl?: string;
  };
  /** Custom models to add to the registry */
  customModels?: ModelDefinition[];
  /**
   * Platform fee multiplier applied on top of base model costs (default: 1.05 = 5%).
   * Gateway operators can adjust this to set their own margin.
   * Set to 1.0 for zero platform fees, or higher for additional margin.
   */
  costMultiplier?: number;
  /** Enable points reporting to Beep server for hosted gateway usage */
  reportUsageForPoints?: boolean;
}
