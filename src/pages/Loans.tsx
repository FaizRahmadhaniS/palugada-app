import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, FileText, X, Calendar, CreditCard, Clock, TrendingDown, ChevronRight, AlertCircle, History, ListChecks } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import { useLanguage } from '../contexts/LanguageContext';

const fmt = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

const generateBarcode = (text: string) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, { format: 'CODE128', displayValue: false, height: 40, width: 2, margin: 0 });
  return canvas.toDataURL('image/png');
};

export default function Loans() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'jadwal' | 'riwayat'>('info');
  const { t } = useLanguage();

  useEffect(() => { fetchLoans(); }, []);

  const fetchLoans = async () => {
    try {
      const res = await fetch('/api/loans', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLoans(Array.isArray(data) ? data : []);
    } catch { setLoans([]); }
    finally { setLoading(false); }
  };

  const openDetail = async (loan: any) => {
    setSelectedLoan(loan);
    setActiveTab('info');
    setDetailLoading(true);
    try {
      const [schRes, payRes] = await Promise.all([
        fetch(`/api/loan_schedules/${loan.memberId || loan.member_id}`, { credentials: 'include' }),
        fetch(`/api/loan-payments/${loan.id}`, { credentials: 'include' }),
      ]);
      const schData = schRes.ok ? await schRes.json() : [];
      const payData = payRes.ok ? await payRes.json() : [];
      // Filter schedules for this specific loan
      setSchedules(Array.isArray(schData) ? schData.filter((s: any) => s.loan_id === loan.id) : []);
      setPayments(Array.isArray(payData) ? payData : []);
    } catch { setSchedules([]); setPayments([]); }
    finally { setDetailLoading(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/loans/${id}/status`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchLoans();
      if (selectedLoan?.id === id) setSelectedLoan(null);
    } catch {}
  };

  const exportLoansPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Laporan Data Pinjaman', 14, 20);
    doc.setFontSize(11); doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [['No', 'Anggota', 'Jumlah', 'Tenor', 'Sisa', 'Status']],
      body: loans.map((l, i) => [i+1, l.memberName||'N/A', fmt(l.amount), `${l.duration||0} bln`, fmt(l.remainingBalance), l.status]),
      styles: { fontSize: 9 }, headStyles: { fillColor: [5,150,105] }
    });
    doc.save('data-pinjaman.pdf');
  };

  const filtered = loans.filter(l =>
    (l.memberName||'').toLowerCase().includes(search.toLowerCase()) ||
    (l.id||'').toLowerCase().includes(search.toLowerCase())
  );

  // Fix: use paid_amount if available, else fallback to amount - remaining
  const getPaid = (loan: any) => loan.paid_amount ?? Math.max(0, (loan.amount||0) - (loan.remainingBalance||0));
  const getTotal = (loan: any) => loan.total_repayment || loan.amount || 0;
  const getPct = (loan: any) => {
    const total = getTotal(loan);
    const paid = getPaid(loan);
    return total > 0 ? Math.min(100, Math.max(0, Math.round((paid / total) * 100))) : 0;
  };

  const TAB = ({ id, label, icon }: { id: 'info'|'jadwal'|'riwayat', label: string, icon: React.ReactNode }) => (
    <button onClick={() => setActiveTab(id)} style={{
      flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
      borderBottom: activeTab === id ? '2.5px solid #059669' : '2.5px solid transparent',
      color: activeTab === id ? '#059669' : '#9ca3af',
      background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      transition: 'all .15s'
    }}>{icon}{label}</button>
  );

  return (
    <div style={{ padding: '20px 16px', width: '100%' }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>

      {/* MODAL */}
      {selectedLoan && (
        <div style={{ position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
          onClick={() => setSelectedLoan(null)}>
          <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(4px)' }} />
          <div style={{ position:'relative',background:'#fff',borderRadius:18,width:'100%',maxWidth:560,maxHeight:'92vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,.25)',display:'flex',flexDirection:'column' }}
            onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ background:'linear-gradient(135deg,#059669,#0d9488)',padding:'20px 24px',borderRadius:'18px 18px 0 0',flexShrink:0 }}>
              <button onClick={() => setSelectedLoan(null)} style={{ position:'absolute',top:16,right:16,background:'rgba(255,255,255,.2)',border:'none',borderRadius:'50%',width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff' }}>
                <X size={15}/>
              </button>
              <div style={{ display:'flex',alignItems:'center',gap:14 }}>
                <div style={{ width:52,height:52,borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',flexShrink:0 }}>
                  {(selectedLoan.memberName||'?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize:18,fontWeight:800,color:'#fff',margin:0 }}>{selectedLoan.memberName||'N/A'}</p>
                  <p style={{ fontSize:12,color:'rgba(255,255,255,.75)',margin:'3px 0 0' }}>
                    ID: #{selectedLoan.id?.slice(0,12)} &nbsp;·&nbsp; Diajukan: {fmtDate(selectedLoan.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex',borderBottom:'1px solid #f3f4f6',flexShrink:0 }}>
              <TAB id="info" label="Info" icon={<CreditCard size={13}/>} />
              <TAB id="jadwal" label={`Jadwal (${schedules.length})`} icon={<ListChecks size={13}/>} />
              <TAB id="riwayat" label={`Riwayat (${payments.length})`} icon={<History size={13}/>} />
            </div>

            {/* Tab Content */}
            <div style={{ padding:'20px 24px',overflowY:'auto' }}>
              {detailLoading ? (
                <div style={{ display:'flex',justifyContent:'center',padding:40 }}>
                  <div style={{ width:28,height:28,border:'3px solid #e5e7eb',borderTop:'3px solid #059669',borderRadius:'50%',animation:'sp .8s linear infinite' }} />
                </div>
              ) : (
                <>
                  {/* INFO TAB */}
                  {activeTab === 'info' && (
                    <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                      {/* Progress Bar - FIXED */}
                      <div style={{ background:'#f9fafb',borderRadius:12,padding:16 }}>
                        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                          <span style={{ fontSize:13,fontWeight:600,color:'#374151' }}>Progress Pelunasan</span>
                          <span style={{ fontSize:14,fontWeight:800,color:'#059669' }}>{getPct(selectedLoan)}%</span>
                        </div>
                        <div style={{ background:'#e5e7eb',borderRadius:50,height:10,overflow:'hidden' }}>
                          <div style={{ background:'linear-gradient(90deg,#10b981,#059669)',borderRadius:50,height:'100%',width:`${getPct(selectedLoan)}%`,transition:'width .5s ease' }} />
                        </div>
                        <div style={{ display:'flex',justifyContent:'space-between',marginTop:7 }}>
                          <span style={{ fontSize:12,color:'#6b7280' }}>Dibayar: <b style={{ color:'#059669' }}>{fmt(getPaid(selectedLoan))}</b></span>
                          <span style={{ fontSize:12,color:'#6b7280' }}>Total: <b>{fmt(getTotal(selectedLoan))}</b></span>
                        </div>
                      </div>

                      {/* 4 cards */}
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                        {[
                          { l:'Total Pinjaman', v:fmt(selectedLoan.amount), c:'#111827', bg:'#f9fafb', bd:'#e5e7eb', Icon:CreditCard },
                          { l:'Sisa Hutang', v:fmt(selectedLoan.remainingBalance), c:(selectedLoan.remainingBalance||0)>0?'#d97706':'#059669', bg:(selectedLoan.remainingBalance||0)>0?'#fffbeb':'#f0fdf4', bd:(selectedLoan.remainingBalance||0)>0?'#fde68a':'#86efac', Icon:TrendingDown },
                          { l:'Tenor', v:`${selectedLoan.duration||0} Bulan`, c:'#3b82f6', bg:'#eff6ff', bd:'#bfdbfe', Icon:Clock },
                          { l:'Bunga', v:`${selectedLoan.interest_rate||selectedLoan.interestRate||1}% / bln`, c:'#8b5cf6', bg:'#faf5ff', bd:'#ddd6fe', Icon:AlertCircle },
                        ].map(({ l,v,c,bg,bd,Icon }) => (
                          <div key={l} style={{ background:bg,border:`1.5px solid ${bd}`,borderRadius:12,padding:'14px 12px' }}>
                            <Icon size={16} color={c} style={{ marginBottom:6 }} />
                            <p style={{ fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.04em',margin:'0 0 4px' }}>{l}</p>
                            <p style={{ fontSize:15,fontWeight:800,color:c,margin:0 }}>{v}</p>
                          </div>
                        ))}
                      </div>

                      {/* Status + Dates + Purpose */}
                      <div style={{ background:'#f9fafb',borderRadius:12,padding:'14px 16px',display:'flex',flexDirection:'column',gap:10 }}>
                        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                          <div>
                            <p style={{ fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.04em',margin:'0 0 5px' }}>Status</p>
                            <span style={{ display:'inline-block',padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:700,
                              background: selectedLoan.status==='approved'?'#f0fdf4':selectedLoan.status==='paid_off'?'#eff6ff':selectedLoan.status==='pending'?'#fffbeb':'#fff1f2',
                              color: selectedLoan.status==='approved'?'#059669':selectedLoan.status==='paid_off'?'#3b82f6':selectedLoan.status==='pending'?'#d97706':'#e11d48',
                              border: `1.5px solid ${selectedLoan.status==='approved'?'#86efac':selectedLoan.status==='paid_off'?'#bfdbfe':selectedLoan.status==='pending'?'#fde68a':'#fecdd3'}`
                            }}>
                              {selectedLoan.status==='approved'?'✓ Disetujui':selectedLoan.status==='paid_off'?'✓ Lunas':selectedLoan.status==='pending'?'⏱ Menunggu':'✗ Ditolak'}
                            </span>
                          </div>
                          {selectedLoan.approved_date && (
                            <div style={{ textAlign:'right' }}>
                              <p style={{ fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.04em',margin:'0 0 4px' }}>Disetujui</p>
                              <p style={{ fontSize:12,fontWeight:600,color:'#374151' }}>{fmtDate(selectedLoan.approved_date)}</p>
                            </div>
                          )}
                        </div>
                        {selectedLoan.purpose && (
                          <div style={{ borderTop:'1px solid #e5e7eb',paddingTop:10 }}>
                            <p style={{ fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.04em',margin:'0 0 4px' }}>Tujuan Pinjaman</p>
                            <p style={{ fontSize:13,color:'#374151',margin:0 }}>{selectedLoan.purpose}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {selectedLoan.status === 'pending' && (
                        <div style={{ display:'flex',gap:10 }}>
                          <button onClick={() => handleStatusChange(selectedLoan.id,'approved')}
                            style={{ flex:1,padding:12,background:'#059669',color:'#fff',border:'none',borderRadius:11,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                            <CheckCircle size={16}/> Setujui Pinjaman
                          </button>
                          <button onClick={() => handleStatusChange(selectedLoan.id,'rejected')}
                            style={{ flex:1,padding:12,background:'#fff1f2',color:'#e11d48',border:'1.5px solid #fecdd3',borderRadius:11,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                            <XCircle size={16}/> Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* JADWAL TAB */}
                  {activeTab === 'jadwal' && (
                    <div>
                      {schedules.length === 0 ? (
                        <div style={{ textAlign:'center',padding:'40px 20px',background:'#f9fafb',borderRadius:12,border:'1.5px dashed #e5e7eb' }}>
                          <ListChecks size={36} color="#d1d5db" style={{ marginBottom:10 }} />
                          <p style={{ fontSize:14,color:'#9ca3af' }}>Belum ada jadwal angsuran</p>
                          <p style={{ fontSize:12,color:'#d1d5db',marginTop:4 }}>Jadwal dibuat otomatis saat pinjaman disetujui</p>
                        </div>
                      ) : (
                        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                          {schedules.map((s, i) => {
                            const isPaid = s.status === 'Paid' || s.status === 'paid';
                            const isOverdue = s.status === 'Overdue' || s.status === 'overdue' || (s.status !== 'Paid' && new Date(s.due_date) < new Date());
                            return (
                              <div key={s.id||i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',background: isPaid?'#f0fdf4':isOverdue?'#fff1f2':'#f9fafb',border:`1.5px solid ${isPaid?'#86efac':isOverdue?'#fecdd3':'#e5e7eb'}`,borderRadius:10,gap:10 }}>
                                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                                  <div style={{ width:30,height:30,borderRadius:'50%',background:isPaid?'#059669':isOverdue?'#e11d48':'#6b7280',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0 }}>
                                    {i+1}
                                  </div>
                                  <div>
                                    <p style={{ fontSize:12,fontWeight:700,color:'#374151',margin:0 }}>Angsuran ke-{s.installment_number||i+1}</p>
                                    <p style={{ fontSize:11,color:'#6b7280',margin:'2px 0 0',display:'flex',alignItems:'center',gap:4 }}>
                                      <Calendar size={11}/> {fmtDate(s.due_date)}
                                    </p>
                                  </div>
                                </div>
                                <div style={{ textAlign:'right' }}>
                                  <p style={{ fontSize:14,fontWeight:800,color:isPaid?'#059669':isOverdue?'#e11d48':'#111827',margin:0 }}>{fmt(s.amount_due||s.total_payment||0)}</p>
                                  <span style={{ fontSize:10,fontWeight:700,color:isPaid?'#059669':isOverdue?'#e11d48':'#6b7280' }}>
                                    {isPaid?'✓ Lunas':isOverdue?'⚠ Terlambat':'○ Belum'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* RIWAYAT TAB */}
                  {activeTab === 'riwayat' && (
                    <div>
                      {payments.length === 0 ? (
                        <div style={{ textAlign:'center',padding:'40px 20px',background:'#f9fafb',borderRadius:12,border:'1.5px dashed #e5e7eb' }}>
                          <History size={36} color="#d1d5db" style={{ marginBottom:10 }} />
                          <p style={{ fontSize:14,color:'#9ca3af' }}>Belum ada riwayat pembayaran</p>
                        </div>
                      ) : (
                        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                          {payments.map((p, i) => (
                            <div key={p.id||i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',background:'#f9fafb',borderRadius:10,border:'1.5px solid #f3f4f6',gap:8 }}>
                              <div>
                                <p style={{ fontSize:14,fontWeight:800,color:'#059669',margin:0 }}>{fmt(p.amount)}</p>
                                <div style={{ display:'flex',alignItems:'center',gap:5,marginTop:3 }}>
                                  <Calendar size={11} color="#9ca3af"/>
                                  <span style={{ fontSize:12,color:'#6b7280' }}>{fmtDate(p.payment_date||p.created_at)}</span>
                                </div>
                                {p.notes && <p style={{ fontSize:11,color:'#9ca3af',margin:'2px 0 0' }}>{p.notes}</p>}
                              </div>
                              <span style={{ fontSize:11,fontWeight:700,color:'#059669',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'4px 10px',flexShrink:0 }}>
                                <CheckCircle size={11} style={{ marginRight:3 }}/>Lunas
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12 }}>
        <div>
          <h1 style={{ fontSize:'clamp(18px,3vw,26px)',fontWeight:800,color:'#111827',margin:0 }}>Data Pinjaman</h1>
          <p style={{ fontSize:13,color:'#6b7280',marginTop:4 }}>Kelola data pinjaman anggota</p>
        </div>
        <button onClick={exportLoansPDF} style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 18px',background:'#ea580c',color:'#fff',border:'none',borderRadius:11,fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0 }}>
          <FileText size={16}/> Unduh PDF
        </button>
      </div>

      {/* Search */}
      <div style={{ position:'relative',marginBottom:16 }}>
        <Search size={16} style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#9ca3af' }} />
        <input type="text" placeholder="Cari nama anggota..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width:'100%',padding:'11px 14px 11px 40px',border:'1.5px solid #e5e7eb',borderRadius:11,fontSize:14,background:'#f9fafb',outline:'none',boxSizing:'border-box' }} />
      </div>

      {/* Table */}
      <div style={{ background:'#fff',borderRadius:14,border:'1.5px solid #f3f4f6',overflow:'hidden',boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',minWidth:500 }}>
            <thead>
              <tr style={{ background:'#f9fafb',borderBottom:'1.5px solid #f3f4f6' }}>
                {['Detail','Aksi','Anggota','Jumlah','Tenor','Sisa','Status'].map(h => (
                  <th key={h} style={{ padding:'12px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.04em',whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding:48,textAlign:'center' }}>
                  <div style={{ width:28,height:28,border:'3px solid #e5e7eb',borderTop:'3px solid #059669',borderRadius:'50%',animation:'sp .8s linear infinite',margin:'0 auto' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:48,textAlign:'center',color:'#9ca3af',fontSize:14 }}>Belum ada pinjaman</td></tr>
              ) : filtered.map(loan => (
                <tr key={loan.id} style={{ borderBottom:'1px solid #f9fafb',cursor:'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background='#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                  <td style={{ padding:'12px 14px' }}>
                    <button onClick={() => openDetail(loan)}
                      style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 12px',background:'#eff6ff',color:'#3b82f6',border:'1px solid #bfdbfe',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap' }}>
                      Lihat <ChevronRight size={13}/>
                    </button>
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex',gap:4 }}>
                      {loan.status === 'pending' ? (
                        <>
                          <button onClick={() => handleStatusChange(loan.id,'approved')} title="Setujui"
                            style={{ width:28,height:28,borderRadius:7,background:'#f0fdf4',border:'1px solid #86efac',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#059669' }}>
                            <CheckCircle size={15}/>
                          </button>
                          <button onClick={() => handleStatusChange(loan.id,'rejected')} title="Tolak"
                            style={{ width:28,height:28,borderRadius:7,background:'#fff1f2',border:'1px solid #fecdd3',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#e11d48' }}>
                            <XCircle size={15}/>
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize:10,fontWeight:700,color:'#9ca3af',background:'#f3f4f6',padding:'3px 7px',borderRadius:5 }}>✓</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:'12px 14px',fontWeight:600,color:'#111827',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{loan.memberName||'N/A'}</td>
                  <td style={{ padding:'12px 14px',fontWeight:800,color:'#059669',whiteSpace:'nowrap' }}>{fmt(loan.amount)}</td>
                  <td style={{ padding:'12px 14px',color:'#6b7280',whiteSpace:'nowrap',textAlign:'center' }}>{loan.duration||0} bln</td>
                  <td style={{ padding:'12px 14px',fontWeight:700,color:'#d97706',whiteSpace:'nowrap' }}>{fmt(loan.remainingBalance)}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ display:'inline-block',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:'nowrap',
                      background: loan.status==='approved'?'#f0fdf4':loan.status==='paid_off'?'#eff6ff':loan.status==='pending'?'#fffbeb':'#fff1f2',
                      color: loan.status==='approved'?'#059669':loan.status==='paid_off'?'#3b82f6':loan.status==='pending'?'#d97706':'#e11d48',
                      border: `1px solid ${loan.status==='approved'?'#86efac':loan.status==='paid_off'?'#bfdbfe':loan.status==='pending'?'#fde68a':'#fecdd3'}`
                    }}>
                      {loan.status==='approved'?'Setuju':loan.status==='paid_off'?'Lunas':loan.status==='pending'?'Tunggu':'Tolak'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}