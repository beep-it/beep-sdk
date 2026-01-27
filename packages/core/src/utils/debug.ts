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
  logger?: (level: string, message: string, data?: any) => void;
}

/**
 * Default logger that uses console
 */
const defaultLogger = (level: string, message: string, data?: any) => {
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
  private logger: (level: string, message: string, data?: any) => void;
  
  constructor(options: BeepDebugOptions = {}) {
    this.options = options;
    this.logger = options.logger || defaultLogger;
  }
  
  /**
   * Log an error with context
   */
  public error(message: string, error?: any): void {
    if (error instanceof BeepError) {
      this.logger('error', message, {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        requestId: error.requestId,
        userMessage: error.getUserMessage(),
      });
    } else {
      this.logger('error', message, error);
    }
  }
  
  /**
   * Log a warning
   */
  public warn(message: string, data?: any): void {
    this.logger('warn', message, data);
  }
  
  /**
   * Log info message
   */
  public info(message: string, data?: any): void {
    if (this.options.debug) {
      this.logger('info', message, data);
    }
  }
  
  /**
   * Log debug message
   */
  public debug(message: string, data?: any): void {
    if (this.options.debug) {
      this.logger('debug', message, data);
    }
  }
  
  /**
   * Log API request
   */
  public logRequest(method: string, url: string, data?: any): void {
    if (this.options.logRequests && this.options.debug) {
      this.logger('debug', `API Request: ${method} ${url}`, {
        method,
        url,
        data: this.sanitizeData(data),
      });
    }
  }
  
  /**
   * Log API response
   */
  public logResponse(method: string, url: string, status: number, data?: any): void {
    if (this.options.logResponses && this.options.debug) {
      this.logger('debug', `API Response: ${method} ${url} (${status})`, {
        method,
        url,
        status,
        data: this.sanitizeData(data),
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
      return data.map(item => this.sanitizeData(item));
    }
    
    if (typeof data === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
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
export function createDebugInterceptors(axios: any, debugger: BeepDebugger) {
  // Request interceptor
  axios.interceptors.request.use(
    (config: any) => {
      debugger.logRequest(config.method?.toUpperCase() || 'GET', config.url || '', config.data);
      return config;
    },
    (error: any) => {
      debugger.error('Request interceptor error', error);
      return Promise.reject(error);
    }
  );
  
  // Response interceptor
  axios.interceptors.response.use(
    (response: any) => {
      debugger.logResponse(
        response.config.method?.toUpperCase() || 'GET',
        response.config.url || '',
        response.status,
        response.data
      );
      return response;
    },
    (error: any) => {
      if (error.response) {
        debugger.logResponse(
          error.config?.method?.toUpperCase() || 'GET',
          error.config?.url || '',
          error.response.status,
          error.response.data
        );
      }
      debugger.error('API Error', error);
      return Promise.reject(error);
    }
  );
}

/**
 * Helper to format error for display
 */
export function formatBeepError(error: BeepError): string {
  const lines = [
    `Error: ${error.message}`,
    `Code: ${error.code}`,
  ];
  
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
  
  return lines.join('\\n');
}