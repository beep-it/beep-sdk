import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

interface McpClientStdioParams {
  type: 'stdio';
  path: string;
}

interface McpClientHttpOptions {
  type: 'http';
  url: URL;
}

type McpClientInitParams = McpClientStdioParams | McpClientHttpOptions;

/**
 * MCP Client wrapper that manages communication with the MCP server via child process
 */
export class McpClientInternal {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private _mcpClient: Client | null = null;

  /**
   * Initialize the MCP server and establish communication
   */
  async initialize(params: McpClientInitParams): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (params.type === 'stdio') {
      this.initializationPromise = this._initializeStdio(params);
    }
    if (params.type === 'http') {
      this.initializationPromise = this._initializeHttp(params);
    }
    return this.initializationPromise!;
  }

  private async _initializeStdio(params: McpClientStdioParams): Promise<void> {
    try {
      console.info('Starting and connecting to the MCP server...');
      // TODO SST: Find a way to reference the module directly here.
      const transport = new StdioClientTransport({
        command: 'node',
        args: [params.path],
      });

      this._mcpClient = new Client(
        {
          name: 'mcp-server',
          version: '1.0.0',
        },
        { capabilities: {} },
      );

      await this._mcpClient.connect(transport);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MCP server:', error);
    }
  }

  private async _initializeHttp(params: McpClientHttpOptions): Promise<void> {
    try {
      console.info('Starting and connecting to the MCP server through HTTP...');
      const transport = new StreamableHTTPClientTransport(params.url);

      this._mcpClient = new Client(
        {
          // NOTE: You will need to update the name and version of the server
          name: 'mcp-server',
          version: '1.0.0',
        },
        { capabilities: {} },
      );

      await this._mcpClient.connect(transport);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MCP server:', error);
    }
  }

  /**
   * Call a tool on the MCP server
   */
  private async callTool(method: string, params: any = {}, timeout: number = 30000): Promise<any> {
    if (!this.isInitialized && method !== 'initialize') {
      throw new Error('MCP client not initialized. Call initialize() first.');
    }
    return this._mcpClient?.callTool({ name: method, arguments: params });
  }

  /**
   * Check BEEP API status
   */
  async checkBeepApi(): Promise<any> {
    return this.callTool('checkBeepApi');
  }

  /**
   * Get paid resource (HTTP 402 flow)
   */
  async getPaidResource(params: {
    resourceId?: string;
    paymentReference?: string;
    amount?: number;
    token?: 'USDT' | 'USDC';
    description?: string;
    serverUrl?: string;
  }): Promise<any> {
    return this.callTool('getPaidResource', params);
  }

  /**
   * Pay an invoice
   */
  async payInvoice(params: { invoiceId: string }): Promise<any> {
    return this.callTool('payInvoice', params);
  }

  /**
   * Execute preauthorized transfer
   */
  async executePreauthorizedTransfer(params: any): Promise<any> {
    return this.callTool('executePreauthorizedTransfer', params);
  }

  /**
   * Get payment widget HTML/JS
   */
  async getPaymentWidget(params: any): Promise<any> {
    return this.callTool('getPaymentWidget', params);
  }

  /**
   * Initiate device login
   */
  async initiateDeviceLogin(params: any): Promise<any> {
    return this.callTool('initiateDeviceLogin', params);
  }

  /**
   * Create merchant account from SSO
   */
  async createMerchantAccountFromSSO(): Promise<any> {
    return this.callTool('createMerchantAccountFromSSO');
  }

  /**
   * Sign Solana transaction
   */
  async signSolanaTransaction(params: { transactionUri: string }): Promise<any> {
    return this.callTool('signSolanaTransaction', params);
  }

  /**
   * Sign Solana token transaction
   */
  async signSolanaTokenTransaction(params: any): Promise<any> {
    return this.callTool('signSolanaTokenTransaction', params);
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(params: any): Promise<any> {
    return this.callTool('getTransactionStatus', params);
  }

  /**
   * Get available wallets
   */
  async getAvailableWallets(): Promise<any> {
    return this.callTool('getAvailableWallets');
  }

  /**
   * Issue payment for streaming
   */
  async issuePayment(params: {
    apiKey: string;
    assetChunks: Array<{ assetId: string; quantity: number }>;
    payingMerchantId: string;
  }): Promise<any> {
    return this.callTool('issuePayment', params);
  }

  /**
   * Start streaming session
   */
  async startStreaming(params: { apiKey: string; invoiceId: string }): Promise<any> {
    return this.callTool('startStreaming', params);
  }

  /**
   * Pause streaming session
   */
  async pauseStreaming(params: { apiKey: string; invoiceId: string }): Promise<any> {
    return this.callTool('pauseStreaming', params);
  }

  /**
   * Stop streaming session
   */
  async stopStreaming(params: { apiKey: string; invoiceId: string }): Promise<any> {
    return this.callTool('stopStreaming', params);
  }
}

export const mcpClient = new McpClientInternal();
