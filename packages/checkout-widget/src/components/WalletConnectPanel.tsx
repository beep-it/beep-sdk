import { Wallet } from '@dynamic-labs/sdk-react-core';
import { isSuiWallet } from '@dynamic-labs/sui';
import { Transaction } from '@mysten/sui/transactions';
import React, { useCallback } from 'react';
import { useDynamicWallet } from '../hooks/useDynamicWallet';
import { PaymentSetupData } from '../hooks/usePaymentSetup';

interface WalletConnectPanelProps {
  destinationAddress: string;
  paymentSetupData: PaymentSetupData;
  onPaymentComplete: (trxDigest: string) => void;
}

const SUI_MOVE_BEEP_PACKAGE_ID =
  '0x9ed50429ae12b4207c648d1f2f7d36b849d3a0227d8df6f45b5494c5f0a56e37';
const TRANSACTION_REFERENCE = 'trx_refr';
const SUI_USDC_ADDRESS =
  '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
const SUI_USDC_DECIMALS = 6;

const getProviderName = (walletProviderKey: string, address: string): string => {
  const providerKey = walletProviderKey.toLowerCase();

  if (providerKey.includes('phantom')) {
    return 'Phantom';
  } else if (providerKey.includes('metamask')) {
    return 'MetaMask';
  } else if (providerKey.includes('slushsui')) {
    return 'Slush';
  } else if (providerKey.includes('suietsui')) {
    return 'Suiet';
  } else if (providerKey.includes('coinbase')) {
    return 'Coinbase';
  } else if (providerKey.includes('walletconnect')) {
    return 'WalletConnect';
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Scales a decimal value to integer base units using the token's decimals
 * @param value - The decimal value as a string (e.g., "10.50")
 * @param decimals - The number of decimals for the token (e.g., 6 for USDC)
 * @returns The scaled integer value as a string
 */
const scaleToInteger = (value: number, decimals: number): string => {
  const scaleFactor = Math.pow(10, decimals);
  const scaled = Math.floor(value * scaleFactor);
  return scaled.toString();
};

const useConnectButtonText = ({
  isLoading,
  isConnected,
  wallet,
}: {
  isLoading: boolean;
  isConnected: boolean;
  wallet: Wallet | null;
}) => {
  if (isLoading) {
    return 'Connecting...';
  }
  if (isConnected && wallet?.address) {
    const walletAddress = wallet.address;
    const walletName = getProviderName(wallet.connector.key, walletAddress);
    return `Pay with ${walletName} on ${wallet.chain}`;
  }
  return 'Connect your wallet';
};

/**
 * Sends a Sui USDC payment transaction
 * @param paymentSetupData - Payment setup data containing amount and recipient
 * @param primaryWallet - The connected Dynamic wallet
 */
const payToAddress = async ({
  paymentSetupData,
  primaryWallet,
  destinationAddress,
}: {
  paymentSetupData: PaymentSetupData;
  primaryWallet: any;
  destinationAddress: string;
}) => {
  try {
    if (!primaryWallet || !isSuiWallet(primaryWallet)) {
      throw new Error('Wallet not connected or not compatible');
    }

    // Get Sui client
    const suiClient = await primaryWallet.getSuiClient();
    if (!suiClient) {
      throw new Error('Failed to get Sui client');
    }

    // Fetch USDC coins owned by the user
    const { data: coins } = await suiClient.getCoins({
      owner: primaryWallet.address,
      coinType: SUI_USDC_ADDRESS,
    });

    if (!coins.length) {
      throw new Error('No USDC funds in your wallet');
    }

    // Create transaction
    const tx = new Transaction();

    // Merge all coins into the first one if multiple exist
    const mergeCoin = coins[0];
    if (coins.length > 1) {
      tx.mergeCoins(
        tx.object(mergeCoin.coinObjectId),
        coins.map((c) => tx.object(c.coinObjectId)).slice(1),
      );
    }

    if (paymentSetupData.referenceKey) {
      const eventId = Array.from(new TextEncoder().encode(TRANSACTION_REFERENCE));
      const reference = Array.from(new TextEncoder().encode(paymentSetupData.referenceKey));
      tx.moveCall({
        target: `${SUI_MOVE_BEEP_PACKAGE_ID}::metadata::emit_metadata`,
        arguments: [tx.pure.vector('u8', eventId), tx.pure.vector('u8', reference)],
      });
    }

    // Calculate amount in base units
    const baseUnits = scaleToInteger(paymentSetupData.totalAmount, SUI_USDC_DECIMALS);

    // Split the amount to send
    const [sendCoin] = tx.splitCoins(tx.object(mergeCoin.coinObjectId), [baseUnits]);

    // Set transaction parameters
    tx.setSender(primaryWallet.address);
    tx.setGasBudget(10_000_000);

    // Transfer to recipient
    tx.transferObjects([sendCoin], tx.pure.address(destinationAddress));

    // Sign and execute transaction
    const signedTransaction = await primaryWallet.signTransaction(tx);
    const paidTransaction = await suiClient.executeTransactionBlock({
      options: {},
      signature: signedTransaction.signature,
      transactionBlock: signedTransaction.bytes,
    });

    console.log('[WalletConnectButton] Transaction successful');
    return paidTransaction.digest;
  } catch (error) {
    console.error('[WalletConnectButton] Transaction failed:', error);
    throw error;
  }
};

/**
 * WalletConnectButton - Button component to trigger Sui wallet connection
 *
 * This component displays a button that opens the Dynamic SDK wallet connection
 * modal when clicked. It shows the connected wallet address if already connected,
 * or a "Connect Wallet" prompt if not.
 *
 * The button styling matches the checkout widget's design system with inline
 * styles to prevent CSS conflicts.
 */
export const WalletConnectPanel: React.FC<WalletConnectPanelProps> = ({
  paymentSetupData,
  destinationAddress,
  onPaymentComplete,
}) => {
  const { isConnected, walletAddress, openModal, disconnect, isLoading, primaryWallet } =
    useDynamicWallet();

  const handleMainButtonClick = useCallback(async () => {
    if (isConnected && walletAddress) {
      try {
        const trxDigest = await payToAddress({
          paymentSetupData,
          primaryWallet,
          destinationAddress,
        });
        // Call parent callback with transaction digest to trigger payment status polling
        onPaymentComplete(trxDigest);
      } catch (error) {
        console.error('[WalletConnectButton] Payment failed:', error);
        // Error handling - for now just log, no UI feedback yet
      }
      return;
    }
    if (isConnected) {
      disconnect();
      return;
    }
    openModal();
  }, [
    paymentSetupData,
    primaryWallet,
    destinationAddress,
    isConnected,
    disconnect,
    onPaymentComplete,
  ]);

  const mainButtonText = useConnectButtonText({ isLoading, isConnected, wallet: primaryWallet });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        gap: '12px',
      }}
    >
      <button
        onClick={handleMainButtonClick}
        disabled={isLoading}
        style={{
          width: '80%',
          backgroundColor: isConnected ? '#10b981' : '#26262B',
          color: 'white',
          fontWeight: '500',
          padding: '14px 16px',
          borderRadius: '9999px',
          border: 'none',
          cursor: isLoading ? 'default' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          fontSize: '14px',
          textAlign: 'center',
          opacity: isLoading ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = isConnected ? '#059669' : '#1a1a1e';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isConnected ? '#10b981' : '#26262B';
        }}
      >
        {mainButtonText}
      </button>
      {isConnected && (
        <button
          onClick={disconnect}
          disabled={isLoading}
          style={{
            width: '80%',
            backgroundColor: '#dc2626',
            color: 'white',
            fontWeight: '500',
            padding: '14px 16px',
            borderRadius: '9999px',
            border: 'none',
            cursor: isLoading ? 'default' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            textAlign: 'center',
            opacity: isLoading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#b91c1c';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }}
        >
          Disconnect
        </button>
      )}
    </div>
  );
};
