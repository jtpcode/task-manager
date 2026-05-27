export interface SummaryResponse {
  summary: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface CreateTaskRequest {
  title: string;
  status?: 'OPEN' | 'CLOSED';
}

export interface CreateTaskEntryRequest {
  description: string;
  minutes: number;
  date?: string;
}

export interface Task {
  id: number;
  title: string;
  status: 'OPEN' | 'CLOSED';
  totalMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskEntry {
  id: number;
  description: string;
  date: string;
  minutes: number;
  taskId: number;
  createdAt: string;
  updatedAt: string;
}
