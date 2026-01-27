/**
 * @fileoverview Enhanced error handling for the BEEP SDK
 * Provides typed, semantic errors with proper error codes and context
 */

export enum BeepErrorCode {
  // Authentication errors (1xxx)
  INVALID_API_KEY = 'BEEP_1001',
  MISSING_API_KEY = 'BEEP_1002',
  UNAUTHORIZED = 'BEEP_1003',
  INVALID_PUBLISHABLE_KEY = 'BEEP_1004',
  
  // Network errors (2xxx)
  NETWORK_ERROR = 'BEEP_2001',
  TIMEOUT = 'BEEP_2002',
  SERVER_ERROR = 'BEEP_2003',
  
  // Payment errors (3xxx)
  PAYMENT_FAILED = 'BEEP_3001',
  PAYMENT_EXPIRED = 'BEEP_3002',
  PAYMENT_NOT_FOUND = 'BEEP_3003',
  INSUFFICIENT_FUNDS = 'BEEP_3004',
  PAYMENT_ALREADY_PROCESSED = 'BEEP_3005',
  
  // Invoice errors (4xxx)
  INVOICE_NOT_FOUND = 'BEEP_4001',
  INVOICE_EXPIRED = 'BEEP_4002',
  INVOICE_ALREADY_PAID = 'BEEP_4003',
  
  // Validation errors (5xxx)
  INVALID_PARAMETER = 'BEEP_5001',
  MISSING_PARAMETER = 'BEEP_5002',
  INVALID_AMOUNT = 'BEEP_5003',
  INVALID_TOKEN = 'BEEP_5004',
  
  // Rate limiting (6xxx)
  RATE_LIMIT_EXCEEDED = 'BEEP_6001',
  
  // Unknown errors (9xxx)
  UNKNOWN_ERROR = 'BEEP_9999',
}

/**
 * Base error class for all BEEP SDK errors
 * Provides structured error information for better debugging and handling
 */
export class BeepError extends Error {
  public readonly code: BeepErrorCode;
  public readonly statusCode?: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly requestId?: string;
  
  constructor(
    message: string,
    code: BeepErrorCode,
    statusCode?: number,
    details?: Record<string, any>,
    requestId?: string
  ) {
    super(message);
    this.name = 'BeepError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.requestId = requestId;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BeepError);
    }
  }
  
  /**
   * Returns a user-friendly error message
   */
  public getUserMessage(): string {
    switch (this.code) {
      case BeepErrorCode.INVALID_API_KEY:
        return 'The API key provided is invalid. Please check your credentials.';
      case BeepErrorCode.MISSING_API_KEY:
        return 'No API key provided. Please provide a valid API key.';
      case BeepErrorCode.NETWORK_ERROR:
        return 'Unable to connect to BEEP servers. Please check your internet connection.';
      case BeepErrorCode.PAYMENT_EXPIRED:
        return 'This payment request has expired. Please create a new one.';
      case BeepErrorCode.INSUFFICIENT_FUNDS:
        return 'Insufficient funds to complete this transaction.';
      case BeepErrorCode.RATE_LIMIT_EXCEEDED:
        return 'Too many requests. Please try again later.';
      default:
        return this.message || 'An unexpected error occurred.';
    }
  }
  
  /**
   * Returns a JSON representation of the error for logging
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      stack: this.stack,
    };
  }
}

/**
 * Authentication error - thrown when API key is invalid or missing
 */
export class BeepAuthenticationError extends BeepError {
  constructor(message: string, code: BeepErrorCode = BeepErrorCode.UNAUTHORIZED, details?: Record<string, any>) {
    super(message, code, 401, details);
    this.name = 'BeepAuthenticationError';
  }
}

/**
 * Validation error - thrown when request parameters are invalid
 */
export class BeepValidationError extends BeepError {
  constructor(message: string, code: BeepErrorCode = BeepErrorCode.INVALID_PARAMETER, details?: Record<string, any>) {
    super(message, code, 400, details);
    this.name = 'BeepValidationError';
  }
}

/**
 * Payment error - thrown when payment operations fail
 */
export class BeepPaymentError extends BeepError {
  constructor(message: string, code: BeepErrorCode = BeepErrorCode.PAYMENT_FAILED, details?: Record<string, any>) {
    super(message, code, 402, details);
    this.name = 'BeepPaymentError';
  }
}

/**
 * Network error - thrown when network operations fail
 */
export class BeepNetworkError extends BeepError {
  constructor(message: string, code: BeepErrorCode = BeepErrorCode.NETWORK_ERROR, details?: Record<string, any>) {
    super(message, code, undefined, details);
    this.name = 'BeepNetworkError';
  }
}

/**
 * Rate limit error - thrown when API rate limits are exceeded
 */
export class BeepRateLimitError extends BeepError {
  public readonly retryAfter?: number;
  
  constructor(message: string, retryAfter?: number, details?: Record<string, any>) {
    super(message, BeepErrorCode.RATE_LIMIT_EXCEEDED, 429, details);
    this.name = 'BeepRateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Utility function to create appropriate error from axios error response
 */
export function createBeepErrorFromAxios(error: any): BeepError {
  const response = error.response;
  const requestId = response?.headers?.['x-request-id'];
  
  if (!response) {
    // Network error
    return new BeepNetworkError(
      error.message || 'Network connection failed',
      BeepErrorCode.NETWORK_ERROR,
      { originalError: error }
    );
  }
  
  const status = response.status;
  const data = response.data;
  const message = data?.message || data?.error || error.message;
  
  // Handle specific status codes
  switch (status) {
    case 401:
      return new BeepAuthenticationError(
        message,
        BeepErrorCode.UNAUTHORIZED,
        { response: data }
      );
      
    case 400:
      // Try to determine more specific validation error
      if (message.toLowerCase().includes('api key')) {
        return new BeepAuthenticationError(
          message,
          BeepErrorCode.INVALID_API_KEY,
          { response: data }
        );
      }
      return new BeepValidationError(
        message,
        BeepErrorCode.INVALID_PARAMETER,
        { response: data, fields: data?.fields }
      );
      
    case 402:
      return new BeepPaymentError(
        message,
        BeepErrorCode.PAYMENT_FAILED,
        { response: data }
      );
      
    case 404:
      // Determine what resource was not found
      if (message.toLowerCase().includes('invoice')) {
        return new BeepError(
          message,
          BeepErrorCode.INVOICE_NOT_FOUND,
          404,
          { response: data },
          requestId
        );
      }
      if (message.toLowerCase().includes('payment')) {
        return new BeepError(
          message,
          BeepErrorCode.PAYMENT_NOT_FOUND,
          404,
          { response: data },
          requestId
        );
      }
      break;
      
    case 429:
      const retryAfter = response.headers?.['retry-after'];
      return new BeepRateLimitError(
        message,
        retryAfter ? parseInt(retryAfter) : undefined,
        { response: data }
      );
      
    case 500:
    case 502:
    case 503:
    case 504:
      return new BeepError(
        message,
        BeepErrorCode.SERVER_ERROR,
        status,
        { response: data },
        requestId
      );
  }
  
  // Default error
  return new BeepError(
    message,
    BeepErrorCode.UNKNOWN_ERROR,
    status,
    { response: data },
    requestId
  );
}