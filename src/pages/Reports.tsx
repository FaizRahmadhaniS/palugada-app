import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Wallet, HandCoins, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import { addPDFHeader, addPDFFooter, addSignatureArea } from '../utils/pdfHelper';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import { Saving, Loan } from '../types';

const generateBarcode = (text: string) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, { format: 'CODE128', displayValue: false, height: 40, width: 2, margin: 0 });
  return canvas.toDataURL('image/png');
};

export default function Reports() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const safeFetch = (url: string) => 
      fetch(url).then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Oops, we haven't got JSON!");
        }
        return res.json();
      }).catch(() => []);

    Promise.all([
      safeFetch('/api/savings'),
      safeFetch('/api/loans')
    ]).then(([savingsData, loansData]) => {
      setSavings(Array.isArray(savingsData) ? savingsData : []);
      setLoans(Array.isArray(loansData) ? loansData : []);
      setLoading(false);
    });
  }, []);

  const exportSavingsPDF = async () => {
    const doc = new jsPDF();
    const reportId = `REP-SAV-${Date.now()}`;
    const startY = await addPDFHeader(doc, {
      reportId, title: 'Laporan Simpanan Anggota',
      subtitle: `Total: ${savings.length} transaksi · ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
    });
    autoTable(doc, {
      startY,
      head: [['NO', 'ANGGOTA', 'JENIS', 'JUMLAH', 'TANGGAL']],
      body: savings.map((s, i) => [i + 1, s.memberName, s.type || 'Simpanan', `Rp ${(s.amount || 0).toLocaleString('id-ID')}`, new Date(s.date).toLocaleDateString('id-ID')]),
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2.5, minCellHeight: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2, minCellHeight: 6.5, textColor: [15, 23, 42] as [number,number,number] },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 3: { halign: 'right' }, 4: { halign: 'center' } },
      tableLineColor: [226, 232, 240], tableLineWidth: 0.3,
    });
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    if (finalY < 240) addSignatureArea(doc, finalY + 10);
    addPDFFooter(doc);
    doc.save(`laporan-simpanan-${Date.now()}.pdf`);
  };

  const exportLoansPDF = async () => {
    const doc = new jsPDF();
    const reportId = `REP-LOAN-${Date.now()}`;
    const startY = await addPDFHeader(doc, {
      reportId, title: 'Laporan Pinjaman Anggota',
      subtitle: `Total: ${loans.length} pinjaman · ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      accentColor: [245, 158, 11]
    });
    autoTable(doc, {
      startY,
      head: [['NO', 'ANGGOTA', 'JUMLAH', 'TENOR', 'STATUS', 'TANGGAL']],
      body: loans.map((l, i) => [i + 1, l.memberName, `Rp ${(l.amount || 0).toLocaleString('id-ID')}`, `${l.duration || 0} bln`,
        l.status === 'approved' ? 'Disetujui' : l.status === 'paid_off' ? 'Lunas' : l.status === 'pending' ? 'Menunggu' : 'Ditolak',
        new Date(l.date).toLocaleDateString('id-ID')]),
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', halign: 'center', cellPadding: 5 },
      bodyStyles: { fontSize: 8, cellPadding: 2, minCellHeight: 6.5, textColor: [15, 23, 42] as [number,number,number] },
      alternateRowStyles: { fillColor: [254, 252, 232] },
      columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 2: { halign: 'right' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' } },
      tableLineColor: [226, 232, 240], tableLineWidth: 0.3,
    });
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    if (finalY < 240) addSignatureArea(doc, finalY + 10);
    addPDFFooter(doc, [245, 158, 11]);
    doc.save(`laporan-pinjaman-${Date.now()}.pdf`);
  };

  const exportSHUPDF = async () => {
    const doc = new jsPDF();
    const reportId = `REP-SHU-${Date.now()}`;
    const totalSavings = savings.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalLoans = loans.filter(l => l.status === 'approved' || l.status === 'paid_off').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const estimatedSHU = (totalLoans * 0.1) + (totalSavings * 0.05);
    const startY = await addPDFHeader(doc, {
      reportId, title: 'Ringkasan Sisa Hasil Usaha (SHU)',
      subtitle: `Estimasi SHU: Rp ${estimatedSHU.toLocaleString('id-ID')} · ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      accentColor: [147, 51, 234]
    });
    autoTable(doc, {
      startY,
      head: [['KOMPONEN PENDAPATAN', 'PERSENTASE', 'JUMLAH']],
      body: [
        ['Pendapatan Bunga Pinjaman', '10%', `Rp ${(totalLoans * 0.1).toLocaleString('id-ID')}`],
        ['Pendapatan Investasi Simpanan', '5%', `Rp ${(totalSavings * 0.05).toLocaleString('id-ID')}`],
        ['Total SHU Kotor', '-', `Rp ${estimatedSHU.toLocaleString('id-ID')}`],
      ],
      headStyles: { fillColor: [147, 51, 234], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', halign: 'center', cellPadding: 5 },
      bodyStyles: { fontSize: 9, cellPadding: 2.5, minCellHeight: 6.5, textColor: [15, 23, 42] as [number,number,number] },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
      alternateRowStyles: { fillColor: [250, 245, 255] },
      tableLineColor: [226, 232, 240], tableLineWidth: 0.3,
    });
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    if (finalY < 240) addSignatureArea(doc, finalY + 10);
    addPDFFooter(doc, [147, 51, 234]);
    doc.save(`laporan-shu-${Date.now()}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Laporan Keuangan</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Unduh laporan keuangan koperasi dalam format PDF.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Laporan Simpanan */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
            <Wallet size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Laporan Simpanan</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Rekapitulasi seluruh setoran simpanan anggota.</p>
          </div>
          <button 
            onClick={exportSavingsPDF}
            disabled={loading || savings.length === 0}
            className="mt-4 w-full py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download size={18} />
            Unduh PDF
          </button>
        </div>

        {/* Laporan Pinjaman */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
            <HandCoins size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Laporan Pinjaman</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Data pengajuan dan persetujuan pinjaman.</p>
          </div>
          <button 
            onClick={exportLoansPDF}
            disabled={loading || loans.length === 0}
            className="mt-4 w-full py-2.5 bg-slate-900 dark:bg-amber-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download size={18} />
            Unduh PDF
          </button>
        </div>

        {/* Laporan SHU */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center">
            <TrendingUp size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Laporan SHU</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Estimasi Sisa Hasil Usaha (SHU) koperasi.</p>
          </div>
          <button 
            onClick={exportSHUPDF}
            disabled={loading}
            className="mt-4 w-full py-2.5 bg-slate-900 dark:bg-purple-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download size={18} />
            Unduh PDF
          </button>
        </div>
      </div>
    </motion.div>
  );
}
