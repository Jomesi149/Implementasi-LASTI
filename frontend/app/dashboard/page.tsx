"use client";

import React, { useEffect, useState } from 'react';
import { transactionsApi } from '../../lib/api/transactions';
import type { Wallet, Transaction, CreateTransactionPayload } from '../../lib/types';

function formatCurrency(v: string) {
  const n = parseFloat(v || '0');
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function DashboardPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  const userId = '00000000-0000-0000-0000-000000000001'; // replace with real user id from auth

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const w = await transactionsApi.listWallets(userId);
        setWallets(w);
        const t = await transactionsApi.listTransactions(50);
        setTransactions(t);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const total = wallets.reduce((acc, w) => acc + parseFloat(w.balance || '0'), 0);
 

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <div>Current Balance</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(String(total))}</div>
        </div>
        <div>
          <button onClick={() => setShow(true)}>Add Transaction</button>
        </div>
      </div>

      <h2>Recent Transactions</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>When</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>Amount</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>Kind</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>Note</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td style={{ padding: '8px 0' }}>{new Date(t.occurred_at).toLocaleString()}</td>
                <td style={{ padding: '8px 0' }}>{formatCurrency(t.amount)}</td>
                <td style={{ padding: '8px 0' }}>{t.kind}</td>
                <td style={{ padding: '8px 0' }}>{t.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 320 }}>
            <TransactionForm
              wallets={wallets}
              onClose={() => setShow(false)}
              onCreated={t => setTransactions(prev => [t, ...prev])}
              userId={userId}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionForm({ wallets, onClose, onCreated, userId }: { wallets: Wallet[]; onClose: () => void; onCreated: (t: Transaction) => void; userId: string }) {
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? '');
  const [amount, setAmount] = useState('0');
  const [kind, setKind] = useState<'in'|'out'>('out');
  const [note, setNote] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: CreateTransactionPayload = {
      userId,
      wallet_id: walletId,
      amount,
      kind,
      note: note || null,
    };
    try {
      const created = await transactionsApi.createTransaction(payload as any);
      onCreated(created);
      onClose();
    } catch (err) {
      console.error(err);
      alert('failed');
    }
  }

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 8 }}>
        <label>Wallet</label>
        <select value={walletId} onChange={e => setWalletId(e.target.value)}>
          {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Amount</label>
        <input value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Kind</label>
        <select value={kind} onChange={e => setKind(e.target.value as 'in'|'out')}>
          <option value="in">In</option>
          <option value="out">Out</option>
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Note</label>
        <input value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit">Create</button>
      </div>
    </form>
  );
}
"use client";

import React, { useEffect, useState } from 'react';
import { transactionsApi } from '../../lib/api/transactions';
import type { Wallet, Transaction, CreateTransactionPayload } from '../../lib/types';

function formatCurrency(v: string) {
  const n = parseFloat(v || '0');
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function DashboardPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  const userId = '00000000-0000-0000-0000-000000000001'; // replace with real user id from auth

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const w = await transactionsApi.listWallets(userId);
        setWallets(w);
        const t = await transactionsApi.listTransactions(50);
        setTransactions(t);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const total = wallets.reduce((acc, w) => acc + parseFloat(w.balance || '0'), 0);

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <div>Current Balance</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(String(total))}</div>
        </div>
        <div>
          <button onClick={() => setShow(true)}>Add Transaction</button>
        </div>
      </div>

      <h2>Recent Transactions</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>When</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>Amount</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>Kind</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>Note</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td style={{ padding: '8px 0' }}>{new Date(t.occurred_at).toLocaleString()}</td>
                <td style={{ padding: '8px 0' }}>{formatCurrency(t.amount)}</td>
                <td style={{ padding: '8px 0' }}>{t.kind}</td>
                <td style={{ padding: '8px 0' }}>{t.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 320 }}>
            <TransactionForm
              wallets={wallets}
              onClose={() => setShow(false)}
              onCreated={t => setTransactions(prev => [t, ...prev])}
              userId={userId}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionForm({ wallets, onClose, onCreated, userId }: { wallets: Wallet[]; onClose: () => void; onCreated: (t: Transaction) => void; userId: string }) {
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? '');
  const [amount, setAmount] = useState('0');
  const [kind, setKind] = useState<'in'|'out'>('out');
  const [note, setNote] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: CreateTransactionPayload = {
      userId,
      wallet_id: walletId,
      amount,
      kind,
      note: note || null,
    };
    try {
      const created = await transactionsApi.createTransaction(payload as any);
      onCreated(created);
      onClose();
    } catch (err) {
      console.error(err);
      alert('failed');
    }
  }

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 8 }}>
        <label>Wallet</label>
        <select value={walletId} onChange={e => setWalletId(e.target.value)}>
          {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Amount</label>
        <input value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Kind</label>
        <select value={kind} onChange={e => setKind(e.target.value as 'in'|'out')}>
          <option value="in">In</option>
          <option value="out">Out</option>
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Note</label>
        <input value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit">Create</button>
      </div>
    </form>
  );
}
