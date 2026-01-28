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

export const program = new Command();

// Configure CLI
program
  .name('beep')
  .description(color.bold('BEEP CLI - Scaffold AI payment servers with ease'))
  .version('0.2.0')
  .configureHelp({
    sortSubcommands: true,
    subcommandTerm: (cmd) => color.cyan(cmd.name()),
  });

// Add custom help - this handler is called when --help flag is used
program.on('--help', () => {
  outputCustomHelp();
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
      const message = error instanceof Error ? error.message : String(error);
      output.error(`Setup failed: ${message}`);
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
      const message = error instanceof Error ? error.message : String(error);
      output.error(`Integration failed: ${message}`);
      process.exit(1);
    }
  });

// TODO: Future commands to implement
// - interactive: Start interactive setup wizard
// - config: Manage BEEP configuration
// - doctor: Check your BEEP setup and diagnose issues

/**
 * Output custom help sections (Examples and Learn More)
 */
function outputCustomHelp(): void {
  console.log('');
  output.section('Examples');
  console.log('  $ beep init-mcp --mode https --role mcp-server');
  console.log('  $ beep init-mcp --mode stdio --role both --path ./my-project');
  console.log('  $ beep integrate ./existing-project');
  console.log('');
  output.section('Learn More');
  console.log('  Documentation: https://docs.justbeep.it');
  console.log('  GitHub: https://github.com/beep-it/beep-sdk');
}

/**
 * Run CLI when executed directly (not when imported)
 */
function runCli(): void {
  // Show help if no command provided (before parsing to avoid exitOverride issues)
  if (!process.argv.slice(2).length) {
    // Use helpInformation() to get the help text, then output it manually
    // This avoids issues with Commander's help() method behavior
    const helpText = program.helpInformation();
    console.log(helpText);
    outputCustomHelp();
    return;
  }

  // Error handling - exitOverride lets us catch errors instead of process.exit
  program.exitOverride();

  try {
    program.parse();
  } catch (error: any) {
    // Handle expected exits (help, version) - these are not errors
    if (
      error.code === 'commander.helpDisplayed' ||
      error.code === 'commander.version' ||
      error.code === 'commander.help'
    ) {
      process.exit(0);
    }

    // Handle actual errors
    if (error.code === 'commander.missingArgument') {
      output.error(error.message);
    } else if (error.code === 'commander.unknownCommand') {
      output.error(`Unknown command: ${error.message}`);
      console.log(`\nRun ${color.cyan('beep --help')} for available commands`);
    } else if (error.code === 'commander.missingMandatoryOptionValue') {
      output.error(error.message);
    } else if (error.code === 'commander.optionMissingArgument') {
      output.error(error.message);
    } else {
      output.error(error.message);
    }
    process.exit(1);
  }
}

// Only run CLI when this file is executed directly, not when imported
if (require.main === module) {
  runCli();
}
