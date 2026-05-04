import React, { useState, useEffect } from 'react';
import { HandCoins, Calculator, CheckCircle, AlertCircle, Clock, TrendingDown, Info, ChevronDown } from 'lucide-react';

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

  useEffect(() => {
    // Fetch interest rate
    fetch('/api/settings/general', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.loanInterestRate) setInterestRate(d.loanInterestRate / 100); })
      .catch(() => {});

    // Fetch active loans
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
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `LOAN-${Date.now()}`,
          memberId: user.id, memberName: user.name,
          amount: principal, purpose, duration: months,
          interestRate, totalInterest, totalRepayment,
          status: 'pending', date: new Date().toISOString(),
          companyCode: 'PALUGADA', createdBy: user.id
        })
      });
      if (res.ok) {
        setMessage({ text: 'Pengajuan pinjaman berhasil dikirim! Admin akan mereview dalam 1x24 jam.', type: 'success' });
        setAmount(''); setPurpose(''); setDuration('12'); setAgreed(false);
        // Refresh active loans
        fetch('/api/loans', { credentials: 'include' })
          .then(r => r.json()).then(data => {
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

  const inputStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 11, fontSize: 14, background: '#f9fafb', outline: 'none', boxSizing: 'border-box' as const, transition: 'border .15s' };
  const labelStyle = { fontSize: 12, fontWeight: 700 as const, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '.04em', display: 'block', marginBottom: 7 };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#111827', margin: 0 }}>Ajukan Pinjaman</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Isi formulir di bawah untuk mengajukan pinjaman baru</p>
      </div>

      {/* Active Loans Warning */}
      {activeLoans.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: '0 0 8px' }}>
                Anda memiliki {activeLoans.length} pinjaman aktif
              </p>
              {activeLoans.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#78350f', padding: '4px 0', borderTop: i > 0 ? '1px solid #fde68a' : 'none' }}>
                  <span>#{(l.id || '').slice(0, 12)} · {l.status === 'pending' ? '⏱ Menunggu' : '✓ Aktif'}</span>
                  <span style={{ fontWeight: 700 }}>Sisa: {fmt(l.remainingBalance || l.amount || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message.text && (
        <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10, background: message.type === 'success' ? '#f0fdf4' : '#fff1f2', border: `1.5px solid ${message.type === 'success' ? '#86efac' : '#fecdd3'}` }}>
          {message.type === 'success' ? <CheckCircle size={18} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={18} color="#e11d48" style={{ flexShrink: 0, marginTop: 1 }} />}
          <p style={{ fontSize: 13, fontWeight: 600, color: message.type === 'success' ? '#065f46' : '#9f1239', margin: 0, lineHeight: 1.6 }}>{message.text}</p>
        </div>
      )}

      {/* Form */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f3f4f6', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Amount */}
          <div>
            <label style={labelStyle}>Jumlah Pinjaman (Rp)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              required min="500000" placeholder="Minimal Rp 500.000" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#10b981'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            {principal > 0 && principal < 500000 && (
              <p style={{ fontSize: 12, color: '#e11d48', marginTop: 5 }}>⚠ Minimal pinjaman adalah Rp 500.000</p>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label style={labelStyle}>Tujuan Pinjaman</label>
            <textarea value={purpose} onChange={e => setPurpose(e.target.value)}
              required rows={3} placeholder="Jelaskan tujuan penggunaan dana secara singkat..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              onFocus={e => e.target.style.borderColor = '#10b981'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
          </div>

          {/* Tenor */}
          <div>
            <label style={labelStyle}>Tenor Pembayaran</label>
            <div style={{ position: 'relative' }}>
              <select value={duration} onChange={e => setDuration(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', paddingRight: 40, cursor: 'pointer' }}>
                {[3, 6, 12, 24].map(m => (
                  <option key={m} value={m}>{m} bulan</option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Simulation */}
          {principal >= 500000 && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 14, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Calculator size={18} color="#059669" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>Simulasi Cicilan</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { l: 'Cicilan/Bulan', v: fmt(monthlyInstallment), c: '#059669', Icon: HandCoins },
                  { l: 'Total Bunga', v: fmt(totalInterest), c: '#d97706', Icon: TrendingDown },
                  { l: 'Total Bayar', v: fmt(totalRepayment), c: '#111827', Icon: Calculator },
                ].map(({ l, v, c, Icon }) => (
                  <div key={l} style={{ background: '#fff', borderRadius: 10, padding: '12px 10px', textAlign: 'center', border: '1px solid #d1fae5' }}>
                    <Icon size={16} color={c} style={{ marginBottom: 6 }} />
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.03em', margin: '0 0 4px' }}>{l}</p>
                    <p style={{ fontSize: 'clamp(11px,2vw,14px)', fontWeight: 800, color: c, margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#059669', background: 'rgba(5,150,105,.08)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={13} />
                Bunga {(interestRate * 100).toFixed(1)}%/bulan · {months} bulan · Total {months} cicilan
              </div>
            </div>
          )}

          {/* Terms */}
          <div>
            <button type="button" onClick={() => setShowTerms(!showTerms)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 10 }}>
              <Info size={14} /> {showTerms ? 'Sembunyikan' : 'Lihat'} Syarat & Ketentuan
            </button>

            {showTerms && (
              <div style={{ background: '#f8faff', border: '1.5px solid #dbeafe', borderRadius: 10, padding: '14px 16px', marginBottom: 12, fontSize: 12, color: '#374151', lineHeight: 1.8 }}>
                <p style={{ fontWeight: 700, marginBottom: 8, color: '#1e40af' }}>Syarat & Ketentuan Pinjaman:</p>
                <ol style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li>Anggota aktif dengan simpanan pokok dan wajib yang terpenuhi</li>
                  <li>Pembayaran cicilan dilakukan sesuai jadwal yang ditetapkan</li>
                  <li>Keterlambatan pembayaran dapat dikenakan denda sesuai kebijakan koperasi</li>
                  <li>Pinjaman akan diproses dalam 1×24 jam kerja setelah pengajuan</li>
                  <li>Koperasi berhak menolak pengajuan jika tidak memenuhi syarat</li>
                  <li>Dengan mengajukan, anggota menyetujui semua ketentuan yang berlaku</li>
                </ol>
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: '#059669', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                Saya telah membaca dan <strong>menyetujui syarat & ketentuan</strong> pinjaman yang berlaku di koperasi Palugada.
              </span>
            </label>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading || !agreed || principal < 500000}
            style={{ width: '100%', padding: '14px', background: loading || !agreed || principal < 500000 ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading || !agreed || principal < 500000 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .2s' }}>
            <HandCoins size={18} />
            {loading ? 'Memproses...' : 'Ajukan Pinjaman Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}