# Beep MCP Server - Client Integration Guide

A Model-Context-Protocol (MCP) server that provides secure access to Beep platform capabilities through multiple transport protocols.

## Quick Start

### Prerequisites

- Valid API key from Beep platform (if **not authenticated**)

### HTTP Transport

The HTTP transport is ideal for web applications, remote clients, and production use.

#### Initialize a Session

Send an initialize request without a session ID:

```bash
curl -X POST https://api.justbeep.it/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "initialize",
    "params": {
      "clientInfo": {
        "name": "my-client",
        "version": "1.0.0"
      }
    }
  }'
```

The server will respond with a session ID in the `mcp-session-id` header. Use this ID for all subsequent requests:

```bash
curl -X POST https://api.justbeep.it/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: your-session-id" \
  -d '{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "tools/list",
    "params": {}
  }'
```

#### Call Tools with Authentication

```bash
curl -X POST https://api.justbeep.it/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: your-session-id" \
  -d '{
    "jsonrpc": "2.0",
    "id": "3",
    "method": "tools/call",
    "params": {
      "name": "requestAndPurchaseAsset",
      "arguments": {
        "apiKey": "your-api-key",
        "amount": 1000000,
        "currency": "USDT",
        "referenceId": "payment-123"
      }
    }
  }'
```

## Available Tools

### Authentication Tools

- **`initiateDeviceLogin`**: Start OAuth device flow for CLI tools and apps
- **`createMerchantAccountFromSSO`**: Create new merchant accounts via Google SSO

### Resource Access

- **`getPaidResource`**: Access premium features and paid content

## Integration Examples

### JavaScript/Node.js

```javascript
const McpClient = require('@modelcontextprotocol/sdk/client');

const client = new McpClient({
  transport: 'http',
  endpoint: 'https://api.justbeep.it/mcp',
  auth: {
    type: 'bearer',
    token: 'your-access-token',
  },
});

await client.initialize();
const tools = await client.listTools();
```

### Python

```python
import requests

session = requests.Session()
session.headers.update({
    'Authorization': 'Bearer your-access-token',
    'Content-Type': 'application/json'
})

# Initialize session
response = session.post('https://api.justbeep.it/mcp', json={
    'method': 'initialize',
    'params': {'clientInfo': {'name': 'python-client', 'version': '1.0.0'}}
})

session_id = response.headers.get('mcp-session-id')
session.headers.update({'mcp-session-id': session_id})

# List available tools
tools = session.post('https://api.justbeep.it/mcp', json={
    'method': 'tools/list'
}).json()
```

## Error Handling

The server returns standard HTTP status codes:

- **200**: Success
- **401**: Authentication required
- **402**: Payment required (for paid resources)
- **404**: Resource not found
- **500**: Server error

## Rate Limits

Please respect the standard server's rate limits of **1000 requests per 15 minutes**. Implement exponential backoff for failed requests.

## Support

For technical support and API documentation, contact the Beep platform team.
