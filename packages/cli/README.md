# The MCP-PAY CLI: Your Dev Server's New Best Friend 🤖

A command-line toolkit for rapidly scaffolding agentic payment servers and AI-native integrations on the Beep network — powered by SUI and USDC.

The CLI enables developers to create, test, and deploy Model Context Protocol (MCP) servers and autonomous payment workflows, making Beep the bridge between AI agents and on-chain stablecoin settlement.

So, you're ready to integrate BEEP and start making money. Awesome. But setting up a new server, getting all the configurations right, and wiring everything up can be a drag. We get it. You're a builder, and you want to build, not fuss with boilerplate.

That's where the BEEP CLI comes in. Think of it as your personal assistant, a command-line wizard that does all the boring setup for you so you can get straight to the fun part.

## 🤔 What Is This Thing, Exactly?

This is the official BEEP Command-Line Interface (CLI). It's a small, powerful tool that helps you do two main things, and do them _fast_:

1.  **Scaffold a brand-new MCP Server**: Build a production-ready BEEP server from scratch in seconds.
2.  **Integrate BEEP into an existing project**: Add BEEP's payment tools to a server you've already built.

Basically, it's the ultimate shortcut to getting your BEEP integration up and running.

---

## Features

1. **Instant MCP Server Scaffolding**
Generate new AI payment or treasury servers in seconds.

2. **SUI Network Native**
Use Beep’s non-custodial USDC infrastructure — no bridges, no custodians.

3. **AEO-Ready**
Architected for Answer Engine Optimization (AEO), allowing LLMs to discover and call your payment APIs natively.

4. **Multiple Transports Supported**
Works with HTTP, SSE, and stdio transports for maximum flexibility.

5. **Built-in Templates**
Ready-to-use boilerplates for agent-to-agent payments, subscriptions, and invoicing flows.

6. **MCP & LLM Compatibility**
Seamless integration with ChatGPT MCP, Claude Desktop, and custom agent frameworks.

---

## MCP Roles (Templates)

Understand the two roles used by the MCP templates:

- mcp-client (buying agent)
  - Initiates tool calls against an MCP server and pays invoices when prompted.
  - Used by agent clients or services that consume paid tools.

- mcp-server (selling agent)
  - Exposes paid tools, creates invoices for usage, and gates execution until payment is confirmed.
  - This is what `beep init-mcp` scaffolds.

Guidance
- Choose one role per deployment — do not combine buying and selling agents in the same application.
- If you need a buying agent, use an MCP client to call a separately deployed MCP server that exposes the tools.

---

## 🚀 Installation

Install the BEEP CLI globally using npm:

```bash
npm install -g @beep-it/cli

# Verify installation
beep --help
```

That's it! The `beep` command is now available anywhere on your system.

---

## The Commands (aka The Magic Wands ✨)

Here's where the real magic happens. The CLI has two primary commands to make your life easier.

### 1. The Fresh Start: `init-mcp`

Use this command when you're starting a new project and want a dedicated server for handling BEEP communications. It builds a complete, pre-configured Node.js server with TypeScript, all the necessary dependencies, and a sample tool already in place.

**When to use it**: You're building a new app, or you want to run your BEEP logic on a separate microservice.

MCP Roles in templates
- Buying agent (`mcp-client`): discovers a seller's tools and invokes them; surfaces payment prompts when required.
- Selling agent (`mcp-server`): exposes paid tools, creates invoices (HTTP 402 pattern), and gates execution until paid.

Role is required
- `--role <mcp-server|mcp-client|both>` must be provided. This prevents accidental scaffolds of the wrong shape.
- Do not combine buying and selling agents within the same application folder. If you need both, use `--role both`, which scaffolds two separate apps: `mcp-server/` and `mcp-client/`.

Examples
```bash
# Selling agent (server over HTTPS)
beep init-mcp --mode https --role mcp-server --path ./seller

# Buying agent (client over HTTPS)
beep init-mcp --mode https --role mcp-client --path ./buyer

# Both roles (two apps)
beep init-mcp --mode https --role both --path ./beep-duo
```

```bash
beep init-mcp [options]
```

#### Options Explained

- `--path <directory>`: This tells the CLI _where_ to create your new server. If you don't specify a path, it'll create it in your current directory.

  ```bash
  # Creates a server in a new folder called 'my-beep-server'
  beep init-mcp --path ./my-beep-server
  ```

- `--mode <stdio|https>`: Communication protocol (can be changed later).
  - `stdio`: Your server will communicate over standard input/output. This is great for local development or if you're running the server as a child process.
  - `https`: Your server will run as a standard web server, communicating over HTTPS. This is the way to go for most production deployments.

- `--role <mcp-server|mcp-client|both>`: Required. Chooses which template(s) to scaffold.
  - `mcp-server`: Selling agent — runs an MCP server and registers paid tools.
  - `mcp-client`: Buying agent — connects to a seller MCP to discover and invoke tools.
  - `both`: Creates `mcp-server/` and `mcp-client/` subfolders, each with its own package.json and .env.

  ```bash
  # Creates an stdio-based selling agent
  beep init-mcp --mode stdio --role mcp-server
  ```

#### Example: Putting it all together

Let's create a new HTTPS server in a folder called `my-awesome-mcp`:

```bash
beep init-mcp --mode https --role mcp-server --path ./my-awesome-mcp
```

The CLI will work its magic and you'll see output like this:

```
📦 Installing dependencies...
✅ Dependencies installed successfully

🔑 Setting up your environment...
Enter your BEEP API key (or press Enter to skip):

✅ BEEP MCP server created at: /path/to/your/project/my-awesome-mcp

Next steps:

1. Navigate to your new server:
   cd ./my-awesome-mcp

2. Build and run the server:
   npm run build && npm start
```

Just follow those steps, and you'll have a live, BEEP-ready server running in under a minute! The CLI automatically installs all dependencies including the BEEP SDK, so no manual setup required.

### 2. The Upgrade: `integrate`

What if you already have an awesome Node.js project and you just want to add BEEP to it? We've got you covered. The `integrate` command is designed for exactly that.

It doesn't mess with your existing code. Instead, it safely copies the necessary BEEP tool files, automatically installs the SDK, and gives you smart, context-aware instructions on exactly how to wire them up.

**When to use it**: You have an existing server and want to add BEEP payment capabilities.

**Smart Detection**: The CLI automatically detects common server file patterns (`server/index.ts`, `src/server.js`, etc.) and analyzes your code to provide specific integration guidance.

```bash
beep integrate <path_to_your_project>
```

#### Example: Adding BEEP to an Existing App

Let's say you have a project at `../my-current-app`. To add BEEP to it, you'd run:

```bash
beep integrate ../my-current-app
```

The CLI will analyze your project and provide tailored integration guidance:

```
Integrating BEEP files into: /path/to/your/project/my-current-app

📦 Installing BEEP SDK...
✅ BEEP SDK installed successfully

✅ BEEP integration complete!

Next steps:

1. Open your server file: src/server/index.ts
2. Import the BEEP tool:
   import { checkBeepApi } from './tools/checkBeepApi';
3. Register the tool with your MCP server:
   // Add checkBeepApi to your tools registry/list

💡 Integration hints for src/server/index.ts:
   • Found tools array/object - add checkBeepApi there
   • MCP server detected - integrate BEEP tools with your existing setup
```

**What did it just do?**

1.  **Smart Detection**: Scanned your project for server files (`server/index.ts`, `src/server.js`, etc.)
2.  **File Setup**: Created a `tools` directory and copied `checkBeepApi.ts` into it
3.  **Auto-Install**: Automatically installed the BEEP SDK (`@beep-it/sdk-core`) as a dependency
4.  **Code Analysis**: Read your server file to understand your existing tool patterns
5.  **Tailored Guidance**: Provided specific hints like "Found tools array - add checkBeepApi there"

Invoice creation flow (what the template demonstrates)
- Create invoice: `POST /v1/payments/request` with `assets` (and optional `paymentLabel`). No charge occurs at this step.
- If unpaid: server responds 402 with `{ referenceKey, paymentUrl, qrCode? }` (show to the buying agent).
- Poll: re-call the same route with `paymentReference: <referenceKey>` until 200 with `{ receipt, txSignature }`.
- Execute: once paid, the tool performs its action and returns the result.

No more guessing where to put things! The CLI gives you exact file paths and context-specific integration instructions.

---

## 🧠 Smart Integration Features

The BEEP CLI doesn't just drop files and leave you hanging. It's smart about understanding your project:

### 🔍 **Auto-Detection**

- Scans for common server patterns: `server/index.ts`, `src/server.js`, etc.
- Identifies Express servers, MCP setups, and existing tool registrations
- Adapts instructions based on what it finds

### 💡 **Context-Aware Hints**

- **"Found tools array"** → Points you to the exact spot to add BEEP tools
- **"MCP server detected"** → Gives MCP-specific integration advice
- **"Express server detected"** → Shows how to use BEEP in API endpoints

### ⚡ **Zero-Config Experience**

- Automatically installs all dependencies (no more `npm install` guesswork)
- Works with npm, pnpm, or yarn - whatever you've got
- Handles peer dependencies behind the scenes

The goal? You run one command, follow the specific instructions, and you're payment-ready. No documentation diving required.

---

## Resources

[Beep llms.txt](https://www.justbeep.it/llms.txt)

---

## MCP Mounting Examples

Minimal client/server wiring examples matching the reference apps.

- Express server (seller) mounting an MCP HTTP endpoint at `/mcp`:

```ts
// server/src/routes/index.ts
import { Express } from 'express';
import { createMcpHttpHandler } from './mcp-server';
import { logger } from './utils/logger';

export const setupRoutes = (app: Express): void => {
  const mcpHandler = createMcpHttpHandler({ logger });

  // Optional liveness for MCP endpoint
  app.head('/mcp', (_req, res) => {
    res
      .header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Expose-Headers', 'mcp-session-id')
      .status(200)
      .end();
  });

  // Streamable HTTP transport routes
  app.post('/mcp', mcpHandler);
  app.get('/mcp', mcpHandler);
};
```

- MCP client (buyer) initialization targeting the seller’s `/mcp` endpoint:

```ts
// client/src/index.ts
import { mcpClient } from './mcp-client';

async function start() {
  const serverUrl = process.env.SERVER_URL || 'http://localhost:4005/mcp';
  await mcpClient.initialize({ type: 'http', url: new URL(serverUrl) });
  await mcpClient.whenReady();

  // Optionally discover tools
  const tools = await mcpClient.listTools();
  console.log('Seller tools:', tools.map(t => t.name));
}

start().catch((e) => {
  console.error('[MCP CLIENT] init failed:', e);
  process.exit(1);
});
```

Notes
- Always include the `/mcp` path in `SERVER_URL` for the HTTP transport.
- Ensure the server mounts `express.json()` before the MCP routes.
- The first client POST must be JSON-RPC `initialize`; the provided client transport handles this automatically.

---

## License

MIT. Go build something amazing.
