import { API_BASE_URL } from '../constants';
import type { Wallet, Category, Transaction, CreateTransactionPayload } from '../types';

async function request<T>(path: string, options: RequestInit) {
  const url = `${API_BASE_URL}${path}`;
  console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`, options.headers);
  
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    console.error(`❌ API Error: ${res.status}`, json?.message || 'api error');
    throw new Error(json?.message || 'api error');
  }
  const data = await res.json() as T;
  console.log(`✅ API Response:`, data);
  return data;
}

export const transactionsApi = {
  listTransactions(limit = 50, userId: string) {
    return request<Transaction[]>(`/transactions?limit=${limit}`, { 
      method: 'GET',
      headers: { 'X-User-ID': userId }
    });
  },
  createTransaction(payload: CreateTransactionPayload) {
    return request<Transaction>(`/transactions`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json', 'X-User-ID': payload.userId },
    });
  },
  listWallets(userId: string) {
    return request<Wallet[]>(`/wallets`, { 
      method: 'GET',
      headers: { 'X-User-ID': userId } 
    });
  },
  listCategories(userId: string) {
    return request<Category[]>(`/categories`, { 
      method: 'GET',
      headers: { 'X-User-ID': userId } 
    });
  }
};
