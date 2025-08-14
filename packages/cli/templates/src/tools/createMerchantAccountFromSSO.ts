/**
 * Skeleton: createMerchantAccountFromSSO
 *
 * Returns a mock SSO URL. Replace with SDK routing.
 */
export async function createMerchantAccountFromSSO(): Promise<any> {
  const ssoUrl = '/auth/google';
  return { content: [{ type: 'text', text: JSON.stringify({ sso_url: ssoUrl }) }] };
}
