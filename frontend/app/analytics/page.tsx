'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { analyticsApi, type AnalyticsData } from '../../lib/api/analytics';
import { budgetsApi, type Budget } from '../../lib/api/budgets';
import { getUserIdFromToken } from '../../lib/auth';

const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#6b7280', '#10b981', '#3b82f6'];
const CATEGORY_ICONS: Record<string, string> = {
  'Transportasi': '🚗',
  'Makan': '🍔',
  'Hiburan': '🎮',
  'Lain-lain': '📦',
  'Gaji': '💼',
  'Bonus': '🎁',
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(v);
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const id = getUserIdFromToken();
    if (!id) {
      router.push('/login');
      return;
    }
    setUserId(id);
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    Promise.all([
      analyticsApi.getAnalytics(userId),
      budgetsApi.listBudgets(userId)
    ])
      .then(([analyticsData, budgetData]) => {
        setData(analyticsData);
        setBudgets(budgetData || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#374151' }}>Loading charts...</div>;
  
  const pieData = data?.breakdown?.map(d => ({ 
    ...d, 
    value: parseFloat(d.value),
    icon: CATEGORY_ICONS[d.name] || '📊'
  })) || [];

  const barData = data?.monthly?.map(d => ({
    ...d,
    income: parseFloat(d.income),
    expense: parseFloat(d.expense)
  })) || [];

  // Calculate total expense
  const totalExpense = pieData.reduce((acc, d) => acc + d.value, 0);

  // Budget vs Actual data
  const budgetVsActual = budgets.map(b => ({
    name: b.category_name,
    budget: parseFloat(b.amount),
    spent: parseFloat(b.spent),
    isOverBudget: parseFloat(b.spent) > parseFloat(b.amount),
    icon: CATEGORY_ICONS[b.category_name] || '📊'
  }));

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>📊 Analytics Pengeluaran</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/dashboard" style={{ 
            padding: '10px 20px', 
            background: '#3b82f6', 
            color: '#fff', 
            borderRadius: 8, 
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14
          }}>
            ← Dashboard
          </Link>
          <Link href="/budget" style={{ 
            padding: '10px 20px', 
            background: '#f59e0b', 
            color: '#fff', 
            borderRadius: 8, 
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14
          }}>
            💰 Atur Budget
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 20, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 14, color: '#991b1b', marginBottom: 8 }}>Total Pengeluaran</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(totalExpense)}</div>
        </div>
        <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 14, color: '#166534', marginBottom: 8 }}>Kategori Terbanyak</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
            {pieData.length > 0 ? `${pieData[0]?.icon || ''} ${pieData[0]?.name || '-'}` : '-'}
          </div>
        </div>
        <div style={{ padding: 20, background: '#fefce8', borderRadius: 12, border: '1px solid #fef08a' }}>
          <div style={{ fontSize: 14, color: '#854d0e', marginBottom: 8 }}>Budget Terlampaui</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ca8a04' }}>
            {budgetVsActual.filter(b => b.isOverBudget).length} kategori
          </div>
        </div>
      </div>

      {!data || pieData.length === 0 ? (
        <div style={{ 
          padding: '4rem', 
          textAlign: 'center', 
          background: '#f9fafb', 
          borderRadius: 16, 
          border: '2px dashed #e5e7eb' 
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3 style={{ color: '#374151', marginBottom: 8 }}>Belum Ada Data</h3>
          <p style={{ color: '#6b7280' }}>Tambahkan transaksi pengeluaran untuk melihat analytics</p>
          <Link href="/dashboard" style={{ 
            display: 'inline-block',
            marginTop: 16,
            padding: '12px 24px', 
            background: '#3b82f6', 
            color: '#fff', 
            borderRadius: 8, 
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Tambah Transaksi
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
          {/* PIE CHART - Expense Breakdown */}
          <div style={{ 
            background: 'white', 
            padding: 24, 
            borderRadius: 16, 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb' 
          }}>
            <h3 style={{ marginBottom: 20, fontWeight: 600, color: '#1f2937', fontSize: 18 }}>
              🥧 Breakdown Pengeluaran per Kategori
            </h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent > 0.05 ? `${CATEGORY_ICONS[name] || ''} ${Math.round(percent * 100)}%` : ''}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)} 
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                  />
                  <Legend 
                    formatter={(value) => `${CATEGORY_ICONS[value] || ''} ${value}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BAR CHART - Income vs Expense Monthly */}
          <div style={{ 
            background: 'white', 
            padding: 24, 
            borderRadius: 16, 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb' 
          }}>
            <h3 style={{ marginBottom: 20, fontWeight: 600, color: '#1f2937', fontSize: 18 }}>
              📈 Pemasukan vs Pengeluaran Bulanan
            </h3>
            <div style={{ height: 300 }}>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" style={{ fontSize: 12 }} tick={{ fill: '#6b7280' }} />
                    <YAxis style={{ fontSize: 12 }} tick={{ fill: '#6b7280' }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}jt`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)} 
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#22c55e" name="Pemasukan" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" name="Pengeluaran" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
                  Belum ada data bulanan
                </div>
              )}
            </div>
          </div>

          {/* BAR CHART - Budget vs Actual */}
          {budgetVsActual.length > 0 && (
            <div style={{ 
              gridColumn: '1 / -1',
              background: 'white', 
              padding: 24, 
              borderRadius: 16, 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
              border: '1px solid #e5e7eb' 
            }}>
              <h3 style={{ marginBottom: 20, fontWeight: 600, color: '#1f2937', fontSize: 18 }}>
                📊 Budget vs Pengeluaran Aktual
              </h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetVsActual} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fill: '#6b7280' }} tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120} 
                      tick={{ fill: '#374151' }}
                      tickFormatter={(value) => `${CATEGORY_ICONS[value] || ''} ${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)} 
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                    />
                    <Legend />
                    <Bar dataKey="budget" fill="#3b82f6" name="Budget" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="spent" fill="#ef4444" name="Terpakai" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Over Budget Alerts */}
              {budgetVsActual.filter(b => b.isOverBudget).length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ color: '#dc2626', marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
                    ⚠️ Peringatan: Budget Terlampaui
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {budgetVsActual.filter(b => b.isOverBudget).map(b => (
                      <div key={b.name} style={{ 
                        padding: '12px 16px', 
                        background: '#fef2f2', 
                        borderRadius: 8, 
                        border: '1px solid #fecaca' 
                      }}>
                        <div style={{ fontWeight: 600, color: '#991b1b' }}>
                          {b.icon} {b.name}
                        </div>
                        <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 4 }}>
                          {formatCurrency(b.spent)} / {formatCurrency(b.budget)} 
                          <span style={{ marginLeft: 8, fontWeight: 700 }}>
                            (+{Math.round(((b.spent - b.budget) / b.budget) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Category Breakdown Table */}
          <div style={{ 
            gridColumn: '1 / -1',
            background: 'white', 
            padding: 24, 
            borderRadius: 16, 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb' 
          }}>
            <h3 style={{ marginBottom: 20, fontWeight: 600, color: '#1f2937', fontSize: 18 }}>
              📋 Detail Pengeluaran per Kategori
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e5e7eb', color: '#374151' }}>Kategori</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '2px solid #e5e7eb', color: '#374151' }}>Jumlah</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '2px solid #e5e7eb', color: '#374151' }}>Persentase</th>
                </tr>
              </thead>
              <tbody>
                {pieData.map((d, i) => (
                  <tr key={d.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', color: '#1f2937' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        background: COLORS[i % COLORS.length],
                        marginRight: 8
                      }}></span>
                      {CATEGORY_ICONS[d.name] || ''} {d.name}
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 16px', color: '#ef4444', fontWeight: 600 }}>
                      {formatCurrency(d.value)}
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 16px', color: '#6b7280' }}>
                      {totalExpense > 0 ? Math.round((d.value / totalExpense) * 100) : 0}%
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#f9fafb', fontWeight: 600 }}>
                  <td style={{ padding: '12px 16px', color: '#1f2937' }}>Total</td>
                  <td style={{ textAlign: 'right', padding: '12px 16px', color: '#dc2626' }}>{formatCurrency(totalExpense)}</td>
                  <td style={{ textAlign: 'right', padding: '12px 16px', color: '#374151' }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}