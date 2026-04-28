import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Search, Plus, Settings } from 'lucide-react';

export default function PaymentGateway() {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [provider, setProvider] = useState('xendit');
  const [isProduction, setIsProduction] = useState(true);
  const [serverKey, setServerKey] = useState('');
  const [clientKey, setClientKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const safeFetch = (url: string) => 
      fetch(url).then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Oops, we haven't got JSON!");
        }
        return res.json();
      });

    // Load settings
    safeFetch('/api/settings/payment')
      .then(data => {
        if (data) {
          setProvider(data.provider || 'xendit');
          setIsProduction(data.isProduction ?? true);
          setServerKey(data.serverKey || '');
          setClientKey(data.clientKey || '');
        }
      })
      .catch(err => console.error('Failed to load payment settings', err));

    // Load payments (from savings table)
    safeFetch('/api/savings')
      .then(data => {
        setPayments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load payments', err);
        setLoading(false);
      });
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch('/api/settings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, isProduction, serverKey, clientKey })
      });
      alert('Pengaturan berhasil disimpan!');
      setShowSettings(false);
    } catch (err) {
      alert('Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Cari pembayaran..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowSettings(true)}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>
          <button className="flex-1 sm:flex-none px-4 py-2.5 bg-[#1877F2] text-white font-medium rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
            <Plus size={18} />
            Buat Pembayaran
          </button>
        </div>
      </div>

      <div className="bg-[#F0F7FF] dark:bg-blue-900/20 border border-[#D0E2FF] dark:border-blue-800/50 rounded-xl p-4 flex items-start gap-4">
        <div className="mt-1">
          <CreditCard className="text-[#1877F2] dark:text-blue-400" size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">Xendit Payment Gateway Terintegrasi</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Pembayaran otomatis via Transfer Bank (BCA, BRI, BNI, Mandiri, dll), E-Wallet (OVO, GoPay, Dana, ShopeePay), QRIS, dan Kartu Kredit.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">#</th>
                <th className="px-6 py-4 font-medium">Anggota</th>
                <th className="px-6 py-4 font-medium">Tipe</th>
                <th className="px-6 py-4 font-medium">Jumlah</th>
                <th className="px-6 py-4 font-medium">Metode</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Link Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : payments.filter(p => p.memberName?.toLowerCase().includes(search.toLowerCase()) || p.id?.toLowerCase().includes(search.toLowerCase())).length > 0 ? (
                payments.filter(p => p.memberName?.toLowerCase().includes(search.toLowerCase()) || p.id?.toLowerCase().includes(search.toLowerCase())).map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{payment.id}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white">{payment.memberName}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{payment.type}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      Rp {(payment.amount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">Online (Payment Gateway)</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-white bg-[#1877F2]">
                        Lunas
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 dark:text-slate-500">-</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Belum ada transaksi pembayaran</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white">Pengaturan Payment Gateway</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provider</label>
                <select 
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                >
                  <option value="xendit">Xendit</option>
                  <option value="midtrans">Midtrans</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Server Key</label>
                <input 
                  type="password" 
                  value={serverKey}
                  onChange={(e) => setServerKey(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
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
