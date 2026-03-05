import {
  estimateInputTokens,
  estimateCost,
  calculateActualCost,
  formatUsdcAmount,
  estimateMaxOutput,
} from '../../src/router/cost';
import { ChatMessage, ModelDefinition, TokenUsage } from '../../src/types';

const testModel: ModelDefinition = {
  id: 'test/model',
  provider: 'openai',
  providerModelId: 'test-model',
  pricing: { inputPerToken: 0.000005, outputPerToken: 0.000025 },
  maxTokens: 4096,
};

describe('estimateInputTokens', () => {
  it('returns 0 tokens for empty messages', () => {
    expect(estimateInputTokens([])).toBe(0);
  });

  it('counts role overhead for a single message', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: '' },
    ];
    // 16 chars overhead / 4 = 4 tokens
    expect(estimateInputTokens(messages)).toBe(4);
  });

  it('counts content characters', () => {
    const content = 'a'.repeat(100);
    const messages: ChatMessage[] = [
      { role: 'user', content },
    ];
    // (16 + 100) / 4 = 29
    expect(estimateInputTokens(messages)).toBe(29);
  });

  it('sums multiple messages', () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'a'.repeat(40) },
      { role: 'user', content: 'a'.repeat(80) },
    ];
    // (16 + 40 + 16 + 80) / 4 = 38
    expect(estimateInputTokens(messages)).toBe(38);
  });

  it('handles null content', () => {
    const messages: ChatMessage[] = [
      { role: 'assistant', content: null },
    ];
    // 16 / 4 = 4
    expect(estimateInputTokens(messages)).toBe(4);
  });

  it('includes name field length', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'hi', name: 'alice' },
    ];
    // (16 + 2 + 5) / 4 = ceil(23/4) = 6
    expect(estimateInputTokens(messages)).toBe(6);
  });

  it('rounds up to nearest integer', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'a' },
    ];
    // (16 + 1) / 4 = 4.25 → ceil = 5
    expect(estimateInputTokens(messages)).toBe(5);
  });
});

describe('estimateCost', () => {
  it('calculates cost with no multiplier', () => {
    // 1000 * 0.000005 + 2000 * 0.000025 = 0.005 + 0.05 = 0.055
    const cost = estimateCost(testModel, 1000, 2000);
    expect(cost).toBeCloseTo(0.055, 6);
  });

  it('applies cost multiplier', () => {
    const cost = estimateCost(testModel, 1000, 2000, 1.05);
    expect(cost).toBeCloseTo(0.055 * 1.05, 6);
  });

  it('returns 0 for zero tokens', () => {
    expect(estimateCost(testModel, 0, 0)).toBe(0);
  });

  it('handles input-only cost', () => {
    const cost = estimateCost(testModel, 1000, 0);
    expect(cost).toBeCloseTo(0.005, 6);
  });

  it('handles output-only cost', () => {
    const cost = estimateCost(testModel, 0, 1000);
    expect(cost).toBeCloseTo(0.025, 6);
  });
});

describe('calculateActualCost', () => {
  it('calculates cost from TokenUsage', () => {
    const usage: TokenUsage = { prompt_tokens: 500, completion_tokens: 200, total_tokens: 700 };
    // 500 * 0.000005 + 200 * 0.000025 = 0.0025 + 0.005 = 0.0075
    const cost = calculateActualCost(testModel, usage);
    expect(cost).toBeCloseTo(0.0075, 6);
  });

  it('applies cost multiplier', () => {
    const usage: TokenUsage = { prompt_tokens: 500, completion_tokens: 200, total_tokens: 700 };
    const cost = calculateActualCost(testModel, usage, 1.1);
    expect(cost).toBeCloseTo(0.0075 * 1.1, 6);
  });

  it('returns 0 for zero usage', () => {
    const usage: TokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    expect(calculateActualCost(testModel, usage)).toBe(0);
  });
});

describe('formatUsdcAmount', () => {
  it('formats to 6 decimal places', () => {
    expect(formatUsdcAmount(0.123456)).toBe('0.123456');
  });

  it('rounds to 6 decimals', () => {
    expect(formatUsdcAmount(0.1234567)).toBe('0.123457');
  });

  it('pads with trailing zeros', () => {
    expect(formatUsdcAmount(0.1)).toBe('0.100000');
  });

  it('formats zero', () => {
    expect(formatUsdcAmount(0)).toBe('0.000000');
  });

  it('formats large amounts', () => {
    expect(formatUsdcAmount(1000.5)).toBe('1000.500000');
  });

  it('handles very small amounts', () => {
    expect(formatUsdcAmount(0.000001)).toBe('0.000001');
  });
});

describe('estimateMaxOutput', () => {
  it('uses requested max when within model limit', () => {
    expect(estimateMaxOutput(1000, 4096)).toBe(1000);
  });

  it('caps at model max when requested exceeds it', () => {
    expect(estimateMaxOutput(5000, 4096)).toBe(4096);
  });

  it('defaults to model_max/4 when not specified', () => {
    expect(estimateMaxOutput(undefined, 4096)).toBe(1024);
  });

  it('caps default at 4096', () => {
    // model max = 1_000_000, 1_000_000/4 = 250_000 → capped at 4096
    expect(estimateMaxOutput(undefined, 1_000_000)).toBe(4096);
  });

  it('treats 0 as unspecified', () => {
    expect(estimateMaxOutput(0, 4096)).toBe(1024);
  });

  it('treats negative as unspecified', () => {
    expect(estimateMaxOutput(-1, 4096)).toBe(1024);
  });
});
