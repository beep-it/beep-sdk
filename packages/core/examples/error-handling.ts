/**
 * @fileoverview Example demonstrating enhanced error handling in BEEP SDK
 */

import { BeepClient, BeepError, BeepErrorCode, BeepAuthenticationError, BeepPaymentError } from '@beep-it/sdk-core';

async function demonstrateErrorHandling() {
  try {
    // Initialize client with debugging enabled
    const beep = new BeepClient({
      apiKey: 'your_api_key_here',
      debug: {
        debug: true,
        logRequests: true,
        logResponses: true,
        logger: (level, message, data) => {
          console.log(`[Custom Logger] ${level}: ${message}`, data);
        }
      }
    });
    
    // Example: Handling specific error types
    try {
      const invoice = await beep.invoices.create({
        amount: '10.00',
        description: 'Test Invoice',
        // Missing required fields to trigger validation error
      } as any);
    } catch (error) {
      if (error instanceof BeepError) {
        console.log('Error Code:', error.code);
        console.log('User-Friendly Message:', error.getUserMessage());
        console.log('Status Code:', error.statusCode);
        console.log('Request ID:', error.requestId);
        console.log('Details:', error.details);
        
        // Handle specific error codes
        switch (error.code) {
          case BeepErrorCode.INVALID_PARAMETER:
            console.log('Validation failed - check your input parameters');
            break;
            
          case BeepErrorCode.UNAUTHORIZED:
            console.log('Authentication failed - check your API key');
            break;
            
          case BeepErrorCode.PAYMENT_EXPIRED:
            console.log('Payment expired - create a new payment request');
            break;
            
          case BeepErrorCode.RATE_LIMIT_EXCEEDED:
            const rateLimitError = error as any;
            console.log(`Rate limited - retry after ${rateLimitError.retryAfter} seconds`);
            break;
            
          default:
            console.log('Unexpected error:', error.message);
        }
      }
    }
    
    // Example: Using error type guards
    try {
      await beep.payments.createPayout({
        amount: '1000000',
        destinationWalletAddress: 'invalid_address',
        chain: 'SUI',
        token: 'USDC',
      });
    } catch (error) {
      if (error instanceof BeepAuthenticationError) {
        console.log('Authentication issue - refresh your API key');
      } else if (error instanceof BeepPaymentError) {
        console.log('Payment issue - check payment details');
      } else if (error instanceof BeepError) {
        console.log('BEEP error:', error.getUserMessage());
      } else {
        console.log('Unknown error:', error);
      }
    }
    
    // Example: Error logging for debugging
    try {
      const products = await beep.products.list({ limit: 1000 }); // May trigger rate limit
    } catch (error) {
      if (error instanceof BeepError) {
        // Log full error details for debugging
        console.error('Full error details:', error.toJSON());
      }
    }
    
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Example: Global error handler for Express
export function beepErrorHandler(err: any, req: any, res: any, next: any) {
  if (err instanceof BeepError) {
    res.status(err.statusCode || 500).json({
      error: {
        code: err.code,
        message: err.getUserMessage(),
        requestId: err.requestId,
        ...(process.env.NODE_ENV === 'development' && { details: err.details }),
      }
    });
  } else {
    res.status(500).json({
      error: {
        code: BeepErrorCode.UNKNOWN_ERROR,
        message: 'An unexpected error occurred',
      }
    });
  }
}

// Example: Retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof BeepError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }
      
      // Check if we should retry
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Usage example with retry
async function createInvoiceWithRetry() {
  const beep = new BeepClient({ apiKey: 'your_api_key' });
  
  try {
    const invoice = await retryWithBackoff(() => 
      beep.invoices.create({
        amount: '25.00',
        description: 'Premium Feature',
        token: 'USDC' as any,
      })
    );
    
    console.log('Invoice created:', invoice.id);
  } catch (error) {
    if (error instanceof BeepError) {
      console.error('Failed after retries:', error.getUserMessage());
    }
  }
}