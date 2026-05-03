import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, Users, Plus, X } from 'lucide-react';

const fmt = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

export default function SHUDistribution({ user }: { user: any }) {
  const [distributions, setDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCalc, setShowCalc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [calc, setCalc] = useState({ period: new Date().toISOString().substring(0,7), totalProfit: '', distributionRate: 100 });

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
    const k = d.period || d.created_at?.substring(0,7) || 'N/A';
    if (!acc[k]) acc[k] = [];
    acc[k].push(d);
    return acc;
  }, {});
  const totalAll = distributions.reduce((s,d) => s+(d.share_amount||0), 0);

  return (
    <div style={{ padding: '24px', width: '100%' }}>
      <style>{`
        @keyframes sp { to { transform: rotate(360deg); } }
        .shu-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .shu-calc-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        @media (max-width: 768px) {
          .shu-stats { grid-template-columns: 1fr; }
          .shu-calc-grid { grid-template-columns: 1fr; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .shu-stats { grid-template-columns: repeat(3, 1fr); }
          .shu-calc-grid { grid-template-columns: 1fr 1fr; }
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

      {/* Hitung SHU (admin) */}
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

      {/* Distributions */}
      <div style={{ background:'#fff',borderRadius:14,border:'1.5px solid #f3f4f6',overflow:'hidden',boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
        <div style={{ padding:'16px 20px',borderBottom:'1px solid #f3f4f6',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h2 style={{ fontSize:15,fontWeight:700,color:'#111827',margin:0 }}>Riwayat Distribusi</h2>
          {!loading && <span style={{ fontSize:12,color:'#6b7280',background:'#f3f4f6',padding:'3px 10px',borderRadius:20,fontWeight:600 }}>{distributions.length} anggota</span>}
        </div>

        {loading ? (
          <div style={{ display:'flex',justifyContent:'center',padding:56 }}>
            <div style={{ width:28,height:28,border:'3px solid #e5e7eb',borderTop:'3px solid #059669',borderRadius:'50%',animation:'sp .8s linear infinite' }} />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign:'center',padding:'56px 20px' }}>
            <Users size={40} color="#d1d5db" style={{ marginBottom:12 }} />
            <p style={{ fontSize:14,color:'#9ca3af',fontWeight:500 }}>Belum ada data distribusi SHU</p>
            <p style={{ fontSize:12,color:'#d1d5db',marginTop:4 }}>Klik "Hitung SHU Baru" untuk memulai distribusi</p>
          </div>
        ) : (
          Object.entries(grouped).map(([period, dists]) => {
            const pTotal = dists.reduce((s,d) => s+(d.share_amount||0), 0);
            return (
              <div key={period}>
                <div style={{ background:'#f8fafb',padding:'10px 20px',borderBottom:'1px solid #f3f4f6',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <div>
                    <span style={{ fontSize:13,fontWeight:700,color:'#374151' }}>Periode {period}</span>
                    <span style={{ fontSize:11,color:'#9ca3af',marginLeft:8 }}>{dists.length} anggota</span>
                  </div>
                  <span style={{ fontSize:14,fontWeight:800,color:'#059669' }}>{fmt(pTotal)}</span>
                </div>
                {dists.map((d, i) => (
                  <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',borderBottom:i<dists.length-1?'1px solid #f9fafb':'none' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,fontWeight:700,flexShrink:0 }}>
                        {(d.member_name||'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize:13,fontWeight:600,color:'#111827',margin:0 }}>{d.member_name || 'Anggota'}</p>
                        <p style={{ fontSize:11,color:'#9ca3af',margin:0 }}>{d.distribution_rate}% distribusi</p>
                      </div>
                    </div>
                    <p style={{ fontSize:15,fontWeight:800,color:'#059669',margin:0 }}>{fmt(d.share_amount)}</p>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}