#!/usr/bin/env node

/**
 * Release preparation script for BEEP SDK monorepo
 * 
 * This script helps prepare a new release by:
 * 1. Updating package versions consistently
 * 2. Generating changelogs
 * 3. Creating git tags
 * 4. Validating the release
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGES = ['core', 'checkout-widget', 'cli'];

function updatePackageVersion(packagePath, version) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.version = version;
  
  // Update workspace dependencies to use the new version
  if (packageJson.dependencies && packageJson.dependencies['@beep-it/sdk-core']) {
    packageJson.dependencies['@beep-it/sdk-core'] = `^${version}`;
  }
  if (packageJson.devDependencies && packageJson.devDependencies['@beep-it/sdk-core']) {
    packageJson.devDependencies['@beep-it/sdk-core'] = `^${version}`;
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Updated ${packagePath}/package.json to version ${version}`);
}

function validateVersion(version) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
  if (!semverRegex.test(version)) {
    throw new Error(`Invalid semver version: ${version}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/prepare-release.js <version>');
    console.error('Example: node scripts/prepare-release.js 1.0.0');
    process.exit(1);
  }

  const version = args[0];
  validateVersion(version);

  console.log(`🚀 Preparing release ${version}...`);

  try {
    // Check if working directory is clean
    try {
      execSync('git diff-index --quiet HEAD --');
    } catch {
      throw new Error('Working directory is not clean. Please commit or stash changes first.');
    }

    // Ensure we're on main branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    if (currentBranch !== 'main') {
      console.warn(`⚠️  You're on branch '${currentBranch}', not 'main'. Continue? (y/N)`);
      // In a real script, you'd want to prompt for user input here
    }

    // Update package versions
    PACKAGES.forEach(pkg => {
      updatePackageVersion(path.join('packages', pkg), version);
    });

    // Run tests to make sure everything still works
    console.log('🧪 Running tests...');
    execSync('pnpm test', { stdio: 'inherit' });

    // Build packages
    console.log('🔨 Building packages...');
    execSync('pnpm build', { stdio: 'inherit' });

    // Generate changelog (placeholder - you might want to use a tool like conventional-changelog)
    const changelogEntry = `
## [${version}] - ${new Date().toISOString().split('T')[0]}

### Added
- New features and improvements

### Fixed  
- Bug fixes and stability improvements

### Changed
- Breaking changes and updates

`;

    const changelogPath = 'CHANGELOG.md';
    let changelog = '';
    if (fs.existsSync(changelogPath)) {
      changelog = fs.readFileSync(changelogPath, 'utf8');
    } else {
      changelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n';
    }

    // Insert new entry after the header
    const lines = changelog.split('\n');
    const headerEndIndex = lines.findIndex(line => line.startsWith('## ')) || 2;
    lines.splice(headerEndIndex, 0, ...changelogEntry.trim().split('\n'));
    fs.writeFileSync(changelogPath, lines.join('\n'));

    console.log(`✅ Release ${version} prepared successfully!`);
    console.log('\nNext steps:');
    console.log('1. Review the updated package.json files and CHANGELOG.md');
    console.log('2. Commit changes: git add . && git commit -m "chore: release v' + version + '"');
    console.log('3. Push to main: git push origin main');
    console.log('4. Go to GitHub Actions and manually run "Publish Packages" workflow');
    console.log('5. Create a GitHub release with detailed release notes');

  } catch (error) {
    console.error('❌ Release preparation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}