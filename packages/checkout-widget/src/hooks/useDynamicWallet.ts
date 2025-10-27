import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect } from 'react';

export interface WalletAccount {
  address: string;
  chain: string;
  connector: string;
}

export interface UseDynamicWalletReturn {
  isConnected: boolean;
  primaryWallet: any;
  walletAddress: string | null;
  openModal: () => void;
  disconnect: () => void;
  isLoading: boolean;
}

/**
 * useDynamicWallet - Custom hook to manage Dynamic SDK wallet connections
 *
 * This hook provides a simplified interface to interact with Dynamic SDK's wallet
 * connection features, specifically for Sui wallets in the checkout widget.
 *
 * Features:
 * - Check wallet connection status
 * - Get primary wallet information
 * - Open wallet connection modal
 * - Disconnect wallet
 * - Track loading states
 *
 * @returns Object containing wallet connection state and control functions
 *
 * @example
 * ```tsx
 * const { isConnected, walletAddress, openModal, disconnect } = useDynamicWallet();
 *
 * if (!isConnected) {
 *   return <button onClick={openModal}>Connect Wallet</button>;
 * }
 *
 * return (
 *   <div>
 *     Connected: {walletAddress}
 *     <button onClick={disconnect}>Disconnect</button>
 *   </div>
 * );
 * ```
 */
export const useDynamicWallet = (): UseDynamicWalletReturn => {
  const context = useDynamicContext();
  const [isLoading, setIsLoading] = useState(false);

  const { primaryWallet, setShowAuthFlow, handleLogOut, user, showAuthFlow } = context || {};

  const walletAddress = primaryWallet?.address || null;
  const isConnected = Boolean(primaryWallet && walletAddress && user);

  const openModal = () => {
    if (!setShowAuthFlow) {
      return;
    }
    setIsLoading(true);
    setShowAuthFlow(true);
  };

  const disconnect = async () => {
    if (!handleLogOut) {
      return;
    }
    setIsLoading(true);
    try {
      await handleLogOut();
    } catch (error) {
      console.error('[useDynamicWallet] Error disconnecting wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset loading state when wallet connection changes
  useEffect(() => {
    if (isConnected) {
      setIsLoading(false);
    }
  }, [isConnected]);

  // Reset loading state when auth flow modal is closed without connecting
  useEffect(() => {
    if (!showAuthFlow && !isConnected && isLoading) {
      setIsLoading(false);
    }
  }, [showAuthFlow, isConnected, isLoading]);

  return {
    isConnected,
    primaryWallet,
    walletAddress,
    openModal,
    disconnect,
    isLoading,
  };
};
