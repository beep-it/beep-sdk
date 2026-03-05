import React, { useCallback, useState } from 'react';

interface WalletAddressLabelProps {
  walletAddress?: string;
}

export const WalletAddressLabel: React.FC<WalletAddressLabelProps> = ({ walletAddress }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!walletAddress) {
      return;
    }
    try {
      if (!navigator?.clipboard?.writeText) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = walletAddress;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } else {
        await navigator.clipboard.writeText(walletAddress);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }, [walletAddress]);

  const truncateAddress = (address?: string) => {
    if (!address || typeof address !== 'string') {
      return 'Invalid address';
    }
    if (address.length <= 20) {
      return address;
    }
    return `${address.slice(0, 12)}...${address.slice(-4)}`;
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      position: 'relative',
      maxWidth: '240px',
      margin: '20px auto',
    },
    labelContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      borderRadius: '20px',
      padding: '12px 16px',
      paddingRight: '48px',
      border: '1px solid #e0e0e0',
      minHeight: '20px',
    },
    walletLabel: {
      flex: 1,
      fontSize: '14px',
      color: '#666',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      userSelect: 'none',
    },
    copyButton: {
      position: 'absolute',
      right: '8px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#666',
      transition: 'background-color 0.2s ease',
    },
    copyFeedback: {
      position: 'absolute',
      top: '-35px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#333',
      color: 'white',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      whiteSpace: 'nowrap',
      zIndex: 1000,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.labelContainer}>
        <span style={styles.walletLabel}>{truncateAddress(walletAddress)}</span>
        <button
          disabled={!walletAddress}
          onClick={handleCopy}
          style={styles.copyButton}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      {copied && <div style={styles.copyFeedback}>Copied to clipboard!</div>}
    </div>
  );
};
