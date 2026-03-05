const React = require('react');

// Mutable state for dynamic context
let mockContextValue = {
  primaryWallet: null,
  user: null,
  isAuthenticated: false,
  setShowAuthFlow: jest.fn(),
  handleLogOut: jest.fn().mockResolvedValue(undefined),
  showAuthFlow: false,
};

const DynamicContextProvider = ({ children }) => {
  return React.createElement('div', null, children);
};

// Make it a jest mock function so tests can control return value
const useDynamicContext = jest.fn(() => mockContextValue);

const DynamicWidget = () => {
  return React.createElement('div', { 'data-testid': 'dynamic-widget' }, 'DynamicWidget');
};

// Helper to set mock context
const __setMockContext = (context) => {
  mockContextValue = context;
};

// Helper to reset
const __resetMockContext = () => {
  mockContextValue = {
    primaryWallet: null,
    user: null,
    isAuthenticated: false,
    setShowAuthFlow: jest.fn(),
    handleLogOut: jest.fn().mockResolvedValue(undefined),
    showAuthFlow: false,
  };
};

module.exports = {
  DynamicContextProvider,
  useDynamicContext,
  DynamicWidget,
  __setMockContext,
  __resetMockContext,
};
