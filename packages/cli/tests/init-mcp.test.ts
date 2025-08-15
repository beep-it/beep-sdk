import { program } from '../src/index';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock readline module before importing anything else
jest.mock('readline', () => ({
  createInterface: jest.fn(() => ({
    question: jest.fn((_question: string, callback: (answer: string) => void) => {
      // Simulate user pressing Enter (empty input)
      callback('');
    }),
    close: jest.fn(),
  })),
}));

const baseTestDir = path.join(__dirname, 'test-scaffold');

describe('BEEP CLI init-mcp', () => {
  beforeAll(async () => {
    // Create a base directory for test scaffolds
    await fs.mkdir(baseTestDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up the base directory after all tests
    await fs.rm(baseTestDir, { recursive: true, force: true });
  });

  // Suppress console output during tests
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should scaffold a new server with https mode', async () => {
    const testDir = path.join(baseTestDir, 'https-test');
    const argv = ['node', 'index.js', 'init-mcp', '--mode', 'https', '--path', testDir];

    await program.parseAsync(argv);

    const files = await fs.readdir(testDir);
    expect(files).toContain('package.json');
    expect(files).toContain('tsconfig.json');
    expect(files).toContain('.env');
    expect(files).toContain('src');

    const envContent = await fs.readFile(path.join(testDir, '.env'), 'utf-8');
    expect(envContent).toContain('COMMUNICATION_MODE=https');
  }, 30000);

  it('should scaffold a new server with stdio mode', async () => {
    const testDir = path.join(baseTestDir, 'stdio-test');
    const argv = ['node', 'index.js', 'init-mcp', '--mode', 'stdio', '--path', testDir];

    await program.parseAsync(argv);

    const files = await fs.readdir(testDir);
    expect(files).toContain('package.json');
    expect(files).toContain('.env');

    const envContent = await fs.readFile(path.join(testDir, '.env'), 'utf-8');
    expect(envContent).toContain('COMMUNICATION_MODE=stdio');
  }, 30000);
});
