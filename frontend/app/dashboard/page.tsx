"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { transactionsApi } from '../../lib/api/transactions';
import type { Wallet, Transaction, CreateTransactionPayload } from '../../lib/types';
import { getUserIdFromToken } from '../../lib/auth';

function formatCurrency(v: string) {
  const n = parseFloat(v || '0');
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);
}

export default function DashboardPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [userId, setUserId] = useState<string>('');

  // Initialize userId from JWT token on mount
  useEffect(() => {
    const id = getUserIdFromToken();
    console.log('🔑 Initializing userId from token:', id);
    if (!id) {
      console.warn('❌ No user ID found in token, redirecting to login');
      router.push('/login');
      return;
    }
    setUserId(id);
  }, [router]);

  useEffect(() => {
    async function load() {
      if (!userId) {
        console.log('⚠️ Waiting for userId... Current:', userId);
        return; // Skip load until userId is available
      }

      console.log('📊 Dashboard loading with userId:', userId);
      setLoading(true);
      try {
        // Fetch wallets (sudah ada dari register)
        console.log('🔄 Calling listWallets API with userId:', userId);
        const w = await transactionsApi.listWallets(userId);
        console.log('✅ Wallets API response:', w);
        
        if (!w || w.length === 0) {
          console.error('❌ No wallets found for user:', userId);
          console.error('   Response was:', w);
        } else {
          console.log('✅ Found', w.length, 'wallet(s) for user:', userId);
          console.log('   First wallet:', w[0]);
        }
        
        setWallets(w || []);
        
        // Fetch transactions dengan userId
        console.log('🔄 Calling listTransactions API with userId:', userId);
        const t = await transactionsApi.listTransactions(50, userId);
        console.log('✅ Transactions API response:', t);
        setTransactions(t || []);
      } catch (err) {
        console.error('❌ Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const total = wallets.reduce((acc, w) => acc + parseFloat(w.balance || '0'), 0);
  
  // Calculate total income and expense
  const totalIncome = transactions
    .filter(t => t.kind === 'in')
    .reduce((acc, t) => acc + parseFloat(t.amount || '0'), 0);
  
  const totalExpense = transactions
    .filter(t => t.kind === 'out')
    .reduce((acc, t) => acc + parseFloat(t.amount || '0'), 0);

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#ffffff' }}>
      <h1 style={{ color: '#1a1a1a', marginBottom: 24 }}>Dashboard</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <div style={{ padding: 20, border: '2px solid #e5e7eb', borderRadius: 12, background: '#f9fafb', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Current Balance</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a' }}>{formatCurrency(String(total))}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Total Income</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>+{formatCurrency(String(totalIncome))}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Total Expense</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#ef4444' }}>-{formatCurrency(String(totalExpense))}</div>
          </div>
        </div>
        <div>
          <button 
            onClick={() => setShow(true)}
            style={{ 
              padding: '12px 24px', 
              background: '#3b82f6', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8, 
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Add Transaction
          </button>
        </div>
      </div>

      <h2 style={{ color: '#1a1a1a', marginBottom: 16, fontSize: 20 }}>Recent Transactions</h2>
      {loading ? (
        <div style={{ color: '#6b7280' }}>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 16px', color: '#374151', fontWeight: 600 }}>When</th>
              <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 16px', color: '#374151', fontWeight: 600 }}>Amount</th>
              <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 16px', color: '#374151', fontWeight: 600 }}>Kind</th>
              <th style={{ textAlign: 'left', borderBottom: '2px solid #e5e7eb', padding: '12px 16px', color: '#374151', fontWeight: 600 }}>Note</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', color: '#1f2937' }}>{new Date(t.occurred_at).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', color: t.kind === 'in' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                  {t.kind === 'in' ? '+' : '-'}{formatCurrency(t.amount)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: 12, 
                    fontSize: 12,
                    fontWeight: 600,
                    background: t.kind === 'in' ? '#d1fae5' : '#fee2e2',
                    color: t.kind === 'in' ? '#065f46' : '#991b1b'
                  }}>
                    {t.kind === 'in' ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{t.note ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {show && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            background: '#fff', 
            padding: 32, 
            borderRadius: 12, 
            width: '90%', 
            maxWidth: 500,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}>
            <TransactionForm
              wallets={wallets}
              onClose={() => setShow(false)}
              onCreated={async (t) => {
                setTransactions(prev => [t, ...prev]);
                // Refetch wallets to update balance
                try {
                  const w = await transactionsApi.listWallets(userId);
                  setWallets(w || []);
                } catch (err) {
                  console.error('Failed to refetch wallets after transaction:', err);
                }
              }}
              userId={userId}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionForm({ wallets, onClose, onCreated, userId }: { wallets: Wallet[]; onClose: () => void; onCreated: (t: Transaction) => void; userId: string }) {
  // Menggunakan wallet pertama user secara otomatis (1 user = 1 wallet)
  const walletId = wallets[0]?.id ?? '';
  const [amount, setAmount] = useState('0');
  const [kind, setKind] = useState<'in'|'out'>('out');
  const [note, setNote] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!walletId) {
      console.error('No wallet found. Wallets:', wallets);
      alert('Wallet tidak ditemukan. Silakan refresh dan pastikan wallet sudah terbuat saat register.');
      return;
    }
    console.log('💰 Creating transaction with wallet:', walletId, 'amount:', amount, 'kind:', kind);
    const payload: CreateTransactionPayload = {
      userId,
      wallet_id: walletId,
      amount,
      kind,
      note: note || null,
    };
    try {
      console.log('💰 Sending payload:', payload);
      const created = await transactionsApi.createTransaction(payload as any);
      console.log('✅ Transaction created:', created);
      onCreated(created);
      onClose();
      // Reset form
      setAmount('0');
      setNote('');
    } catch (err) {
      console.error('❌ Create transaction error:', err);
      alert('Gagal menambahkan transaksi: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <form onSubmit={submit} style={{ width: '100%' }}>
      <h2 style={{ marginTop: 0, marginBottom: 24, color: '#1f2937', fontSize: 20, fontWeight: 600 }}>Tambah Transaksi</h2>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, color: '#374151', fontWeight: 500, fontSize: 14 }}>Jumlah (Rp)</label>
        <input 
          type="number"
          value={amount} 
          onChange={e => setAmount(e.target.value)}
          required
          min="0"
          step="1"
          style={{ 
            width: '100%', 
            padding: '10px 12px', 
            border: '2px solid #e5e7eb', 
            borderRadius: 8,
            fontSize: 14,
            color: '#1f2937',
            outline: 'none'
          }}
          placeholder="0"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, color: '#374151', fontWeight: 500, fontSize: 14 }}>Tipe Transaksi</label>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '10px 16px', 
            border: '2px solid ' + (kind === 'in' ? '#10b981' : '#e5e7eb'), 
            borderRadius: 8, 
            cursor: 'pointer', 
            background: kind === 'in' ? '#d1fae5' : '#fff',
            transition: 'all 0.2s'
          }}>
            <input 
              type="radio" 
              value="in" 
              checked={kind === 'in'} 
              onChange={e => setKind('in')}
              style={{ marginRight: 8 }}
            />
            <span style={{ color: kind === 'in' ? '#065f46' : '#6b7280', fontWeight: 500 }}>Pemasukan</span>
          </label>
          <label style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '10px 16px', 
            border: '2px solid ' + (kind === 'out' ? '#ef4444' : '#e5e7eb'), 
            borderRadius: 8, 
            cursor: 'pointer', 
            background: kind === 'out' ? '#fee2e2' : '#fff',
            transition: 'all 0.2s'
          }}>
            <input 
              type="radio" 
              value="out" 
              checked={kind === 'out'} 
              onChange={e => setKind('out')}
              style={{ marginRight: 8 }}
            />
            <span style={{ color: kind === 'out' ? '#991b1b' : '#6b7280', fontWeight: 500 }}>Pengeluaran</span>
          </label>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 8, color: '#374151', fontWeight: 500, fontSize: 14 }}>Catatan (opsional)</label>
        <input 
          type="text"
          value={note} 
          onChange={e => setNote(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '10px 12px', 
            border: '2px solid #e5e7eb', 
            borderRadius: 8,
            fontSize: 14,
            color: '#1f2937',
            outline: 'none'
          }}
          placeholder="Tambahkan catatan..."
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          type="button" 
          onClick={onClose}
          style={{ 
            flex: 1,
            padding: '12px 24px', 
            background: '#fff', 
            color: '#374151', 
            border: '2px solid #e5e7eb', 
            borderRadius: 8, 
            cursor: 'pointer', 
            fontWeight: 600, 
            fontSize: 14 
          }}
        >
          Batal
        </button>
        <button 
          type="submit"
          style={{ 
            flex: 1,
            padding: '12px 24px', 
            background: '#3b82f6', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 8, 
            cursor: 'pointer', 
            fontWeight: 600, 
            fontSize: 14 
          }}
        >
          Simpan
        </button>
      </div>
    </form>
  );
}
