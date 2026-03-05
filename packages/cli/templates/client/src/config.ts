import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  communicationMode: (process.env.COMMUNICATION_MODE || 'https') as 'https' | 'stdio',
  serverUrl: process.env.SERVER_URL || 'http://localhost:3001',
  apiKey: process.env.BEEP_API_KEY || '',
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 15000),
  pollTimeoutMs: Number(process.env.POLL_TIMEOUT_MS || 300000),
};
