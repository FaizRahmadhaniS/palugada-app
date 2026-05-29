import React, { useState, useEffect } from 'react';
import { Download, Search, Printer, FileText, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addPDFHeader, addPDFFooter, fmt } from '../utils/pdfHelper';

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
    const color: [number, number, number] = [16, 185, 129];
    const startY = await addPDFHeader(doc, {
      reportId: `MEM-${user.id.substring(0, 6)}-${Date.now()}`,
      title: 'Riwayat Transaksi Pribadi',
      subtitle: `Anggota: ${user.name} | ${user.email}`,
      accentColor: color,
      printedBy: user.name
    });

    const totalIncome = history.filter(h => !['Withdrawal','Penarikan'].includes(h.type)).reduce((s, h) => s + (h.amount || 0), 0);
    const totalOut = history.filter(h => ['Withdrawal','Penarikan'].includes(h.type)).reduce((s, h) => s + (h.amount || 0), 0);

    autoTable(doc, {
      startY,
      head: [['NO', 'TANGGAL', 'JENIS TRANSAKSI', 'STATUS', 'JUMLAH (Rp)']],
      body: history.map((h, i) => [i + 1, fmtDate(h.date), h.type || 'Simpanan', h.status || 'success', fmt(h.amount)]),
      foot: [
        ['', '', 'TOTAL MASUK', '', fmt(totalIncome)],
        ['', '', 'TOTAL KELUAR', '', fmt(totalOut)],
      ],
      headStyles: { fillColor: color, textColor: [255, 255, 255] as [number,number,number], fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2.5, minCellHeight: 8 },
      footStyles: { fillColor: [15, 23, 42] as [number,number,number], textColor: [255, 255, 255] as [number,number,number], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2, minCellHeight: 6.5, textColor: [15, 23, 42] as [number,number,number] },
      alternateRowStyles: { fillColor: [240, 253, 244] as [number,number,number] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 28 },
        3: { halign: 'center', cellWidth: 24 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: 35 }
      },
      tableLineColor: [226, 232, 240] as [number,number,number],
      tableLineWidth: 0.3,
      margin: { left: 14, right: 14 }
    });

    addPDFFooter(doc, color);
    doc.save(`laporan-saya-${Date.now()}.pdf`);
  };

  const handlePrint = (t: any) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Bukti Transaksi</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; display: flex; justify-content: center; padding: 30px 16px; }
      .page { background: #fff; width: 380px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.1); }
      .header-stripe { background: #0f172a; padding: 8px 16px; text-align: center; }
      .header-stripe p { color: rgba(255,255,255,.7); font-size: 9px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
      .header-main { background: linear-gradient(135deg, #10b981, #059669); padding: 20px 20px 16px; display: flex; align-items: center; gap: 14px; }
      .logo-box { background: #fff; border-radius: 8px; padding: 8px 10px; text-align: center; flex-shrink: 0; }
      .logo-box .univ { font-size: 6px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: .03em; }
      .logo-box .upb { font-size: 16px; font-weight: 900; color: #0f172a; line-height: 1; }
      .logo-box .pelita { font-size: 5.5px; color: #64748b; font-weight: 700; text-transform: uppercase; }
      .app-info h1 { color: #fff; font-size: 20px; font-weight: 900; letter-spacing: -.02em; }
      .app-info p { color: rgba(255,255,255,.75); font-size: 10px; margin-top: 2px; }
      .title-bar { background: #0f172a; padding: 10px 20px; text-align: center; }
      .title-bar h2 { color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
      .body { padding: 20px; }
      .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; align-items: flex-start; gap: 12px; }
      .row:last-child { border-bottom: none; }
      .row .label { font-size: 11px; color: #64748b; font-weight: 500; }
      .row .value { font-size: 12px; color: #0f172a; font-weight: 700; text-align: right; max-width: 200px; word-break: break-all; }
      .total-row { background: #f0fdf4; border-radius: 8px; padding: 14px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center; }
      .total-row .label { font-size: 12px; color: #059669; font-weight: 700; text-transform: uppercase; }
      .total-row .value { font-size: 20px; color: #059669; font-weight: 900; }
      .status-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; background: #f0fdf4; color: #059669; border: 1px solid #86efac; text-transform: uppercase; }
      .footer { background: #0f172a; padding: 12px 20px; text-align: center; }
      .footer p { color: rgba(255,255,255,.5); font-size: 8.5px; line-height: 1.6; }
      .footer .brand { color: #10b981; font-weight: 700; }
      @media print { body { padding: 0; background: #fff; } .page { box-shadow: none; } }
    </style></head>
    <body><div class="page">
      <div class="header-stripe">
        <p>Universitas Pelita Bangsa — Kelompok 7 Pemrograman Web 2</p>
      </div>
      <div class="header-main">
        <div class="logo-box">
          <div class="univ">Univ.</div>
          <div class="upb">UPB</div>
          <div class="pelita">Pelita Bangsa</div>
        </div>
        <div class="app-info">
          <h1>PALUGADA</h1>
          <p>Sistem Manajemen Koperasi Digital</p>
        </div>
      </div>
      <div class="title-bar"><h2>Bukti Transaksi</h2></div>
      <div class="body">
        <div class="row"><span class="label">No. Transaksi</span><span class="value">${t.id ? t.id.substring(0, 12).toUpperCase() : 'TXN-' + Date.now()}</span></div>
        <div class="row"><span class="label">Tanggal</span><span class="value">${fmtDate(t.date)}</span></div>
        <div class="row"><span class="label">Nama Anggota</span><span class="value">${user.name}</span></div>
        <div class="row"><span class="label">Jenis Transaksi</span><span class="value">${t.type || 'Simpanan'}</span></div>
        <div class="row"><span class="label">Status</span><span class="value"><span class="status-badge">${t.status || 'success'}</span></span></div>
        <div class="total-row">
          <span class="label">Total</span>
          <span class="value">${fmt(t.amount)}</span>
        </div>
      </div>
      <div class="footer">
        <p>Dokumen ini diterbitkan secara resmi oleh<br/>
        <span class="brand">Sistem PALUGADA</span> — Koperasi Digital Universitas Pelita Bangsa<br/>
        Dicetak: ${new Date().toLocaleString('id-ID')}</p>
      </div>
    </div>
    <script>window.onload=()=>{ setTimeout(()=>window.print(), 400); }</script>
    </body></html>`);
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

      {/* Filter bar */}
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