import React from 'react';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { SuiWalletConnectors } from '@dynamic-labs/sui';

interface DynamicWalletProviderProps {
  children: React.ReactNode;
  environmentId: string;
}

/**
 * DynamicWalletProvider - Wraps the app with Dynamic SDK for Sui wallet connection
 *
 * This provider configures the Dynamic SDK to support Sui wallet connections only.
 * It must be placed at the root of your component tree, typically wrapping the
 * QueryProvider in the widget.
 *
 * @param children - Child components that will have access to Dynamic SDK context
 * @param environmentId - Dynamic environment ID from app.dynamic.xyz/dashboard
 */
export const DynamicWalletProvider: React.FC<DynamicWalletProviderProps> = ({
  children,
  environmentId,
}) => {
  if (!environmentId) {
    console.warn('[DynamicWalletProvider] No environment ID provided. Wallet connection will not work.');
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
