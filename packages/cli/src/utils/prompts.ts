/**
 * @fileoverview Enhanced prompting utilities for CLI
 */

import * as readline from 'readline';
import { color, output } from './colors';

export interface PromptOptions {
  /** Default value if user presses enter */
  default?: string;
  /** Validation function */
  validate?: (value: string) => boolean | string;
  /** Hide input (for passwords) */
  hidden?: boolean;
  /** Allow empty input */
  allowEmpty?: boolean;
}

export interface SelectOption {
  /** Display name */
  name: string;
  /** Value to return when selected */
  value: string;
  /** Optional description */
  hint?: string;
}

/**
 * Enhanced prompt utility with validation and better UX
 */
export async function prompt(question: string, options: PromptOptions = {}): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Format question with default value
  let formattedQuestion = question;
  if (options.default) {
    formattedQuestion += ` ${color.dim(`(${options.default})`)}`;
  }
  formattedQuestion += ': ';

  return new Promise((resolve) => {
    const askQuestion = () => {
      rl.question(formattedQuestion, async (answer) => {
        const value = answer.trim() || options.default || '';

        // Check if empty and not allowed
        if (!value && !options.allowEmpty) {
          output.error('This field is required');
          askQuestion();
          return;
        }

        // Validate if validator provided
        if (options.validate && value) {
          const result = options.validate(value);
          if (result !== true) {
            output.error(typeof result === 'string' ? result : 'Invalid input');
            askQuestion();
            return;
          }
        }

        rl.close();
        resolve(value);
      });
    };

    askQuestion();
  });
}

/**
 * Confirm prompt (yes/no)
 */
export async function confirm(question: string, defaultValue: boolean = false): Promise<boolean> {
  const hint = defaultValue ? 'Y/n' : 'y/N';
  const answer = await prompt(`${question} ${color.dim(`(${hint})`)}`, {
    default: defaultValue ? 'y' : 'n',
    validate: (value) => {
      const v = value.toLowerCase();
      return ['y', 'yes', 'n', 'no', ''].includes(v) || 'Please answer yes or no';
    },
  });

  return ['y', 'yes'].includes(answer.toLowerCase());
}

/**
 * Select from list of options
 */
export async function select(question: string, options: SelectOption[]): Promise<string> {
  console.log(`\n${color.bold(question)}`);

  // Display options
  options.forEach((option, index) => {
    const num = color.cyan(`${index + 1})`);
    const hint = option.hint ? color.dim(` - ${option.hint}`) : '';
    console.log(`  ${num} ${option.name}${hint}`);
  });

  const answer = await prompt('\nSelect an option', {
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > options.length) {
        return `Please enter a number between 1 and ${options.length}`;
      }
      return true;
    },
  });

  return options[parseInt(answer) - 1].value;
}

/**
 * Multi-select from list of options
 */
export async function multiSelect(question: string, options: SelectOption[]): Promise<string[]> {
  console.log(`\n${color.bold(question)}`);
  console.log(color.dim('(Enter comma-separated numbers, or "all" for all options)'));

  // Display options
  options.forEach((option, index) => {
    const num = color.cyan(`${index + 1})`);
    const hint = option.hint ? color.dim(` - ${option.hint}`) : '';
    console.log(`  ${num} ${option.name}${hint}`);
  });

  const answer = await prompt('\nSelect options', {
    validate: (value) => {
      if (value.toLowerCase() === 'all') return true;

      const nums = value.split(',').map((v) => parseInt(v.trim()));
      for (const num of nums) {
        if (isNaN(num) || num < 1 || num > options.length) {
          return `Please enter numbers between 1 and ${options.length}`;
        }
      }
      return true;
    },
  });

  if (answer.toLowerCase() === 'all') {
    return options.map((o) => o.value);
  }

  const indices = answer.split(',').map((v) => parseInt(v.trim()) - 1);
  return indices.map((i) => options[i].value);
}

/**
 * Password prompt with hidden input
 */
export async function password(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question}: `, (answer) => {
      rl.close();
      resolve(answer);
    });

    // Hide input - using type assertion for internal readline properties
    const rlAny = rl as unknown as {
      _writeToOutput: (str: string) => void;
      output: { write: (str: string) => void };
    };
    rlAny._writeToOutput = function _writeToOutput(stringToWrite: string) {
      if (stringToWrite.includes(question)) {
        rlAny.output.write(stringToWrite);
      } else {
        rlAny.output.write('*');
      }
    };
  });
}

/**
 * API key validation
 */
export function validateApiKey(key: string): boolean | string {
  if (!key) return 'API key is required';

  if (key.startsWith('beep_sk_') || key.startsWith('beep_pk_')) {
    return true;
  }

  return 'Invalid API key format. Should start with beep_sk_ or beep_pk_';
}

/**
 * Package manager detection
 */
export function detectPackageManager(): 'npm' | 'pnpm' | 'yarn' {
  const { env } = process;

  if (env.npm_config_user_agent) {
    if (env.npm_config_user_agent.includes('yarn')) return 'yarn';
    if (env.npm_config_user_agent.includes('pnpm')) return 'pnpm';
  }

  return 'npm';
}
