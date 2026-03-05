/**
 * Mock for validator package
 */

const isEmail = jest.fn((email) => {
  // Simple email validation for testing
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
});

module.exports = {
  isEmail,
  default: {
    isEmail,
  },
};
