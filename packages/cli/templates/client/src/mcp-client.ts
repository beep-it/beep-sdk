/**
 * MCP Client (Buying Agent)
 *
 * This module implements an MCP client that connects to a SELLER MCP SERVER.
 * There is no auto-discovery of servers: you must explicitly point this
 * client at the seller you intend to talk to by choosing a transport and
 * providing the target.
 *
 * Two common transports:
 * - HTTP/S (hosted sellers): Use StreamableHTTPClientTransport and pass a full
 *   URL to the seller's MCP endpoint. Example:
 *     SERVER_URL=https://companyA.example.com/mcp
 *   In code we do: new StreamableHTTPClientTransport(new URL(SERVER_URL))
 *
 * - STDIO (local/embedded servers): Use StdioClientTransport and pass a
 *   command + args to launch a local MCP server process. Example:
 *     new StdioClientTransport({ command: 'node', args: ['dist/mcp-server.js'] })
 *
 * In this template, the default is HTTP. You configure the target via `.env`:
 *   - COMMUNICATION_MODE: 'https' or 'stdio'
 *   - SERVER_URL: full URL to the seller's MCP endpoint (when using HTTP)
 *
 * Typical flow for buyers:
 *   1) Connect to the seller MCP (using SERVER_URL for HTTP or stdio command)
 *   2) Discover tools via listTools() to learn available capabilities
 *   3) Invoke seller tools by name using callTool wrappers
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
// Use public SDK type entries; avoid deep dist imports
import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';

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

  /** Returns true once the underlying client has connected. */
  isReady(): boolean {
    return this.isInitialized && !!this._mcpClient;
  }

  /** Promise that resolves when initialization completes. */
  whenReady(): Promise<void> {
    if (this.isInitialized) return Promise.resolve();
    if (this.initializationPromise) return this.initializationPromise;
    return Promise.reject(new Error('MCP client not initialized. Call initialize() at startup.'));
  }

  private async _initializeStdio(params: McpClientStdioParams): Promise<void> {
    // STDIO mode: connect to a local MCP server process that this client launches.
    // Use this for local development or when embedding a server process.
    const transport = new StdioClientTransport({ command: 'node', args: [params.path] });
    this._mcpClient = new Client({ name: 'mcp-server', version: '1.0.0' }, { capabilities: {} });
    await this._mcpClient.connect(transport);
    this.isInitialized = true;
  }

  private async _initializeHttp(params: McpClientHttpOptions): Promise<void> {
    // HTTP/S mode: connect to a hosted seller MCP endpoint.
    // Provide a full URL like: https://companyA.example.com/mcp
    const transport = new StreamableHTTPClientTransport(params.url);
    this._mcpClient = new Client({ name: 'mcp-server', version: '1.0.0' }, { capabilities: {} });
    await this._mcpClient.connect(transport);
    this.isInitialized = true;
  }

  private async callTool(method: string, params: any = {}): Promise<any> {
    if (!this.isInitialized && method !== 'initialize') {
      throw new Error('MCP client not initialized. Call initialize() first.');
    }
    // Calls a REMOTE tool exposed by the SELLER MCP server by name.
    return this._mcpClient?.callTool({ name: method, arguments: params });
  }

  async listTools(): Promise<Array<{ name: string; description?: string; inputSchema?: any }>> {
    if (!this._mcpClient) throw new Error('MCP client not initialized');
    // Pass the expected result schema to ensure compatibility across SDK versions
    const res = await (this._mcpClient as any).request(
      { method: 'tools/list', params: {} },
      ListToolsResultSchema,
    );
    return (res?.tools as any[]) || [];
  }

  // BEEP seller-specific wrappers (optional): only valid when the remote MCP implements these tools

  // --------------------------------------------------------------
  // These methods are called from within the PaymentService. If you do not have a use for the
  // PaymentService, you can remove these methods. they are intended to be used with a MCP server
  // that implements the BEEP tools like `issuePayment`, `startStreaming`, and `stopStreaming`.

  // You should not call them directly; instead, use the PaymentService class in services/paymentService.ts
  // --------------------------------------------------------------
  async _checkBeepApi(): Promise<any> {
    return this.callTool('checkBeepApi');
  }
  async _startStreaming(params: { invoiceId: string }): Promise<any> {
    if (!this.isInitialized) throw new Error('MCP client not initialized');
    return this.callTool('startStreaming', params);
  }
  async _stopStreaming(params: { invoiceId: string }): Promise<any> {
    if (!this.isInitialized) throw new Error('MCP client not initialized');
    return this.callTool('stopStreaming', params);
  }
  async _issuePayment(params: {
    assetChunks: Array<{ assetId: string; quantity: number }>;
    payingMerchantId: string;
  }): Promise<any> {
    if (!this.isInitialized) throw new Error('MCP client not initialized');
    return this.callTool('issuePayment', params);
  }
  async _getAvailableWallets(): Promise<any> {
    return this.callTool('getAvailableWallets');
  }
}

export const mcpClient = new McpClientInternal();
