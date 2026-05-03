import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Plus, X, ChevronDown, CreditCard, TrendingDown, Wallet } from 'lucide-react';

const fmt = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

export default function LoanPaymentHistory({ user }: { user: any }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoan, setSelectedLoan] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    fetch('/api/loans', { credentials: 'include' })
      .then(r => r.json()).then(d => {
        const arr = Array.isArray(d) ? d : [];
        setLoans(arr);
        if (arr.length > 0) setSelectedLoan(arr[0].id);
        else setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedLoan) return;
    setLoading(true);
    fetch(`/api/loan-payments/${selectedLoan}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setPayments(Array.isArray(d) ? d : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, [selectedLoan]);

  const handleAdd = async () => {
    if (!selectedLoan || !form.amount) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/loan-payments', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId: selectedLoan, amount: Number(form.amount), paymentDate: form.date, notes: form.notes })
      });
      const data = await res.json();
      if (data.success) {
        setPayments([data.payment, ...payments]);
        setForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
        setShowForm(false);
        showToast('Pembayaran berhasil dicatat!');
      } else showToast('Gagal: ' + (data.message || 'Error'));
    } catch { showToast('Gagal menyimpan'); }
    setSubmitting(false);
  };

  const loanData = loans.find(l => l.id === selectedLoan);
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const remaining = (loanData?.amount || 0) - totalPaid;

  return (
    <div style={{ padding: '24px', width: '100%' }}>
      <style>{`
        @keyframes sp { to { transform: rotate(360deg); } }
        .lph-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
        .lph-summary { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .lph-form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        @media (max-width: 900px) {
          .lph-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .lph-summary { grid-template-columns: 1fr; }
          .lph-form-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {toast && <div style={{ position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:999,background:'#059669',color:'#fff',padding:'10px 20px',borderRadius:10,fontSize:13,fontWeight:600,boxShadow:'0 4px 16px rgba(0,0,0,.2)' }}>{toast}</div>}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, color: '#111827', margin: 0 }}>Riwayat Pembayaran</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Pantau cicilan dan sisa hutang pinjaman</p>
      </div>

      <div className="lph-grid">
        {/* LEFT: Selector + Summary + Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Loan selector */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f3f4f6', padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.05)' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 8 }}>Pilih Pinjaman</label>
            <div style={{ position: 'relative' }}>
              <select value={selectedLoan} onChange={e => setSelectedLoan(e.target.value)}
                style={{ width:'100%',padding:'12px 40px 12px 14px',border:'1.5px solid #e5e7eb',borderRadius:10,fontSize:14,background:'#f9fafb',appearance:'none',fontWeight:500,color:'#111827',outline:'none',cursor:'pointer' }}>
                {loans.length === 0 && <option value="">Tidak ada pinjaman</option>}
                {loans.map(l => <option key={l.id} value={l.id}>#{l.id?.slice(0,12)} — {fmt(l.amount)}</option>)}
              </select>
              <ChevronDown size={16} style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'#9ca3af',pointerEvents:'none' }} />
            </div>
          </div>

          {/* Summary Cards */}
          {loanData && (
            <div className="lph-summary">
              {[
                { l:'Total Pinjaman', v:loanData.amount, c:'#111827', bg:'#f9fafb', bd:'#e5e7eb', Icon: CreditCard },
                { l:'Sudah Dibayar', v:totalPaid, c:'#059669', bg:'#f0fdf4', bd:'#86efac', Icon: CheckCircle },
                { l:'Sisa Hutang', v:remaining, c:remaining>0?'#d97706':'#059669', bg:remaining>0?'#fffbeb':'#f0fdf4', bd:remaining>0?'#fde68a':'#86efac', Icon: TrendingDown },
              ].map(({ l,v,c,bg,bd,Icon }) => (
                <div key={l} style={{ background:bg,border:`1.5px solid ${bd}`,borderRadius:12,padding:'16px 14px' }}>
                  <Icon size={18} color={c} style={{ marginBottom: 8 }} />
                  <p style={{ fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:4 }}>{l}</p>
                  <p style={{ fontSize:'clamp(13px,1.5vw,16px)',fontWeight:800,color:c,lineHeight:1.2 }}>{fmt(v)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Payment */}
          {user?.role === 'admin' && (
            <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f3f4f6', padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.05)' }}>
              <button onClick={() => setShowForm(!showForm)}
                style={{ display:'flex',alignItems:'center',gap:8,padding:'12px 20px',background:showForm?'#6b7280':'#059669',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',width:'100%',justifyContent:'center' }}>
                {showForm ? <><X size={15}/>Tutup</> : <><Plus size={15}/>Tambah Pembayaran</>}
              </button>
              {showForm && (
                <div style={{ marginTop: 14 }}>
                  <div className="lph-form-grid" style={{ marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Jumlah (Rp)</label>
                      <input type="number" placeholder="Contoh: 500000" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})}
                        style={{ width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:9,fontSize:14,background:'#f9fafb',outline:'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Tanggal Bayar</label>
                      <input type="date" value={form.date} onChange={e => setForm({...form,date:e.target.value})}
                        style={{ width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:9,fontSize:14,background:'#f9fafb',outline:'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Catatan</label>
                      <input type="text" placeholder="Opsional" value={form.notes} onChange={e => setForm({...form,notes:e.target.value})}
                        style={{ width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:9,fontSize:14,background:'#f9fafb',outline:'none' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleAdd} disabled={submitting || !form.amount}
                      style={{ flex:1,padding:'11px',background:'#059669',color:'#fff',border:'none',borderRadius:9,fontSize:14,fontWeight:700,cursor:submitting?'not-allowed':'pointer',opacity:submitting?.7:1 }}>
                      {submitting?'Menyimpan...':'Simpan Pembayaran'}
                    </button>
                    <button onClick={() => setShowForm(false)}
                      style={{ padding:'11px 16px',background:'#f3f4f6',color:'#374151',border:'none',borderRadius:9,fontSize:14,fontWeight:600,cursor:'pointer' }}>
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Payment list */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f3f4f6', padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Riwayat Pembayaran</h2>
            {!loading && <span style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{payments.length} transaksi</span>}
          </div>

          {loading ? (
            <div style={{ display:'flex',justifyContent:'center',padding:48 }}>
              <div style={{ width:28,height:28,border:'3px solid #e5e7eb',borderTop:'3px solid #059669',borderRadius:'50%',animation:'sp .8s linear infinite' }} />
            </div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign:'center',padding:'48px 20px',background:'#f9fafb',borderRadius:12,border:'1.5px dashed #e5e7eb' }}>
              <Wallet size={36} color="#d1d5db" style={{ marginBottom: 10 }} />
              <p style={{ fontSize:14,color:'#9ca3af',fontWeight:500 }}>Belum ada riwayat pembayaran</p>
              <p style={{ fontSize:12,color:'#d1d5db',marginTop:4 }}>Tambahkan pembayaran pertama di sebelah kiri</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {payments.map((p, i) => (
                <div key={p.id||i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',background:'#f9fafb',borderRadius:12,border:'1.5px solid #f3f4f6',gap:12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize:16,fontWeight:800,color:'#059669',margin:0 }}>{fmt(p.amount)}</p>
                    <div style={{ display:'flex',alignItems:'center',gap:5,marginTop:4 }}>
                      <Calendar size={12} color="#9ca3af" />
                      <span style={{ fontSize:12,color:'#6b7280' }}>{new Date(p.payment_date||p.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</span>
                    </div>
                    {p.notes && <p style={{ fontSize:12,color:'#9ca3af',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.notes}</p>}
                  </div>
                  <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'5px 10px',background:'#f0fdf4',color:'#059669',borderRadius:8,fontSize:11,fontWeight:700,flexShrink:0,border:'1px solid #bbf7d0' }}>
                    <CheckCircle size={12}/> Lunas
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}