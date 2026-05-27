export interface TaskResponse {
  id: number;
  title: string;
  status: 'OPEN' | 'CLOSED';
  totalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskEntryResponse {
  id: number;
  description: string;
  date: Date;
  minutes: number;
  taskId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SummaryResponse {
  summary: string;
}
