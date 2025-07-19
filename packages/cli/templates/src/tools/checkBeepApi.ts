import { BeepClient } from '@beep/sdk-core';

export interface CheckBeepApiResult {
  status: string;
  timestamp: string;
}

/**
 * Checks the status of the BEEP API using the SDK.
 * @returns The API status.
 */
export async function checkBeepApi(): Promise<CheckBeepApiResult | { error: string }> {
  if (!process.env.BEEP_API_KEY) {
    return { error: 'BEEP_API_KEY is not configured in the .env file.' };
  }

  try {
    const beepClient = new BeepClient({
      apiKey: process.env.BEEP_API_KEY,
    });

    const status = await beepClient.healthCheck();

    return {
      status,
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Error checking BEEP API status:', errorMessage);
    return { error: `Failed to connect to BEEP API: ${errorMessage}` };
  }
}
