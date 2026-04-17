import { ApiError } from './apiError';
import type { Matter } from '../types/api';

export const fetchMatters = async (token: string): Promise<Matter[]> => {
  const response = await fetch('/api/matters', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<Matter[]>;
}
