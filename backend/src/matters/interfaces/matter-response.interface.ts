export interface MatterResponse {
  id: number;
  title: string;
  clientName: string;
  status: 'OPEN' | 'CLOSED';
  totalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntryResponse {
  id: number;
  description: string;
  date: Date;
  minutes: number;
  matterId: number;
  createdAt: Date;
  updatedAt: Date;
}
