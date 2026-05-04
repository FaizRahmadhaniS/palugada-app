import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, FileText, Calendar, DollarSign, TrendingUp } from 'lucide-react';

export default function MemberStatement({ user }: { user: any }) {
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    fetchStatement();
  }, [user]);

  const fetchStatement = async () => {
    setLoading(true);
    try {
      // Try primary statement endpoint
      const res = await fetch(`/api/members/${user.id}/statement`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.statement) {
          setStatement(data.statement);
          setLoading(false);
          return;
        }
      }
      // Fallback: build statement from savings + member data
      const [savRes, memRes] = await Promise.all([
        fetch('/api/savings', { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);
      const savData = savRes.ok ? await savRes.json() : [];
      const memData = memRes.ok ? await memRes.json() : {};
      const mem = memData.user || user;
      const transactions = Array.isArray(savData) ? savData : [];
      const deposits = transactions.filter((t:any) => t.type !== 'Withdrawal').reduce((s:number,t:any) => s+(t.amount||0), 0);
      const withdrawals = transactions.filter((t:any) => t.type === 'Withdrawal').reduce((s:number,t:any) => s+(t.amount||0), 0);
      setStatement({
        totalDeposits: deposits,
        totalWithdrawals: withdrawals,
        balance: deposits - withdrawals,
        shuReceived: mem.total_shu || 0,
        transactions: transactions.map((t:any) => ({
          created_at: t.date || t.createdDate,
          description: t.description || t.type,
          amount: t.amount,
          status: t.status || 'Success'
        }))
      });
    } catch (error) {
      console.error('Error fetching statement:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!statement) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Rekening - ${user.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.6; }
          .container { max-width: 800px; margin: 20px auto; padding: 40px; background: white; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #059669; padding-bottom: 20px; }
          .header h1 { color: #059669; font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 16px; font-weight: bold; color: #059669; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
          .label { font-weight: 500; color: #4b5563; }
          .value { text-align: right; color: #1f2937; }
          .table { width: 100%; margin-top: 15px; border-collapse: collapse; }
          .table th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: 600; border: 1px solid #e5e7eb; }
          .table td { padding: 10px; border: 1px solid #e5e7eb; }
          .total-row { background: #f9fafb; font-weight: bold; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px; }
          .amount { color: #059669; font-weight: bold; }
          @page { size: A4; margin: 10mm; }
          @media print { body { margin: 0; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 LAPORAN REKENING</h1>
            <p>Koperasi Palugada Simple - ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Informasi Anggota</div>
            <div class="row">
              <span class="label">Nama Anggota:</span>
              <span class="value">${user.name}</span>
            </div>
            <div class="row">
              <span class="label">ID Anggota:</span>
              <span class="value">${user.id}</span>
            </div>
            <div class="row">
              <span class="label">Email:</span>
              <span class="value">${user.email}</span>
            </div>
            <div class="row">
              <span class="label">No. HP:</span>
              <span class="value">${user.phone || '-'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Ringkasan Keuangan</div>
            <div class="row">
              <span class="label">Total Setoran Simpanan:</span>
              <span class="value amount">Rp ${(statement.totalDeposits || 0).toLocaleString('id-ID')}</span>
            </div>
            <div class="row">
              <span class="label">Total Penarikan:</span>
              <span class="value amount">Rp ${(statement.totalWithdrawals || 0).toLocaleString('id-ID')}</span>
            </div>
            <div class="row">
              <span class="label">Saldo Simpanan:</span>
              <span class="value amount">Rp ${(statement.balance || 0).toLocaleString('id-ID')}</span>
            </div>
            <div class="row">
              <span class="label">SHU Diterima:</span>
              <span class="value amount">Rp ${(statement.shuReceived || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Riwayat 10 Transaksi Terakhir</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th style="text-align: right;">Jumlah</th>
                  <th style="text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${(statement.transactions || []).slice(0, 10).map((t: any) => `
                  <tr>
                    <td>${new Date(t.created_at || t.date).toLocaleDateString('id-ID')}</td>
                    <td>${t.description || t.type}</td>
                    <td style="text-align: right; color: #059669; font-weight: bold;">Rp ${(t.amount || 0).toLocaleString('id-ID')}</td>
                    <td style="text-align: center;">
                      ${t.status === 'success' || t.status === 'Success' ? '<span style="color: green;">✓</span>' : 
                        t.status === 'pending' || t.status === 'Pending' ? '<span style="color: orange;">⏱</span>' : 
                        '<span style="color: red;">✗</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Laporan ini digenerated secara otomatis oleh Sistem Informasi Koperasi Palugada Simple</p>
            <p style="margin-top: 10px;">Dicetak: ${new Date().toLocaleString('id-ID')}</p>
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement_${user.name}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat laporan...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Laporan Rekening</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Ringkasan akun dan riwayat transaksi Anda</p>
        </div>
        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
        >
          <Download size={20} />
          Unduh Laporan
        </button>
      </div>

      {/* Financial Summary */}
      {statement && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Setoran</p>
                <h3 className="text-2xl font-bold mt-2">
                  Rp {(statement.totalDeposits || 0).toLocaleString('id-ID')}
                </h3>
              </div>
              <DollarSign size={24} className="text-blue-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-rose-100 text-sm font-medium">Total Penarikan</p>
                <h3 className="text-2xl font-bold mt-2">
                  Rp {(statement.totalWithdrawals || 0).toLocaleString('id-ID')}
                </h3>
              </div>
              <TrendingUp size={24} className="text-rose-200 rotate-180" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Saldo Simpanan</p>
                <h3 className="text-2xl font-bold mt-2">
                  Rp {(statement.balance || 0).toLocaleString('id-ID')}
                </h3>
              </div>
              <FileText size={24} className="text-emerald-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-100 text-sm font-medium">SHU Diterima</p>
                <h3 className="text-2xl font-bold mt-2">
                  Rp {(statement.shuReceived || 0).toLocaleString('id-ID')}
                </h3>
              </div>
              <TrendingUp size={24} className="text-amber-200" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Transaction History */}
      {statement?.transactions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={24} className="text-emerald-600" />
              Riwayat Transaksi
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Tanggal</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Keterangan</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Jumlah</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {statement.transactions.map((t: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(t.created_at || t.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">
                      {t.description || t.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-emerald-600">
                      Rp {(t.amount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        t.status === 'Success' || t.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        t.status === 'Pending' || t.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {t.status === 'Success' || t.status === 'success' ? '✓ Sukses' :
                         t.status === 'Pending' || t.status === 'pending' ? '⏱ Menunggu' :
                         '✗ Gagal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}