import React, { useState, useEffect } from 'react';
import { HandCoins } from 'lucide-react';

export default function MemberLoanRequest({ user }: { user: any }) {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState('12');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [interestRate, setInterestRate] = useState(0.015); // Default 1.5%

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

    safeFetch('/api/settings/general')
      .then(data => {
        if (data.loanInterestRate) {
          setInterestRate(data.loanInterestRate / 100);
        }
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const principal = parseInt(amount);
    const months = parseInt(duration);
    const totalInterest = principal * interestRate * months;
    const totalRepayment = principal + totalInterest;

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `LOAN-${Date.now()}`,
          memberId: user.id,
          memberName: user.name,
          amount: principal,
          purpose,
          duration: months,
          interestRate,
          totalInterest,
          totalRepayment,
          status: 'pending',
          date: new Date().toISOString(),
          companyCode: 'PALUGADA',
          createdBy: user.id
        })
      });

      if (res.ok) {
        setMessage('Pengajuan pinjaman berhasil dikirim!');
        setAmount('');
        setPurpose('');
        setDuration('12');
      } else {
        setMessage('Gagal mengajukan pinjaman.');
      }
    } catch (error) {
      setMessage('Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ajukan Pinjaman</h1>
        <p className="text-slate-500 dark:text-slate-400">Isi formulir untuk mengajukan pinjaman baru</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className={`p-4 rounded-xl ${message.includes('berhasil') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Jumlah Pinjaman (Rp)
            </label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="500000"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Minimal Rp 500.000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tujuan Pinjaman
            </label>
            <textarea 
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Jelaskan tujuan penggunaan dana..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tenor (Bulan)
            </label>
            <select 
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="3">3 bulan</option>
              <option value="6">6 bulan</option>
              <option value="12">12 bulan</option>
              <option value="24">24 bulan</option>
            </select>
          </div>

          {amount && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Estimasi Cicilan per Bulan:</span>
                <span className="font-medium">
                  Rp {(Math.round((parseInt(amount) * (1 + interestRate * parseInt(duration))) / parseInt(duration)) || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bunga ({(interestRate * 100).toFixed(1)}% per bulan):</span>
                <span className="font-medium text-amber-600">
                  Rp {(Math.round(parseInt(amount) * interestRate * parseInt(duration)) || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <HandCoins size={20} />
            {loading ? 'Memproses...' : 'Ajukan Pinjaman'}
          </button>
        </form>
      </div>
    </div>
  );
}
