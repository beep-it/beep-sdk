# MCP Server (Selling Agent)

This template exposes paid tools and creates invoices using the HTTP 402 pattern.

- Create invoice: POST /v1/payments/request with assets/paymentLabel (no charge performed).
- If unpaid: 402 with { referenceKey, paymentUrl, qrCode? }.
- Poll: repeat with paymentReference until 200 with { receipt, txSignature }.
- Execute: run the tool after paid; optionally POST /v1/payments/confirm after webhook settlement.

Do not use these server tools directly from browsers.

