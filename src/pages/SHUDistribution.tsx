import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, Users, Plus, X, FileText, BookOpen, Award, Info, Printer, ChevronDown } from 'lucide-react';

const fmt = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;
const fmtShort = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}jt` : n >= 1000 ? `${(n/1000).toFixed(0)}rb` : String(n);

export default function SHUDistribution({ user }: { user: any }) {
  const [distributions, setDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCalc, setShowCalc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'formal' | 'nonformal'>('formal');
  const [calc, setCalc] = useState({ period: new Date().toISOString().substring(0, 7), totalProfit: '', distributionRate: 100 });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchData = () => {
    setLoading(true);
    fetch('/api/shu/distribution', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setDistributions(Array.isArray(d) ? d : []))
      .catch(() => setDistributions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleCalculate = async () => {
    if (!calc.totalProfit || Number(calc.totalProfit) <= 0) { showToast('Total laba harus lebih dari 0'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/shu/calculate', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: calc.period, totalProfit: Number(calc.totalProfit), distributionRate: calc.distributionRate })
      });
      const data = await res.json();
      if (data.success) { showToast('SHU berhasil dihitung!'); setShowCalc(false); fetchData(); }
      else showToast('Gagal: ' + (data.message || 'Error'));
    } catch { showToast('Gagal menghitung SHU'); }
    setSubmitting(false);
  };

  const grouped = distributions.reduce((acc: Record<string, any[]>, d) => {
    const k = d.period || d.created_at?.substring(0, 7) || 'N/A';
    if (!acc[k]) acc[k] = [];
    acc[k].push(d);
    return acc;
  }, {});
  const totalAll = distributions.reduce((s, d) => s + (d.share_amount || 0), 0);
  const maxShare = distributions.length > 0 ? Math.max(...distributions.map(d => d.share_amount || 0)) : 0;

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = distributions.map((d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${d.member_name || 'Anggota'}</td>
        <td>${d.period || '-'}</td>
        <td>${d.distribution_rate || 0}%</td>
        <td style="font-weight:700;color:#059669">${fmt(d.share_amount)}</td>
      </tr>`).join('');
    w.document.write(`<html><head><title>Laporan SHU Formal</title>
      <style>
        body{font-family:Georgia,serif;padding:40px;color:#111}
        h1{font-size:22px;margin-bottom:4px}
        .sub{color:#666;font-size:13px;margin-bottom:20px}
        .meta{border:1px solid #ddd;padding:12px 16px;border-radius:6px;margin-bottom:20px;font-size:13px;background:#f9f9f9}
        .meta span{font-weight:700}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th{background:#065f46;color:#fff;padding:10px 12px;text-align:left}
        td{padding:9px 12px;border-bottom:1px solid #eee}
        tr:nth-child(even) td{background:#f9fafb}
        .total{font-weight:700;font-size:15px;color:#059669}
        footer{margin-top:30px;font-size:11px;color:#999;text-align:center}
        @media print{button{display:none}}
      </style></head><body>
      <h1>Laporan Distribusi SHU — Koperasi Palugada</h1>
      <p class="sub">Sisa Hasil Usaha — Dokumen Resmi berdasarkan UU No. 25 Tahun 1992</p>
      <div class="meta">
        Total Terdistribusi: <span>${fmt(totalAll)}</span> &nbsp;·&nbsp;
        Jumlah Anggota: <span>${distributions.length} orang</span> &nbsp;·&nbsp;
        Periode: <span>${Object.keys(grouped).join(', ') || '-'}</span> &nbsp;·&nbsp;
        Dicetak: <span>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
      <table>
        <thead><tr><th>No</th><th>Nama Anggota</th><th>Periode</th><th>% Distribusi</th><th>Nominal SHU</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="4" style="font-weight:700;padding:10px 12px">TOTAL</td><td class="total" style="padding:10px 12px">${fmt(totalAll)}</td></tr></tfoot>
      </table>
      <footer>Dokumen ini merupakan laporan resmi koperasi · Palugada Koperasi Digital</footer>
      <script>window.onload=()=>window.print()</script>
      </body></html>`);
    w.document.close();
  };

  const TAB = ({ id, label, icon }: { id: 'formal' | 'nonformal', label: string, icon: any }) => (
    <button onClick={() => setActiveTab(id)} style={{
      flex: 1, padding: '12px 16px', border: 'none', cursor: 'pointer',
      fontSize: 13, fontWeight: 700, borderRadius: 10, display: 'flex',
      alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all .2s',
      background: activeTab === id
        ? (id === 'formal' ? 'linear-gradient(135deg,#0f1c2e,#1a3a5c)' : 'linear-gradient(135deg,#059669,#0d9488)')
        : 'transparent',
      color: activeTab === id ? '#fff' : '#6b7280',
      boxShadow: activeTab === id ? '0 4px 12px rgba(0,0,0,.15)' : 'none',
    }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{ padding: '24px', width: '100%' }}>
      <style>{`
        @keyframes sp { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .shu-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .shu-calc-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .shu-tab-content { animation: fadeIn .3s ease; }
        .shu-card { display: none; }
        @media (max-width: 768px) {
          .shu-stats { grid-template-columns: 1fr; }
          .shu-calc-grid { grid-template-columns: 1fr; }
          .shu-table-wrap { display: none; }
          .shu-card { display: flex; flex-direction: column; gap: 10px; }
        }
      `}</style>

      {toast && <div style={{ position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:999,background:'#059669',color:'#fff',padding:'10px 20px',borderRadius:10,fontSize:13,fontWeight:600,boxShadow:'0 4px 16px rgba(0,0,0,.2)',maxWidth:'85vw',textAlign:'center' }}>{toast}</div>}

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#059669,#0d9488)',borderRadius:16,padding:'24px 28px',marginBottom:24 }}>
        <h1 style={{ fontSize:'clamp(20px,3vw,28px)',fontWeight:800,color:'#fff',margin:0,marginBottom:4 }}>Distribusi SHU</h1>
        <p style={{ fontSize:14,color:'rgba(255,255,255,.8)',margin:0 }}>Sisa Hasil Usaha — pembagian profit koperasi kepada anggota</p>
      </div>

      {/* Stats */}
      <div className="shu-stats" style={{ marginBottom: 20 }}>
        {[
          { l:'Total Terdistribusi', v:fmt(totalAll), Icon:DollarSign, c:'#059669', bg:'#f0fdf4', bd:'#86efac' },
          { l:'Periode Aktif', v:String(Object.keys(grouped).length) + ' periode', Icon:Calendar, c:'#3b82f6', bg:'#eff6ff', bd:'#bfdbfe' },
          { l:'Rata-rata/Anggota', v:fmt(distributions.length > 0 ? Math.round(totalAll/distributions.length) : 0), Icon:TrendingUp, c:'#d97706', bg:'#fffbeb', bd:'#fde68a' },
        ].map(({ l,v,Icon,c,bg,bd }) => (
          <div key={l} style={{ background:bg,border:`1.5px solid ${bd}`,borderRadius:14,padding:'18px 20px',display:'flex',alignItems:'center',gap:14 }}>
            <div style={{ width:44,height:44,borderRadius:12,background:c+'20',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Icon size={22} color={c} />
            </div>
            <div>
              <p style={{ fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.04em',margin:0,marginBottom:4 }}>{l}</p>
              <p style={{ fontSize:'clamp(14px,1.8vw,20px)',fontWeight:800,color:'#111827',margin:0 }}>{v}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hitung SHU */}
      {user?.role === 'admin' && (
        <div style={{ background:'#fff',borderRadius:14,border:'1.5px solid #f3f4f6',padding:20,marginBottom:20,boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
          <button onClick={() => setShowCalc(!showCalc)}
            style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 24px',background:showCalc?'#6b7280':'#059669',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer' }}>
            {showCalc ? <><X size={15}/>Tutup Kalkulator</> : <><Plus size={15}/>Hitung SHU Baru</>}
          </button>
          {showCalc && (
            <div style={{ marginTop:16,padding:16,background:'#f0fdf4',borderRadius:12,border:'1.5px solid #86efac' }}>
              <h3 style={{ fontSize:14,fontWeight:700,color:'#065f46',margin:'0 0 14px' }}>Perhitungan SHU Baru</h3>
              <div className="shu-calc-grid" style={{ marginBottom:14 }}>
                <div>
                  <label style={{ fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6 }}>Periode</label>
                  <input type="month" value={calc.period} onChange={e => setCalc({...calc,period:e.target.value})}
                    style={{ width:'100%',padding:'10px 12px',border:'1.5px solid #d1fae5',borderRadius:9,fontSize:14,background:'#fff',outline:'none' }} />
                </div>
                <div>
                  <label style={{ fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6 }}>Total Laba (Rp)</label>
                  <input type="number" placeholder="Contoh: 5000000" value={calc.totalProfit} onChange={e => setCalc({...calc,totalProfit:e.target.value})}
                    style={{ width:'100%',padding:'10px 12px',border:'1.5px solid #d1fae5',borderRadius:9,fontSize:14,background:'#fff',outline:'none' }} />
                </div>
                <div>
                  <label style={{ fontSize:12,fontWeight:600,color:'#374151',display:'block',marginBottom:6 }}>% Distribusi</label>
                  <select value={calc.distributionRate} onChange={e => setCalc({...calc,distributionRate:Number(e.target.value)})}
                    style={{ width:'100%',padding:'10px 12px',border:'1.5px solid #d1fae5',borderRadius:9,fontSize:14,background:'#fff',outline:'none' }}>
                    <option value={100}>100% — Semua Anggota</option>
                    <option value={80}>80% — Anggota Aktif</option>
                    <option value={50}>50% — Pembagi Merata</option>
                  </select>
                </div>
              </div>
              <div style={{ display:'flex',gap:8 }}>
                <button onClick={handleCalculate} disabled={submitting}
                  style={{ padding:'11px 24px',background:'#059669',color:'#fff',border:'none',borderRadius:9,fontSize:14,fontWeight:700,cursor:submitting?'not-allowed':'pointer',opacity:submitting?.7:1 }}>
                  {submitting?'Menghitung...':'Hitung & Simpan'}
                </button>
                <button onClick={() => setShowCalc(false)}
                  style={{ padding:'11px 18px',background:'#f3f4f6',color:'#374151',border:'none',borderRadius:9,fontSize:14,fontWeight:600,cursor:'pointer' }}>
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Toggle */}
      <div style={{ background:'#f3f4f6',borderRadius:14,padding:5,display:'flex',gap:4,marginBottom:20 }}>
        <TAB id="formal" label="SHU Formal" icon={<FileText size={15}/>} />
        <TAB id="nonformal" label="SHU Non-Formal" icon={<BookOpen size={15}/>} />
      </div>

      {/* ======================== TAB FORMAL ======================== */}
      {activeTab === 'formal' && (
        <div className="shu-tab-content">


          {/* Print button */}
          <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:14 }}>
            <button onClick={handlePrint}
              style={{ display:'flex',alignItems:'center',gap:7,padding:'10px 18px',background:'#0f1c2e',color:'#e8c97a',border:'1.5px solid rgba(201,168,76,.3)',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer' }}>
              <Printer size={15}/> Cetak Laporan Resmi
            </button>
          </div>

          {/* Table */}
          <div style={{ background:'#fff',borderRadius:14,border:'1.5px solid #f3f4f6',overflow:'hidden',boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
            <div style={{ padding:'14px 20px',borderBottom:'1px solid #f3f4f6',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#0f1c2e' }}>
              <div>
                <h2 style={{ fontSize:14,fontWeight:700,color:'#e8c97a',margin:0 }}>Tabel Distribusi SHU — Formal</h2>
                <p style={{ fontSize:11,color:'rgba(232,228,220,.5)',margin:'2px 0 0' }}>Laporan resmi sesuai standar akuntansi koperasi</p>
              </div>
              {!loading && <span style={{ fontSize:12,color:'#e8c97a',background:'rgba(201,168,76,.15)',padding:'3px 10px',borderRadius:20,fontWeight:600,border:'1px solid rgba(201,168,76,.3)' }}>{distributions.length} anggota</span>}
            </div>

            {loading ? (
              <div style={{ display:'flex',justifyContent:'center',padding:56 }}>
                <div style={{ width:28,height:28,border:'3px solid #e5e7eb',borderTop:'3px solid #059669',borderRadius:'50%',animation:'sp .8s linear infinite' }} />
              </div>
            ) : distributions.length === 0 ? (
              <div style={{ textAlign:'center',padding:'56px 20px' }}>
                <Users size={40} color="#d1d5db" style={{ marginBottom:12 }} />
                <p style={{ fontSize:14,color:'#9ca3af',fontWeight:500 }}>Belum ada data distribusi SHU</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="shu-table-wrap" style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%',borderCollapse:'collapse',minWidth:500 }}>
                    <thead>
                      <tr style={{ background:'#f8f9fc',borderBottom:'1.5px solid #e5e7eb' }}>
                        {['No','Nama Anggota','Periode','Dasar Hukum','% Distribusi','Nominal SHU'].map(h => (
                          <th key={h} style={{ padding:'11px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.06em',whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(grouped).map(([period, dists]) =>
                        dists.map((d, i) => (
                          <tr key={`${period}-${i}`} style={{ borderBottom:'1px solid #f9fafb' }}
                            onMouseEnter={e => (e.currentTarget.style.background='#f9fafb')}
                            onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                            <td style={{ padding:'12px 16px',fontSize:12,color:'#9ca3af',fontWeight:500 }}>{i+1}</td>
                            <td style={{ padding:'12px 16px' }}>
                              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                                <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700,flexShrink:0 }}>
                                  {(d.member_name||'A').charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize:13,fontWeight:600,color:'#111827' }}>{d.member_name || 'Anggota'}</span>
                              </div>
                            </td>
                            <td style={{ padding:'12px 16px',fontSize:13,color:'#374151',whiteSpace:'nowrap' }}>{period}</td>
                            <td style={{ padding:'12px 16px' }}>
                              <span style={{ fontSize:10,fontWeight:700,color:'#92400e',background:'#fffbeb',border:'1px solid #fde68a',padding:'3px 8px',borderRadius:6,whiteSpace:'nowrap' }}>UU No.25/1992 Ps.45</span>
                            </td>
                            <td style={{ padding:'12px 16px',fontSize:13,fontWeight:700,color:'#374151' }}>{d.distribution_rate || 0}%</td>
                            <td style={{ padding:'12px 16px',fontSize:15,fontWeight:800,color:'#059669',whiteSpace:'nowrap' }}>{fmt(d.share_amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{ background:'#f0fdf4',borderTop:'2px solid #86efac' }}>
                        <td colSpan={5} style={{ padding:'12px 16px',fontSize:13,fontWeight:700,color:'#065f46' }}>TOTAL DISTRIBUSI SHU</td>
                        <td style={{ padding:'12px 16px',fontSize:16,fontWeight:900,color:'#059669' }}>{fmt(totalAll)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="shu-card" style={{ padding:14 }}>
                  {distributions.map((d, i) => (
                    <div key={i} style={{ background:'#f9fafb',border:'1.5px solid #e5e7eb',borderRadius:12,padding:14 }}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                          <div style={{ width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700 }}>
                            {(d.member_name||'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize:13,fontWeight:700,color:'#111827',margin:0 }}>{d.member_name||'Anggota'}</p>
                            <p style={{ fontSize:10,color:'#9ca3af',margin:0 }}>{d.period} · {d.distribution_rate}%</p>
                          </div>
                        </div>
                        <p style={{ fontSize:15,fontWeight:800,color:'#059669',margin:0 }}>{fmt(d.share_amount)}</p>
                      </div>
                      <span style={{ fontSize:10,fontWeight:700,color:'#92400e',background:'#fffbeb',border:'1px solid #fde68a',padding:'3px 8px',borderRadius:6 }}>UU No.25/1992 Pasal 45</span>
                    </div>
                  ))}
                  <div style={{ background:'#f0fdf4',border:'1.5px solid #86efac',borderRadius:12,padding:'12px 14px',display:'flex',justifyContent:'space-between' }}>
                    <span style={{ fontSize:13,fontWeight:700,color:'#065f46' }}>Total Distribusi</span>
                    <span style={{ fontSize:15,fontWeight:900,color:'#059669' }}>{fmt(totalAll)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================== TAB NON-FORMAL ======================== */}
      {activeTab === 'nonformal' && (
        <div className="shu-tab-content">


          {/* Member Cards */}
          {loading ? (
            <div style={{ display:'flex',justifyContent:'center',padding:56 }}>
              <div style={{ width:28,height:28,border:'3px solid #e5e7eb',borderTop:'3px solid #059669',borderRadius:'50%',animation:'sp .8s linear infinite' }} />
            </div>
          ) : distributions.length === 0 ? (
            <div style={{ textAlign:'center',padding:'56px 20px',background:'#fff',borderRadius:14,border:'1.5px dashed #e5e7eb' }}>
              <span style={{ fontSize:48,display:'block',marginBottom:12 }}>🌱</span>
              <p style={{ fontSize:15,color:'#9ca3af',fontWeight:600 }}>Belum ada distribusi SHU</p>
              <p style={{ fontSize:13,color:'#d1d5db',marginTop:6 }}>SHU akan dibagikan setelah admin menghitung hasil usaha koperasi</p>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              {Object.entries(grouped).map(([period, dists]) => {
                const pTotal = dists.reduce((s, d) => s + (d.share_amount || 0), 0);
                return (
                  <div key={period} style={{ background:'#fff',borderRadius:16,border:'1.5px solid #f3f4f6',overflow:'hidden',boxShadow:'0 2px 10px rgba(0,0,0,.06)' }}>
                    {/* Period header */}
                    <div style={{ background:'linear-gradient(135deg,#059669,#0d9488)',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                      <div>
                        <p style={{ fontSize:13,fontWeight:800,color:'#fff',margin:0 }}>🗓️ Periode {period}</p>
                        <p style={{ fontSize:11,color:'rgba(255,255,255,.75)',margin:'3px 0 0' }}>Dibagikan ke {dists.length} anggota koperasi</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontSize:11,color:'rgba(255,255,255,.7)',margin:0 }}>Total dibagikan</p>
                        <p style={{ fontSize:16,fontWeight:800,color:'#fff',margin:'2px 0 0' }}>{fmt(pTotal)}</p>
                      </div>
                    </div>

                    {/* Member cards */}
                    <div style={{ padding:'12px 14px',display:'flex',flexDirection:'column',gap:10 }}>
                      {dists
                        .sort((a, b) => (b.share_amount || 0) - (a.share_amount || 0))
                        .map((d, i) => {
                          const pct = maxShare > 0 ? ((d.share_amount || 0) / maxShare) * 100 : 0;
                          const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
                          return (
                            <div key={i} style={{ background:'#f9fafb',borderRadius:12,padding:'14px 16px',border:'1.5px solid #f3f4f6' }}>
                              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10,gap:8 }}>
                                <div style={{ display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0 }}>
                                  <div style={{ width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14,fontWeight:800,flexShrink:0 }}>
                                    {(d.member_name||'A').charAt(0).toUpperCase()}
                                  </div>
                                  <div style={{ minWidth:0 }}>
                                    <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                                      <p style={{ fontSize:14,fontWeight:700,color:'#111827',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{d.member_name || 'Anggota'}</p>
                                      <span style={{ fontSize:14,flexShrink:0 }}>{rank}</span>
                                    </div>
                                    <p style={{ fontSize:12,color:'#6b7280',margin:'2px 0 0' }}>Kontribusi distribusi: <strong>{d.distribution_rate || 0}%</strong></p>
                                  </div>
                                </div>
                                <div style={{ textAlign:'right',flexShrink:0 }}>
                                  <p style={{ fontSize:18,fontWeight:900,color:'#059669',margin:0 }}>{fmt(d.share_amount)}</p>
                                  <p style={{ fontSize:11,color:'#9ca3af',margin:'2px 0 0' }}>bagian SHU kamu 🎁</p>
                                </div>
                              </div>
                              {/* Progress bar */}
                              <div style={{ background:'#e5e7eb',borderRadius:50,height:7,overflow:'hidden' }}>
                                <div style={{ background:'linear-gradient(90deg,#10b981,#059669)',height:'100%',width:`${pct}%`,borderRadius:50,transition:'width .5s ease' }} />
                              </div>
                              <p style={{ fontSize:11,color:'#9ca3af',marginTop:5,textAlign:'right' }}>
                                {pct.toFixed(0)}% dari anggota tertinggi ({fmt(maxShare)})
                              </p>
                            </div>
                          );
                        })}
                    </div>

                    {/* Footer ringkasan */}
                    <div style={{ background:'#f0fdf4',padding:'12px 20px',borderTop:'1px solid #d1fae5',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                        <Award size={16} color="#059669" />
                        <p style={{ fontSize:12,color:'#065f46',fontWeight:600,margin:0 }}>
                          Selamat! Koperasi berhasil membagikan SHU periode ini 🎊
                        </p>
                      </div>
                      <p style={{ fontSize:13,fontWeight:800,color:'#059669',margin:0 }}>{fmt(pTotal)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}