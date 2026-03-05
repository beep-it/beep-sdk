/**
 * @fileoverview Enhanced integrate command for existing projects
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';
import {
  color,
  output,
  Spinner,
  confirm,
  select,
  analyzeProject,
  getInstallCommand,
  copyTemplate,
} from '../utils';

export interface IntegrateOptions {
  force?: boolean;
  dryRun?: boolean;
}

export async function integrate(targetPath: string, options: IntegrateOptions): Promise<void> {
  const fullTargetPath = path.resolve(targetPath);

  output.section('BEEP Integration');
  console.log(`Target: ${color.blue(fullTargetPath)}`);

  // Analyze project
  const spinner = new Spinner('Analyzing existing project...');
  spinner.start();

  const projectInfo = await analyzeProject(fullTargetPath);

  spinner.stop(true, 'Analysis complete');

  // Show project info
  output.section('Project Information');
  output.list([
    `Name: ${color.bold(projectInfo.name)}`,
    `TypeScript: ${projectInfo.hasTypeScript ? color.green('Yes') : color.yellow('No')}`,
    `MCP SDK: ${projectInfo.hasMcp ? color.green('Yes') : color.yellow('No')}`,
    `BEEP SDK: ${projectInfo.hasBeepSdk ? color.green('Installed') : color.yellow('Not installed')}`,
    `Package Manager: ${color.cyan(projectInfo.packageManager)}`,
  ]);

  if (projectInfo.serverFile) {
    output.info(`Detected server file: ${color.blue(projectInfo.serverFile)}`);
  }

  // Check for existing BEEP integration
  if (projectInfo.hasBeepSdk && !options.force) {
    output.warning('BEEP SDK is already installed');

    const proceed = await confirm('Add additional BEEP tools anyway?', false);
    if (!proceed) {
      output.info('Integration cancelled');
      return;
    }
  }

  // Determine what to integrate
  const integrationType = await select('What would you like to integrate?', [
    {
      name: 'Payment Tools',
      value: 'tools',
      hint: 'Add BEEP payment tools to your existing MCP server',
    },
    {
      name: 'Complete MCP Server',
      value: 'server',
      hint: 'Add a full MCP server setup with BEEP tools',
    },
    {
      name: 'Checkout Widget',
      value: 'widget',
      hint: 'Add React checkout component for frontend',
    },
    {
      name: 'Core SDK Only',
      value: 'sdk',
      hint: 'Just install the BEEP SDK package',
    },
  ]);

  // Copy appropriate templates
  output.section('Adding BEEP files');

  const templatesDir = path.resolve(__dirname, '../../templates');
  const copySpinner = new Spinner('Copying files...');
  copySpinner.start();

  try {
    const copiedFiles: string[] = [];

    switch (integrationType) {
      case 'tools': {
        // Copy just the tools directory
        const toolsFiles = await copyTemplate({
          templatePath: path.join(templatesDir, 'server/src/tools'),
          targetPath: path.join(fullTargetPath, 'src/tools'),
          overwrite: options.force,
          dryRun: options.dryRun,
          onProgress: (file) => copySpinner.update(`Copying: ${file}`),
        });
        copiedFiles.push(...toolsFiles);

        // Also copy types if needed
        if (projectInfo.hasTypeScript) {
          const typesFiles = await copyTemplate({
            templatePath: path.join(templatesDir, 'server/src/types'),
            targetPath: path.join(fullTargetPath, 'src/types'),
            overwrite: false, // Never overwrite types
            dryRun: options.dryRun,
          });
          copiedFiles.push(...typesFiles);
        }
        break;
      }

      case 'server': {
        // Copy full server setup
        const serverFiles = await copyTemplate({
          templatePath: path.join(templatesDir, 'server'),
          targetPath: fullTargetPath,
          overwrite: options.force,
          dryRun: options.dryRun,
          ignore: ['package.json', '.env.example'],
          onProgress: (file) => copySpinner.update(`Copying: ${file}`),
        });
        copiedFiles.push(...serverFiles);
        break;
      }

      case 'widget': {
        // Create example widget component
        const widgetDir = path.join(fullTargetPath, 'src/components/checkout');
        await fs.mkdir(widgetDir, { recursive: true });

        const widgetExample = `import React from 'react';
import { CheckoutWidget } from '@beep-it/checkout-widget';

export function BeepCheckout() {
  return (
    <CheckoutWidget
      publishableKey={process.env.REACT_APP_BEEP_PUBLISHABLE_KEY || ''}
      primaryColor="#007bff"
      labels={{
        scanQr: 'Scan to Pay',
        paymentLabel: 'My Store',
      }}
      assets={[
        // Add your products here
      ]}
    />
  );
}`;

        if (!options.dryRun) {
          await fs.writeFile(path.join(widgetDir, 'BeepCheckout.tsx'), widgetExample);
        }

        copiedFiles.push('src/components/checkout/BeepCheckout.tsx');
        break;
      }
    }

    copySpinner.stop(true, `Added ${copiedFiles.length} files`);

    if (copiedFiles.length > 0) {
      output.section('Files added');
      output.list(copiedFiles.slice(0, 10));
      if (copiedFiles.length > 10) {
        output.info(color.dim(`... and ${copiedFiles.length - 10} more`));
      }
    }
  } catch (_error) {
    copySpinner.stop(false, 'Failed to copy files');
    throw _error;
  }

  // Install dependencies
  if (!options.dryRun) {
    output.section('Installing dependencies');

    const packages: string[] = ['@beep-it/sdk-core'];

    if (integrationType === 'widget') {
      packages.push('@beep-it/checkout-widget');
    }

    if (!projectInfo.hasMcp && (integrationType === 'tools' || integrationType === 'server')) {
      packages.push('@modelcontextprotocol/sdk');
    }

    const installSpinner = new Spinner('Installing packages...');
    installSpinner.start();

    try {
      execSync(getInstallCommand(projectInfo.packageManager, packages), {
        cwd: fullTargetPath,
        stdio: 'pipe',
      });

      installSpinner.stop(true, 'Dependencies installed');
    } catch (_error) {
      installSpinner.stop(false, 'Failed to install dependencies');
      output.warning(`Run manually: ${getInstallCommand(projectInfo.packageManager, packages)}`);
    }
  }

  // Integration instructions
  output.section('Integration Instructions');

  switch (integrationType) {
    case 'tools':
      if (projectInfo.serverFile) {
        const serverPath = path.join(fullTargetPath, projectInfo.serverFile);
        const hints = await getIntegrationHints(serverPath);

        output.step({ step: 1, total: 3, message: `Open ${color.blue(projectInfo.serverFile)}` });
        output.step({ step: 2, total: 3, message: 'Import the BEEP tools:' });
        output.code(
          `
import { checkBeepApiTool } from './tools/checkBeepApi';
import { requestAndPurchaseAssetTool } from './tools/requestAndPurchaseAsset';
// ... import other tools as needed`,
          'typescript',
        );

        output.step({ step: 3, total: 3, message: 'Register the tools with your MCP server' });

        if (hints.length > 0) {
          console.log('\n' + color.bold('💡 Specific hints for your code:'));
          output.list(hints);
        }
      } else {
        output.info("Add the BEEP tools to your MCP server's tool registry");
      }
      break;

    case 'widget':
      output.step({ step: 1, total: 3, message: 'Import the checkout component:' });
      output.code(
        `import { BeepCheckout } from './components/checkout/BeepCheckout';`,
        'typescript',
      );

      output.step({ step: 2, total: 3, message: 'Add your publishable key to environment:' });
      output.code(`REACT_APP_BEEP_PUBLISHABLE_KEY=beep_pk_your_key_here`, 'bash');

      output.step({ step: 3, total: 3, message: 'Use the component in your app:' });
      output.code(`<BeepCheckout />`, 'tsx');
      break;

    case 'server':
      output.info('Complete MCP server files added to your project');
      output.info('Configure your .env file with your BEEP API key');
      break;
  }

  // Success
  output.section('✨ Success!');
  output.success('BEEP integration complete');

  // Links
  console.log('\n' + color.bold('Helpful Links:'));
  output.list([
    'Documentation: https://docs.justbeep.it',
    'API Reference: https://api.justbeep.it/docs',
    'Get API Keys: https://app.justbeep.it',
  ]);
}

/**
 * Analyze server file for integration hints
 */
async function getIntegrationHints(serverPath: string): Promise<string[]> {
  const hints: string[] = [];

  try {
    const content = await fs.readFile(serverPath, 'utf-8');

    // Look for tool patterns
    if (content.includes('tools:') || content.includes('tools =')) {
      const match = content.match(/tools\s*[:=]\s*{([^}]+)}/s);
      if (match) {
        hints.push('Add BEEP tools to your existing tools object');
      }
    }

    if (content.includes('server.setRequestHandler')) {
      hints.push('Your server uses setRequestHandler pattern - follow the same for BEEP tools');
    }

    if (content.includes('CallToolRequestSchema')) {
      hints.push('Look for your CallToolRequestSchema handler and add BEEP tool handling there');
    }

    // TypeScript vs JavaScript
    if (serverPath.endsWith('.ts')) {
      hints.push('Import tool types from the types directory for TypeScript support');
    }
  } catch {
    // Could not read file
  }

  return hints;
}
