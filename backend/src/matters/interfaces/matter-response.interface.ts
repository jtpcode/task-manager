export interface MatterResponse {
  id: number;
  title: string;
  clientName: string;
  status: 'OPEN' | 'CLOSED';
  totalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}
