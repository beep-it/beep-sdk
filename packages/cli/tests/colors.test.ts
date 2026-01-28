/**
 * Tests for utils/colors.ts
 */

import { color, colors, output } from '../src/utils/colors';

describe('colors utility', () => {
  describe('ANSI color codes', () => {
    it('should have reset code', () => {
      expect(colors.reset).toBe('\x1b[0m');
    });

    it('should have standard text colors', () => {
      expect(colors.red).toBe('\x1b[31m');
      expect(colors.green).toBe('\x1b[32m');
      expect(colors.yellow).toBe('\x1b[33m');
      expect(colors.blue).toBe('\x1b[34m');
      expect(colors.cyan).toBe('\x1b[36m');
    });

    it('should have style codes', () => {
      expect(colors.bright).toBe('\x1b[1m');
      expect(colors.dim).toBe('\x1b[2m');
    });
  });

  describe('color helper functions', () => {
    it('should wrap text with error color (red)', () => {
      const result = color.error('test');
      expect(result).toBe(`${colors.red}test${colors.reset}`);
    });

    it('should wrap text with success color (green)', () => {
      const result = color.success('test');
      expect(result).toBe(`${colors.green}test${colors.reset}`);
    });

    it('should wrap text with warning color (yellow)', () => {
      const result = color.warning('test');
      expect(result).toBe(`${colors.yellow}test${colors.reset}`);
    });

    it('should wrap text with info color (cyan)', () => {
      const result = color.info('test');
      expect(result).toBe(`${colors.cyan}test${colors.reset}`);
    });

    it('should wrap text with dim style', () => {
      const result = color.dim('test');
      expect(result).toBe(`${colors.dim}test${colors.reset}`);
    });

    it('should wrap text with bold style', () => {
      const result = color.bold('test');
      expect(result).toBe(`${colors.bright}test${colors.reset}`);
    });

    it('should have direct color functions', () => {
      expect(color.green('text')).toBe(`${colors.green}text${colors.reset}`);
      expect(color.red('text')).toBe(`${colors.red}text${colors.reset}`);
      expect(color.yellow('text')).toBe(`${colors.yellow}text${colors.reset}`);
      expect(color.blue('text')).toBe(`${colors.blue}text${colors.reset}`);
      expect(color.cyan('text')).toBe(`${colors.cyan}text${colors.reset}`);
      expect(color.magenta('text')).toBe(`${colors.magenta}text${colors.reset}`);
    });
  });

  describe('output helpers', () => {
    let consoleSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should output error with red X', () => {
      output.error('test error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('test error'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(colors.red));
    });

    it('should output success with green checkmark', () => {
      output.success('test success');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test success'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(colors.green));
    });

    it('should output warning with yellow symbol', () => {
      output.warning('test warning');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test warning'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(colors.yellow));
    });

    it('should output info with cyan symbol', () => {
      output.info('test info');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test info'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(colors.cyan));
    });

    it('should output step with step/total format', () => {
      output.step({ step: 1, total: 3, message: 'test step' });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[1/3]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test step'));
    });

    it('should output section with title and underline', () => {
      output.section('Test Section');
      expect(consoleSpy).toHaveBeenCalledTimes(2);
    });

    it('should output list with bullet points', () => {
      output.list(['item1', 'item2']);
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('item1'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('item2'));
    });
  });
});
