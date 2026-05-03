import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, BarChart3, Download, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const fmt = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;
const fmtShort = (v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : String(v);
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export default function MonthlyReports({ user }: { user: any }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}&year=${year}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Gagal mengambil data');
      setReport(await res.json());
    } catch { setError('Gagal memuat laporan. Coba lagi.'); setReport(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [month, year]);

  const net = (report?.totalSavings || 0) - (report?.totalLoans || 0);
  const chartData = report ? [{ name: MONTHS_SHORT[month-1], Tabungan: report.totalSavings||0, Pinjaman: report.totalLoans||0 }] : [];

  return (
    <div style={{ padding: '24px', width: '100%' }}>
      <style>{`
        @keyframes sp { to { transform: rotate(360deg); } }
        .mr-layout { display: grid; grid-template-columns: 280px 1fr; gap: 20px; align-items: start; }
        .mr-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        .mr-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 1024px) {
          .mr-layout { grid-template-columns: 1fr; }
          .mr-stats { grid-template-columns: repeat(3,1fr); }
        }
        @media (max-width: 640px) {
          .mr-stats { grid-template-columns: 1fr; }
          .mr-summary { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)',borderRadius:16,padding:'24px 28px',marginBottom:24,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12 }}>
        <div>
          <h1 style={{ fontSize:'clamp(20px,3vw,28px)',fontWeight:800,color:'#fff',margin:0,marginBottom:4 }}>Laporan Bulanan</h1>
          <p style={{ fontSize:14,color:'rgba(255,255,255,.8)',margin:0 }}>Analisis transaksi dan performa keuangan koperasi</p>
        </div>
        <span style={{ background:'rgba(255,255,255,.15)',borderRadius:10,padding:'8px 16px',color:'#fff',fontSize:14,fontWeight:700 }}>
          {MONTHS[month-1]} {year}
        </span>
      </div>

      <div className="mr-layout">
        {/* Sidebar: Period selector */}
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <div style={{ background:'#fff',borderRadius:14,border:'1.5px solid #f3f4f6',padding:20,boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
            <h2 style={{ fontSize:14,fontWeight:700,color:'#374151',margin:'0 0 16px' }}>Pilih Periode</h2>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:7 }}>Bulan</label>
                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                  style={{ width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:9,fontSize:14,background:'#f9fafb',outline:'none',cursor:'pointer' }}>
                  {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:7 }}>Tahun</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                  style={{ width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:9,fontSize:14,background:'#f9fafb',outline:'none',cursor:'pointer' }}>
                  {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button onClick={fetchReport}
                style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer' }}>
                <RefreshCw size={14}/> Refresh Data
              </button>
            </div>
          </div>

          {/* Net summary card */}
          {report && !loading && (
            <div style={{ background: net>=0?'#f0fdf4':'#fff1f2', border:`1.5px solid ${net>=0?'#86efac':'#fecdd3'}`, borderRadius:14, padding:20 }}>
              <p style={{ fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.05em',margin:'0 0 8px' }}>Selisih Bersih</p>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                {net >= 0 ? <ArrowUp size={20} color="#059669"/> : <ArrowDown size={20} color="#e11d48"/>}
                <p style={{ fontSize:'clamp(16px,2vw,22px)',fontWeight:800,color:net>=0?'#059669':'#e11d48',margin:0 }}>{net>=0?'+':''}{fmt(net)}</p>
              </div>
              <p style={{ fontSize:12,color:net>=0?'#059669':'#e11d48',margin:'4px 0 0',opacity:.75 }}>{net>=0?'Tabungan > Pinjaman':'Pinjaman > Tabungan'}</p>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          {loading ? (
            <div style={{ display:'flex',justifyContent:'center',alignItems:'center',padding:80,background:'#fff',borderRadius:14,border:'1.5px solid #f3f4f6' }}>
              <div style={{ width:32,height:32,border:'3px solid #e5e7eb',borderTop:'3px solid #3b82f6',borderRadius:'50%',animation:'sp .8s linear infinite' }} />
            </div>
          ) : error ? (
            <div style={{ background:'#fff1f2',border:'1.5px solid #fecdd3',borderRadius:14,padding:'32px',textAlign:'center' }}>
              <p style={{ fontSize:14,color:'#be123c',marginBottom:14 }}>{error}</p>
              <button onClick={fetchReport} style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'10px 20px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer' }}>
                <RefreshCw size={14}/> Coba Lagi
              </button>
            </div>
          ) : report ? (
            <>
              {/* Stats row */}
              <div className="mr-stats">
                {[
                  { l:'Total Tabungan', v:fmt(report.totalSavings), Icon:DollarSign, c:'#059669', bg:'#f0fdf4', bd:'#86efac' },
                  { l:'Total Pinjaman', v:fmt(report.totalLoans), Icon:TrendingUp, c:'#d97706', bg:'#fffbeb', bd:'#fde68a' },
                  { l:'Jumlah Transaksi', v:String(report.transactionCount||0) + ' transaksi', Icon:BarChart3, c:'#3b82f6', bg:'#eff6ff', bd:'#bfdbfe' },
                ].map(({ l,v,Icon,c,bg,bd }) => (
                  <div key={l} style={{ background:bg,border:`1.5px solid ${bd}`,borderRadius:14,padding:'16px 18px',display:'flex',alignItems:'center',gap:12 }}>
                    <div style={{ width:40,height:40,borderRadius:11,background:c+'20',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      <Icon size={20} color={c} />
                    </div>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.04em',margin:0,marginBottom:4 }}>{l}</p>
                      <p style={{ fontSize:'clamp(13px,1.5vw,17px)',fontWeight:800,color:'#111827',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{v}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div style={{ background:'#fff',borderRadius:14,border:'1.5px solid #f3f4f6',padding:'20px',boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
                <h3 style={{ fontSize:14,fontWeight:700,color:'#374151',margin:'0 0 16px' }}>Komparasi Tabungan vs Pinjaman — {MONTHS[month-1]} {year}</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top:0,right:0,left:-10,bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize:12, fill:'#6b7280' }} />
                    <YAxis tickFormatter={fmtShort} tick={{ fontSize:11, fill:'#6b7280' }} width={56} />
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius:8, border:'1px solid #e5e7eb', fontSize:13 }} />
                    <Legend wrapperStyle={{ fontSize:13 }} />
                    <Bar dataKey="Tabungan" fill="#10b981" radius={[6,6,0,0]} />
                    <Bar dataKey="Pinjaman" fill="#f59e0b" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed summary */}
              <div style={{ background:'#fff',borderRadius:14,border:'1.5px solid #f3f4f6',padding:'20px',boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
                  <h3 style={{ fontSize:14,fontWeight:700,color:'#374151',margin:0 }}>Ringkasan Laporan — {MONTHS[month-1]} {year}</h3>
                  <button style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:'#3b82f6',color:'#fff',border:'none',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer' }}>
                    <Download size={13}/> Export PDF
                  </button>
                </div>
                <div className="mr-summary">
                  {[
                    { l:'Pemasukan (Tabungan)', v:fmt(report.totalSavings), c:'#059669', bg:'#f0fdf4', bd:'#86efac' },
                    { l:'Pengeluaran (Pinjaman)', v:fmt(report.totalLoans), c:'#d97706', bg:'#fffbeb', bd:'#fde68a' },
                  ].map(({ l,v,c,bg,bd }) => (
                    <div key={l} style={{ background:bg,border:`1.5px solid ${bd}`,borderRadius:10,padding:'16px 18px' }}>
                      <p style={{ fontSize:12,fontWeight:600,color:'#6b7280',margin:'0 0 6px' }}>{l}</p>
                      <p style={{ fontSize:'clamp(14px,1.8vw,20px)',fontWeight:800,color:c,margin:0 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}