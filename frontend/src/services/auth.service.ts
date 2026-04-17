import { ApiError } from './apiError';
import type { LoginResponse } from '../types/api';

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return response.json() as Promise<LoginResponse>;
}
