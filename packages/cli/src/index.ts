#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import * as readline from 'readline';

/**
 * @fileoverview BEEP CLI - Scaffolding tool for MCP (Model Context Protocol) servers
 * 
 * This CLI helps developers integrate BEEP payment functionality into their projects
 * by generating MCP server templates that AI agents can interact with.
 * 
 * Design principles:
 * - Never overwrite user files by default (non-destructive)
 * - Provide working templates out-of-the-box
 * - Keep all behavior explicit and documented
 * - Support both new projects and existing codebases
 * 
 * @example CLI usage
 * ```bash
 * # Create new MCP server with HTTPS transport
 * npx @beep/cli init-mcp --mode https --path ./my-payment-server
 * 
 * # Create MCP server with stdio transport (for Claude Desktop)
 * npx @beep/cli init-mcp --mode stdio
 * 
 * # Add BEEP tools to existing MCP server
 * npx @beep/cli integrate ./existing-mcp-project
 * ```
 */

/**
 * Main CLI program instance.
 * Exported for testing and programmatic access.
 */
export const program = new Command();

/**
 * Prompts user for input via command line interface.
 * Used for interactive configuration during scaffolding.
 */
const promptUser = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

program
  .version('0.1.0')
  .description('A CLI for scaffolding and managing BEEP MCP servers');

/**
 * Simple test command to verify CLI installation.
 * Useful for troubleshooting and development.
 */
program
  .command('hello')
  .description('Prints a greeting to verify CLI installation')
  .action(() => {
    console.log('Hello, from the BEEP CLI!');
  });


/**
 * Primary scaffolding command - creates a complete MCP server with BEEP integration.
 * 
 * Supports two communication modes:
 * - 'https': For web-based AI agents and API integrations
 * - 'stdio': For desktop AI clients like Claude Desktop
 * 
 * The generated server includes:
 * - Complete MCP server setup with proper error handling
 * - Pre-configured BEEP payment tools
 * - Environment configuration with API key management
 * - TypeScript build configuration
 * - Ready-to-use package.json with all dependencies
 */
program
  .command('init-mcp')
  .description('Scaffolds a new BEEP MCP server with payment tools')
  .requiredOption('--mode <https|stdio>', 'Communication protocol: https (web agents) or stdio (desktop clients)')
  .option('--path <directory>', 'Target directory (defaults to current directory)')
  .action(async (options) => {
    /**
     * Initialize an MCP server in the given target path.
     *
     * Behavior:
     *  - Copies template files but will NOT overwrite existing files.
     *  - Special-cases package.json to MERGE dependencies/devDependencies/scripts.
     *  - Creates an .env from .env.example if .env is missing.
     *  - Prefers creating a file named `mcp-server.ts` (not `server.ts`).
     */
    const targetPath = options.path ? path.resolve(options.path) : process.cwd();
    const templatePath = path.resolve(__dirname, '../templates');

    console.log(`Scaffolding new BEEP MCP server at: ${targetPath}`);

    try {
      /** Ensure a directory exists (mkdir -p) */
      const ensureDir = async (dir: string) => {
        await fs.mkdir(dir, { recursive: true });
      };

      /**
       * Merge package.json from template into destination.
       *
       * Strategy:
       *  - If dest package.json does not exist: write template as-is.
       *  - If dest exists: merge dependencies, devDependencies, scripts (non-destructive — do not overwrite existing keys).
       */
      const mergePackageJson = async (srcPkgPath: string, destPkgPath: string) => {
        const srcRaw = await fs.readFile(srcPkgPath, 'utf-8');
        const src = JSON.parse(srcRaw);

        let dest: any = {};
        try {
          const destRaw = await fs.readFile(destPkgPath, 'utf-8');
          dest = JSON.parse(destRaw);
        } catch (e) {
          // If no existing package.json, use src entirely
          await fs.writeFile(destPkgPath, JSON.stringify(src, null, 2) + '\n');
          console.log('  - Created package.json');
          return;
        }

        const merged = { ...dest };
        const mergeField = (field: 'dependencies' | 'devDependencies' | 'scripts') => {
          const srcField = src[field] || {};
          const destField = dest[field] || {};
          const out: Record<string, string> = { ...destField };
          for (const [k, v] of Object.entries(srcField)) {
            if (!(k in out)) {
              out[k] = v as string;
            }
          }
          if (Object.keys(out).length > 0) merged[field] = out;
        };

        mergeField('dependencies');
        mergeField('devDependencies');
        mergeField('scripts');

        await fs.writeFile(destPkgPath, JSON.stringify(merged, null, 2) + '\n');
        console.log('  - Updated package.json (merged dependencies, devDependencies, scripts)');
      };

      /**
       * Recursively copy template files into target directory.
       *
       * Rules:
       *  - package.json => merge via mergePackageJson
       *  - server.ts => SKIP (we use mcp-server.ts instead)
       *  - all other files => copy only if not present
       */
      const copyTemplates = async (srcDir: string, destDir: string) => {
        await ensureDir(destDir);
        const entries = await fs.readdir(srcDir, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(srcDir, entry.name);
          const destPath = path.join(destDir, entry.name);

          if (entry.isDirectory()) {
            await copyTemplates(srcPath, destPath);
          } else if (entry.isFile()) {
            if (entry.name === 'package.json') {
              await mergePackageJson(srcPath, path.join(destDir, 'package.json'));
              continue;
            }

            // Skip legacy server.ts from templates; we provide mcp-server.ts instead
            if (entry.name === 'server.ts') {
              console.log('  - Skipped template server.ts (replaced by mcp-server.ts)');
              continue;
            }

            // Do not overwrite existing files
            try {
              await fs.access(destPath);
              // If exists, skip
              console.log(`  - Skipped existing ${path.relative(destDir, destPath)}`);
              continue;
            } catch (_) {
              // does not exist, proceed to copy
            }

            const fileData = await fs.readFile(srcPath);
            await ensureDir(path.dirname(destPath));
            await fs.writeFile(destPath, fileData);
            console.log(`  - Added ${path.relative(destDir, destPath)}`);
          }
        }
      };

      await copyTemplates(templatePath, targetPath);

      // Install dependencies automatically
      console.log('\n📦 Installing dependencies...');
      try {
        execSync('npm install', { 
          cwd: targetPath, 
          stdio: 'inherit' 
        });
        console.log('✅ Dependencies installed successfully');
      } catch (error) {
        console.log('⚠️  Failed to install dependencies automatically. Please run "npm install" manually.');
      }

      // Prompt for API key and create configured .env file
      console.log('\n🔑 Setting up your environment...');
      const apiKey = await promptUser('Enter your BEEP API key (or press Enter to skip): ');
      
      const envExamplePath = path.join(targetPath, '.env.example');
      const envPath = path.join(targetPath, '.env');
      let envContent = await fs.readFile(envExamplePath, 'utf-8');
      
      // Set communication mode
      envContent = envContent.replace(
        /^COMMUNICATION_MODE=.*/m,
        `COMMUNICATION_MODE=${options.mode}`
      );
      
      // Set API key if provided
      if (apiKey) {
        envContent = envContent.replace(
          /^BEEP_API_KEY=.*/m,
          `BEEP_API_KEY=${apiKey}`
        );
      }
      
      // Handle .env file: create or merge safely
      try {
        // Check if .env already exists
        const existingEnv = await fs.readFile(envPath, 'utf-8');
        
        // Merge: only add missing BEEP variables
        let updatedEnv = existingEnv;
        let hasUpdates = false;
        
        // Add COMMUNICATION_MODE if not present
        if (!existingEnv.includes('COMMUNICATION_MODE=')) {
          updatedEnv += `\n# BEEP MCP Server configuration\nCOMMUNICATION_MODE=${options.mode}\n`;
          hasUpdates = true;
        }
        
        // Add BEEP_API_KEY if not present and user provided one
        if (apiKey && !existingEnv.includes('BEEP_API_KEY=')) {
          updatedEnv += `BEEP_API_KEY=${apiKey}\n`;
          hasUpdates = true;
        }
        
        if (hasUpdates) {
          await fs.writeFile(envPath, updatedEnv);
          console.log('  - Updated existing .env with BEEP configuration');
        } else {
          console.log('  - .env already contains BEEP configuration, leaving unchanged');
        }
      } catch (_) {
        // .env doesn't exist, create it
        await fs.writeFile(envPath, envContent);
        console.log('  - Created .env with your configuration');
      }
      // Clean up the example file only if it was copied
      try {
        await fs.unlink(envExamplePath);
      } catch (_) {
        /* ignore */
      }

      console.log(`\n✅ BEEP MCP server created at: ${targetPath}`);
      console.log('\nNext steps:');
      console.log(`\n1. Navigate to your new server:`);
      console.log(`   cd ${options.path || path.basename(targetPath)}`);
      
      if (!apiKey) {
        console.log(`\n2. Configure your API key:`);
        console.log(`   Add your BEEP_API_KEY to the .env file.`);
        console.log(`\n3. Build and run the server:`);
      } else {
        console.log(`\n2. Build and run the server:`);
      }
      console.log(`   npm run build && npm start`);

    } catch (error) {
      console.error('\n❌ An error occurred during scaffolding:', error);
    }
  });

/**
 * Integration command for existing MCP servers.
 * 
 * Adds BEEP payment tools to projects that already have MCP server infrastructure.
 * This is useful when you want to add payment capabilities to an existing agent/tool setup.
 * 
 * What it does:
 * - Copies BEEP tool templates to your tools/ directory
 * - Provides the BEEP SDK package for local installation
 * - Gives integration instructions for your existing server
 * 
 * Note: This command doesn't modify existing files - you'll need to manually
 * integrate the tools into your server's tool registry.
 */
if (require.main === module) {
  program
    .command('integrate <path>')
    .description('Add BEEP payment tools to an existing MCP project')
    .action(async (targetPath) => {
      /**
       * Integrate helper files into an existing project:
       *  - Copies the example tool into <project>/tools/
       *  - Copies the BEEP SDK tarball next to the project (for local installs)
       *
       * Note: We do not modify package.json here; instructions are printed for the user.
       */
      const fullTargetPath = path.resolve(targetPath);
      console.log(`\nIntegrating BEEP files into: ${fullTargetPath}`);

      try {
        const templatesDir = path.resolve(__dirname, '../templates');
        const toolTemplateDir = path.resolve(templatesDir, 'src/tools');

        // 1. Create tools directory
        const targetToolsDir = path.resolve(fullTargetPath, 'tools');
        await fs.mkdir(targetToolsDir, { recursive: true });

        // 2. Copy tool file
        const toolFile = 'checkBeepApi.ts';
        await fs.copyFile(
          path.join(toolTemplateDir, toolFile),
          path.join(targetToolsDir, toolFile)
        );

        // 3. Copy SDK tarball
        const sdkTarball = 'beep-sdk-core-0.1.0.tgz';
        await fs.copyFile(
          path.join(templatesDir, sdkTarball),
          path.join(fullTargetPath, sdkTarball)
        );

        console.log('\n✅ BEEP integration files created!');
        console.log('\nNext steps:');
        console.log('\n1. Add the BEEP SDK dependency to your project.');
        console.log('   In your package.json, add the following to your \'dependencies\':');
        console.log('   \'@beep/sdk-core\': \'file:beep-sdk-core-0.1.0.tgz\'');
        console.log('\n2. Run \'npm install\' or \'pnpm install\' to install the new dependency.');
        console.log('\n3. Integrate the BEEP tool into your server file:');
        console.log('   import { checkBeepApi } from \'./tools/checkBeepApi\'; // Adjust path if needed');
        console.log('   // Add the tool to your MCP\'s tool registry.');

      } catch (error) {
        console.error('\n❌ Failed to integrate BEEP files:', error);
      }
    });

  program.parse(process.argv);
}
