import React, { useState, useEffect } from 'react';
import { HandCoins, Search, CheckCircle, XCircle, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../types';

const generateBarcode = (text: string) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, { format: 'CODE128', displayValue: false, height: 40, width: 2, margin: 0 });
  return canvas.toDataURL('image/png');
};

export default function Loans() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const res = await fetch('/api/loans');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setLoans(data);
      } else {
        setLoans([]);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/loans/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchLoans();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const exportLoansPDF = () => {
    const doc = new jsPDF();
    const reportId = `LOAN-${Date.now()}`;
    
    // Header
    doc.setFillColor(245, 158, 11);
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
    doc.text('LAPORAN DATA PINJAMAN', 14, 65);
    
    const tableData = loans.map((l, index) => [
      index + 1,
      l.memberName || 'N/A',
      `Rp ${((l.amount || 0) / 1000000).toFixed(1)}jt`,
      `${l.duration || 0} bln`,
      `Rp ${((l.remainingBalance || 0) / 1000000).toFixed(1)}jt`,
      l.status === 'approved' ? 'Disetujui' : l.status === 'paid_off' ? 'Lunas' : l.status === 'pending' ? 'Menunggu' : 'Ditolak'
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['NO', 'ANGGOTA', 'JUMLAH', 'TENOR', 'SISA', 'STATUS']],
      body: tableData,
      headStyles: { fillColor: [245, 158, 11], halign: 'center', textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [254, 252, 232] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'center' }
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

    doc.save(`laporan-pinjaman-${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Data Pinjaman</h1>
          <p className="text-slate-500 dark:text-slate-400">Kelola data pinjaman anggota</p>
        </div>
        <button 
          onClick={exportLoansPDF}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
        >
          <FileText size={18} />
          Unduh PDF
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari pinjaman..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 sticky top-0">
              <tr>
                <th className="px-3 sm:px-4 py-3 font-bold text-left">Aksi</th>
                <th className="px-3 sm:px-4 py-3 font-bold">Anggota</th>
                <th className="px-3 sm:px-4 py-3 font-bold text-right">Jumlah</th>
                <th className="px-3 sm:px-4 py-3 font-bold text-center">Tenor</th>
                <th className="px-3 sm:px-4 py-3 font-bold text-right">Sisa</th>
                <th className="px-3 sm:px-4 py-3 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-slate-500">Belum ada pinjaman</td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex justify-start gap-1">
                        {loan.status === 'pending' ? (
                          <>
                            <button onClick={() => handleStatusChange(loan.id, 'approved')} className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors" title="Setujui">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => handleStatusChange(loan.id, 'rejected')} className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors" title="Tolak">
                              <XCircle size={16} />
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                            ✓
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 font-medium text-slate-900 dark:text-white truncate">{loan.memberName || 'N/A'}</td>
                    <td className="px-3 sm:px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      Rp {((loan.amount || 0) / 1000000).toFixed(1)}jt
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center text-slate-600 dark:text-slate-300 whitespace-nowrap">{(loan.duration || 0)} bln</td>
                    <td className="px-3 sm:px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      Rp {((loan.remainingBalance || 0) / 1000000).toFixed(1)}jt
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap ${
                        loan.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        loan.status === 'paid_off' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        loan.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {loan.status === 'approved' ? 'Setuju' : loan.status === 'paid_off' ? 'Lunas' : loan.status === 'pending' ? 'Tunggu' : 'Tolak'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
