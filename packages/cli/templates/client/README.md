# MCP Client (Buying Agent)

This template is a minimal buying agent that both:
- Exposes its own client-side tools via an MCP server (buyer capabilities)
- Connects to a remote seller MCP server to discover and invoke seller tools

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
