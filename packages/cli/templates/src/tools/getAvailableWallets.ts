/**
 * Skeleton: getAvailableWallets
 *
 * Returns a mock list of wallets. Replace with SDK lookup by API key.
 */
export async function getAvailableWallets(): Promise<any> {
  const wallets = [
    { id: 1, name: 'Primary Wallet' },
    { id: 2, name: 'Secondary Wallet' },
  ];
  return { content: [{ type: 'text', text: JSON.stringify(wallets, null, 2) }] };
}
