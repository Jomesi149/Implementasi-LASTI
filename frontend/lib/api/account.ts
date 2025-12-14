import { API_BASE_URL } from '../constants';
import type { AuthTokens, LoginPayload, LoginResponse, RegisterPayload, RegisterResponse, VerifyPayload } from '../types';

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit, revalidate = 0): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: revalidate === 0 ? 'no-store' : 'default',
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError((data?.message as string) ?? 'Unexpected error', response.status);
  }
  return data as T;
}

export const accountApi = {
  register(payload: RegisterPayload) {
    console.log('📤 Sending register payload:', payload);
    return request<RegisterResponse>('/account/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  login(payload: LoginPayload) {
    return request<LoginResponse>('/account/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  verify(payload: VerifyPayload) {
    return request<AuthTokens>('/account/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export type { ApiError };
