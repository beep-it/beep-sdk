/**
 * @fileoverview Debug utilities for enhanced developer experience
 */

import { BeepError } from '../errors';

export interface BeepDebugOptions {
  /** Enable verbose logging */
  debug?: boolean;
  /** Log API requests */
  logRequests?: boolean;
  /** Log API responses */
  logResponses?: boolean;
  /** Custom logger function */
  logger?: (options: LogOptions) => void;
}

export interface LogOptions {
  level: string;
  message: string;
  data?: any;
}

export interface ApiRequestLogOptions {
  method: string;
  url: string;
  data?: any;
}

export interface ApiResponseLogOptions {
  method: string;
  url: string;
  status: number;
  data?: any;
}

/**
 * Default logger that uses console
 */
const defaultLogger = (options: LogOptions) => {
  const { level, message, data } = options;
  const timestamp = new Date().toISOString();
  const prefix = `[BEEP SDK ${level}] ${timestamp}`;

  switch (level) {
    case 'error':
      console.error(prefix, message, data);
      break;
    case 'warn':
      console.warn(prefix, message, data);
      break;
    case 'info':
      console.info(prefix, message, data);
      break;
    case 'debug':
      console.debug(prefix, message, data);
      break;
    default:
      console.log(prefix, message, data);
  }
};

/**
 * Debug logger class for the SDK
 */
export class BeepDebugger {
  private options: BeepDebugOptions;
  private logger: (options: LogOptions) => void;

  constructor(options: BeepDebugOptions = {}) {
    this.options = options;
    this.logger = options.logger || defaultLogger;
  }

  /**
   * Log an error with context
   */
  public error(message: string, error?: any): void {
    if (error instanceof BeepError) {
      this.logger({
        level: 'error',
        message,
        data: {
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
          requestId: error.requestId,
          userMessage: error.getUserMessage(),
        },
      });
    } else {
      this.logger({ level: 'error', message, data: error });
    }
  }

  /**
   * Log a warning
   */
  public warn(message: string, data?: any): void {
    this.logger({ level: 'warn', message, data });
  }

  /**
   * Log info message
   */
  public info(message: string, data?: any): void {
    if (this.options.debug) {
      this.logger({ level: 'info', message, data });
    }
  }

  /**
   * Log debug message
   */
  public debug(message: string, data?: any): void {
    if (this.options.debug) {
      this.logger({ level: 'debug', message, data });
    }
  }

  /**
   * Log API request
   */
  public logRequest(options: ApiRequestLogOptions): void {
    if (this.options.logRequests && this.options.debug) {
      const { method, url, data } = options;
      this.logger({
        level: 'debug',
        message: `API Request: ${method} ${url}`,
        data: {
          method,
          url,
          data: this.sanitizeData(data),
        },
      });
    }
  }

  /**
   * Log API response
   */
  public logResponse(options: ApiResponseLogOptions): void {
    if (this.options.logResponses && this.options.debug) {
      const { method, url, status, data } = options;
      this.logger({
        level: 'debug',
        message: `API Response: ${method} ${url} (${status})`,
        data: {
          method,
          url,
          status,
          data: this.sanitizeData(data),
        },
      });
    }
  }

  /**
   * Sanitize sensitive data before logging
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveFields = ['apiKey', 'api_key', 'authorization', 'password', 'secret'];

    if (typeof data === 'string') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};

      for (const [key, value] of Object.entries(data)) {
        if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }

      return sanitized;
    }

    return data;
  }
}

/**
 * Create axios interceptors for debugging
 */
export function createDebugInterceptors(axios: any, beepDebugger: BeepDebugger) {
  // Request interceptor
  axios.interceptors.request.use(
    (config: any) => {
      beepDebugger.logRequest({
        method: config.method?.toUpperCase() || 'GET',
        url: config.url || '',
        data: config.data,
      });
      return config;
    },
    (error: any) => {
      beepDebugger.error('Request interceptor error', error);
      return Promise.reject(error);
    },
  );

  // Response interceptor
  axios.interceptors.response.use(
    (response: any) => {
      beepDebugger.logResponse({
        method: response.config.method?.toUpperCase() || 'GET',
        url: response.config.url || '',
        status: response.status,
        data: response.data,
      });
      return response;
    },
    (error: any) => {
      if (error.response) {
        beepDebugger.logResponse({
          method: error.config?.method?.toUpperCase() || 'GET',
          url: error.config?.url || '',
          status: error.response.status,
          data: error.response.data,
        });
      }
      beepDebugger.error('API Error', error);
      return Promise.reject(error);
    },
  );
}

/**
 * Helper to format error for display
 */
export function formatBeepError(error: BeepError): string {
  const lines = [`Error: ${error.message}`, `Code: ${error.code}`];

  if (error.statusCode) {
    lines.push(`Status: ${error.statusCode}`);
  }

  if (error.requestId) {
    lines.push(`Request ID: ${error.requestId}`);
  }

  if (error.details) {
    lines.push(`Details: ${JSON.stringify(error.details, null, 2)}`);
  }

  lines.push(`User Message: ${error.getUserMessage()}`);

  return lines.join('\n');
}
