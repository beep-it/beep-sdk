/**
 * @fileoverview Configuration management utilities
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface BeepConfig {
  apiKey?: string;
  communicationMode?: 'https' | 'stdio';
  serverUrl?: string;
  role?: 'mcp-server' | 'mcp-client';
  packageManager?: 'npm' | 'pnpm' | 'yarn';
}

export interface ProjectInfo {
  name: string;
  version: string;
  hasPackageJson: boolean;
  hasTypeScript: boolean;
  hasMcp: boolean;
  hasBeepSdk: boolean;
  serverFile?: string;
  packageManager: 'npm' | 'pnpm' | 'yarn';
}

/**
 * Read and parse .env file
 */
export async function readEnvFile(filePath: string): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const env: Record<string, string> = {};

    content.split('\n').forEach((line) => {
      // Skip comments and empty lines
      if (!line.trim() || line.trim().startsWith('#')) return;

      const [key, ...valueParts] = line.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });

    return env;
  } catch {
    return {};
  }
}

export interface WriteEnvFileOptions {
  filePath: string;
  values: Record<string, string>;
  preserve?: boolean;
}

/**
 * Write .env file preserving existing values
 */
export async function writeEnvFile(options: WriteEnvFileOptions): Promise<void> {
  const { filePath, values, preserve = true } = options;
  let existing: Record<string, string> = {};

  if (preserve) {
    existing = await readEnvFile(filePath);
  }

  const merged = { ...existing, ...values };
  const lines: string[] = [];

  // Add header if new file
  if (Object.keys(existing).length === 0) {
    lines.push('# BEEP SDK Configuration');
    lines.push('# Get your API key from https://app.justbeep.it');
    lines.push('');
  }

  // Write values
  for (const [key, value] of Object.entries(merged)) {
    lines.push(`${key}=${value}`);
  }

  await fs.writeFile(filePath, lines.join('\n') + '\n');
}

/**
 * Analyze project structure
 */
export async function analyzeProject(projectPath: string): Promise<ProjectInfo> {
  const info: ProjectInfo = {
    name: path.basename(projectPath),
    version: '0.0.0',
    hasPackageJson: false,
    hasTypeScript: false,
    hasMcp: false,
    hasBeepSdk: false,
    packageManager: 'npm',
  };

  try {
    // Check package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    info.hasPackageJson = true;
    info.name = packageJson.name || info.name;
    info.version = packageJson.version || info.version;

    // Check dependencies
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    info.hasTypeScript = 'typescript' in deps;
    info.hasMcp = '@modelcontextprotocol/sdk' in deps;
    info.hasBeepSdk = '@beep-it/sdk-core' in deps;

    // Detect package manager
    if (await fileExists(path.join(projectPath, 'pnpm-lock.yaml'))) {
      info.packageManager = 'pnpm';
    } else if (await fileExists(path.join(projectPath, 'yarn.lock'))) {
      info.packageManager = 'yarn';
    }
  } catch {
    // No package.json or invalid
  }

  // Find server file
  const serverPatterns = [
    'server/index.ts',
    'server/index.js',
    'src/server/index.ts',
    'src/server/index.js',
    'src/mcp-server.ts',
    'src/mcp-server.js',
    'mcp-server.ts',
    'mcp-server.js',
    'server.ts',
    'server.js',
    'src/server.ts',
    'src/server.js',
    'index.ts',
    'index.js',
    'src/index.ts',
    'src/index.js',
  ];

  for (const pattern of serverPatterns) {
    if (await fileExists(path.join(projectPath, pattern))) {
      info.serverFile = pattern;
      break;
    }
  }

  return info;
}

/**
 * Create beep.config.json file
 */
export async function createConfigFile(projectPath: string, config: BeepConfig): Promise<void> {
  const configPath = path.join(projectPath, 'beep.config.json');
  const configData = {
    $schema: 'https://api.justbeep.it/schemas/beep-config.json',
    ...config,
    // Don't store API key in JSON
    apiKey: undefined,
  };

  await fs.writeFile(configPath, JSON.stringify(configData, null, 2) + '\n');
}

/**
 * Load beep.config.json file
 */
export async function loadConfigFile(projectPath: string): Promise<BeepConfig | null> {
  try {
    const configPath = path.join(projectPath, 'beep.config.json');
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
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
 * Get install command for package manager
 */
export function getInstallCommand(
  packageManager: 'npm' | 'pnpm' | 'yarn',
  packages: string[] = [],
): string {
  const pkg = packages.join(' ');

  switch (packageManager) {
    case 'pnpm':
      return pkg ? `pnpm add ${pkg}` : 'pnpm install';
    case 'yarn':
      return pkg ? `yarn add ${pkg}` : 'yarn';
    default:
      return pkg ? `npm install ${pkg}` : 'npm install';
  }
}

/**
 * Get run command for package manager
 */
export function getRunCommand(packageManager: 'npm' | 'pnpm' | 'yarn', script: string): string {
  switch (packageManager) {
    case 'pnpm':
      return `pnpm ${script}`;
    case 'yarn':
      return `yarn ${script}`;
    default:
      return `npm run ${script}`;
  }
}
