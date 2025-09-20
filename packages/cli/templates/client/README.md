# MCP Client (Buying Agent)

This template is a minimal buying agent that connects to a remote MCP server and discovers available tools.

Behavior
- Discovery-first: connects to the seller's MCP server and lists tools (name, description, schema).
- Payment handling: when a tool requires payment, surface paymentUrl/qrCode to the user; do not poll here.

Configure target server in `.env` (SERVER_URL). DEFAULT_LIST_ONLY=true keeps runs to discovery only.
