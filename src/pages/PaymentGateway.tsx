import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Search, Plus, Settings, Clock, ExternalLink, RefreshCw } from 'lucide-react';

export default function PaymentGateway() {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'success'>('all');

  const [provider, setProvider] = useState('midtrans');
  const [isProduction, setIsProduction] = useState(false);
  const [serverKey, setServerKey] = useState('');
  const [clientKey, setClientKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/savings', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load payments', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/settings/payment', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data) {
          setProvider(data.provider || 'midtrans');
          setIsProduction(data.isProduction ?? false);
          setServerKey(data.serverKey || '');
          setClientKey(data.clientKey || '');
        }
      }).catch(() => {});

    fetchPayments();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch('/api/settings/payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, isProduction, serverKey, clientKey })
      });
      alert('Pengaturan berhasil disimpan!');
      setShowSettings(false);
    } catch { alert('Gagal menyimpan pengaturan'); }
    finally { setIsSaving(false); }
  };

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  const filtered = payments.filter(p => {
    const matchSearch = p.memberName?.toLowerCase().includes(search.toLowerCase()) || p.id?.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'pending') return matchSearch && p.status === 'pending';
    if (activeTab === 'success') return matchSearch && p.status !== 'pending';
    return matchSearch;
  });

  const parseMeta = (desc: string) => { try { return JSON.parse(desc || '{}'); } catch { return {}; } };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 max-w-6xl mx-auto">

      {/* Header actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input type="text" placeholder="Cari nama anggota..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={fetchPayments} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button onClick={() => setShowSettings(true)} className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
            <Settings size={18} /> <span className="hidden sm:inline">Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-[#F0F7FF] dark:bg-blue-900/20 border border-[#D0E2FF] dark:border-blue-800/50 rounded-xl p-4 flex items-start gap-4">
        <CreditCard className="text-[#1877F2] dark:text-blue-400 mt-1" size={24} />
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">Payment Gateway Terintegrasi</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Pembayaran otomatis via Transfer Bank, E-Wallet (OVO, GoPay, Dana, ShopeePay), QRIS, dan Kartu Kredit.</p>
        </div>
      </div>

      {/* Stats + Tab filter */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { key: 'all', label: 'Semua', count: payments.length },
          { key: 'pending', label: '⏳ Pending', count: pendingCount, highlight: pendingCount > 0 },
          { key: 'success', label: '✅ Lunas', count: payments.length - pendingCount },
        ].map((tab: any) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? tab.highlight ? 'bg-amber-500 text-white shadow' : 'bg-blue-600 text-white shadow'
                : tab.highlight ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}>
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-md text-xs font-black ${activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Anggota</th>
                <th className="px-6 py-4 font-medium">Tipe</th>
                <th className="px-6 py-4 font-medium">Jumlah</th>
                <th className="px-6 py-4 font-medium">Tanggal</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  {activeTab === 'pending' ? 'Tidak ada pembayaran pending' : 'Belum ada transaksi'}
                </td></tr>
              ) : filtered.map(payment => {
                const meta = parseMeta(payment.description);
                const redirectUrl = meta.redirectUrl || '';
                const isPending = payment.status === 'pending';
                return (
                  <tr key={payment.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${isPending ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs flex-shrink-0">
                          {(payment.memberName || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{payment.memberName || '-'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{payment.id?.substring(0, 12)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{meta.depositType || payment.type || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Rp {(payment.amount || 0).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {payment.date ? new Date(payment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {isPending ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 inline-flex items-center gap-1">
                          <Clock size={11} /> Pending
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          ✓ Lunas
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isPending && redirectUrl ? (
                        <a href={redirectUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all">
                          <ExternalLink size={12} /> Buka Pembayaran
                        </a>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white">Pengaturan Payment Gateway</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provider</label>
                <select value={provider} onChange={e => setProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm dark:text-white">
                  <option value="midtrans">Midtrans</option>
                  <option value="xendit">Xendit</option>
                  <option value="glodipay">GlodiPay</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mode</label>
                <div className="flex gap-3">
                  {[{ val: false, label: 'Sandbox / Testing' }, { val: true, label: 'Production' }].map(opt => (
                    <button key={String(opt.val)} type="button" onClick={() => setIsProduction(opt.val)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${isProduction === opt.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Server Key</label>
                <input type="password" value={serverKey} onChange={e => setServerKey(e.target.value)} placeholder="SB-Mid-server-..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Client Key</label>
                <input type="password" value={clientKey} onChange={e => setClientKey(e.target.value)} placeholder="SB-Mid-client-..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm dark:text-white" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowSettings(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium">Batal</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}