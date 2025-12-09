import { API_BASE_URL } from '../constants';
import type { Wallet, Category, Transaction, CreateTransactionPayload } from '../types';

async function request<T>(path: string, options: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message || 'api error');
  }
  return (await res.json()) as T;
}

export const transactionsApi = {
  listTransactions(limit = 50) {
    return request<Transaction[]>(`/transactions?limit=${limit}`, { method: 'GET' });
  },
  createTransaction(payload: CreateTransactionPayload) {
    return request<Transaction>(`/transactions`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json', 'X-User-ID': payload.userId },
    });
  },
  listWallets(userId: string) {
    return fetch(`${API_BASE_URL}/wallets`, { headers: { 'X-User-ID': userId } }).then(r => r.json() as Promise<Wallet[]>);
  },
  listCategories(userId: string) {
    return fetch(`${API_BASE_URL}/categories`, { headers: { 'X-User-ID': userId } }).then(r => r.json() as Promise<Category[]>);
  }
};
