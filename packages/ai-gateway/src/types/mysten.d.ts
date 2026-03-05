/**
 * Type stubs for optional @mysten/* peer dependencies.
 * These modules are dynamically imported at runtime and only required
 * when the Seal Key Vault plugin is used. The stubs allow TypeScript
 * compilation without requiring the packages to be installed.
 */

declare module '@mysten/seal' {
  export class SealClient {
    constructor(config: any);
    encrypt(params: any): Promise<Uint8Array>;
    decrypt(params: any): Promise<Uint8Array>;
  }
}

declare module '@mysten/sui/client' {
  export class SuiClient {
    constructor(config: { url: string });
    getObject(params: any): Promise<any>;
    signAndExecuteTransaction(params: any): Promise<any>;
  }
}

declare module '@mysten/sui/transactions' {
  export class Transaction {
    setSender(address: string): void;
    pure: {
      vector(type: string, value: any): any;
      address(value: string): any;
    };
    moveCall(params: any): void;
    build(params: any): Promise<Uint8Array>;
  }
}

declare module '@mysten/sui/keypairs/ed25519' {
  export class Ed25519Keypair {
    static fromSecretKey(secret: string | Uint8Array): Ed25519Keypair;
    toSuiAddress(): string;
  }
}
