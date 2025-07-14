import { AxiosInstance } from 'axios';

// Represents a Privy wallet
export interface PrivyWallet {
  id: string;
  address: string;
  chainType: string;
}

export class WalletsModule {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Creates a new pre-authorized wallet for the user.
   * @returns A promise that resolves to the new wallet's details.
   */
  async create(): Promise<PrivyWallet> {
    const response = await this.client.post<PrivyWallet>('/wallets');
    return response.data;
  }

  /**
   * Lists all wallets for the authenticated user.
   * @returns A promise that resolves to an array of wallets.
   */
  async list(): Promise<PrivyWallet[]> {
    const response = await this.client.get<PrivyWallet[]>('/wallets');
    return response.data;
  }

  /**
   * Deletes a wallet by its ID.
   * @param walletId The ID of the wallet to delete.
   */
  async delete(walletId: string): Promise<void> {
    await this.client.delete(`/wallets/${walletId}`);
  }
}
