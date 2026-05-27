import { ApiError } from './apiError';
import type { Task, CreateTaskRequest, TaskEntry, CreateTaskEntryRequest, SummaryResponse } from '../types/api';

export const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetch('/api/tasks', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<Task[]>;
};

export const createTask = async (
  data: CreateTaskRequest,
): Promise<Task> => {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<Task>;
};

export const fetchTaskEntries = async (
  taskId: number,
): Promise<TaskEntry[]> => {
  const response = await fetch(`/api/tasks/${taskId}/task-entries`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<TaskEntry[]>;
};

export const createTaskEntry = async (
  taskId: number,
  data: CreateTaskEntryRequest,
): Promise<TaskEntry> => {
  const response = await fetch(`/api/tasks/${taskId}/task-entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<TaskEntry>;
};

export const fetchSummary = async (
  taskId: number,
): Promise<SummaryResponse> => {
  const response = await fetch(`/api/tasks/${taskId}/summary`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<SummaryResponse>;
};
