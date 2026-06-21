import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users, FileText, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addPDFHeader, addPDFFooter, addSignatureArea } from '../utils/pdfHelper';
import ReportPreviewModal from '../components/ReportPreviewModal';

const fmt = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

interface MonthlyData {
  totalSavings: number;
  totalWithdrawals: number;
  totalLoans: number;
  totalRepayments: number;
  totalIncome: number;
  totalExpense: number;
  newMembers: number;
  transactionCount: number;
  netCashflow: number;
}

export default function MonthlyReports({ user }: { user: any }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchReport = async (month: number, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}&year=${year}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Gagal memuat data (${res.status})`);
      const json = await res.json();
      setData({
        totalSavings:     json.totalSavings     || 0,
        totalWithdrawals: json.totalWithdrawals || 0,
        totalLoans:       json.totalLoans       || 0,
        totalRepayments:  json.totalRepayments  || 0,
        totalIncome:      json.totalIncome      || 0,
        totalExpense:     json.totalExpense     || 0,
        newMembers:       json.newMembers       || 0,
        transactionCount: json.transactionCount || 0,
        netCashflow:      json.netCashflow      || 0,
      });
    } catch (e: any) {
      setError(e.message || 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(selectedMonth, selectedYear); }, [selectedMonth, selectedYear]);

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  const generatePDF = async (): Promise<jsPDF> => {
    const doc = new jsPDF();
    const color: [number, number, number] = [16, 185, 129];
    const periodLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
    const startY = await addPDFHeader(doc, {
      reportId: `RPT-${selectedYear}${String(selectedMonth).padStart(2,'0')}-${Date.now()}`,
      title: 'Laporan Bulanan Koperasi',
      subtitle: `Periode: ${periodLabel}`,
      accentColor: color,
      printedBy: user?.name,
    });
    autoTable(doc, {
      startY,
      head: [['KETERANGAN', 'JUMLAH']],
      body: [
        ['Total Simpanan Masuk',        fmt(data?.totalSavings     || 0)],
        ['Total Penarikan',             fmt(data?.totalWithdrawals || 0)],
        ['Total Pinjaman Dicairkan',    fmt(data?.totalLoans       || 0)],
        ['Total Angsuran Diterima',     fmt(data?.totalRepayments  || 0)],
        ['Pemasukan Operasional',       fmt(data?.totalIncome      || 0)],
        ['Pengeluaran Operasional',     fmt(data?.totalExpense     || 0)],
        ['Anggota Baru',               `${data?.newMembers || 0} orang`],
        ['Jumlah Transaksi',           `${data?.transactionCount || 0} transaksi`],
        ['Net Cashflow',                fmt(data?.netCashflow      || 0)],
      ],
      headStyles: { fillColor: color, textColor: [255,255,255] as [number,number,number], fontSize: 9, fontStyle: 'bold', halign: 'center', cellPadding: 3 },
      bodyStyles: { fontSize: 9, cellPadding: 3, textColor: [15,23,42] as [number,number,number] },
      alternateRowStyles: { fillColor: [240,253,244] as [number,number,number] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 100 }, 1: { halign: 'right', cellWidth: 80 } },
      tableLineColor: [226,232,240] as [number,number,number], tableLineWidth: 0.3,
      margin: { left: 14, right: 14 },
    });
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    if (finalY < 220) addSignatureArea(doc, finalY + 12);
    addPDFFooter(doc, color);
    return doc;
  };

  const stats = [
    { label: 'Total Simpanan',      value: fmt(data?.totalSavings     || 0), icon: TrendingUp,   color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Total Penarikan',     value: fmt(data?.totalWithdrawals || 0), icon: TrendingDown, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    { label: 'Pinjaman Cair',       value: fmt(data?.totalLoans       || 0), icon: DollarSign,   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { label: 'Angsuran Diterima',   value: fmt(data?.totalRepayments  || 0), icon: DollarSign,   color: '#0891b2', bg: '#f0f9ff', border: '#bae6fd' },
    { label: 'Pemasukan Ops.',      value: fmt(data?.totalIncome      || 0), icon: TrendingUp,   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { label: 'Pengeluaran Ops.',    value: fmt(data?.totalExpense     || 0), icon: TrendingDown, color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' },
    { label: 'Anggota Baru',        value: `${data?.newMembers || 0} orang`, icon: Users,       color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
    { label: 'Total Transaksi',     value: `${data?.transactionCount || 0}`, icon: FileText,    color: '#374151', bg: '#f9fafb', border: '#e5e7eb' },
  ];

  return (
    <div style={{ padding: '24px', width: '100%', maxWidth: 1100 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight:800, color:'#111827', margin:0 }}>Laporan Bulanan</h1>
          <p style={{ fontSize:13, color:'#6b7280', marginTop:4 }}>Ringkasan aktivitas keuangan koperasi per bulan</p>
        </div>
        <button onClick={() => setPreviewOpen(true)} disabled={!data || loading}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:(!data||loading)?'#9ca3af':'#059669', color:'#fff', border:'none', borderRadius:12, fontSize:13, fontWeight:700, cursor:(!data||loading)?'not-allowed':'pointer' }}>
          <FileText size={16} /> Unduh PDF
        </button>
      </div>

      {/* Period Selector */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28, background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:14, padding:'14px 20px', width:'fit-content', boxShadow:'0 1px 4px rgba(0,0,0,.05)', flexWrap:'wrap' }}>
        <button onClick={prevMonth} style={{ padding:8, border:'1.5px solid #e5e7eb', borderRadius:9, background:'#f9fafb', cursor:'pointer', display:'flex', alignItems:'center' }}>
          <ChevronLeft size={16} color="#374151" />
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:180, justifyContent:'center' }}>
          <Calendar size={18} color="#059669" />
          <span style={{ fontSize:16, fontWeight:800, color:'#111827' }}>{MONTHS[selectedMonth-1]} {selectedYear}</span>
        </div>
        <button onClick={nextMonth} style={{ padding:8, border:'1.5px solid #e5e7eb', borderRadius:9, background:'#f9fafb', cursor:'pointer', display:'flex', alignItems:'center' }}>
          <ChevronRight size={16} color="#374151" />
        </button>
        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
          style={{ padding:'8px 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, background:'#f9fafb', outline:'none', cursor:'pointer', color:'#374151' }}>
          {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
          style={{ padding:'8px 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, background:'#f9fafb', outline:'none', cursor:'pointer', color:'#374151' }}>
          {Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={() => fetchReport(selectedMonth, selectedYear)}
          style={{ padding:'8px 12px', border:'1.5px solid #e5e7eb', borderRadius:9, background:'#f9fafb', cursor:'pointer', display:'flex', alignItems:'center' }}>
          <RefreshCw size={14} color="#6b7280" />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:80, gap:16 }}>
          <Loader2 size={36} color="#059669" style={{ animation:'spin 1s linear infinite' }} />
          <p style={{ fontSize:14, color:'#6b7280' }}>Memuat laporan {MONTHS[selectedMonth-1]} {selectedYear}...</p>
        </div>
      ) : error ? (
        <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:14, padding:24, textAlign:'center' }}>
          <p style={{ fontSize:14, color:'#dc2626', fontWeight:600, marginBottom:12 }}>⚠ {error}</p>
          <button onClick={() => fetchReport(selectedMonth, selectedYear)}
            style={{ padding:'8px 20px', background:'#059669', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Coba Lagi
          </button>
        </div>
      ) : data ? (
        <>
          {/* Net Cashflow Banner */}
          <div style={{
            background: data.netCashflow >= 0 ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
            borderRadius:16, padding:'20px 28px', marginBottom:24,
            display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12,
            boxShadow:'0 4px 16px rgba(0,0,0,.12)',
          }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.75)', textTransform:'uppercase', letterSpacing:'.06em', margin:0 }}>
                Net Cashflow — {MONTHS[selectedMonth-1]} {selectedYear}
              </p>
              <p style={{ fontSize:'clamp(22px,4vw,32px)', fontWeight:900, color:'#fff', margin:'6px 0 0', lineHeight:1 }}>
                {fmt(data.netCashflow)}
              </p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.8)', margin:0 }}>{data.transactionCount} transaksi</p>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.8)', margin:'4px 0 0' }}>{data.newMembers} anggota baru</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
            {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:14, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:36, height:36, background:'#fff', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
                    <Icon size={18} color={color} />
                  </div>
                  <p style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.04em', margin:0 }}>{label}</p>
                </div>
                <p style={{ fontSize:'clamp(14px,2vw,18px)', fontWeight:800, color, margin:0 }}>{value}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <ReportPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Laporan Bulanan — ${MONTHS[selectedMonth-1]} ${selectedYear}`}
        generatePDF={generatePDF}
        pdfFilename={`laporan-bulanan-${selectedYear}-${String(selectedMonth).padStart(2,'0')}.pdf`}
        excelData={{
          headers: ['KETERANGAN', 'JUMLAH'],
          rows: data ? [
            ['Total Simpanan',      fmt(data.totalSavings)],
            ['Total Penarikan',     fmt(data.totalWithdrawals)],
            ['Pinjaman Dicairkan',  fmt(data.totalLoans)],
            ['Angsuran Diterima',   fmt(data.totalRepayments)],
            ['Pemasukan Ops.',      fmt(data.totalIncome)],
            ['Pengeluaran Ops.',    fmt(data.totalExpense)],
            ['Anggota Baru',        `${data.newMembers} orang`],
            ['Total Transaksi',     `${data.transactionCount}`],
            ['Net Cashflow',        fmt(data.netCashflow)],
          ] as (string|number)[][] : [],
          filename: `laporan-bulanan-${selectedYear}-${String(selectedMonth).padStart(2,'0')}.xlsx`,
          onDownload: () => {},
        }}
      />
    </div>
  );
}