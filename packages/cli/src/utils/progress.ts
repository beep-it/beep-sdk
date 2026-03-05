/**
 * @fileoverview Progress tracking utilities for CLI operations
 */

import { color, output } from './colors';

/**
 * Simple spinner for async operations
 */
export class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private current = 0;
  private interval: NodeJS.Timeout | null = null;
  private message: string;

  constructor(message: string) {
    this.message = message;
  }

  start(): void {
    if (this.interval) return;

    this.interval = setInterval(() => {
      process.stdout.write(`\r${color.cyan(this.frames[this.current])} ${this.message}`);
      this.current = (this.current + 1) % this.frames.length;
    }, 80);
  }

  stop(success: boolean = true, finalMessage?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    process.stdout.write('\r' + ' '.repeat(this.message.length + 4) + '\r');

    if (finalMessage) {
      if (success) {
        output.success(finalMessage);
      } else {
        output.error(finalMessage);
      }
    }
  }

  update(message: string): void {
    this.message = message;
  }
}

/**
 * Progress bar for operations with known total
 */
export class ProgressBar {
  private total: number;
  private current = 0;
  private width = 30;
  private label: string;

  constructor(total: number, label: string = 'Progress') {
    this.total = total;
    this.label = label;
  }

  update(current: number, message?: string): void {
    this.current = Math.min(current, this.total);
    const percentage = Math.floor((this.current / this.total) * 100);
    const filled = Math.floor((this.current / this.total) * this.width);
    const empty = this.width - filled;

    const bar = color.green('█'.repeat(filled)) + color.dim('░'.repeat(empty));
    const status = message || `${this.current}/${this.total}`;

    process.stdout.write(`\r${this.label}: [${bar}] ${percentage}% ${color.dim(status)}`);

    if (this.current === this.total) {
      console.log(''); // New line when complete
    }
  }

  increment(message?: string): void {
    this.update(this.current + 1, message);
  }
}

/**
 * Task list for showing multiple operations
 */
export class TaskList {
  private tasks: Array<{ name: string; status: 'pending' | 'running' | 'done' | 'error' }> = [];

  add(name: string): void {
    this.tasks.push({ name, status: 'pending' });
    this.render();
  }

  start(name: string): void {
    const task = this.tasks.find((t) => t.name === name);
    if (task) {
      task.status = 'running';
      this.render();
    }
  }

  complete(name: string, success: boolean = true): void {
    const task = this.tasks.find((t) => t.name === name);
    if (task) {
      task.status = success ? 'done' : 'error';
      this.render();
    }
  }

  private render(): void {
    // Clear previous output
    process.stdout.write('\x1B[2J\x1B[H');

    console.log(color.bold('Tasks:\n'));

    this.tasks.forEach((task) => {
      let icon: string;
      let colorFn = color.dim;

      switch (task.status) {
        case 'pending':
          icon = '○';
          break;
        case 'running':
          icon = '◐';
          colorFn = color.cyan;
          break;
        case 'done':
          icon = '●';
          colorFn = color.green;
          break;
        case 'error':
          icon = '✖';
          colorFn = color.red;
          break;
      }

      console.log(`  ${colorFn(icon)} ${task.name}`);
    });
  }
}

/**
 * Utility to measure operation time
 */
export class Timer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  elapsed(): string {
    const ms = Date.now() - this.startTime;

    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  log(message: string): void {
    console.log(`${color.dim(`[${this.elapsed()}]`)} ${message}`);
  }
}
