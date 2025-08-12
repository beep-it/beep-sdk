#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * BEEP CLI
 *
 * This CLI scaffolds and integrates a minimal BEEP MCP server into existing projects.
 * Design principles:
 *  - Never overwrite a user's files by default.
 *  - Provide sensible templates that can run out-of-the-box.
 *  - Keep behavior explicit and documented.
 */

// This is the main entry point for the CLI
export const program = new Command();

program
  .version('0.1.0')
  .description('A CLI for scaffolding and managing BEEP MCP servers');

// A simple command to test the CLI
program
  .command('hello')
  .description('Prints a greeting')
  .action(() => {
    console.log('Hello, from the BEEP CLI!');
  });


// The main command for scaffolding a new MCP server
program
  .command('init-mcp')
  .description('Scaffolds a new BEEP MCP server in a target repository')
  .requiredOption('--mode <https|stdio>', 'The communication protocol for the server')
  .option('--path <directory>', 'The path to create the server in. Defaults to the current directory.')
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

      // Create a configured .env file
      const envExamplePath = path.join(targetPath, '.env.example');
      const envPath = path.join(targetPath, '.env');
      let envContent = await fs.readFile(envExamplePath, 'utf-8');
      envContent = envContent.replace(
        /^COMMUNICATION_MODE=.*/m,
        `COMMUNICATION_MODE=${options.mode}`
      );
      // Only write .env if it doesn't already exist
      try {
        await fs.access(envPath);
        console.log('  - .env already exists, leaving unchanged');
      } catch (_) {
        await fs.writeFile(envPath, envContent);
        console.log('  - Created .env from .env.example');
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
      console.log(`\n2. Install dependencies:`);
      console.log(`   npm install`);
      console.log(`\n3. Configure your environment:`);
      console.log(`   Fill in your BEEP_API_KEY in the .env file.`);
      console.log(`\n4. Run the server:`);
      console.log(`   npm run dev`);

    } catch (error) {
      console.error('\n❌ An error occurred during scaffolding:', error);
    }
  });

// This allows the CLI to be executed directly, but also to be imported for testing
if (require.main === module) {
  program
    .command('integrate <path>')
    .description('Integrate BEEP MCP into an existing project')
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
