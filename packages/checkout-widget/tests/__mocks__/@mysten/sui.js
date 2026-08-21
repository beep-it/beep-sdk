/**
 * Mock for @mysten/sui
 * Provides mock implementations for Transaction and SuiClient
 */

/**
 * Mock of the `coinWithBalance` intent. Like the real one it resolves nothing on its own — the
 * command is a placeholder until `build()` runs against a client.
 */
const coinWithBalance = jest.fn(({ balance, type, useGasCoin }) => ({
  type: 'coinWithBalance',
  balance,
  coinType: type,
  useGasCoin,
}));

// Mock Transaction class
class Transaction {
  constructor() {
    this.sender = null;
    this.gasBudget = null;
    this.operations = [];
  }

  /**
   * Rebuilds a transaction from built bytes — what the dapp hands the wallet to sign.
   */
  static from(bytes) {
    const tx = new Transaction();
    tx.bytes = bytes;
    return tx;
  }

  /**
   * Resolves the `coinWithBalance` intents against the client, mirroring the real resolver's
   * coin lookup and its shortfall error, then returns opaque bytes.
   */
  async build({ client } = {}) {
    if (!client) {
      throw new Error('No sui client passed to Transaction#build');
    }
    for (const op of this.operations) {
      for (const coin of op.objects ?? []) {
        if (coin?.type !== 'coinWithBalance') continue;
        const { data } = await client.getCoins({ owner: this.sender, coinType: coin.coinType });
        const total = data.reduce((sum, c) => sum + BigInt(c.balance), 0n);
        if (total < BigInt(coin.balance)) {
          throw new Error(`Not enough coins of type ${coin.coinType} to satisfy requested balance`);
        }
      }
    }
    return new Uint8Array([1, 2, 3]);
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
  coinWithBalance,
};
