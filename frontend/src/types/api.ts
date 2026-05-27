export interface SummaryResponse {
  summary: string;
}

export interface AuthResponse {
  email: string;
}

export interface AuthMeResponse {
  email: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
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
