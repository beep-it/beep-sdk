/**
 * Tests for utils/prompts.ts
 */

import { validateApiKey, detectPackageManager } from '../src/utils/prompts';

describe('prompts utility', () => {
  describe('validateApiKey', () => {
    it('should return error message for empty key', () => {
      const result = validateApiKey('');
      expect(result).toBe('API key is required');
    });

    it('should accept valid secret key format', () => {
      const result = validateApiKey('beep_sk_test_123456');
      expect(result).toBe(true);
    });

    it('should accept valid publishable key format', () => {
      const result = validateApiKey('beep_pk_live_abc123');
      expect(result).toBe(true);
    });

    it('should reject invalid key format', () => {
      const result = validateApiKey('invalid_key');
      expect(typeof result).toBe('string');
      expect(result).toContain('Invalid API key format');
    });

    it('should reject keys with wrong prefix', () => {
      const result = validateApiKey('sk_test_123');
      expect(typeof result).toBe('string');
      expect(result).toContain('beep_sk_');
    });
  });

  describe('detectPackageManager', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should detect yarn from user agent', () => {
      process.env.npm_config_user_agent = 'yarn/1.22.19 npm/? node/v18.0.0';
      expect(detectPackageManager()).toBe('yarn');
    });

    it('should detect pnpm from user agent', () => {
      process.env.npm_config_user_agent = 'pnpm/8.0.0 npm/? node/v18.0.0';
      expect(detectPackageManager()).toBe('pnpm');
    });

    it('should default to npm when no user agent', () => {
      delete process.env.npm_config_user_agent;
      expect(detectPackageManager()).toBe('npm');
    });

    it('should default to npm for npm user agent', () => {
      process.env.npm_config_user_agent = 'npm/9.0.0 node/v18.0.0';
      expect(detectPackageManager()).toBe('npm');
    });
  });
});
