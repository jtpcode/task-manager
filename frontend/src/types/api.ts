export interface LoginResponse {
  access_token: string;
}

export interface Matter {
  id: number;
  title: string;
  clientName: string;
  status: 'OPEN' | 'CLOSED';
  totalMinutes: number;
  createdAt: string;
  updatedAt: string;
}
