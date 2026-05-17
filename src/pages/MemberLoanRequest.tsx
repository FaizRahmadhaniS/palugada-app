import React, { useState, useEffect } from 'react';
import { HandCoins, Calculator, CheckCircle, AlertCircle, TrendingDown, Info, ChevronDown, Sparkles, Shield, Clock, FileText, Wallet } from 'lucide-react';

const fmt = (n: number) => `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`;

export default function MemberLoanRequest({ user }: { user: any }) {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState('12');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [interestRate, setInterestRate] = useState(0.015);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  useEffect(() => {
    fetch('/api/settings/general', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.loanInterestRate) setInterestRate(d.loanInterestRate / 100); })
      .catch(() => {});

    fetch('/api/loans', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setActiveLoans(arr.filter((l: any) =>
          (l.memberId === user?.id || l.member_id === user?.id) &&
          (l.status === 'approved' || l.status === 'pending')
        ));
      })
      .catch(() => {});
  }, [user?.id]);

  const principal = parseFloat(amount) || 0;
  const months = parseInt(duration) || 12;
  const totalInterest = principal * interestRate * months;
  const totalRepayment = principal + totalInterest;
  const monthlyInstallment = months > 0 ? totalRepayment / months : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setMessage({ text: 'Harap setujui syarat & ketentuan terlebih dahulu.', type: 'error' }); return; }
    if (principal < 500000) { setMessage({ text: 'Jumlah pinjaman minimal Rp 500.000.', type: 'error' }); return; }

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: principal, purpose, duration: months, interestRate: interestRate * 100 })
      });
      if (res.ok) {
        setMessage({ text: 'Pengajuan berhasil dikirim! Mohon tunggu persetujuan admin.', type: 'success' });
        setAmount(''); setPurpose(''); setDuration('12'); setAgreed(false);
        fetch('/api/loans', { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            const arr = Array.isArray(data) ? data : [];
            setActiveLoans(arr.filter((l: any) =>
              (l.memberId === user?.id || l.member_id === user?.id) &&
              (l.status === 'approved' || l.status === 'pending')
            ));
          });
      } else {
        setMessage({ text: 'Gagal mengajukan pinjaman. Coba lagi.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Terjadi kesalahan koneksi.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 80px' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .lr-input { width:100%; padding:14px 16px 14px 44px; border:1.5px solid #e5e7eb; border-radius:14px; font-size:15px; background:#fff; outline:none; box-sizing:border-box; transition: all .2s; font-weight:500; color:#111827; }
        .lr-input:focus { border-color:#059669; box-shadow: 0 0 0 4px rgba(5,150,105,.08); }
        .lr-input::placeholder { color:#9ca3af; font-weight:400; }
        .lr-textarea { width:100%; padding:14px 16px; border:1.5px solid #e5e7eb; border-radius:14px; font-size:14px; background:#fff; outline:none; box-sizing:border-box; transition: all .2s; resize:vertical; min-height:90px; font-family:inherit; line-height:1.6; }
        .lr-textarea:focus { border-color:#059669; box-shadow: 0 0 0 4px rgba(5,150,105,.08); }
        .sim-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        @media (max-width:480px) { .sim-grid { grid-template-columns: 1fr 1fr; } .sim-card-3 { grid-column: 1 / -1; } }
        .lr-fade { animation: fadeUp .4s ease both; }
      `}</style>

      {/* HERO HEADER */}
      <div style={{ position:'relative', background:'linear-gradient(135deg, #064e3b 0%, #059669 50%, #0d9488 100%)', borderRadius:24, padding:'28px 26px', marginBottom:20, overflow:'hidden', boxShadow:'0 12px 40px rgba(5,150,105,.25)' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,.15) 0%, transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:-50, left:-20, width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle, rgba(251,191,36,.2) 0%, transparent 70%)' }} />

        <div style={{ position:'relative', display:'flex', alignItems:'center', gap:14, marginBottom:8 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,.15)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', animation:'float 3s ease-in-out infinite' }}>
            <HandCoins size={24} color="#fff" />
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.15)', padding:'4px 12px', borderRadius:100, fontSize:10, fontWeight:700, color:'#fff', letterSpacing:'.1em', textTransform:'uppercase', border:'1px solid rgba(255,255,255,.2)' }}>
            <Sparkles size={11} /> Pengajuan Pinjaman
          </div>
        </div>

        <h1 style={{ position:'relative', fontSize:'clamp(24px,4vw,32px)', fontWeight:900, color:'#fff', margin:'0 0 6px', letterSpacing:'-.02em' }}>
          Wujudkan Rencana<br/>Finansial Anda
        </h1>
        <p style={{ position:'relative', fontSize:13, color:'rgba(255,255,255,.85)', margin:0, fontWeight:400, lineHeight:1.6 }}>
          Pinjaman cepat dengan bunga ringan, transparan, dan tanpa biaya tersembunyi.
        </p>

        <div style={{ position:'relative', display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
          {[
            { Icon: Shield, label: 'Aman & Terdaftar' },
            { Icon: Clock, label: 'Proses 1x24 Jam' },
            { Icon: TrendingDown, label: 'Bunga ' + (interestRate * 100).toFixed(1) + '%/bln' },
          ].map(({ Icon, label }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#fff', background:'rgba(255,255,255,.12)', padding:'5px 11px', borderRadius:100, fontWeight:600, border:'1px solid rgba(255,255,255,.15)' }}>
              <Icon size={11} /> {label}
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE LOANS WARNING */}
      {activeLoans.length > 0 && (
        <div className="lr-fade" style={{ position:'relative', background:'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)', border:'1.5px solid #fbbf24', borderRadius:18, padding:'18px 20px', marginBottom:20, overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, width:4, height:'100%', background:'linear-gradient(180deg,#d97706,#f59e0b)' }} />
          <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1.5px solid #fde68a' }}>
              <AlertCircle size={20} color="#d97706" />
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:800, color:'#92400e', margin:'0 0 8px', display:'flex', alignItems:'center', gap:6 }}>
                Anda Memiliki Pinjaman Aktif
                <span style={{ background:'#d97706', color:'#fff', fontSize:10, padding:'2px 8px', borderRadius:100, fontWeight:700 }}>{activeLoans.length}</span>
              </p>
              {activeLoans.map((l, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, padding:'8px 0', borderTop: i > 0 ? '1px dashed #fde68a' : 'none' }}>
                  <span style={{ color:'#78350f', fontWeight:500 }}>
                    #{(l.id || '').slice(0, 10)} - {l.status === 'pending' ? 'Menunggu' : 'Berjalan'}
                  </span>
                  <span style={{ fontWeight:800, color:'#92400e' }}>{fmt(l.remainingBalance || l.amount || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE */}
      {message.text && (
        <div className="lr-fade" style={{ position:'relative', padding:'16px 18px', borderRadius:14, marginBottom:20, display:'flex', alignItems:'flex-start', gap:12, background: message.type === 'success' ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fff1f2,#ffe4e6)', border:`1.5px solid ${message.type === 'success' ? '#86efac' : '#fecdd3'}`, boxShadow:`0 4px 16px ${message.type === 'success' ? 'rgba(5,150,105,.1)' : 'rgba(225,29,72,.1)'}` }}>
          {message.type === 'success' ? <CheckCircle size={20} color="#059669" style={{ flexShrink:0, marginTop:1 }} /> : <AlertCircle size={20} color="#e11d48" style={{ flexShrink:0, marginTop:1 }} />}
          <p style={{ fontSize:13, fontWeight:600, color: message.type === 'success' ? '#065f46' : '#9f1239', margin:0, lineHeight:1.6 }}>{message.text}</p>
        </div>
      )}

      {/* MAIN FORM CARD */}
      <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #f3f4f6', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.06)' }}>
        {/* Card Header */}
        <div style={{ padding:'18px 22px', borderBottom:'1.5px solid #f3f4f6', background:'linear-gradient(135deg,#fafbfc 0%,#fff 100%)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FileText size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize:15, fontWeight:800, color:'#111827', margin:0 }}>Formulir Pengajuan</h2>
            <p style={{ fontSize:11, color:'#6b7280', margin:'2px 0 0' }}>Isi data dengan lengkap dan benar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'24px 22px', display:'flex', flexDirection:'column', gap:22 }}>

          {/* AMOUNT */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:8, letterSpacing:'.03em', textTransform:'uppercase' }}>
              <span style={{ color:'#059669' }}>1.</span> Jumlah Pinjaman
            </label>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', width:24, height:24, borderRadius:7, background: focusedField === 'amount' ? '#d1fae5' : '#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}>
                <Wallet size={14} color={focusedField === 'amount' ? '#059669' : '#6b7280'} />
              </div>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                required min="500000" placeholder="Minimal Rp 500.000"
                onFocus={() => setFocusedField('amount')}
                onBlur={() => setFocusedField('')}
                className="lr-input" />
            </div>
            {principal > 0 && principal < 500000 ? (
              <p style={{ fontSize:11.5, color:'#e11d48', marginTop:6, display:'flex', alignItems:'center', gap:4 }}>
                <AlertCircle size={12} /> Minimal pinjaman adalah Rp 500.000
              </p>
            ) : principal >= 500000 && (
              <p style={{ fontSize:11.5, color:'#059669', marginTop:6, display:'flex', alignItems:'center', gap:4, fontWeight:600 }}>
                <CheckCircle size={12} /> {fmt(principal)}
              </p>
            )}
          </div>

          {/* PURPOSE */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:8, letterSpacing:'.03em', textTransform:'uppercase' }}>
              <span style={{ color:'#059669' }}>2.</span> Tujuan Pinjaman
            </label>
            <textarea value={purpose} onChange={e => setPurpose(e.target.value)}
              required placeholder="Jelaskan tujuan penggunaan dana secara singkat..."
              className="lr-textarea"
              onFocus={() => setFocusedField('purpose')}
              onBlur={() => setFocusedField('')} />
          </div>

          {/* TENOR */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:8, letterSpacing:'.03em', textTransform:'uppercase' }}>
              <span style={{ color:'#059669' }}>3.</span> Tenor Pembayaran
            </label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {[3, 6, 12, 24].map(m => (
                <button key={m} type="button" onClick={() => setDuration(String(m))}
                  style={{
                    padding:'12px 8px',
                    borderRadius:12,
                    border:`1.5px solid ${duration === String(m) ? '#059669' : '#e5e7eb'}`,
                    background: duration === String(m) ? 'linear-gradient(135deg,#10b981,#059669)' : '#fff',
                    color: duration === String(m) ? '#fff' : '#374151',
                    fontSize:13,
                    fontWeight:700,
                    cursor:'pointer',
                    transition:'all .2s',
                    display:'flex',
                    flexDirection:'column',
                    alignItems:'center',
                    gap:2,
                    boxShadow: duration === String(m) ? '0 4px 14px rgba(5,150,105,.3)' : 'none'
                  }}>
                  <span style={{ fontSize:16, fontWeight:900 }}>{m}</span>
                  <span style={{ fontSize:10, fontWeight:600, opacity:.85 }}>bulan</span>
                </button>
              ))}
            </div>
          </div>

          {/* SIMULATION */}
          {principal >= 500000 && (
            <div className="lr-fade" style={{ position:'relative', background:'linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 100%)', border:'1.5px solid #86efac', borderRadius:16, padding:'18px 16px', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, right:0, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle, rgba(5,150,105,.08) 0%, transparent 70%)' }} />

              <div style={{ position:'relative', display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid #86efac' }}>
                  <Calculator size={16} color="#059669" />
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:800, color:'#065f46', margin:0 }}>Simulasi Cicilan</p>
                  <p style={{ fontSize:10.5, color:'#059669', margin:'1px 0 0' }}>Estimasi pembayaran bulanan Anda</p>
                </div>
              </div>

              <div className="sim-grid" style={{ position:'relative' }}>
                {[
                  { l: 'Cicilan/Bulan', v: fmt(monthlyInstallment), c: '#059669', Icon: HandCoins, primary: true },
                  { l: 'Total Bunga', v: fmt(totalInterest), c: '#d97706', Icon: TrendingDown },
                  { l: 'Total Bayar', v: fmt(totalRepayment), c: '#1e293b', Icon: Calculator, last: true },
                ].map(({ l, v, c, Icon, primary, last }) => (
                  <div key={l} className={last ? 'sim-card-3' : ''} style={{ background: primary ? 'linear-gradient(135deg,#10b981,#059669)' : '#fff', borderRadius:12, padding:'12px 10px', textAlign:'left', border: primary ? 'none' : '1.5px solid #d1fae5', boxShadow: primary ? '0 4px 14px rgba(5,150,105,.25)' : 'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
                      <Icon size={13} color={primary ? '#fff' : c} />
                      <p style={{ fontSize:9.5, fontWeight:700, color: primary ? 'rgba(255,255,255,.85)' : '#6b7280', textTransform:'uppercase', letterSpacing:'.03em', margin:0 }}>{l}</p>
                    </div>
                    <p style={{ fontSize:'clamp(13px,3.5vw,16px)', fontWeight:900, color: primary ? '#fff' : c, margin:0, wordBreak:'break-all', letterSpacing:'-.01em' }}>{v}</p>
                  </div>
                ))}
              </div>

              <div style={{ position:'relative', fontSize:11, color:'#065f46', background:'rgba(5,150,105,.08)', borderRadius:10, padding:'8px 12px', display:'flex', alignItems:'center', gap:6, marginTop:12, fontWeight:600 }}>
                <Info size={12} />
                Bunga {(interestRate * 100).toFixed(1)}%/bulan - {months} bulan - {months} cicilan
              </div>
            </div>
          )}

          {/* TERMS */}
          <div>
            <button type="button" onClick={() => setShowTerms(!showTerms)}
              style={{ display:'flex', alignItems:'center', gap:8, background: showTerms ? '#eff6ff' : 'transparent', border:`1.5px solid ${showTerms ? '#bfdbfe' : '#e5e7eb'}`, borderRadius:10, padding:'9px 14px', cursor:'pointer', color:'#3b82f6', fontSize:13, fontWeight:600, transition:'all .2s' }}>
              <Info size={14} /> {showTerms ? 'Sembunyikan' : 'Baca'} Syarat & Ketentuan
              <ChevronDown size={14} style={{ transition:'transform .2s', transform: showTerms ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>

            {showTerms && (
              <div className="lr-fade" style={{ background:'linear-gradient(135deg,#f0f9ff,#eff6ff)', border:'1.5px solid #bfdbfe', borderRadius:12, padding:'14px 18px', marginTop:10, fontSize:12.5, color:'#1e3a8a', lineHeight:1.85 }}>
                <p style={{ fontWeight:800, marginBottom:8, color:'#1e40af', fontSize:13 }}>Syarat & Ketentuan Pinjaman:</p>
                <ol style={{ paddingLeft:18, display:'flex', flexDirection:'column', gap:5, margin:0 }}>
                  <li>Anggota aktif dengan simpanan pokok dan wajib terpenuhi</li>
                  <li>Pembayaran cicilan dilakukan sesuai jadwal yang ditetapkan</li>
                  <li>Keterlambatan dapat dikenakan denda sesuai kebijakan koperasi</li>
                  <li>Pinjaman diproses dalam 1x24 jam kerja setelah pengajuan</li>
                  <li>Koperasi berhak menolak pengajuan jika tidak memenuhi syarat</li>
                  <li>Dengan mengajukan, anggota menyetujui semua ketentuan berlaku</li>
                </ol>
              </div>
            )}

            <label style={{ display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer', background: agreed ? '#f0fdf4' : '#f9fafb', padding:'12px 14px', borderRadius:12, border:`1.5px solid ${agreed ? '#86efac' : '#e5e7eb'}`, marginTop:12, transition:'all .2s' }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ width:18, height:18, marginTop:1, accentColor:'#059669', flexShrink:0, cursor:'pointer' }} />
              <span style={{ fontSize:12.5, color:'#374151', lineHeight:1.6 }}>
                Saya telah membaca dan <strong style={{ color:'#065f46' }}>menyetujui syarat & ketentuan</strong> pinjaman yang berlaku di Koperasi Palugada.
              </span>
            </label>
          </div>

          {/* SUBMIT */}
          <button type="submit" disabled={loading || !agreed || principal < 500000}
            style={{
              position:'relative',
              width:'100%',
              padding:'16px',
              background: (loading || !agreed || principal < 500000) ? '#cbd5e1' : 'linear-gradient(135deg,#10b981 0%,#059669 50%,#0d9488 100%)',
              color:'#fff',
              border:'none',
              borderRadius:14,
              fontSize:15,
              fontWeight:800,
              cursor: (loading || !agreed || principal < 500000) ? 'not-allowed' : 'pointer',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:10,
              transition:'all .25s',
              boxShadow: (loading || !agreed || principal < 500000) ? 'none' : '0 8px 24px rgba(5,150,105,.35)',
              letterSpacing:'.01em',
              overflow:'hidden'
            }}>
            <HandCoins size={20} />
            {loading ? 'Memproses Pengajuan...' : 'Ajukan Pinjaman Sekarang'}
            {!loading && <Sparkles size={16} style={{ opacity:.8 }} />}
          </button>
        </form>
      </div>
    </div>
  );
}