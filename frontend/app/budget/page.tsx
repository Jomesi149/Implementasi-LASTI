// frontend/app/budget/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { budgetsApi, type Budget } from '../../lib/api/budgets';
import { transactionsApi } from '../../lib/api/transactions';
import { BudgetCard } from '../../components/BudgetCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { InputField } from '../../components/InputField';
import { AuthShell } from '../../components/AuthShell'; // Pinjam style shell kalau mau, atau div biasa

export default function BudgetPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // State Form
  const [selectedCat, setSelectedCat] = useState('');
  const [amount, setAmount] = useState('');

  // 1. Ambil User ID dari LocalStorage (Hasil fix login kemarin)
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (!id) {
      router.push('/login');
      return;
    }
    setUserId(id);
    loadData(id);
  }, [router]);

  async function loadData(uid: string) {
    setLoading(true);
    try {
      // Load budgets & categories paralel biar cepet
      const [bData, cData] = await Promise.all([
        budgetsApi.listBudgets(uid),
        transactionsApi.listCategories(uid)
      ]);
      setBudgets(bData);
      setCategories(cData);
      if (cData.length > 0) setSelectedCat(cData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetBudget(e: React.FormEvent) {
    e.preventDefault();
    try {
      await budgetsApi.setBudget(userId, {
        category_id: selectedCat,
        amount: amount
      });
      setShowModal(false);
      setAmount('');
      loadData(userId); // Refresh list
    } catch (err) {
      alert('Gagal simpan budget');
    }
  }

  if (!userId) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Budgeting</h1>
          <p style={{ color: '#64748b' }}>Atur batas pengeluaran bulananmu.</p>
        </div>
        <PrimaryButton onClick={() => setShowModal(true)} style={{ width: 'auto', padding: '0.8rem 1.5rem' }}>
          + Atur Budget
        </PrimaryButton>
      </div>

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {budgets.length === 0 ? (
            <p>Belum ada budget yang diatur.</p>
          ) : (
            budgets.map((b) => <BudgetCard key={b.id} budget={b} />)
          )}
        </div>
      )}

      {/* Modal Form Sederhana */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50
        }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Set Budget Target</h2>
            <form onSubmit={handleSetBudget} className="form-grid">
              
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontWeight: 600 }}>
                Kategori
                <select 
                  value={selectedCat} 
                  onChange={(e) => setSelectedCat(e.target.value)}
                  style={{
                    padding: '0.8rem', borderRadius: '12px', border: '1.5px solid #e2e8f0',
                    fontSize: '1rem'
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <InputField 
                label="Batas Nominal (Rp)" 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="Contoh: 1000000"
              />

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: 600 }}
                >
                  Batal
                </button>
                <PrimaryButton type="submit" style={{ flex: 1 }}>Simpan</PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}