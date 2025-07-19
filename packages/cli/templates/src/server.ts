import 'dotenv/config';
import * as http from 'http';
import { checkBeepApi, CheckBeepApiResult } from './tools/checkBeepApi';

// Define types for our tools for better type safety
type ToolParams = Record<string, unknown>;
type ToolFunction = (params: ToolParams) => Promise<CheckBeepApiResult | { error: string }>;

interface ToolRegistry {
  [key: string]: ToolFunction;
}

// A simple tool registry
const tools: ToolRegistry = {
  checkBeepApi,
};

const communicationMode = process.env.COMMUNICATION_MODE;

if (communicationMode === 'https') {
  console.log('Starting server in HTTPS mode...');
  const port = process.env.PORT || 8443;

  const server = http.createServer((req, res) => {
    // Basic request routing
    if (req.method === 'POST' && req.url === '/invoke') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { toolName, params } = JSON.parse(body);
          const tool = tools[toolName];

          if (tool) {
            // In a real implementation, you would stream the response
            const result = await tool(params);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result }));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Tool not found' }));
          }
        } catch (error) {
          console.error('Error processing request:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });

  server.listen(port, () => {
    console.log(`BEEP MCP Server listening on port ${port}`);
  });

} else if (communicationMode === 'stdio') {
  console.log('Starting server in STDIO mode...');
  // Logic for reading from stdin and writing to stdout will go here
  process.stdin.on('data', async (data) => {
    try {
      const { toolName, params } = JSON.parse(data.toString());
      const tool = tools[toolName];
      if (tool) {
        const result = await tool(params);
        process.stdout.write(JSON.stringify({ result }) + '\n');
      } else {
        process.stdout.write(JSON.stringify({ error: 'Tool not found' }) + '\n');
      }
    } catch (error) {
      console.error('Error processing stdio data:', error);
      process.stdout.write(JSON.stringify({ error: 'Invalid JSON' }) + '\n');
    }
  });
} else {
  console.error('Invalid COMMUNICATION_MODE specified in .env file. Please use \'https\' or \'stdio\'.');
  process.exit(1);
}
