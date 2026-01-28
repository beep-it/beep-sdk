/**
 * @fileoverview Enhanced init-mcp command with better UX
 */

import * as path from 'path';
import { execSync } from 'child_process';
import {
  color,
  output,
  Spinner,
  prompt,
  confirm,
  validateApiKey,
  detectPackageManager,
  analyzeProject,
  writeEnvFile,
  createConfigFile,
  getInstallCommand,
  getRunCommand,
  copyTemplate,
} from '../utils';

export interface InitMcpOptions {
  mode: 'https' | 'stdio';
  role: 'mcp-server' | 'mcp-client' | 'both';
  path?: string;
  force?: boolean;
  dryRun?: boolean;
  skipInstall?: boolean;
  packageManager?: 'npm' | 'pnpm' | 'yarn';
}

export async function initMcp(options: InitMcpOptions): Promise<void> {
  const targetPath = options.path ? path.resolve(options.path) : process.cwd();
  const templatesRoot = path.resolve(__dirname, '../../templates');

  output.section('BEEP MCP Project Setup');

  // Analyze target directory
  const spinner = new Spinner('Analyzing project structure...');
  spinner.start();

  const projectInfo = await analyzeProject(targetPath);
  const packageManager =
    options.packageManager || projectInfo.packageManager || detectPackageManager();

  spinner.stop(true, 'Project analysis complete');

  // Show project info
  if (projectInfo.hasPackageJson) {
    output.info(`Found existing project: ${color.bold(projectInfo.name)}`);

    if (projectInfo.hasBeepSdk) {
      output.warning('BEEP SDK is already installed in this project');

      if (!options.force) {
        const proceed = await confirm('Continue anyway?', false);
        if (!proceed) {
          output.info('Setup cancelled');
          return;
        }
      }
    }
  }

  // Determine target paths
  const serverTarget = options.role === 'both' ? path.join(targetPath, 'mcp-server') : targetPath;

  const clientTarget = options.role === 'both' ? path.join(targetPath, 'mcp-client') : targetPath;

  // Get API key
  output.section('Configuration');

  let apiKey = '';
  if (options.role !== 'mcp-client') {
    apiKey = await prompt('Enter your BEEP API key', {
      validate: validateApiKey,
      allowEmpty: true,
      default: process.env.BEEP_API_KEY,
    });

    if (!apiKey) {
      output.warning("No API key provided - you'll need to add it to .env later");
    }
  }

  // Copy templates
  output.section('Creating project files');

  const copySpinner = new Spinner('Copying templates...');
  copySpinner.start();

  const copiedFiles: string[] = [];

  try {
    if (options.role === 'mcp-server' || options.role === 'both') {
      const serverFiles = await copyTemplate({
        templatePath: path.join(templatesRoot, 'server'),
        targetPath: serverTarget,
        overwrite: options.force,
        dryRun: options.dryRun,
        transform: (content) => {
          // Replace template variables
          return content
            .replace(/{{COMMUNICATION_MODE}}/g, options.mode)
            .replace(/{{API_KEY}}/g, apiKey || 'your_api_key_here');
        },
        onProgress: (file, action) => {
          copySpinner.update(`Copying: ${file} (${action})`);
        },
      });
      copiedFiles.push(...serverFiles);
    }

    if (options.role === 'mcp-client' || options.role === 'both') {
      const clientFiles = await copyTemplate({
        templatePath: path.join(templatesRoot, 'client'),
        targetPath: clientTarget,
        overwrite: options.force,
        dryRun: options.dryRun,
        transform: (content) => {
          return content
            .replace(/{{COMMUNICATION_MODE}}/g, options.mode)
            .replace(
              /{{SERVER_URL}}/g,
              options.mode === 'https' ? 'http://localhost:4005/mcp' : 'stdio://mcp-server',
            );
        },
        onProgress: (file, action) => {
          copySpinner.update(`Copying: ${file} (${action})`);
        },
      });
      copiedFiles.push(...clientFiles);
    }

    copySpinner.stop(true, `Created ${copiedFiles.length} files`);
  } catch (error) {
    copySpinner.stop(false, 'Failed to copy templates');
    throw error;
  }

  // Configure environment
  if (!options.dryRun) {
    output.section('Environment setup');

    const configureEnv = async (targetDir: string, isServer: boolean) => {
      const envPath = path.join(targetDir, '.env');
      const envValues: Record<string, string> = {
        COMMUNICATION_MODE: options.mode,
      };

      if (isServer && apiKey) {
        envValues.BEEP_API_KEY = apiKey;
      }

      await writeEnvFile({ filePath: envPath, values: envValues });
      output.success(`Created .env file in ${path.relative(targetPath, targetDir)}`);

      // Create beep.config.json
      await createConfigFile(targetDir, {
        communicationMode: options.mode,
        role: isServer ? 'mcp-server' : 'mcp-client',
        packageManager,
      });
    };

    if (options.role === 'both') {
      await configureEnv(serverTarget, true);
      await configureEnv(clientTarget, false);
    } else {
      await configureEnv(
        options.role === 'mcp-server' ? serverTarget : clientTarget,
        options.role === 'mcp-server',
      );
    }
  }

  // Install dependencies
  if (!options.skipInstall && !options.dryRun) {
    output.section('Installing dependencies');

    const installDeps = async (targetDir: string, label: string) => {
      const installSpinner = new Spinner(`Installing dependencies for ${label}...`);
      installSpinner.start();

      try {
        // Install BEEP SDK first
        execSync(getInstallCommand(packageManager, ['@beep-it/sdk-core']), {
          cwd: targetDir,
          stdio: 'pipe',
        });

        // Install all dependencies
        execSync(getInstallCommand(packageManager), {
          cwd: targetDir,
          stdio: 'pipe',
        });

        installSpinner.stop(true, `Dependencies installed for ${label}`);
      } catch (_error) {
        installSpinner.stop(false, `Failed to install dependencies for ${label}`);
        output.warning(`Run manually: ${getInstallCommand(packageManager)}`);
      }
    };

    if (options.role === 'both') {
      await installDeps(serverTarget, 'server');
      await installDeps(clientTarget, 'client');
    } else {
      await installDeps(options.role === 'mcp-server' ? serverTarget : clientTarget, options.role);
    }
  }

  // Success message and next steps
  output.section('✨ Success!');

  output.box(
    [
      `BEEP MCP project created successfully!`,
      '',
      `Mode: ${color.cyan(options.mode)}`,
      `Role: ${color.cyan(options.role)}`,
      `Package Manager: ${color.cyan(packageManager)}`,
    ],
    'Project Summary',
  );

  output.section('Next Steps');

  const steps: string[] = [];

  if (options.role === 'both') {
    steps.push(`Navigate to your projects:`);
    steps.push(
      `  ${color.blue(`cd ${path.relative(process.cwd(), serverTarget)}`)} ${color.dim('(server)')}`,
    );
    steps.push(
      `  ${color.blue(`cd ${path.relative(process.cwd(), clientTarget)}`)} ${color.dim('(client)')}`,
    );
  } else {
    steps.push(`Navigate to your project:`);
    steps.push(`  ${color.blue(`cd ${path.relative(process.cwd(), targetPath)}`)}`);
  }

  if (!apiKey && options.role !== 'mcp-client') {
    steps.push('');
    steps.push('Add your BEEP API key to .env:');
    steps.push('  BEEP_API_KEY=your_api_key_here');
  }

  steps.push('');
  steps.push('Build and run:');

  if (options.role === 'both') {
    steps.push(
      `  ${color.dim('(server)')} ${color.blue(getRunCommand(packageManager, 'build && npm start'))}`,
    );
    steps.push(
      `  ${color.dim('(client)')} ${color.blue(getRunCommand(packageManager, 'build && npm start'))}`,
    );
  } else {
    steps.push(`  ${color.blue(getRunCommand(packageManager, 'build'))}`);
    steps.push(`  ${color.blue(getRunCommand(packageManager, 'start'))}`);
  }

  output.list(steps);

  if (options.mode === 'stdio') {
    output.info('\nFor Claude Desktop integration, add the server to your MCP settings');
  }
}
