# MCP Server (Selling Agent)

This template exposes paid tools and creates invoices using the HTTP 402 pattern.

- Create invoice: POST /v1/payments/request with assets/paymentLabel (no charge performed).
- If unpaid: 402 with { referenceKey, paymentUrl, qrCode? }.
- Poll: repeat with paymentReference until 200 with { receipt, txSignature }.
- Execute: run the tool after paid; optionally POST /v1/payments/confirm after webhook settlement.

## HTTPS mode

Set `MCP_AUTH_TOKEN` and send it as `Authorization: Bearer <token>` on every MCP request.
Requests are refused while it is unset.

`MCP_ALLOWED_ORIGINS` is a comma-separated CORS allowlist (empty means no cross-origin access).
`MCP_ALLOWED_HOSTS` is a comma-separated list of the hostnames the server is reached on.

Do not use these server tools directly from browsers.

