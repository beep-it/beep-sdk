import type { AxiosInstance } from 'axios';

export interface CurrentUserResponse {
  merchantId: string | null;
}

export class UserModule {
  constructor(private client: AxiosInstance) {}

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const { data } = await this.client.get('/v1/user');
    return data as CurrentUserResponse;
  }
}
