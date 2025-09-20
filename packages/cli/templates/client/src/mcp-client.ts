// Copied from templates/src/mcp-client.ts and placed in client template
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

interface McpClientStdioParams {
  type: 'stdio';
  path: string;
}

interface McpClientHttpOptions {
  type: 'http';
  url: URL;
}

type McpClientInitParams = McpClientStdioParams | McpClientHttpOptions;

export class McpClientInternal {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private _mcpClient: Client | null = null;

  async initialize(params: McpClientInitParams): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;
    if (params.type === 'stdio') this.initializationPromise = this._initializeStdio(params);
    if (params.type === 'http') this.initializationPromise = this._initializeHttp(params);
    return this.initializationPromise!;
  }

  private async _initializeStdio(params: McpClientStdioParams): Promise<void> {
    const transport = new StdioClientTransport({ command: 'node', args: [params.path] });
    this._mcpClient = new Client({ name: 'mcp-server', version: '1.0.0' }, { capabilities: {} });
    await this._mcpClient.connect(transport);
    this.isInitialized = true;
  }

  private async _initializeHttp(params: McpClientHttpOptions): Promise<void> {
    const transport = new StreamableHTTPClientTransport(params.url);
    this._mcpClient = new Client({ name: 'mcp-server', version: '1.0.0' }, { capabilities: {} });
    await this._mcpClient.connect(transport);
    this.isInitialized = true;
  }

  private async callTool(method: string, params: any = {}): Promise<any> {
    if (!this.isInitialized && method !== 'initialize') {
      throw new Error('MCP client not initialized. Call initialize() first.');
    }
    return this._mcpClient?.callTool({ name: method, arguments: params });
  }

  async listTools(): Promise<Array<{ name: string; description?: string; inputSchema?: any }>> {
    if (!this._mcpClient) throw new Error('MCP client not initialized');
    const res = await (this._mcpClient as any).request(ListToolsRequestSchema, {});
    return (res?.tools as any[]) || [];
  }

  async checkBeepApi(): Promise<any> {
    return this.callTool('checkBeepApi');
  }
  async getAvailableWallets(): Promise<any> {
    return this.callTool('getAvailableWallets');
  }
  async signSolanaTransaction(params: { walletId: string; transaction: any }): Promise<any> {
    return this.callTool('signSolanaTransaction', params);
  }
}

export const mcpClient = new McpClientInternal();
