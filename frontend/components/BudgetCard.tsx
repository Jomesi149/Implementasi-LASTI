// frontend/components/BudgetCard.tsx
import React from 'react';
import type { Budget } from '../lib/api/budgets';

// Helper format duit
const formatCurrency = (val: string) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseFloat(val));
};

export function BudgetCard({ budget }: { budget: Budget }) {
  const limit = parseFloat(budget.amount);
  const spent = parseFloat(budget.spent);
  
  // Hitung persentase
  // Kalau limit 0 (error case), anggap 100% biar ga bagi nol
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  
  // Logika Warna Phase 3:
  // < 50% = Hijau
  // > 75% = Kuning
  // > 90% = Merah
  let color = '#22c55e'; // Green-500
  if (percentage > 90) color = '#ef4444'; // Red-500
  else if (percentage > 75) color = '#eab308'; // Yellow-500

  // Cap width max 100% biar bar-nya ga tembus layar kalau overbudget
  const barWidth = Math.min(percentage, 100);

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '20px',
      background: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{budget.category_name}</h3>
        <span style={{ fontWeight: 'bold', color: percentage > 100 ? '#ef4444' : '#64748b' }}>
          {percentage.toFixed(0)}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          width: `${barWidth}%`,
          height: '100%',
          background: color,
          transition: 'width 0.5s ease-in-out'
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.9rem', color: '#64748b' }}>
        <span>Terpakai: {formatCurrency(budget.spent)}</span>
        <span>Limit: {formatCurrency(budget.amount)}</span>
      </div>
    </div>
  );
}