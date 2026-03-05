/**
 * @fileoverview Template management and file operations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { output } from './colors';

export interface CopyOptions {
  /** Source template path */
  templatePath: string;
  /** Target destination path */
  targetPath: string;
  /** Overwrite existing files */
  overwrite?: boolean;
  /** Dry run - don't actually copy */
  dryRun?: boolean;
  /** Transform file content */
  transform?: (content: string, filePath: string) => string;
  /** Files to skip */
  ignore?: string[];
  /** Progress callback */
  onProgress?: (file: string, action: 'skip' | 'copy' | 'merge') => void;
}

export interface MergeStrategy {
  /** How to merge package.json */
  packageJson: 'merge' | 'overwrite' | 'skip';
  /** How to handle TypeScript config */
  tsconfig: 'merge' | 'overwrite' | 'skip';
  /** How to handle .env files */
  env: 'merge' | 'overwrite' | 'skip';
  /** Default strategy for other files */
  default: 'overwrite' | 'skip';
}

/**
 * Copy template directory with smart merging
 */
export async function copyTemplate(options: CopyOptions): Promise<string[]> {
  const { templatePath, targetPath } = options;
  const copiedFiles: string[] = [];

  async function copyDir(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });

    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      const relativePath = path.relative(targetPath, destPath);

      // Skip ignored files
      if (options.ignore?.some((pattern) => entry.name.match(pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        // Check if file exists
        const exists = await fileExists(destPath);

        if (exists && !options.overwrite) {
          // Special handling for specific files
          if (entry.name === 'package.json') {
            await mergePackageJson({ srcPath, destPath, dryRun: options.dryRun });
            options.onProgress?.(relativePath, 'merge');
            copiedFiles.push(relativePath);
          } else if (entry.name === '.env' || entry.name === '.env.example') {
            await mergeEnvFile({ srcPath, destPath, dryRun: options.dryRun });
            options.onProgress?.(relativePath, 'merge');
            copiedFiles.push(relativePath);
          } else {
            options.onProgress?.(relativePath, 'skip');
          }
        } else {
          // Copy file
          if (!options.dryRun) {
            let content = await fs.readFile(srcPath, 'utf-8');

            // Apply transformation if provided
            if (options.transform) {
              content = options.transform(content, relativePath);
            }

            await fs.writeFile(destPath, content);
          }

          options.onProgress?.(relativePath, 'copy');
          copiedFiles.push(relativePath);
        }
      }
    }
  }

  await copyDir(templatePath, targetPath);
  return copiedFiles;
}

interface MergeOptions {
  srcPath: string;
  destPath: string;
  dryRun?: boolean;
}

/**
 * Merge package.json files intelligently
 */
async function mergePackageJson(options: MergeOptions): Promise<void> {
  const { srcPath, destPath, dryRun } = options;
  const src = JSON.parse(await fs.readFile(srcPath, 'utf-8'));
  const dest = JSON.parse(await fs.readFile(destPath, 'utf-8'));

  const merged = { ...dest };

  // Merge dependencies
  ['dependencies', 'devDependencies', 'peerDependencies'].forEach((field) => {
    if (src[field]) {
      merged[field] = { ...dest[field], ...src[field] };
    }
  });

  // Merge scripts (don't overwrite existing)
  if (src.scripts) {
    merged.scripts = { ...src.scripts, ...dest.scripts };
  }

  // Add missing fields
  ['keywords', 'repository', 'bugs', 'homepage'].forEach((field) => {
    if (src[field] && !dest[field]) {
      merged[field] = src[field];
    }
  });

  if (!dryRun) {
    await fs.writeFile(destPath, JSON.stringify(merged, null, 2) + '\n');
  }
}

/**
 * Merge .env files preserving existing values
 */
async function mergeEnvFile(options: MergeOptions): Promise<void> {
  const { srcPath, destPath, dryRun } = options;
  const srcContent = await fs.readFile(srcPath, 'utf-8');
  const destContent = await fs.readFile(destPath, 'utf-8').catch(() => '');

  const srcVars = parseEnv(srcContent);
  const destVars = parseEnv(destContent);

  // Only add new variables
  const merged = { ...srcVars, ...destVars };

  const lines: string[] = [];

  // Preserve comments from destination
  destContent.split('\n').forEach((line) => {
    if (line.trim().startsWith('#') || !line.trim()) {
      lines.push(line);
    }
  });

  // Add new variables with comments
  for (const [key, value] of Object.entries(merged)) {
    if (!(key in destVars)) {
      lines.push(`\n# Added by BEEP CLI`);
    }
    lines.push(`${key}=${value}`);
  }

  if (!dryRun) {
    await fs.writeFile(destPath, lines.join('\n') + '\n');
  }
}

/**
 * Parse .env file content
 */
function parseEnv(content: string): Record<string, string> {
  const vars: Record<string, string> = {};

  content.split('\n').forEach((line) => {
    if (!line.trim() || line.trim().startsWith('#')) return;

    const [key, ...valueParts] = line.split('=');
    if (key) {
      vars[key.trim()] = valueParts.join('=').trim();
    }
  });

  return vars;
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Transform template variables
 */
export function transformTemplate(content: string, variables: Record<string, string>): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Get available templates
 */
export async function getAvailableTemplates(
  templatesDir: string,
): Promise<Array<{ name: string; description: string }>> {
  const templates: Array<{ name: string; description: string }> = [];

  try {
    const entries = await fs.readdir(templatesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const templatePath = path.join(templatesDir, entry.name);
        const readmePath = path.join(templatePath, 'README.md');

        let description = 'No description available';

        try {
          const readme = await fs.readFile(readmePath, 'utf-8');
          const firstLine = readme.split('\n')[0];
          description = firstLine.replace(/^#\s*/, '').trim();
        } catch {
          // No README
        }

        templates.push({
          name: entry.name,
          description,
        });
      }
    }
  } catch {
    output.warning('Could not read templates directory');
  }

  return templates;
}
