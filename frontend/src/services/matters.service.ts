import { ApiError } from './apiError';
import type { Matter, CreateMatterRequest, TimeEntry, CreateTimeEntryRequest, SummaryResponse } from '../types/api';

export const fetchMatters = async (token: string): Promise<Matter[]> => {
  const response = await fetch('/api/matters', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<Matter[]>;
};

export const createMatter = async (
  token: string,
  data: CreateMatterRequest,
): Promise<Matter> => {
  const response = await fetch('/api/matters', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<Matter>;
};

export const fetchTimeEntries = async (
  token: string,
  matterId: number,
): Promise<TimeEntry[]> => {
  const response = await fetch(`/api/matters/${matterId}/time-entries`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<TimeEntry[]>;
};

export const createTimeEntry = async (
  token: string,
  matterId: number,
  data: CreateTimeEntryRequest,
): Promise<TimeEntry> => {
  const response = await fetch(`/api/matters/${matterId}/time-entries`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<TimeEntry>;
};

export const fetchSummary = async (
  token: string,
  matterId: number,
): Promise<SummaryResponse> => {
  const response = await fetch(`/api/matters/${matterId}/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<SummaryResponse>;
};
