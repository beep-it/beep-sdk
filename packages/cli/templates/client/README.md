# MCP Client (Buying Agent)

This template is a minimal buying agent that:
- Can expose its own client-side tools via an MCP server (buyer capabilities)
- Connects to a remote seller MCP server to discover and invoke seller tools

Important: embedding/integrating this client into your app is not automatic. You must wire the client into your server or runner. See the integration examples below.

Behavior
- Discovery-first: connects to the seller's MCP server and lists tools (name, description, schema).
- Payment handling: when a tool requires payment, surface paymentUrl/qrCode to the user; do not poll here.

Configure target server in `.env` (SERVER_URL). DEFAULT_LIST_ONLY=true keeps runs to discovery only.

Quick Start
- Set transport and target in `.env`:
  - `COMMUNICATION_MODE=https` for hosted sellers (recommended)
  - `SERVER_URL=https://companyA.example.com/mcp` (replace with seller endpoint)
- Install and run:
  ```bash
  npm install
  npm run build && npm start  # starts the buyer's MCP server
  ```
- Expected output:
  - Connects to `SERVER_URL`
  - Buyer MCP server exposes local tools: checkBeepApi, getAvailableWallets, signSolanaTransaction
  - When invoked by an orchestrator, local tools can call out to the seller MCP as needed
  - Prints discovered tools from the seller (name, description) when using the discovery helper
  - With `DEFAULT_LIST_ONLY=true`, it stops after discovery
  - Optionally attempts a simple demo call if a matching tool (e.g., `checkBeepApi`) exists

Integrating the client into your server

There are two common ways to use this buying agent client in your own app. Choose one and embed it explicitly.

1) As an outbound MCP client only (no local HTTP route)
- Use this when your app just needs to call a seller MCP server.
- Example with modern TS (top‑level await allowed):
  ```ts
  // src/main.ts (your server or script)
  import { mcpClient } from './src/mcp-client';

  const url = new URL(process.env.SERVER_URL || 'http://localhost:4005/mcp');
  await mcpClient.initialize({ type: 'http', url });

  const tools = await mcpClient.listTools();
  console.log('Discovered seller tools:', tools.map(t => t.name));

  // later in your code, invoke tools as needed
  // await mcpClient.checkBeepApi();
  ```

- Example without top‑level await (older TS/Node configs):
  ```ts
  // src/main.ts
  import { mcpClient } from './src/mcp-client';

  const url = new URL(process.env.SERVER_URL || 'http://localhost:4005/mcp');
  mcpClient
    .initialize({ type: 'http', url })
    .then(() => mcpClient.listTools())
    .then((tools) => {
      console.log('Discovered seller tools:', tools.map(t => t.name));
      // return mcpClient.checkBeepApi();
    })
    .catch((err) => {
      console.error('Failed to initialize MCP client:', err);
      process.exit(1);
    });
  ```

Notes
- Always use the public MCP SDK type entry points: `@modelcontextprotocol/sdk/types.js`.
- For listing tools over HTTP, this template uses a literal JSON‑RPC request with `ListToolsResultSchema` to avoid overload/typing issues across SDK versions.
- If you need request/response traces, add logging around your initialize + tools/list calls and on your `/mcp` route.

Singleton client and readiness
- The exported `mcpClient` is a singleton. Initialize it once at process startup.
- All imports of `mcpClient` share the same instance and session.
- Use `mcpClient.isReady()` or `mcpClient.whenReady()` to guard calls in modules that can run before startup completes.

Using the PaymentService with a BEEP seller

This template includes a minimal `PaymentService` (`src/services/paymentService.ts`) intended for BEEP sellers that expose tools: `issuePayment`, `startStreaming`, and `stopStreaming`. Other sellers may not implement these tools.

Example (modern TS with top‑level await):
```ts
import { mcpClient } from './src/mcp-client';
import { paymentService } from './src/services/paymentService';

const url = new URL(process.env.SERVER_URL || 'http://localhost:4005/mcp');
await mcpClient.initialize({ type: 'http', url });

const pay = await paymentService.issuePayment({
  apiKey: process.env.BEEP_API_KEY!,
  assetChunks: [{ assetId: 'video_001', quantity: 1 }],
  payingMerchantId: 'merchant_123',
});

if (pay.success && pay.invoiceId) {
  await paymentService.startStreamingSession({ apiKey: process.env.BEEP_API_KEY!, invoiceId: pay.invoiceId });
}
```

Example (no top‑level await):
```ts
import { mcpClient } from './src/mcp-client';
import { paymentService } from './src/services/paymentService';

const url = new URL(process.env.SERVER_URL || 'http://localhost:4005/mcp');
mcpClient
  .initialize({ type: 'http', url })
  .then(() => paymentService.issuePayment({
    apiKey: process.env.BEEP_API_KEY!,
    assetChunks: [{ assetId: 'video_001', quantity: 1 }],
    payingMerchantId: 'merchant_123',
  }))
  .then((pay) => {
    if (pay.success && pay.invoiceId) {
      return paymentService.startStreamingSession({ apiKey: process.env.BEEP_API_KEY!, invoiceId: pay.invoiceId });
    }
  })
  .catch((err) => console.error('Payment/streaming error:', err));
```

Note: If integrating with a non‑BEEP seller, tool names and input shapes may differ. Adjust the service or call tools directly via `mcpClient.callTool(...)`.
