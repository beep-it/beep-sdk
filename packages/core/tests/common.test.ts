import { isUUID, isMoneyAmount, formatMoneyAmount, parseMoneyAmount } from '../src/types/common';

describe('Common Utilities', () => {
  describe('isUUID', () => {
    it('returns true for valid UUID v4', () => {
      expect(isUUID('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
    });

    it('returns false for invalid UUID', () => {
      expect(isUUID('not-a-uuid')).toBe(false);
    });

    it('returns false for non-string values', () => {
      expect(isUUID(12345)).toBe(false);
      expect(isUUID(null)).toBe(false);
      expect(isUUID(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isUUID('')).toBe(false);
    });
  });

  describe('isMoneyAmount', () => {
    it('returns true for valid money amounts', () => {
      expect(isMoneyAmount('10.50')).toBe(true);
      expect(isMoneyAmount('0.99')).toBe(true);
      expect(isMoneyAmount('100')).toBe(true);
      expect(isMoneyAmount('0.1')).toBe(true);
    });

    it('returns false for invalid money amounts', () => {
      expect(isMoneyAmount('10.999')).toBe(false); // 3 decimals
      expect(isMoneyAmount('-5.00')).toBe(false); // negative
      expect(isMoneyAmount('abc')).toBe(false);
      expect(isMoneyAmount('')).toBe(false);
    });

    it('returns false for non-string values', () => {
      expect(isMoneyAmount(10.5)).toBe(false);
      expect(isMoneyAmount(null)).toBe(false);
    });
  });

  describe('formatMoneyAmount', () => {
    it('formats numbers with 2 decimal places by default', () => {
      expect(formatMoneyAmount(10.5)).toBe('10.50');
      expect(formatMoneyAmount(0)).toBe('0.00');
      expect(formatMoneyAmount(100)).toBe('100.00');
    });

    it('formats with custom decimal places', () => {
      expect(formatMoneyAmount(10.5, 4)).toBe('10.5000');
      expect(formatMoneyAmount(1.123456, 6)).toBe('1.123456');
    });
  });

  describe('parseMoneyAmount', () => {
    it('parses valid money strings to numbers', () => {
      expect(parseMoneyAmount('10.50')).toBe(10.5);
      expect(parseMoneyAmount('0.99')).toBe(0.99);
      expect(parseMoneyAmount('100')).toBe(100);
    });
  });
});
