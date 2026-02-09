import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
});

// Mock window.open
window.open = jest.fn();

// Mock console.error to track error logging in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Suppress React act() warnings and other expected errors in tests
    const message = args[0]?.toString() || '';
    if (
      message.includes('act(') ||
      message.includes('Warning:') ||
      message.includes('Not implemented')
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  });
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
