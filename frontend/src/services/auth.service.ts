import { ApiError } from './apiError';
import type { AuthResponse, AuthMeResponse } from '../types/api';

export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<AuthResponse>;
};

export const register = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<AuthResponse>;
};

export const checkAuth = async (): Promise<AuthMeResponse> => {
  const response = await fetch('/api/auth/me', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<AuthMeResponse>;
};

export const logout = async (): Promise<void> => {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
};
