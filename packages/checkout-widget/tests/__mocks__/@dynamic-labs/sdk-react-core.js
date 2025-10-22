const React = require('react');

const DynamicContextProvider = ({ children }) => {
  return React.createElement('div', null, children);
};

const useDynamicContext = () => ({
  primaryWallet: null,
  user: null,
  isAuthenticated: false,
  setShowAuthFlow: jest.fn(),
});

const DynamicWidget = () => {
  return React.createElement('div', { 'data-testid': 'dynamic-widget' }, 'DynamicWidget');
};

module.exports = {
  DynamicContextProvider,
  useDynamicContext,
  DynamicWidget,
};
