#!/usr/bin/env node

import { Command } from 'commander';
import { color, output } from './utils/colors';
import { initMcp } from './commands/init-mcp';
import { integrate } from './commands/integrate';

/**
 * @fileoverview Enhanced BEEP CLI with improved developer experience
 *
 * Key improvements:
 * - Colored output for better readability
 * - Interactive prompts with validation
 * - Progress tracking for long operations
 * - Better error handling and recovery
 * - Configuration management
 * - Smart template merging
 * - Package manager detection
 */

const program = new Command();

// Configure CLI
program
  .name('beep')
  .description(color.bold('BEEP CLI - Scaffold AI payment servers with ease'))
  .version('0.2.0')
  .configureHelp({
    sortSubcommands: true,
    subcommandTerm: (cmd) => color.cyan(cmd.name()),
  });

// Add custom help
program.on('--help', () => {
  console.log('');
  output.section('Examples');
  console.log('  $ beep init-mcp --mode https --role mcp-server');
  console.log('  $ beep init-mcp --mode stdio --role both --path ./my-project');
  console.log('  $ beep integrate ./existing-project');
  console.log('');
  output.section('Learn More');
  console.log('  Documentation: https://docs.justbeep.it');
  console.log('  GitHub: https://github.com/beep-it/beep-sdk');
});

/**
 * Enhanced init-mcp command
 */
program
  .command('init-mcp')
  .description('Create a new BEEP MCP project with payment capabilities')
  .requiredOption('--mode <mode>', 'Communication protocol', (value) => {
    if (!['https', 'stdio'].includes(value)) {
      throw new Error(`Invalid mode: ${value}. Must be 'https' or 'stdio'`);
    }
    return value as 'https' | 'stdio';
  })
  .requiredOption('--role <role>', 'Project role', (value) => {
    if (!['mcp-server', 'mcp-client', 'both'].includes(value)) {
      throw new Error(`Invalid role: ${value}. Must be 'mcp-server', 'mcp-client', or 'both'`);
    }
    return value as 'mcp-server' | 'mcp-client' | 'both';
  })
  .option('--path <directory>', 'Target directory (defaults to current)')
  .option('-f, --force', 'Overwrite existing files')
  .option('--dry-run', 'Preview changes without creating files')
  .option('--skip-install', 'Skip dependency installation')
  .option('--package-manager <pm>', 'Package manager to use', (value) => {
    if (!['npm', 'pnpm', 'yarn'].includes(value)) {
      throw new Error(`Invalid package manager: ${value}`);
    }
    return value as 'npm' | 'pnpm' | 'yarn';
  })
  .action(async (options) => {
    try {
      await initMcp(options);
    } catch (error) {
      output.error(`Setup failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Enhanced integrate command
 */
program
  .command('integrate <path>')
  .description('Add BEEP payment tools to an existing project')
  .option('-f, --force', 'Overwrite existing files')
  .option('--dry-run', 'Preview changes without creating files')
  .action(async (targetPath, options) => {
    try {
      await integrate(targetPath, options);
    } catch (error) {
      output.error(`Integration failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Interactive mode
 */
program
  .command('interactive')
  .alias('i')
  .description('Start interactive setup wizard')
  .action(async () => {
    const { interactiveSetup } = await import('./commands/interactive');
    try {
      await interactiveSetup();
    } catch (error) {
      output.error(`Interactive setup failed: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Config management commands
 */
const config = program.command('config').description('Manage BEEP configuration');

config
  .command('init')
  .description('Create beep.config.json file')
  .action(async () => {
    const { configInit } = await import('./commands/config');
    await configInit();
  });

config
  .command('validate')
  .description('Validate current configuration')
  .action(async () => {
    const { configValidate } = await import('./commands/config');
    await configValidate();
  });

/**
 * Doctor command for troubleshooting
 */
program
  .command('doctor')
  .description('Check your BEEP setup and diagnose issues')
  .action(async () => {
    const { doctor } = await import('./commands/doctor');
    await doctor();
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code === 'commander.missingArgument') {
    output.error(error.message);
  } else if (error.code === 'commander.unknownCommand') {
    output.error(`Unknown command: ${error.message}`);
    console.log(`\nRun ${color.cyan('beep --help')} for available commands`);
  } else {
    output.error(error.message);
  }
  process.exit(1);
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
