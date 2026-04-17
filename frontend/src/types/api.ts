export interface SummaryResponse {
  summary: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface CreateMatterRequest {
  title: string;
  clientName: string;
  status?: 'OPEN' | 'CLOSED';
}

export interface CreateTimeEntryRequest {
  description: string;
  minutes: number;
  date?: string;
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

export interface TimeEntry {
  id: number;
  description: string;
  date: string;
  minutes: number;
  matterId: number;
  createdAt: string;
  updatedAt: string;
}
