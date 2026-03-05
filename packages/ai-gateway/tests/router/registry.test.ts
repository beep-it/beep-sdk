import { ModelRegistry } from '../../src/router/registry';
import { ModelDefinition } from '../../src/types';

const customModel: ModelDefinition = {
  id: 'custom/test-model',
  provider: 'custom',
  providerModelId: 'test-model',
  pricing: { inputPerToken: 0.001, outputPerToken: 0.002 },
  maxTokens: 8192,
  displayName: 'Test Model',
};

describe('ModelRegistry', () => {
  describe('constructor', () => {
    it('loads default models', () => {
      const registry = new ModelRegistry();
      const models = registry.listModels();
      expect(models.length).toBeGreaterThan(40);
    });

    it('merges custom models', () => {
      const registry = new ModelRegistry([customModel]);
      expect(registry.getModel('custom/test-model')).toEqual(customModel);
    });

    it('custom model overrides default with same ID', () => {
      const override: ModelDefinition = {
        id: 'openai/gpt-5.3-chat',
        provider: 'openai',
        providerModelId: 'openai/gpt-5.3-chat',
        pricing: { inputPerToken: 0.999, outputPerToken: 0.999 },
        maxTokens: 999,
      };
      const registry = new ModelRegistry([override]);
      const model = registry.getModel('openai/gpt-5.3-chat');
      expect(model?.pricing.inputPerToken).toBe(0.999);
    });
  });

  describe('getModel', () => {
    it('returns existing model', () => {
      const registry = new ModelRegistry();
      const model = registry.getModel('openai/gpt-5.3-chat');
      expect(model).toBeDefined();
      expect(model!.provider).toBe('openai');
    });

    it('returns undefined for non-existent model', () => {
      const registry = new ModelRegistry();
      expect(registry.getModel('nonexistent/model')).toBeUndefined();
    });

    it('is case-sensitive', () => {
      const registry = new ModelRegistry();
      expect(registry.getModel('OPENAI/GPT-5.3-CHAT')).toBeUndefined();
    });
  });

  describe('listModels', () => {
    it('returns all models as array', () => {
      const registry = new ModelRegistry();
      const models = registry.listModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('includes custom models in count', () => {
      const base = new ModelRegistry();
      const withCustom = new ModelRegistry([customModel]);
      expect(withCustom.listModels().length).toBe(base.listModels().length + 1);
    });
  });

  describe('listModelsByProvider', () => {
    it('filters by openai provider', () => {
      const registry = new ModelRegistry();
      const models = registry.listModelsByProvider('openai');
      expect(models.length).toBeGreaterThan(0);
      expect(models.every((m) => m.provider === 'openai')).toBe(true);
    });

    it('filters by anthropic provider', () => {
      const registry = new ModelRegistry();
      const models = registry.listModelsByProvider('anthropic');
      expect(models.length).toBe(3);
    });

    it('returns empty for non-existent provider', () => {
      const registry = new ModelRegistry();
      const models = registry.listModelsByProvider('custom');
      expect(models).toEqual([]);
    });
  });

  describe('addModel', () => {
    it('adds a new model', () => {
      const registry = new ModelRegistry();
      const before = registry.listModels().length;
      registry.addModel(customModel);
      expect(registry.listModels().length).toBe(before + 1);
      expect(registry.getModel('custom/test-model')).toEqual(customModel);
    });

    it('replaces existing model with same ID', () => {
      const registry = new ModelRegistry();
      registry.addModel(customModel);
      const updated = { ...customModel, maxTokens: 99999 };
      registry.addModel(updated);
      expect(registry.getModel('custom/test-model')?.maxTokens).toBe(99999);
    });
  });

  describe('removeModel', () => {
    it('removes existing model and returns true', () => {
      const registry = new ModelRegistry();
      const before = registry.listModels().length;
      const result = registry.removeModel('openai/gpt-5.3-chat');
      expect(result).toBe(true);
      expect(registry.listModels().length).toBe(before - 1);
      expect(registry.getModel('openai/gpt-5.3-chat')).toBeUndefined();
    });

    it('returns false for non-existent model', () => {
      const registry = new ModelRegistry();
      expect(registry.removeModel('nonexistent')).toBe(false);
    });
  });
});
