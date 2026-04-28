import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, DollarSign, Users, Calendar, PieChart, Download } from 'lucide-react';

interface Distribution {
  member_id: string;
  member_name: string;
  period: string;
  share_amount: number;
  distribution_rate: number;
  created_by: string;
  created_at: string;
}

export default function SHUDistribution({ user }: { user: any }) {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCalculation, setShowCalculation] = useState(false);
  const [calculation, setCalculation] = useState({
    period: new Date().toISOString().substring(0, 7),
    totalProfit: 0,
    distributionRate: 100
  });

  useEffect(() => {
    fetchDistributions();
  }, []);

  const fetchDistributions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shu/distribution');
      console.log('SHU API Response Status:', res.status);
      if (!res.ok) {
        console.warn(`HTTP error! status: ${res.status}. Using sample data for demo.`);
        // Use sample data for demo if API fails
        const sampleData: Distribution[] = [
          {
            member_id: '1',
            member_name: 'Anggota 1',
            period: '2024-01',
            share_amount: 500000,
            distribution_rate: 100,
            created_by: 'admin',
            created_at: new Date().toISOString()
          },
          {
            member_id: '2',
            member_name: 'Anggota 2',
            period: '2024-01',
            share_amount: 500000,
            distribution_rate: 100,
            created_by: 'admin',
            created_at: new Date().toISOString()
          }
        ];
        setDistributions(sampleData);
        return;
      }
      const data = await res.json();
      console.log('SHU Distribution Data:', data);
      setDistributions(data || []);
    } catch (error) {
      console.error('Error fetching SHU distributions:', error);
      // Use empty array as fallback
      setDistributions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateSHU = async () => {
    if (calculation.totalProfit <= 0) {
      alert('Total laba harus lebih dari 0');
      return;
    }

    try {
      const res = await fetch('/api/shu/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculation)
      });

      const data = await res.json();
      if (data.success) {
        setDistributions([...data.distributions, ...distributions]);
        setCalculation({ period: new Date().toISOString().substring(0, 7), totalProfit: 0, distributionRate: 100 });
        setShowCalculation(false);
        alert('Perhitungan SHU berhasil disimpan!');
      }
    } catch (error) {
      console.error('Error calculating SHU:', error);
      alert('Gagal menghitung SHU');
    }
  };

  const groupedByPeriod = distributions.reduce((acc: Record<string, Distribution[]>, dist) => {
    const period = dist.period;
    if (!acc[period]) acc[period] = [];
    acc[period].push(dist);
    return acc;
  }, {});

  const totalDistributed = Object.values(groupedByPeriod).flat().reduce((sum, d) => sum + (d.share_amount || 0), 0);

  console.log('Rendering SHUDistribution - user:', user, 'distributions:', distributions, 'loading:', loading);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Distribusi SHU (Sisa Hasil Usaha)</h1>
        <p className="text-emerald-100">Kelola pembagian profit sharing untuk semua anggota</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Total Terdistribusi</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Rp {totalDistributed.toLocaleString('id-ID')}</p>
            </div>
            <DollarSign className="text-emerald-600" size={32} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Periode Aktif</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{Object.keys(groupedByPeriod).length}</p>
            </div>
            <Calendar className="text-blue-600" size={32} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Rata-rata Distribusi</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                Rp {distributions.length > 0 ? Math.round(totalDistributed / distributions.length).toLocaleString('id-ID') : 0}
              </p>
            </div>
            <TrendingUp className="text-amber-600" size={32} />
          </div>
        </motion.div>
      </div>

      {/* Calculate SHU Button */}
      {user?.role === 'admin' && (
        <button
          onClick={() => setShowCalculation(!showCalculation)}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all"
        >
          {showCalculation ? 'Tutup Kalkulator' : '+ Hitung SHU Baru'}
        </button>
      )}

      {/* Calculation Form */}
      {showCalculation && user?.role === 'admin' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Perhitungan SHU Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Periode (YYYY-MM)</label>
              <input
                type="month"
                value={calculation.period}
                onChange={(e) => setCalculation({ ...calculation, period: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Total Laba (Rp)</label>
              <input
                type="number"
                value={calculation.totalProfit}
                onChange={(e) => setCalculation({ ...calculation, totalProfit: Number(e.target.value) })}
                placeholder="0"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">% Distribusi</label>
              <select
                value={calculation.distributionRate}
                onChange={(e) => setCalculation({ ...calculation, distributionRate: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={100}>100% - Semua Anggota</option>
                <option value={80}>80% - Anggota Aktif</option>
                <option value={50}>50% - Pembagi Merata</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleCalculateSHU}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all"
          >
            Hitung & Simpan
          </button>
        </motion.div>
      )}

      {/* Distributions by Period */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : Object.keys(groupedByPeriod).length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">Belum ada data distribusi SHU</p>
          </div>
        ) : (
          Object.entries(groupedByPeriod).map(([period, perDist]) => {
            const periodTotal = perDist.reduce((sum, d) => sum + (d.share_amount || 0), 0);
            return (
              <motion.div
                key={period}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="bg-slate-50 dark:bg-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Periode {period}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Distribusi: Rp {periodTotal.toLocaleString('id-ID')}</p>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Nama Anggota</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Nominal SHU</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">% Distribusi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perDist.map((dist, idx) => (
                      <tr key={idx} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{dist.member_name}</td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">Rp {dist.share_amount?.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4">{dist.distribution_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
