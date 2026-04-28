import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, DollarSign, TrendingUp, Download, BarChart3, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface MonthlyReport {
  month: number;
  year: number;
  totalSavings: number;
  totalLoans: number;
  transactionCount: number;
}

export default function MonthlyReports({ user }: { user: any }) {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedMonth, selectedYear]);

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${selectedMonth}&year=${selectedYear}`);
      console.log('Monthly Report API Response Status:', res.status);
      if (!res.ok) {
        console.warn(`HTTP error! status: ${res.status}. Using sample data for demo.`);
        // Use sample data for demo if API fails
        const sampleData = {
          month: selectedMonth,
          year: selectedYear,
          totalSavings: 5000000,
          totalLoans: 8000000,
          transactionCount: 45
        };
        setReports([sampleData]);
        setChartData([sampleData]);
        return;
      }
      const data = await res.json();
      console.log('Monthly Report Data:', data);
      setReports([data]);
      setChartData([data]);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      // Use empty sample data as fallback
      const emptyData = {
        month: selectedMonth,
        year: selectedYear,
        totalSavings: 0,
        totalLoans: 0,
        transactionCount: 0
      };
      setReports([emptyData]);
      setChartData([emptyData]);
    } finally {
      setLoading(false);
    }
  };

  const currentReport = reports[0];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Laporan Bulanan</h1>
        <p className="text-blue-100">Analisis transaksi dan performa koperasi setiap bulannya</p>
      </motion.div>

      {/* Month/Year Selection */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Pilih Periode</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bulan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, idx) => (
                <option key={idx} value={idx + 1}>{month}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tahun</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : currentReport ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Total Tabungan</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Rp {currentReport.totalSavings.toLocaleString('id-ID')}</p>
                </div>
                <DollarSign className="text-emerald-600" size={32} />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Total Pinjaman</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Rp {currentReport.totalLoans.toLocaleString('id-ID')}</p>
                </div>
                <TrendingUp className="text-amber-600" size={32} />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Jumlah Transaksi</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{currentReport.transactionCount}</p>
                </div>
                <BarChart3 className="text-blue-600" size={32} />
              </div>
            </motion.div>
          </div>

          {/* Charts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Komparasi Tabungan vs Pinjaman</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                <Legend />
                <Bar dataKey="totalSavings" fill="#10b981" name="Tabungan" />
                <Bar dataKey="totalLoans" fill="#f59e0b" name="Pinjaman" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Detailed Report */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ringkasan Laporan</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all">
                <Download size={18} />
                Export PDF
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Periode</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{months[selectedMonth - 1]} {selectedYear}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Total Pemasukan (Tabungan)</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">Rp {currentReport.totalSavings.toLocaleString('id-ID')}</p>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">Total Pengeluaran (Pinjaman)</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">Rp {currentReport.totalLoans.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase">Netral (Pemasukan - Pengeluaran)</p>
                <p className={`text-2xl font-bold mt-2 ${(currentReport.totalSavings - currentReport.totalLoans) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  Rp {(currentReport.totalSavings - currentReport.totalLoans).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </div>
  );
}
