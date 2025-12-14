// frontend/app/budget/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { budgetsApi, type Budget } from '../../lib/api/budgets';
import { transactionsApi } from '../../lib/api/transactions';
import { BudgetCard } from '../../components/BudgetCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { InputField } from '../../components/InputField';
import { getUserIdFromToken } from '../../lib/auth';
import type { Category } from '../../lib/types';

const CATEGORY_ICONS: Record<string, string> = {
  'Transportasi': '🚗',
  'Makan': '🍔',
  'Hiburan': '🎮',
  'Lain-lain': '📦',
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(v);
}

export default function BudgetPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // State Form
  const [selectedCat, setSelectedCat] = useState('');
  const [amount, setAmount] = useState('');
  const [userId, setUserId] = useState('');

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
    loadData(userId);
  }, [userId]);

  async function loadData(uid: string) {
    setLoading(true);
    try {
      // Fetch categories first (required)
      const cData = await transactionsApi.listCategories(uid);
      console.log('📦 All categories from API:', cData);
      
      // Fetch budgets (optional - may fail if table doesn't exist)
      let bData: Budget[] = [];
      try {
        bData = await budgetsApi.listBudgets(uid);
      } catch (budgetErr) {
        console.warn('⚠️ Budget API error (table may not exist):', budgetErr);
        // Continue anyway - budgets are optional
      }
      setBudgets(bData || []);
      // Filter only expense categories for budgeting
      // Support multiple formats: 'out', 'expense', 'pengeluaran'
      const expenseCategories = (cData || []).filter((c: Category) => 
        c.kind === 'out' || c.kind === 'expense' || c.kind === 'pengeluaran'
      );
      console.log('💸 Filtered expense categories:', expenseCategories);
      
      // If still no expense categories, show all categories as fallback
      if (expenseCategories.length === 0 && cData && cData.length > 0) {
        console.log('⚠️ No expense categories found, showing all categories');
        setCategories(cData);
        setSelectedCat(cData[0].id);
      } else {
        setCategories(expenseCategories);
        if (expenseCategories.length > 0) {
          setSelectedCat(expenseCategories[0].id);
        }
      }
    } catch (err) {
      console.error('❌ Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCat || !amount) {
      alert('Pilih kategori dan masukkan nominal');
      return;
    }
    if (categories.length === 0) {
      alert('Tidak ada kategori tersedia. Silakan tambah transaksi terlebih dahulu.');
      return;
    }
    try {
      await budgetsApi.setBudget(userId, {
        category_id: selectedCat,
        amount: amount
      });
      setShowModal(false);
      setAmount('');
      loadData(userId);
    } catch (err) {
      alert('Gagal simpan budget');
    }
  }

  if (!userId) return null;

  // Calculate totals
  const totalBudget = budgets.reduce((acc, b) => acc + parseFloat(b.amount), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + parseFloat(b.spent), 0);
  const overBudgetCount = budgets.filter(b => parseFloat(b.spent) > parseFloat(b.amount)).length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>💰 Pengaturan Budget</h1>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Atur batas pengeluaran bulanan per kategori</p>
        </div>
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
          <Link href="/analytics" style={{ 
            padding: '10px 20px', 
            background: '#8b5cf6', 
            color: '#fff', 
            borderRadius: 8, 
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14
          }}>
            📊 Analytics
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 20, background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 14, color: '#1e40af', marginBottom: 8 }}>Total Budget</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>{formatCurrency(totalBudget)}</div>
        </div>
        <div style={{ padding: 20, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 14, color: '#991b1b', marginBottom: 8 }}>Total Terpakai</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>{formatCurrency(totalSpent)}</div>
        </div>
        <div style={{ padding: 20, background: totalSpent <= totalBudget ? '#f0fdf4' : '#fefce8', borderRadius: 12, border: `1px solid ${totalSpent <= totalBudget ? '#bbf7d0' : '#fef08a'}` }}>
          <div style={{ fontSize: 14, color: totalSpent <= totalBudget ? '#166534' : '#854d0e', marginBottom: 8 }}>
            {overBudgetCount > 0 ? '⚠️ Terlampaui' : '✅ Status'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: totalSpent <= totalBudget ? '#16a34a' : '#ca8a04' }}>
            {overBudgetCount > 0 ? `${overBudgetCount} kategori` : 'Aman'}
          </div>
        </div>
      </div>

      {/* Add Budget Button */}
      <div style={{ marginBottom: 24 }}>
        {categories.length === 0 ? (
          <div style={{ 
            padding: 16, 
            background: '#fefce8', 
            border: '1px solid #fef08a', 
            borderRadius: 8,
            color: '#854d0e'
          }}>
            ⚠️ Belum ada kategori pengeluaran. Silakan <Link href="/dashboard" style={{ color: '#d97706', fontWeight: 600 }}>tambah transaksi</Link> terlebih dahulu untuk membuat kategori.
          </div>
        ) : (
          <button 
            onClick={() => setShowModal(true)}
            style={{ 
              padding: '12px 24px', 
              background: '#f59e0b', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8, 
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            + Atur Budget Kategori
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading data...</div>
      ) : budgets.length === 0 ? (
        <div style={{ 
          padding: '4rem', 
          textAlign: 'center', 
          background: '#f9fafb', 
          borderRadius: 16, 
          border: '2px dashed #e5e7eb' 
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
          <h3 style={{ color: '#374151', marginBottom: 8 }}>Belum Ada Budget</h3>
          <p style={{ color: '#6b7280' }}>Klik tombol "Atur Budget Kategori" untuk mulai mengatur batas pengeluaran</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {budgets.map((b) => {
            const spent = parseFloat(b.spent);
            const budget = parseFloat(b.amount);
            const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const isOver = spent > budget;
            
            return (
              <div key={b.id} style={{ 
                padding: 20, 
                background: '#fff', 
                borderRadius: 12, 
                border: `2px solid ${isOver ? '#fecaca' : '#e5e7eb'}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, color: '#1f2937', fontSize: 16 }}>
                    {CATEGORY_ICONS[b.category_name] || '📦'} {b.category_name}
                  </div>
                  {isOver && (
                    <span style={{ 
                      padding: '4px 8px', 
                      background: '#fef2f2', 
                      color: '#dc2626', 
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      ⚠️ OVER
                    </span>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div style={{ 
                  height: 8, 
                  background: '#f3f4f6', 
                  borderRadius: 4, 
                  marginBottom: 12,
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min(percent, 100)}%`,
                    background: isOver ? '#ef4444' : percent > 80 ? '#f59e0b' : '#22c55e',
                    borderRadius: 4,
                    transition: 'width 0.3s'
                  }}></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <div>
                    <span style={{ color: '#6b7280' }}>Terpakai: </span>
                    <span style={{ fontWeight: 600, color: isOver ? '#dc2626' : '#374151' }}>
                      {formatCurrency(spent)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Budget: </span>
                    <span style={{ fontWeight: 600, color: '#374151' }}>
                      {formatCurrency(budget)}
                    </span>
                  </div>
                </div>
                
                <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
                  {isOver 
                    ? `Melebihi ${formatCurrency(spent - budget)} (${Math.round(((spent - budget) / budget) * 100)}%)`
                    : `Sisa ${formatCurrency(budget - spent)} (${Math.round(100 - percent)}%)`
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50
        }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 16, width: '90%', maxWidth: 400 }}>
            <h2 style={{ marginTop: 0, marginBottom: 24, color: '#1f2937', fontSize: 20 }}>Atur Budget Kategori</h2>
            <form onSubmit={handleSetBudget}>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Kategori Pengeluaran
                </label>
                <select 
                  value={selectedCat} 
                  onChange={(e) => setSelectedCat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px', 
                    borderRadius: 8, 
                    border: '2px solid #e5e7eb',
                    fontSize: 14,
                    color: '#1f2937',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {CATEGORY_ICONS[c.name] || '📦'} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151', fontSize: 14 }}>
                  Batas Budget (Rp)
                </label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="Contoh: 500000"
                  min="0"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px', 
                    borderRadius: 8, 
                    border: '2px solid #e5e7eb',
                    fontSize: 14,
                    color: '#1f2937'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ 
                    flex: 1, 
                    padding: '12px 24px', 
                    borderRadius: 8, 
                    border: '2px solid #e5e7eb', 
                    background: '#fff', 
                    cursor: 'pointer', 
                    fontWeight: 600,
                    color: '#374151'
                  }}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  style={{ 
                    flex: 1, 
                    padding: '12px 24px', 
                    borderRadius: 8, 
                    border: 'none', 
                    background: '#f59e0b', 
                    color: '#fff',
                    cursor: 'pointer', 
                    fontWeight: 600
                  }}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}