import { API_BASE_URL } from '../constants';

export type AnalyticsData = {
  breakdown: Array<{ name: string; value: string }>;
  monthly: Array<{ month: string; income: string; expense: string }>;
};

export const analyticsApi = {
  getAnalytics(userId: string) {
    return fetch(`${API_BASE_URL}/analytics`, {
      headers: { 'X-User-ID': userId },
    }).then((res) => {
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json() as Promise<AnalyticsData>;
    });
  },
};