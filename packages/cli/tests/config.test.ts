/**
 * Tests for utils/config.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  readEnvFile,
  writeEnvFile,
  analyzeProject,
  createConfigFile,
  loadConfigFile,
  getInstallCommand,
  getRunCommand,
} from '../src/utils/config';

const testDir = path.join(__dirname, 'test-config');

describe('config utility', () => {
  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // Clean up test directory before each test
    const entries = await fs.readdir(testDir);
    for (const entry of entries) {
      await fs.rm(path.join(testDir, entry), { recursive: true, force: true });
    }
  });

  describe('readEnvFile', () => {
    it('should parse simple key=value pairs', async () => {
      const envPath = path.join(testDir, '.env');
      await fs.writeFile(envPath, 'KEY1=value1\nKEY2=value2');

      const result = await readEnvFile(envPath);

      expect(result).toEqual({
        KEY1: 'value1',
        KEY2: 'value2',
      });
    });

    it('should handle values with equals signs', async () => {
      const envPath = path.join(testDir, '.env');
      await fs.writeFile(envPath, 'CONNECTION_STRING=host=localhost;port=5432');

      const result = await readEnvFile(envPath);

      expect(result.CONNECTION_STRING).toBe('host=localhost;port=5432');
    });

    it('should skip comments', async () => {
      const envPath = path.join(testDir, '.env');
      await fs.writeFile(envPath, '# This is a comment\nKEY=value\n# Another comment');

      const result = await readEnvFile(envPath);

      expect(result).toEqual({ KEY: 'value' });
    });

    it('should skip empty lines', async () => {
      const envPath = path.join(testDir, '.env');
      await fs.writeFile(envPath, 'KEY1=value1\n\n\nKEY2=value2');

      const result = await readEnvFile(envPath);

      expect(result).toEqual({
        KEY1: 'value1',
        KEY2: 'value2',
      });
    });

    it('should return empty object for non-existent file', async () => {
      const result = await readEnvFile(path.join(testDir, 'nonexistent.env'));
      expect(result).toEqual({});
    });

    it('should trim whitespace from keys and values', async () => {
      const envPath = path.join(testDir, '.env');
      await fs.writeFile(envPath, '  KEY  =  value  ');

      const result = await readEnvFile(envPath);

      expect(result).toEqual({ KEY: 'value' });
    });
  });

  describe('writeEnvFile', () => {
    it('should write key=value pairs', async () => {
      const envPath = path.join(testDir, '.env');

      await writeEnvFile({
        filePath: envPath,
        values: { KEY1: 'value1', KEY2: 'value2' },
        preserve: false,
      });

      const content = await fs.readFile(envPath, 'utf-8');
      expect(content).toContain('KEY1=value1');
      expect(content).toContain('KEY2=value2');
    });

    it('should add header for new files', async () => {
      const envPath = path.join(testDir, '.env');

      await writeEnvFile({
        filePath: envPath,
        values: { KEY: 'value' },
        preserve: false,
      });

      const content = await fs.readFile(envPath, 'utf-8');
      expect(content).toContain('# BEEP SDK Configuration');
    });

    it('should preserve existing values when preserve is true', async () => {
      const envPath = path.join(testDir, '.env');
      await fs.writeFile(envPath, 'EXISTING=keep_me');

      await writeEnvFile({
        filePath: envPath,
        values: { NEW: 'new_value' },
        preserve: true,
      });

      const content = await fs.readFile(envPath, 'utf-8');
      expect(content).toContain('EXISTING=keep_me');
      expect(content).toContain('NEW=new_value');
    });

    it('should overwrite existing values when preserve is false', async () => {
      const envPath = path.join(testDir, '.env');
      await fs.writeFile(envPath, 'EXISTING=old_value');

      await writeEnvFile({
        filePath: envPath,
        values: { EXISTING: 'new_value' },
        preserve: false,
      });

      const content = await fs.readFile(envPath, 'utf-8');
      expect(content).toContain('EXISTING=new_value');
      expect(content).not.toContain('old_value');
    });
  });

  describe('analyzeProject', () => {
    it('should detect project name from package.json', async () => {
      const projectDir = path.join(testDir, 'my-project');
      await fs.mkdir(projectDir, { recursive: true });
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'my-app', version: '1.0.0' }),
      );

      const info = await analyzeProject(projectDir);

      expect(info.name).toBe('my-app');
      expect(info.version).toBe('1.0.0');
      expect(info.hasPackageJson).toBe(true);
    });

    it('should detect TypeScript dependency', async () => {
      const projectDir = path.join(testDir, 'ts-project');
      await fs.mkdir(projectDir, { recursive: true });
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'ts-app',
          devDependencies: { typescript: '^5.0.0' },
        }),
      );

      const info = await analyzeProject(projectDir);

      expect(info.hasTypeScript).toBe(true);
    });

    it('should detect MCP SDK dependency', async () => {
      const projectDir = path.join(testDir, 'mcp-project');
      await fs.mkdir(projectDir, { recursive: true });
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'mcp-app',
          dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
        }),
      );

      const info = await analyzeProject(projectDir);

      expect(info.hasMcp).toBe(true);
    });

    it('should detect BEEP SDK dependency', async () => {
      const projectDir = path.join(testDir, 'beep-project');
      await fs.mkdir(projectDir, { recursive: true });
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'beep-app',
          dependencies: { '@beep-it/sdk-core': '^1.0.0' },
        }),
      );

      const info = await analyzeProject(projectDir);

      expect(info.hasBeepSdk).toBe(true);
    });

    it('should detect pnpm from pnpm-lock.yaml', async () => {
      const projectDir = path.join(testDir, 'pnpm-project');
      await fs.mkdir(projectDir, { recursive: true });
      await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify({ name: 'app' }));
      await fs.writeFile(path.join(projectDir, 'pnpm-lock.yaml'), 'lockfileVersion: 6.0');

      const info = await analyzeProject(projectDir);

      expect(info.packageManager).toBe('pnpm');
    });

    it('should detect yarn from yarn.lock', async () => {
      const projectDir = path.join(testDir, 'yarn-project');
      await fs.mkdir(projectDir, { recursive: true });
      await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify({ name: 'app' }));
      await fs.writeFile(path.join(projectDir, 'yarn.lock'), '# yarn lockfile');

      const info = await analyzeProject(projectDir);

      expect(info.packageManager).toBe('yarn');
    });

    it('should default to npm when no lockfile found', async () => {
      const projectDir = path.join(testDir, 'npm-project');
      await fs.mkdir(projectDir, { recursive: true });
      await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify({ name: 'app' }));

      const info = await analyzeProject(projectDir);

      expect(info.packageManager).toBe('npm');
    });

    it('should detect common server file patterns', async () => {
      const projectDir = path.join(testDir, 'server-project');
      await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });
      await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify({ name: 'app' }));
      await fs.writeFile(path.join(projectDir, 'src', 'mcp-server.ts'), '// server code');

      const info = await analyzeProject(projectDir);

      expect(info.serverFile).toBe('src/mcp-server.ts');
    });

    it('should handle missing package.json gracefully', async () => {
      const projectDir = path.join(testDir, 'no-package');
      await fs.mkdir(projectDir, { recursive: true });

      const info = await analyzeProject(projectDir);

      expect(info.hasPackageJson).toBe(false);
      expect(info.name).toBe('no-package');
    });
  });

  describe('createConfigFile / loadConfigFile', () => {
    it('should create and load beep.config.json', async () => {
      await createConfigFile(testDir, {
        communicationMode: 'https',
        role: 'mcp-server',
        packageManager: 'pnpm',
      });

      const loaded = await loadConfigFile(testDir);

      expect(loaded).toBeDefined();
      expect(loaded?.communicationMode).toBe('https');
      expect(loaded?.role).toBe('mcp-server');
      expect(loaded?.packageManager).toBe('pnpm');
    });

    it('should not store API key in config file', async () => {
      await createConfigFile(testDir, {
        apiKey: 'secret_key',
        communicationMode: 'https',
      });

      const content = await fs.readFile(path.join(testDir, 'beep.config.json'), 'utf-8');
      expect(content).not.toContain('secret_key');
    });

    it('should return null for missing config file', async () => {
      const result = await loadConfigFile(path.join(testDir, 'nonexistent'));
      expect(result).toBeNull();
    });
  });

  describe('getInstallCommand', () => {
    it('should return npm install for npm with no packages', () => {
      expect(getInstallCommand('npm')).toBe('npm install');
    });

    it('should return npm install with packages', () => {
      expect(getInstallCommand('npm', ['pkg1', 'pkg2'])).toBe('npm install pkg1 pkg2');
    });

    it('should return pnpm add for pnpm with packages', () => {
      expect(getInstallCommand('pnpm', ['pkg1'])).toBe('pnpm add pkg1');
    });

    it('should return pnpm install for pnpm with no packages', () => {
      expect(getInstallCommand('pnpm')).toBe('pnpm install');
    });

    it('should return yarn add for yarn with packages', () => {
      expect(getInstallCommand('yarn', ['pkg1'])).toBe('yarn add pkg1');
    });

    it('should return yarn for yarn with no packages', () => {
      expect(getInstallCommand('yarn')).toBe('yarn');
    });
  });

  describe('getRunCommand', () => {
    it('should return npm run for npm', () => {
      expect(getRunCommand('npm', 'build')).toBe('npm run build');
    });

    it('should return pnpm for pnpm', () => {
      expect(getRunCommand('pnpm', 'build')).toBe('pnpm build');
    });

    it('should return yarn for yarn', () => {
      expect(getRunCommand('yarn', 'build')).toBe('yarn build');
    });
  });
});
