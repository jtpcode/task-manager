import { ApiError } from './apiError';
import type { Task, CreateTaskRequest, TaskEntry, CreateTaskEntryRequest, SummaryResponse } from '../types/api';

export const fetchTasks = async (token: string): Promise<Task[]> => {
  const response = await fetch('/api/tasks', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<Task[]>;
};

export const createTask = async (
  token: string,
  data: CreateTaskRequest,
): Promise<Task> => {
  const response = await fetch('/api/tasks', {
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

  return response.json() as Promise<Task>;
};

export const fetchTaskEntries = async (
  token: string,
  taskId: number,
): Promise<TaskEntry[]> => {
  const response = await fetch(`/api/tasks/${taskId}/task-entries`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<TaskEntry[]>;
};

export const createTaskEntry = async (
  token: string,
  taskId: number,
  data: CreateTaskEntryRequest,
): Promise<TaskEntry> => {
  const response = await fetch(`/api/tasks/${taskId}/task-entries`, {
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

  return response.json() as Promise<TaskEntry>;
};

export const fetchSummary = async (
  token: string,
  taskId: number,
): Promise<SummaryResponse> => {
  const response = await fetch(`/api/tasks/${taskId}/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<SummaryResponse>;
};
