import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Wallet, HandCoins, TrendingUp } from 'lucide-react';
import ReportPreviewModal from '../components/ReportPreviewModal';
import jsPDF from 'jspdf';
import { addPDFHeader, addPDFFooter, addSignatureArea } from '../utils/pdfHelper';
import autoTable from 'jspdf-autotable';
import { Saving, Loan } from '../types';

export default function Reports() {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter simpanan
  const [savDateFrom, setSavDateFrom] = useState('');
  const [savDateTo, setSavDateTo] = useState('');
  // Filter pinjaman
  const [loanStatus, setLoanStatus] = useState('');
  const [loanDateFrom, setLoanDateFrom] = useState('');
  const [loanDateTo, setLoanDateTo] = useState('');

  const filteredSavings = useMemo(() => savings.filter(s => {
    const d = ((s as any).date || '').split('T')[0];
    return (!savDateFrom || d >= savDateFrom) && (!savDateTo || d <= savDateTo);
  }), [savings, savDateFrom, savDateTo]);

  const filteredLoans = useMemo(() => loans.filter(l => {
    const matchStatus = !loanStatus || (l as any).status === loanStatus;
    const d = ((l as any).date || '').split('T')[0];
    return matchStatus && (!loanDateFrom || d >= loanDateFrom) && (!loanDateTo || d <= loanDateTo);
  }), [loans, loanStatus, loanDateFrom, loanDateTo]);

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

  const [rpPreviewOpen, setRpPreviewOpen] = useState(false);
  const [rpPreviewType, setRpPreviewType] = useState<'savings'|'loans'|'shu'>('savings');
  const exportSavingsPDF = async (): Promise<import('jspdf').default> => {
    const doc = new jsPDF();
    const reportId = `REP-SAV-${Date.now()}`;
    const startY = await addPDFHeader(doc, {
      reportId, title: 'Laporan Simpanan Anggota',
      subtitle: `Total: ${savings.length} transaksi · ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
    });
    autoTable(doc, {
      startY,
      head: [['NO', 'ANGGOTA', 'JENIS', 'JUMLAH', 'TANGGAL']],
      body: filteredSavings.map((s: any, i) => [i + 1, s.memberName, s.type || 'Simpanan', `Rp ${(s.amount || 0).toLocaleString('id-ID')}`, new Date(s.date).toLocaleDateString('id-ID')]),
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2.5, minCellHeight: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2, minCellHeight: 6.5, textColor: [15, 23, 42] as [number,number,number] },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 3: { halign: 'right' }, 4: { halign: 'center' } },
      tableLineColor: [226, 232, 240], tableLineWidth: 0.3,
    });
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    if (finalY < 240) addSignatureArea(doc, finalY + 10);
    addPDFFooter(doc);
    return doc;
  };

  const exportLoansPDF = async (): Promise<import('jspdf').default> => {
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
      body: filteredLoans.map((l: any, i) => [i + 1, l.memberName, `Rp ${(l.amount || 0).toLocaleString('id-ID')}`, `${l.duration || 0} bln`,
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
    return doc;
  };

  const exportSHUPDF = async (): Promise<import('jspdf').default> => {
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
    return doc;
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Laporan Simpanan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Rekapitulasi setoran simpanan anggota</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Filter Tanggal:</p>
            <div className="flex gap-2 items-center">
              <input type="date" value={savDateFrom} onChange={e => setSavDateFrom(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none" />
              <span className="text-slate-400 text-xs">—</span>
              <input type="date" value={savDateTo} onChange={e => setSavDateTo(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none" />
            </div>
            <p className="text-xs text-slate-400">{filteredSavings.length} dari {savings.length} transaksi</p>
          </div>
          <button onClick={() => { setRpPreviewType('savings'); setRpPreviewOpen(true); }} disabled={loading || filteredSavings.length === 0}
            className="w-full py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Download size={18} /> Unduh PDF
          </button>
        </div>

        {/* Laporan Pinjaman */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
              <HandCoins size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Laporan Pinjaman</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Data pengajuan dan persetujuan pinjaman</p>
            </div>
          </div>
          <div className="space-y-2">
            <select value={loanStatus} onChange={e => setLoanStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none">
              <option value="">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="paid_off">Lunas</option>
              <option value="rejected">Ditolak</option>
            </select>
            <p className="text-xs font-medium text-slate-500">Filter Tanggal:</p>
            <div className="flex gap-2 items-center">
              <input type="date" value={loanDateFrom} onChange={e => setLoanDateFrom(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none" />
              <span className="text-slate-400 text-xs">—</span>
              <input type="date" value={loanDateTo} onChange={e => setLoanDateTo(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none" />
            </div>
            <p className="text-xs text-slate-400">{filteredLoans.length} dari {loans.length} pinjaman</p>
          </div>
          <button onClick={() => { setRpPreviewType('loans'); setRpPreviewOpen(true); }} disabled={loading || filteredLoans.length === 0}
            className="w-full py-2.5 bg-slate-900 dark:bg-amber-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Download size={18} /> Unduh PDF
          </button>
        </div>

        {/* Laporan SHU */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-full flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Laporan SHU</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Estimasi Sisa Hasil Usaha (SHU) koperasi berdasarkan total simpanan dan pinjaman aktif.</p>
          </div>
          <button onClick={() => { setRpPreviewType('shu'); setRpPreviewOpen(true); }} disabled={loading}
            className="mt-auto w-full py-2.5 bg-slate-900 dark:bg-purple-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Download size={18} /> Unduh PDF
          </button>
        </div>
      </div>

      <ReportPreviewModal
        isOpen={rpPreviewOpen}
        onClose={() => setRpPreviewOpen(false)}
        title={rpPreviewType === 'savings' ? 'Laporan Simpanan' : rpPreviewType === 'loans' ? 'Laporan Pinjaman' : 'Laporan SHU'}
        generatePDF={rpPreviewType === 'savings' ? exportSavingsPDF : rpPreviewType === 'loans' ? exportLoansPDF : exportSHUPDF}
        pdfFilename={`laporan-${rpPreviewType}-${Date.now()}.pdf`}
        excelData={{
          headers: rpPreviewType === 'savings'
            ? ['NO','ANGGOTA','JENIS','JUMLAH','TANGGAL']
            : rpPreviewType === 'loans'
              ? ['NO','ANGGOTA','JUMLAH','TENOR','BUNGA','STATUS']
              : ['NO','ANGGOTA','SIMPANAN','ESTIMASI SHU'],
          rows: rpPreviewType === 'savings'
            ? filteredSavings.map((s: any, i: number) => [i+1, s.memberName||'-', s.type||'-', `Rp ${(s.amount||0).toLocaleString('id-ID')}`, s.date ? new Date(s.date).toLocaleDateString('id-ID') : '-']) as (string|number)[][]
            : rpPreviewType === 'loans'
              ? filteredLoans.map((l: any, i: number) => [i+1, l.memberName||'-', `Rp ${(l.amount||0).toLocaleString('id-ID')}`, `${l.duration||0} bln`, `${l.interest_rate||0}%`, l.status||'-']) as (string|number)[][]
              : [],
          filename: `laporan-${rpPreviewType}-${Date.now()}.xlsx`,
          onDownload: () => {},
        }}
      />
    </motion.div>
  );
}