import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, DollarSign, Trash2, Download, FileText } from 'lucide-react';
import { cn } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';

const generateBarcode = (text: string) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, { format: 'CODE128', displayValue: false, height: 40, width: 2, margin: 0 });
  return canvas.toDataURL('image/png');
};

export default function Finance() {
  const [finances, setFinances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'Income',
    category: 'Operasional',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    try {
      const res = await fetch('/api/finance');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      const data = await res.json();
      setFinances(data);
    } catch (error) {
      console.error('Error fetching finances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userStr = localStorage.getItem('palugada_user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `FIN-${Date.now()}`,
          ...formData,
          amount: parseFloat(formData.amount),
          createdBy: user?.id || 'system'
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add finance');
      }
      
      setIsModalOpen(false);
      fetchFinances();
    } catch (error) {
      console.error('Error adding finance:', error);
      setErrorMsg('Gagal menyimpan transaksi: ' + (error as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/finance/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete finance');
      }
      setDeleteId(null);
      fetchFinances();
    } catch (error) {
      console.error('Error deleting finance:', error);
      setDeleteId(null);
      setErrorMsg('Gagal menghapus transaksi: ' + (error as Error).message);
    }
  };

  const totalIncome = finances.filter(f => f.type === 'Income').reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalExpense = finances.filter(f => f.type === 'Expense').reduce((sum, f) => sum + (f.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const exportFinancePDF = () => {
    const doc = new jsPDF();
    const reportId = `FIN-RPT-${Date.now()}`;
    
    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('PALUGADA COOP', 14, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Koperasi Simpan Pinjam Masa Depan', 14, 32);
    doc.text('Jl. Modern No. 123, Jakarta Selatan', 14, 37);

    // Barcode
    const barcodeData = generateBarcode(reportId);
    doc.addImage(barcodeData, 'PNG', 140, 10, 55, 20);
    doc.setFontSize(8);
    doc.text(`REPORT ID: ${reportId}`, 140, 35);
    doc.text(`GENERATED: ${new Date().toLocaleString('id-ID')}`, 140, 40);

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('LAPORAN KEUANGAN OPERASIONAL', 14, 65);
    
    // Summary
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`, 14, 75);
    doc.text(`Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`, 14, 82);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`Saldo Kas: Rp ${balance.toLocaleString('id-ID')}`, 14, 89);

    doc.setTextColor(0, 0, 0);
    const tableData = finances.map((f, index) => [
      index + 1,
      f.date,
      f.category,
      f.description,
      f.type === 'Income' ? `Rp ${(f.amount || 0).toLocaleString('id-ID')}` : '',
      f.type === 'Expense' ? `Rp ${(f.amount || 0).toLocaleString('id-ID')}` : ''
    ]);

    autoTable(doc, {
      startY: 100,
      head: [['NO', 'TANGGAL', 'KATEGORI', 'DESKRIPSI', 'PEMASUKAN', 'PENGELUARAN']],
      body: tableData,
      headStyles: { 
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Halaman ${i} dari ${pageCount} - Dokumen ini sah dikeluarkan oleh sistem Palugada.`, 105, 285, { align: 'center' });
    }

    doc.save(`laporan-keuangan-${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Keuangan Operasional</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola arus kas operasional (transaksi simpanan/pinjaman dicatat otomatis)</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setFormData({
                type: 'Income',
                category: 'Operasional',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Catat Transaksi
          </button>
          <button 
            onClick={() => {
              // Generate CSV
              const headers = ['Tipe', 'Kategori', 'Jumlah', 'Deskripsi', 'Tanggal'];
              const csv = [headers, ...finances.map(f => [f.type, f.category, f.amount, f.description, f.date])].map(row => row.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `finance_${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
          >
            <Download size={18} />
            Unduh CSV
          </button>
          <button 
            onClick={exportFinancePDF}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
          >
            <FileText size={18} />
            Unduh PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo Kas</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Rp {(balance || 0).toLocaleString('id-ID')}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pemasukan</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">Rp {(totalIncome || 0).toLocaleString('id-ID')}</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pengeluaran</p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">Rp {(totalExpense || 0).toLocaleString('id-ID')}</h3>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
              <ArrowDownRight size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium w-full sm:w-auto justify-center">
            <Filter size={18} />
            Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 sticky top-0">
              <tr>
                <th className="px-3 sm:px-4 py-3 font-bold text-center">Aksi</th>
                <th className="px-3 sm:px-4 py-3 font-bold">Tanggal</th>
                <th className="px-3 sm:px-4 py-3 font-bold">Kategori</th>
                <th className="px-3 sm:px-4 py-3 font-bold">Deskripsi</th>
                <th className="px-3 sm:px-4 py-3 font-bold text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-slate-500 dark:text-slate-400">Memuat data...</td>
                </tr>
              ) : finances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-slate-500 dark:text-slate-400">Belum ada transaksi</td>
                </tr>
              ) : (
                finances.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <button 
                        onClick={() => setDeleteId(f.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{f.date}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className={cn(
                         "px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap",
                        f.type === 'Income' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {f.category}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-slate-900 dark:text-white truncate max-w-xs">{f.description}</td>
                    <td className={cn(
                      "px-3 sm:px-4 py-3 text-right font-bold whitespace-nowrap",
                      f.type === 'Income' ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {f.type === 'Income' ? '+' : '-'} Rp {((f.amount || 0) / 1000000).toFixed(1)}jt
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Catat Transaksi</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Masukkan detail transaksi keuangan baru</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Jenis</label>
                  <select 
                    required
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({
                        ...formData, 
                        type: newType,
                        category: newType === 'Income' ? 'Operasional' : 'Operasional'
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                  >
                    <option value="Income">Pemasukan</option>
                    <option value="Expense">Pengeluaran</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kategori</label>
                  <select 
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                  >
                    {formData.type === 'Income' ? (
                      <>
                        <option value="Operasional">Operasional</option>
                        <option value="Investasi">Investasi</option>
                        <option value="Lainnya">Lainnya</option>
                      </>
                    ) : (
                      <>
                        <option value="Operasional">Operasional</option>
                        <option value="Gaji">Gaji</option>
                        <option value="Pajak">Pajak</option>
                        <option value="Lainnya">Lainnya</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Jumlah (Rp)</label>
                <input 
                  type="number" 
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tanggal</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Deskripsi</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white resize-none"
                  rows={3}
                  placeholder="Keterangan transaksi..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 p-6 text-center"
          >
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Hapus Transaksi?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Tindakan ini tidak dapat dibatalkan. Data transaksi akan dihapus secara permanen.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-xl text-sm font-medium transition-colors"
              >
                Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Error Modal */}
      {errorMsg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 p-6 text-center"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Terjadi Kesalahan</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              {errorMsg}
            </p>
            <button 
              onClick={() => setErrorMsg(null)}
              className="w-full px-4 py-2 text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-xl text-sm font-medium transition-colors"
            >
              Tutup
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
