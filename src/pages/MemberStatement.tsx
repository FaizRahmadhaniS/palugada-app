import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Download, FileText, Calendar, DollarSign, TrendingUp, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import ReportPreviewModal from '../components/ReportPreviewModal';
import autoTable from 'jspdf-autotable';
import { addPDFHeader, addPDFFooter, addSignatureArea } from '../utils/pdfHelper';

const fmt = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;
const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return d || '-'; } };

export default function MemberStatement({ user }: { user: any }) {
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stmtPreviewOpen, setStmtPreviewOpen] = useState(false);
  const [period, setPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => { fetchStatement(); }, [user]);

  const filteredTxs = useMemo(() => {
    const txs = statement?.transactions || [];
    return txs.filter((t: any) => {
      const matchStatus = !filterStatus || (t.status || '').toLowerCase() === filterStatus;
      const d = (t.created_at || t.date || '').split('T')[0];
      return matchStatus && (!filterDateFrom || d >= filterDateFrom) && (!filterDateTo || d <= filterDateTo);
    });
  }, [statement, filterStatus, filterDateFrom, filterDateTo]);

  const fetchStatement = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${user.id}/statement`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.statement) { setStatement(data.statement); setLoading(false); return; }
      }
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

  const downloadPDF = async (): Promise<jsPDF> => {
    if (!statement) return new jsPDF();
    const doc = new jsPDF();
    const color: [number, number, number] = [16, 185, 129];

    const startY = await addPDFHeader(doc, {
      reportId: `STMT-${Date.now()}`,
      title: 'Laporan Rekening Anggota',
      subtitle: `Periode: Semua Transaksi`,
      printedBy: user.name,
      accentColor: color
    });

    // Info anggota
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('INFORMASI ANGGOTA', 14, startY + 4);
    

    autoTable(doc, {
      startY: startY + 8,
      body: [
        ['Nama Anggota', user.name || '-'],
        ['ID Anggota', user.id || '-'],
        ['Email', user.email || '-'],
        ['No. HP', user.phone || '-'],
      ],
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: 2, textColor: [15, 23, 42] as [number,number,number] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45, textColor: [15, 23, 42] as [number,number,number] },
        1: { textColor: [15, 23, 42] as [number,number,number] }
      },
      margin: { left: 14, right: 14 },
    });

    const afterInfo = (doc as any).lastAutoTable.finalY + 6;

    // Ringkasan keuangan
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('RINGKASAN KEUANGAN', 14, afterInfo);

    autoTable(doc, {
      startY: afterInfo + 4,
      head: [['KETERANGAN', 'JUMLAH']],
      body: [
        ['Total Setoran Simpanan', fmt(statement.totalDeposits || 0)],
        ['Total Penarikan', fmt(statement.totalWithdrawals || 0)],
        ['Saldo Simpanan', fmt(statement.balance || 0)],
        ['SHU Diterima', fmt(statement.shuReceived || 0)],
      ],
      headStyles: { fillColor: color, textColor: [255,255,255] as [number,number,number], fontSize: 8, fontStyle: 'bold', cellPadding: 2.5 },
      bodyStyles: { fontSize: 8.5, cellPadding: 2.5, textColor: [15, 23, 42] as [number,number,number] },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] as [number,number,number] } },
      tableLineColor: [226, 232, 240] as [number,number,number], tableLineWidth: 0.3,
      margin: { left: 14, right: 14 },
    });

    const afterSummary = (doc as any).lastAutoTable.finalY + 6;

    // Riwayat transaksi
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('RIWAYAT TRANSAKSI', 14, afterSummary);

    const txs = (filteredTxs).map((t: any, i: number) => [
      i + 1,
      fmtDate(t.created_at || t.date),
      (t.description || t.type || '-').replace(/\[PAY-\d+\]/g, '').trim(),
      fmt(t.amount),
      t.status === 'success' || t.status === 'Success' ? 'Berhasil' :
      t.status === 'pending' || t.status === 'Pending' ? 'Pending' : 'Gagal'
    ]);

    autoTable(doc, {
      startY: afterSummary + 4,
      head: [['NO', 'TANGGAL', 'KETERANGAN', 'JUMLAH', 'STATUS']],
      body: txs,
      headStyles: { fillColor: color, textColor: [255,255,255] as [number,number,number], fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2.5, minCellHeight: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2, minCellHeight: 6.5, textColor: [15, 23, 42] as [number,number,number] },
      alternateRowStyles: { fillColor: [240, 253, 244] as [number,number,number] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 26 },
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 35, textColor: [5, 150, 105] as [number,number,number] },
        4: { halign: 'center', cellWidth: 24 }
      },
      tableLineColor: [226, 232, 240] as [number,number,number], tableLineWidth: 0.3,
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 200;
    if (finalY < 240) addSignatureArea(doc, finalY + 8);
    addPDFFooter(doc, color);
    return doc;
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
          onClick={() => setStmtPreviewOpen(true)}
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
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={24} className="text-emerald-600" />
              Riwayat Transaksi
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Semua Status</option>
                <option value="success">Berhasil</option>
                <option value="pending">Pending</option>
                <option value="failed">Gagal</option>
              </select>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs font-medium text-slate-500">Tanggal:</span>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                  className="px-2 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none" />
                <span className="text-slate-400">—</span>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                  className="px-2 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none" />
              </div>
              {(filterStatus || filterDateFrom || filterDateTo) && (
                <button onClick={() => { setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">✕ Reset</button>
              )}
              <span className="text-xs text-slate-400 ml-auto">{filteredTxs.length} transaksi</span>
            </div>
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
                {filteredTxs.map((t: any, idx: number) => (
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

      <ReportPreviewModal
        isOpen={stmtPreviewOpen}
        onClose={() => setStmtPreviewOpen(false)}
        title="Laporan Rekening Anggota"
        generatePDF={downloadPDF}
        pdfFilename={`laporan-rekening-${Date.now()}.pdf`}
        excelData={{
          headers: ['NO','TANGGAL','JENIS TRANSAKSI','STATUS','JUMLAH'],
          rows: filteredTxs.map((t: any, i: number) => [
            i+1,
            t.date ? new Date(t.date).toLocaleDateString('id-ID') : '-',
            t.type||t.description||'-',
            t.status||'-',
            `Rp ${(t.amount||0).toLocaleString('id-ID')}`
          ]) as (string|number)[][],
          filename: `laporan-rekening-${Date.now()}.xlsx`,
          onDownload: () => {},
        }}
      />
    </motion.div>
  );
}