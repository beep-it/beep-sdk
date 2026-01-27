/**
 * @fileoverview Terminal color utilities for better CLI output
 */

/**
 * ANSI color codes for terminal output
 */
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Text colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

/**
 * Color helper functions for consistent output
 */
export const color = {
  error: (text: string) => `${colors.red}${text}${colors.reset}`,
  success: (text: string) => `${colors.green}${text}${colors.reset}`,
  warning: (text: string) => `${colors.yellow}${text}${colors.reset}`,
  info: (text: string) => `${colors.cyan}${text}${colors.reset}`,
  dim: (text: string) => `${colors.dim}${text}${colors.reset}`,
  bold: (text: string) => `${colors.bright}${text}${colors.reset}`,
  blue: (text: string) => `${colors.blue}${text}${colors.reset}`,
  magenta: (text: string) => `${colors.magenta}${text}${colors.reset}`,
};

/**
 * Styled output helpers
 */
export const output = {
  error: (message: string) => console.error(`${color.error('✖')} ${message}`),
  success: (message: string) => console.log(`${color.success('✔')} ${message}`),
  warning: (message: string) => console.log(`${color.warning('⚠')} ${message}`),
  info: (message: string) => console.log(`${color.info('ℹ')} ${message}`),
  step: (options: { step: number; total: number; message: string }) =>
    console.log(`${color.dim(`[${options.step}/${options.total}]`)} ${options.message}`),

  section: (title: string) => {
    console.log(`\n${color.bold(title)}`);
    console.log(color.dim('─'.repeat(title.length)));
  },

  list: (items: string[], indent: number = 2) => {
    items.forEach((item) => console.log(`${' '.repeat(indent)}${color.dim('•')} ${item}`));
  },

  code: (code: string, language?: string) => {
    if (language) {
      console.log(color.dim(`\`\`\`${language}`));
    }
    console.log(color.blue(code));
    if (language) {
      console.log(color.dim('```'));
    }
  },

  box: (content: string[], title?: string) => {
    const maxLength = Math.max(...content.map((line) => line.length), title?.length || 0);
    const boxWidth = maxLength + 4;

    console.log(color.dim('┌' + '─'.repeat(boxWidth - 2) + '┐'));

    if (title) {
      const padding = Math.floor((boxWidth - title.length - 2) / 2);
      console.log(
        color.dim('│') +
          ' '.repeat(padding) +
          color.bold(title) +
          ' '.repeat(boxWidth - padding - title.length - 2) +
          color.dim('│'),
      );
      console.log(color.dim('├' + '─'.repeat(boxWidth - 2) + '┤'));
    }

    content.forEach((line) => {
      const padding = boxWidth - line.length - 2;
      console.log(color.dim('│') + ' ' + line + ' '.repeat(padding - 1) + color.dim('│'));
    });

    console.log(color.dim('└' + '─'.repeat(boxWidth - 2) + '┘'));
  },
};
