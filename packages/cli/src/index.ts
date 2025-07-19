#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';


// This is the main entry point for your CLI
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
    const targetPath = options.path ? path.resolve(options.path) : process.cwd();
    const templatePath = path.resolve(__dirname, '../templates');

    console.log(`Scaffolding new BEEP MCP server at: ${targetPath}`);

    try {
      // Copy the entire template directory
      await fs.cp(templatePath, targetPath, { recursive: true });

      // Create a configured .env file
      const envExamplePath = path.join(targetPath, '.env.example');
      const envPath = path.join(targetPath, '.env');
      let envContent = await fs.readFile(envExamplePath, 'utf-8');
      envContent = envContent.replace(
        /^COMMUNICATION_MODE=.*/m,
        `COMMUNICATION_MODE=${options.mode}`
      );
      await fs.writeFile(envPath, envContent);
      await fs.unlink(envExamplePath); // Remove the example file

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
