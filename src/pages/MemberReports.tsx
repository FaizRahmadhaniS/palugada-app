import React, { useState, useEffect } from 'react';
import { Download, Search, Printer, FileText, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import { addPDFHeader, addPDFFooter, addSignatureArea } from '../utils/pdfHelper';
import autoTable from 'jspdf-autotable';

const fmt = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export default function MemberReports({ user }: { user: any }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    if (!user?.id) { setError('User tidak ditemukan'); setLoading(false); return; }
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/member_payments/${user.id}`, { credentials: 'include' });
        if (res.ok) {
          const ct = res.headers.get("content-type");
          if (ct && ct.includes("application/json")) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) { setHistory(data); setLoading(false); return; }
          }
        }
        const savRes = await fetch('/api/savings', { credentials: 'include' });
        if (savRes.ok) {
          const savData = await savRes.json();
          if (Array.isArray(savData)) {
            setHistory(savData.map((t: any) => ({
              id: t.id, date: t.date || t.createdDate,
              type: t.description || t.type || 'Simpanan',
              amount: t.amount, status: t.status || 'Success'
            })));
          }
        }
      } catch (err: any) { setError(err.message || 'Gagal memuat laporan'); }
      finally { setLoading(false); }
    };
    loadHistory();
  }, [user?.id]);

  const exportPersonalPDF = async () => {
    const doc = new jsPDF();
    const startY = await addPDFHeader(doc, {
      reportId: `REP-MEM-${Date.now()}`,
      title: 'Riwayat Transaksi Pribadi',
      subtitle: `Anggota: ${user.name}`,
      printedBy: user.name
    });
    autoTable(doc, {
      startY,
      head: [['NO', 'TANGGAL', 'JENIS TRANSAKSI', 'STATUS', 'JUMLAH']],
      body: history.map((h, i) => [i + 1, fmtDate(h.date), h.type, h.status, fmt(h.amount)]),
      headStyles: { fillColor: [16, 185, 129] as [number,number,number], textColor: [255, 255, 255] as [number,number,number], fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2.5, minCellHeight: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2, minCellHeight: 6.5, textColor: [15, 23, 42] as [number,number,number] },
      alternateRowStyles: { fillColor: [240, 253, 244] as [number,number,number] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 28 },
        3: { halign: 'center', cellWidth: 24 },
        4: { halign: 'right', cellWidth: 35 }
      },
      tableLineColor: [226, 232, 240] as [number,number,number],
      tableLineWidth: 0.3,
      margin: { left: 14, right: 14 }
    });
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    if (finalY < 240) addSignatureArea(doc, finalY + 8);
    addPDFFooter(doc);
    doc.save(`laporan-saya-${Date.now()}.pdf`);
  };

  const handlePrint = (t: any) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Bukti</title><style>body{font-family:monospace;padding:40px}
    .box{border:1px dashed #ccc;padding:30px;max-width:400px;margin:0 auto}
    .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0}
    .total{font-weight:bold;font-size:18px;padding-top:12px}
    </style></head><body><div class="box">
    <h2 style="text-align:center">PALUGADA COOP</h2>
    <p style="text-align:center;color:#666">Koperasi Simpan Pinjam</p>
    <div class="row"><span>Tanggal</span><span>${fmtDate(t.date)}</span></div>
    <div class="row"><span>Anggota</span><span>${user.name}</span></div>
    <div class="row"><span>Jenis</span><span>${t.type}</span></div>
    <div class="row"><span>Status</span><span>${t.status}</span></div>
    <div class="row total"><span>TOTAL</span><span>${fmt(t.amount)}</span></div>
    </div><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  const filtered = history.filter(h => {
    const matchSearch = (h.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || (h.type || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filterStatus || (h.status || '').toLowerCase() === filterStatus;
    const d = (h.date || '').split('T')[0];
    const matchFrom = !filterDateFrom || d >= filterDateFrom;
    const matchTo = !filterDateTo || d <= filterDateTo;
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  return (
    <div style={{ padding: '20px 16px', width: '100%' }}>
      <style>{`
        @keyframes sp { to { transform: rotate(360deg); } }
        .mr-card { display: none; }
        @media (max-width: 640px) {
          .mr-table-wrap { display: none; }
          .mr-card { display: flex; flex-direction: column; gap: 10px; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:'clamp(18px,3vw,26px)',fontWeight:800,color:'#111827',margin:0 }}>Riwayat & Laporan</h1>
          <p style={{ fontSize:13,color:'#6b7280',marginTop:4 }}>Riwayat transaksi dan bukti pembayaran Anda</p>
        </div>
        <button onClick={exportPersonalPDF}
          style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 18px',background:'#059669',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0 }}>
          <Download size={16}/> Unduh PDF
        </button>
      </div>

      {/* Search + Filter */}
      <div style={{ display:'flex',flexWrap:'wrap',gap:10,marginBottom:16,alignItems:'center' }}>
        <div style={{ position:'relative' }}>
          <Search size={15} style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'#9ca3af' }}/>
          <input type="text" placeholder="Cari transaksi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ padding:'9px 12px 9px 36px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13,background:'#f9fafb',outline:'none',width:200 }}/>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding:'9px 12px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13,background:'#f9fafb',outline:'none',color:'#374151' }}>
          <option value="">Semua Status</option>
          <option value="success">Berhasil</option>
          <option value="pending">Pending</option>
          <option value="failed">Gagal</option>
        </select>
        <span style={{ fontSize:12,color:'#9ca3af',fontWeight:600 }}>Tanggal:</span>
        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
          style={{ padding:'9px 10px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13,background:'#f9fafb',outline:'none' }} />
        <span style={{ color:'#9ca3af' }}>—</span>
        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
          style={{ padding:'9px 10px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:13,background:'#f9fafb',outline:'none' }} />
        {(filterStatus || filterDateFrom || filterDateTo) && (
          <button onClick={() => { setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            style={{ padding:'6px 12px',background:'#fee2e2',color:'#ef4444',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer' }}>✕ Reset</button>
        )}
        <span style={{ fontSize:12,color:'#9ca3af',marginLeft:'auto' }}>{filtered.length} transaksi</span>
      </div>

      {loading ? (
        <div style={{ display:'flex',justifyContent:'center',padding:48 }}>
          <div style={{ width:28,height:28,border:'3px solid #e5e7eb',borderTop:'3px solid #059669',borderRadius:'50%',animation:'sp .8s linear infinite' }}/>
        </div>
      ) : error ? (
        <div style={{ background:'#fff1f2',border:'1.5px solid #fecdd3',borderRadius:14,padding:'24px',textAlign:'center' }}>
          <p style={{ fontSize:14,color:'#be123c',marginBottom:12 }}>{error}</p>
          <button onClick={() => { setLoading(true); setError(null); }}
            style={{ padding:'8px 20px',background:'#059669',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer' }}>Coba Lagi</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center',padding:'48px 20px',background:'#f9fafb',borderRadius:14,border:'1.5px dashed #e5e7eb' }}>
          <FileText size={40} color="#d1d5db" style={{ marginBottom:10 }}/>
          <p style={{ fontSize:14,color:'#9ca3af',fontWeight:500 }}>Belum ada riwayat transaksi</p>
        </div>
      ) : (
        <>
          {/* DESKTOP: Table */}
          <div className="mr-table-wrap" style={{ background:'#fff',borderRadius:14,border:'1.5px solid #f3f4f6',overflow:'hidden',boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',minWidth:500 }}>
                <thead>
                  <tr style={{ background:'#f9fafb',borderBottom:'1.5px solid #f3f4f6' }}>
                    {['Aksi','Tanggal','Jenis Transaksi','Status','Jumlah'].map(h => (
                      <th key={h} style={{ padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.04em',whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h, i) => (
                    <tr key={h.id||i} style={{ borderBottom:'1px solid #f9fafb' }}
                      onMouseEnter={e => (e.currentTarget.style.background='#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                      <td style={{ padding:'12px 16px' }}>
                        <button onClick={() => handlePrint(h)}
                          style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 10px',background:'#f0fdf4',color:'#059669',border:'1px solid #86efac',borderRadius:7,fontSize:11,fontWeight:700,cursor:'pointer' }}>
                          <Printer size={12}/> Cetak
                        </button>
                      </td>
                      <td style={{ padding:'12px 16px',fontSize:13,color:'#6b7280',whiteSpace:'nowrap' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                          <Calendar size={12} color="#9ca3af"/>{fmtDate(h.date)}
                        </div>
                      </td>
                      <td style={{ padding:'12px 16px',fontSize:13,fontWeight:600,color:'#111827',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{h.type}</td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:'#f0fdf4',color:'#059669',border:'1px solid #86efac' }}>{h.status}</span>
                      </td>
                      <td style={{ padding:'12px 16px',fontSize:14,fontWeight:800,color:'#059669',whiteSpace:'nowrap' }}>{fmt(h.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE: Cards */}
          <div className="mr-card">
            {filtered.map((h, i) => (
              <div key={h.id||i} style={{ background:'#fff',border:'1.5px solid #f3f4f6',borderRadius:14,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10,gap:8 }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ fontSize:14,fontWeight:700,color:'#111827',margin:'0 0 4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{h.type}</p>
                    <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                      <Calendar size={11} color="#9ca3af"/>
                      <span style={{ fontSize:12,color:'#6b7280' }}>{fmtDate(h.date)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right',flexShrink:0 }}>
                    <p style={{ fontSize:16,fontWeight:800,color:'#059669',margin:0 }}>{fmt(h.amount)}</p>
                    <span style={{ fontSize:10,fontWeight:700,color:'#059669',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:6,padding:'2px 8px',display:'inline-block',marginTop:4 }}>{h.status}</span>
                  </div>
                </div>
                <button onClick={() => handlePrint(h)}
                  style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px',background:'#f0fdf4',color:'#059669',border:'1.5px solid #86efac',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer' }}>
                  <Printer size={14}/> Cetak Bukti Transaksi
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}