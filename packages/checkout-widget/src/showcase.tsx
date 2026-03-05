import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Example1 } from './examples/Example1';
import { Example2 } from './examples/Example2';

type Tab = 'example1' | 'example2';

const PUB_KEY_STORAGE_KEY = 'beep_cw_pub_key';
const DEFAULT_PUB_KEY = 'beep_pk_demo_publishable_key';

const getStoredValue = (key: string, defaultValue: string): string => {
  const stored = localStorage.getItem(key);
  if (stored) {
    return stored;
  }
  localStorage.setItem(key, defaultValue);
  return defaultValue;
};

const ShowcasePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('example1');
  const [publishableKey, setPublishableKey] = useState(
    getStoredValue(PUB_KEY_STORAGE_KEY, DEFAULT_PUB_KEY),
  );
  const [inputPubKey, setInputPubKey] = useState(
    getStoredValue(PUB_KEY_STORAGE_KEY, DEFAULT_PUB_KEY),
  );

  const handleSetPubKey = () => {
    setPublishableKey(inputPubKey);
    localStorage.setItem(PUB_KEY_STORAGE_KEY, inputPubKey);
  };

  const tabStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      padding: '20px',
      backgroundColor: '#2c3e50',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      color: 'white',
      fontSize: '24px',
      margin: 0,
    },
    inputContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 15px',
      backgroundColor: 'white',
      borderRadius: '8px',
    },
    inputLabel: {
      color: '#333',
      fontWeight: 'bold' as const,
      fontSize: '14px',
      whiteSpace: 'nowrap' as const,
    },
    input: {
      padding: '8px 12px',
      fontSize: '14px',
      border: '2px solid #ddd',
      borderRadius: '4px',
      minWidth: '300px',
    },
    setButton: {
      padding: '8px 20px',
      fontSize: '14px',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold' as const,
      transition: 'background-color 0.2s',
    },
    contentWrapper: {
      display: 'flex',
      flex: 1,
      gap: '20px',
    },
    sidebar: {
      width: '200px',
      backgroundColor: '#34495e',
      borderRadius: '8px',
      padding: '10px',
    },
    tabButton: (isActive: boolean) => ({
      width: '100%',
      padding: '12px 16px',
      marginBottom: '8px',
      backgroundColor: isActive ? '#3498db' : 'transparent',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      textAlign: 'left' as const,
      transition: 'background-color 0.2s',
    }),
    mainContent: {
      flex: 1,
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'auto',
    },
  };

  return (
    <div style={tabStyles.container}>
      <div style={tabStyles.header}>
        <h1 style={tabStyles.title}>BEEP Merchant Widget Showcase</h1>

        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={tabStyles.inputContainer}>
            <label style={tabStyles.inputLabel}>Publishable Key:</label>
            <input
              type="text"
              value={inputPubKey}
              onChange={(e) => setInputPubKey(e.target.value)}
              placeholder="Enter publishable key"
              style={tabStyles.input}
            />
            <button
              style={tabStyles.setButton}
              onClick={handleSetPubKey}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2980b9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3498db';
              }}
            >
              Set
            </button>
          </div>
        </div>
      </div>

      <div style={tabStyles.contentWrapper}>
        <div style={tabStyles.sidebar}>
          <button
            style={tabStyles.tabButton(activeTab === 'example1')}
            onClick={() => setActiveTab('example1')}
            onMouseEnter={(e) => {
              if (activeTab !== 'example1') {
                e.currentTarget.style.backgroundColor = '#2c3e50';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'example1') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            Example 1
          </button>
          <button
            style={tabStyles.tabButton(activeTab === 'example2')}
            onClick={() => setActiveTab('example2')}
            onMouseEnter={(e) => {
              if (activeTab !== 'example2') {
                e.currentTarget.style.backgroundColor = '#2c3e50';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'example2') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            Example 2
          </button>
        </div>

        <div style={tabStyles.mainContent}>
          {activeTab === 'example1' && <Example1 publishableKey={publishableKey} />}
          {activeTab === 'example2' && <Example2 publishableKey={publishableKey} />}
        </div>
      </div>
    </div>
  );
};

// Initialize the showcase page
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ShowcasePage />);
}
