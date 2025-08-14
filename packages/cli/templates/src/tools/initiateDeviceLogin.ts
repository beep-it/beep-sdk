/**
 * Skeleton: initiateDeviceLogin
 *
 * Returns mock device login codes. Replace with SDK-driven device auth.
 */
export async function initiateDeviceLogin(): Promise<any> {
  const now = Math.floor(Date.now() / 1000);
  const mock = {
    userCode: 'MOCK-CODE',
    deviceCode: `dev_${now}`,
    verificationUri: 'https://beep.dev/device',
    expiresIn: 600,
  };
  return {
    ...mock,
    content: [
      { type: 'text', text: `Visit ${mock.verificationUri} and enter code ${mock.userCode}` },
    ],
  };
}
