# The BEEP CLI: Your Dev Server's New Best Friend 🤖

So, you're ready to integrate BEEP and start making money. Awesome. But setting up a new server, getting all the configurations right, and wiring everything up can be a drag. We get it. You're a builder, and you want to build, not fuss with boilerplate.

That's where the BEEP CLI comes in. Think of it as your personal assistant, a command-line wizard that does all the boring setup for you so you can get straight to the fun part.

## 🤔 What Is This Thing, Exactly?

This is the official BEEP Command-Line Interface (CLI). It's a small, powerful tool that helps you do two main things, and do them *fast*:

1.  **Scaffold a brand-new MCP Server**: Build a production-ready BEEP server from scratch in seconds.
2.  **Integrate BEEP into an existing project**: Add BEEP's payment tools to a server you've already built.

Basically, it's the ultimate shortcut to getting your BEEP integration up and running.

--- 

## 🚀 Installation

First things first, you need to install this bad boy. We've published it to npm, so it's a breeze. Open your terminal and run:

```bash
# Using npm
npm install -g @beep/cli

# Or if you're a pnpm fan
pnpm add -g @beep/cli
```

This makes the `beep` command available anywhere on your system. To check if it worked, just type `beep --help` and you should see a list of available commands.

--- 

## The Commands (aka The Magic Wands ✨)

Here's where the real magic happens. The CLI has two primary commands to make your life easier.

### 1. The Fresh Start: `init-mcp`

Use this command when you're starting a new project and want a dedicated server for handling BEEP communications. It builds a complete, pre-configured Node.js server with TypeScript, all the necessary dependencies, and a sample tool already in place.

**When to use it**: You're building a new app, or you want to run your BEEP logic on a separate microservice.

```bash
beep init-mcp [options]
```

#### Options Explained

*   `--path <directory>`: This tells the CLI *where* to create your new server. If you don't specify a path, it'll create it in your current directory.

    ```bash
    # Creates a server in a new folder called 'my-beep-server'
    beep init-mcp --path ./my-beep-server
    ```

*   `--mode <stdio|https>`: This is the communication protocol your server will use to talk to BEEP. (Don't worry, you can change this later).
    *   `stdio`: Your server will communicate over standard input/output. This is great for local development or if you're running the server as a child process.
    *   `https`: Your server will run as a standard web server, communicating over HTTPS. This is the way to go for most production deployments.

    ```bash
    # Creates an stdio-based server
    beep init-mcp --mode stdio
    ```

#### Example: Putting it all together

Let's create a new HTTPS server in a folder called `my-awesome-mcp`:

```bash
beep init-mcp --mode https --path ./my-awesome-mcp
```

The CLI will work its magic and you'll see output like this:

```
✅ BEEP MCP server created at: /path/to/your/project/my-awesome-mcp

Next steps:

1. Navigate to your new server:
   cd ./my-awesome-mcp

2. Install dependencies:
   npm install

3. Run the server:
   npm run dev
```

Just follow those steps, and you'll have a live, BEEP-ready server running in under a minute! How cool is that?

### 2. The Upgrade: `integrate`

What if you already have an awesome Node.js project and you just want to add BEEP to it? We've got you covered. The `integrate` command is designed for exactly that.

It doesn't mess with your existing code. Instead, it safely copies the necessary BEEP tool files and the SDK into your project and gives you clear instructions on how to wire them up.

**When to use it**: You have an existing server and want to add BEEP payment capabilities.

```bash
beep integrate <path_to_your_project>
```

#### Example: Adding BEEP to an Existing App

Let's say you have a project at `../my-current-app`. To add BEEP to it, you'd run:

```bash
beep integrate ../my-current-app
```

The CLI will print out a confirmation and a list of next steps:

```
Integrating BEEP files into: /path/to/your/project/my-current-app

✅ BEEP integration files created!

Next steps:

1. Add the BEEP SDK dependency to your project.
   In your package.json, add the following to your 'dependencies':
   '@beep/sdk-core': 'file:beep-sdk-core-0.1.0.tgz'

2. Run 'npm install' or 'pnpm install' to install the new dependency.

3. Integrate the BEEP tool into your server file:
   import { checkBeepApi } from './tools/checkBeepApi'; // Adjust path if needed
   // Add the tool to your MCP's tool registry.
```

**What did it just do?**

1.  It created a `tools` directory in your project.
2.  It copied a sample tool, `checkBeepApi.ts`, into that directory.
3.  It copied the BEEP SDK (`beep-sdk-core-0.1.0.tgz`) into your project root.

Now, all you have to do is follow the printed instructions to add the SDK to your `package.json`, install it, and import the tool into your main server file. It's the safest, easiest way to give your existing project BEEP superpowers.

--- 

## License

MIT. Go build something amazing.
