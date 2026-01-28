/**
 * Tests for utils/templates.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { copyTemplate, transformTemplate } from '../src/utils/templates';

const testDir = path.join(__dirname, 'test-templates');
const srcDir = path.join(testDir, 'src');
const destDir = path.join(testDir, 'dest');

describe('templates utility', () => {
  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // Clean up and recreate directories before each test
    await fs.rm(srcDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(destDir, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(srcDir, { recursive: true });
    await fs.mkdir(destDir, { recursive: true });
  });

  describe('copyTemplate', () => {
    it('should copy files from source to destination', async () => {
      // Create source files
      await fs.writeFile(path.join(srcDir, 'file1.ts'), 'content1');
      await fs.writeFile(path.join(srcDir, 'file2.ts'), 'content2');

      const copied = await copyTemplate({
        templatePath: srcDir,
        targetPath: destDir,
      });

      expect(copied).toContain('file1.ts');
      expect(copied).toContain('file2.ts');

      const content1 = await fs.readFile(path.join(destDir, 'file1.ts'), 'utf-8');
      const content2 = await fs.readFile(path.join(destDir, 'file2.ts'), 'utf-8');
      expect(content1).toBe('content1');
      expect(content2).toBe('content2');
    });

    it('should copy nested directories', async () => {
      await fs.mkdir(path.join(srcDir, 'nested'), { recursive: true });
      await fs.writeFile(path.join(srcDir, 'nested', 'deep.ts'), 'nested content');

      const copied = await copyTemplate({
        templatePath: srcDir,
        targetPath: destDir,
      });

      expect(copied).toContain(path.join('nested', 'deep.ts'));

      const content = await fs.readFile(path.join(destDir, 'nested', 'deep.ts'), 'utf-8');
      expect(content).toBe('nested content');
    });

    it('should skip existing files when overwrite is false', async () => {
      await fs.writeFile(path.join(srcDir, 'existing.ts'), 'new content');
      await fs.writeFile(path.join(destDir, 'existing.ts'), 'original content');

      const progressCalls: Array<{ file: string; action: string }> = [];

      await copyTemplate({
        templatePath: srcDir,
        targetPath: destDir,
        overwrite: false,
        onProgress: (file, action) => progressCalls.push({ file, action }),
      });

      // Should be skipped
      const content = await fs.readFile(path.join(destDir, 'existing.ts'), 'utf-8');
      expect(content).toBe('original content');
      expect(progressCalls.some((c) => c.action === 'skip')).toBe(true);
    });

    it('should overwrite existing files when overwrite is true', async () => {
      await fs.writeFile(path.join(srcDir, 'existing.ts'), 'new content');
      await fs.writeFile(path.join(destDir, 'existing.ts'), 'original content');

      await copyTemplate({
        templatePath: srcDir,
        targetPath: destDir,
        overwrite: true,
      });

      const content = await fs.readFile(path.join(destDir, 'existing.ts'), 'utf-8');
      expect(content).toBe('new content');
    });

    it('should not write files in dry-run mode', async () => {
      await fs.writeFile(path.join(srcDir, 'newfile.ts'), 'content');

      const copied = await copyTemplate({
        templatePath: srcDir,
        targetPath: destDir,
        dryRun: true,
      });

      expect(copied).toContain('newfile.ts');

      // File should not exist
      await expect(fs.access(path.join(destDir, 'newfile.ts'))).rejects.toThrow();
    });

    it('should apply transform function to file content', async () => {
      await fs.writeFile(path.join(srcDir, 'template.ts'), 'Hello {{NAME}}!');

      await copyTemplate({
        templatePath: srcDir,
        targetPath: destDir,
        transform: (content) => content.replace('{{NAME}}', 'World'),
      });

      const content = await fs.readFile(path.join(destDir, 'template.ts'), 'utf-8');
      expect(content).toBe('Hello World!');
    });

    it('should skip ignored files', async () => {
      await fs.writeFile(path.join(srcDir, 'keep.ts'), 'keep');
      await fs.writeFile(path.join(srcDir, 'ignore.test.ts'), 'ignore');

      const copied = await copyTemplate({
        templatePath: srcDir,
        targetPath: destDir,
        ignore: ['.*\\.test\\.ts$'],
      });

      expect(copied).toContain('keep.ts');
      expect(copied).not.toContain('ignore.test.ts');
    });

    it('should merge package.json files instead of overwriting', async () => {
      const srcPackage = {
        name: 'template',
        dependencies: { 'new-dep': '1.0.0' },
        scripts: { build: 'tsc' },
      };
      const destPackage = {
        name: 'existing-project',
        version: '2.0.0',
        dependencies: { 'existing-dep': '1.0.0' },
        scripts: { test: 'jest' },
      };

      await fs.writeFile(path.join(srcDir, 'package.json'), JSON.stringify(srcPackage));
      await fs.writeFile(path.join(destDir, 'package.json'), JSON.stringify(destPackage));

      await copyTemplate({
        templatePath: srcDir,
        targetPath: destDir,
        overwrite: false,
      });

      const merged = JSON.parse(await fs.readFile(path.join(destDir, 'package.json'), 'utf-8'));

      // Should preserve existing name and version
      expect(merged.name).toBe('existing-project');
      expect(merged.version).toBe('2.0.0');

      // Should merge dependencies
      expect(merged.dependencies['existing-dep']).toBe('1.0.0');
      expect(merged.dependencies['new-dep']).toBe('1.0.0');

      // Should preserve existing scripts (not overwritten)
      expect(merged.scripts.test).toBe('jest');
      expect(merged.scripts.build).toBe('tsc');
    });

    it('should merge .env files preserving existing values', async () => {
      const srcEnv = 'NEW_VAR=new_value\nSHARED_VAR=src_value';
      const destEnv = '# My config\nEXISTING_VAR=existing\nSHARED_VAR=dest_value';

      await fs.writeFile(path.join(srcDir, '.env'), srcEnv);
      await fs.writeFile(path.join(destDir, '.env'), destEnv);

      await copyTemplate({
        templatePath: srcDir,
        targetPath: destDir,
        overwrite: false,
      });

      const merged = await fs.readFile(path.join(destDir, '.env'), 'utf-8');

      // Should preserve existing values
      expect(merged).toContain('EXISTING_VAR=existing');
      expect(merged).toContain('SHARED_VAR=dest_value'); // dest wins
      expect(merged).toContain('NEW_VAR=new_value');
    });
  });

  describe('transformTemplate', () => {
    it('should replace single variable', () => {
      const result = transformTemplate('Hello {{NAME}}!', { NAME: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should replace multiple variables', () => {
      const result = transformTemplate('{{GREETING}} {{NAME}}!', {
        GREETING: 'Hello',
        NAME: 'World',
      });
      expect(result).toBe('Hello World!');
    });

    it('should replace multiple occurrences of same variable', () => {
      const result = transformTemplate('{{X}} + {{X}} = {{X}}{{X}}', { X: '1' });
      expect(result).toBe('1 + 1 = 11');
    });

    it('should leave unmatched variables unchanged', () => {
      const result = transformTemplate('{{KNOWN}} {{UNKNOWN}}', { KNOWN: 'value' });
      expect(result).toBe('value {{UNKNOWN}}');
    });

    it('should handle empty variables object', () => {
      const result = transformTemplate('Hello {{NAME}}!', {});
      expect(result).toBe('Hello {{NAME}}!');
    });

    it('should handle empty string values', () => {
      const result = transformTemplate('Value: {{EMPTY}}', { EMPTY: '' });
      expect(result).toBe('Value: ');
    });
  });
});
