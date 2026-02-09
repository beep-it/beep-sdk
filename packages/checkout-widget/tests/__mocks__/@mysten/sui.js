/**
 * Mock for @mysten/sui
 * Provides mock implementations for Transaction and SuiClient
 */

// Mock Transaction class
class Transaction {
  constructor() {
    this.sender = null;
    this.gasBudget = null;
    this.operations = [];
  }

  setSender(address) {
    this.sender = address;
    return this;
  }

  setGasBudget(budget) {
    this.gasBudget = budget;
    return this;
  }

  object(objectId) {
    return { objectId, type: 'object' };
  }

  pure = {
    vector: jest.fn((type, data) => ({ type: 'vector', elementType: type, data })),
    address: jest.fn((address) => ({ type: 'address', value: address })),
    u64: jest.fn((value) => ({ type: 'u64', value })),
  };

  moveCall(params) {
    this.operations.push({ type: 'moveCall', ...params });
    return this;
  }

  mergeCoins(destination, sources) {
    this.operations.push({ type: 'mergeCoins', destination, sources });
    return this;
  }

  splitCoins(coin, amounts) {
    this.operations.push({ type: 'splitCoins', coin, amounts });
    return [{ type: 'splitResult', index: 0 }];
  }

  transferObjects(objects, recipient) {
    this.operations.push({ type: 'transferObjects', objects, recipient });
    return this;
  }
}

// Mock SuiClient class
class SuiClient {
  constructor(config) {
    this.config = config;
  }

  async getCoins(params) {
    return {
      data: [
        {
          coinObjectId: 'mock-coin-object-id-1',
          balance: '1000000000', // 1000 USDC
          coinType: params.coinType,
        },
      ],
    };
  }

  async executeTransactionBlock(params) {
    return {
      digest: 'mock-transaction-digest',
      effects: {
        status: { status: 'success' },
      },
    };
  }

  async getBalance(params) {
    return {
      totalBalance: '1000000000',
    };
  }
}

module.exports = {
  Transaction,
  SuiClient,
};
