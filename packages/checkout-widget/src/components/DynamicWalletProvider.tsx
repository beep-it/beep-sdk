import React from 'react';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { SuiWalletConnectors } from '@dynamic-labs/sui';
import { useDynamicEnvironment } from '../hooks/useDynamicEnvironment';

interface DynamicWalletProviderProps {
  children: React.ReactNode;
  publishableKey: string;
  serverUrl?: string;
}

/**
 * DynamicWalletProvider - Wraps the app with Dynamic SDK for Sui wallet connection
 *
 * This provider configures the Dynamic SDK to support Sui wallet connections only.
 * It must be placed at the root of your component tree, typically wrapping the
 * QueryProvider in the widget.
 *
 * The environment ID is fetched from the backend using the BeepPublicClient,
 * which allows for dynamic configuration without hardcoding values.
 *
 * @param children - Child components that will have access to Dynamic SDK context
 * @param publishableKey - BEEP publishable key for authentication
 * @param serverUrl - Optional custom server URL
 */
export const DynamicWalletProvider: React.FC<DynamicWalletProviderProps> = ({
  children,
  publishableKey,
  serverUrl,
}) => {
  const {
    data: environmentId,
    isLoading,
    error,
  } = useDynamicEnvironment({
    publishableKey,
    serverUrl,
  });

  if (isLoading) {
    return <>{children}</>;
  }

  if (error) {
    console.error('[DynamicWalletProvider] Failed to fetch environment ID:', error);
  }

  if (!environmentId) {
    console.warn(
      '[DynamicWalletProvider] No environment ID available. Wallet connection will not work.',
    );
    return <>{children}</>;
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId,
        walletConnectors: [SuiWalletConnectors],
      }}
    >
      {children}
    </DynamicContextProvider>
  );
};
