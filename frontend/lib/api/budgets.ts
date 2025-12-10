// frontend/lib/api/budgets.ts
import { API_BASE_URL } from '../constants';

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  amount: string; // Limit budget
  spent: string;  // Terpakai bulan ini
  created_at: string;
};

export type SetBudgetPayload = {
  category_id: string;
  amount: string;
};

async function request<T>(path: string, options: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message || 'api error');
  }
  return (await res.json()) as T;
}

export const budgetsApi = {
  listBudgets(userId: string) {
    return request<Budget[]>('/budgets', {
      method: 'GET',
      headers: { 'X-User-ID': userId },
    });
  },
  setBudget(userId: string, payload: SetBudgetPayload) {
    return request<any>('/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'X-User-ID': userId },
    });
  },
};