import React, { useState, useEffect, useMemo } from 'react';
import { useDialog } from '../components/Dialog';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Wallet,
  AlertCircle,
  ArrowRight,
  History,
  Plus,
  FileText
} from 'lucide-react';
import { cn } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addPDFHeader, addPDFFooter, addSignatureArea, fmt as fmtPdf } from '../utils/pdfHelper';

const generateBarcode = (text: string) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, { format: 'CODE128', displayValue: false, height: 40, width: 2, margin: 0 });
  return canvas.toDataURL('image/png');
};

export default function Withdrawals({ user }: { user?: any }) {
  const { confirm: dlgConfirm, alert: dlgAlert } = useDialog();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [adminFee, setAdminFee] = useState(5000);
  const [bankName, setBankName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const filteredWithdrawals = useMemo(() => withdrawals.filter(w => {
    const d = w.created_at ? w.created_at.split('T')[0] : '';
    const matchStatus = !filterStatus || w.status === filterStatus;
    const matchFrom = !filterDateFrom || d >= filterDateFrom;
    const matchTo = !filterDateTo || d <= filterDateTo;
    return matchStatus && matchFrom && matchTo;
  }), [withdrawals, filterStatus, filterDateFrom, filterDateTo]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const [sukarelaSaldo, setSukarelaSaldo] = useState(0);

  useEffect(() => {
    const safeFetch = (url: string) => 
      fetch(url, { credentials: 'include' }).then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Oops, we haven't got JSON!");
        }
        return res.json();
      });

    safeFetch('/api/settings/general')
      .then(data => {
        if (data.withdrawalAdminFee !== undefined) {
          setAdminFee(data.withdrawalAdminFee);
        }
      })
      .catch(console.error);

    if (!user) {
      safeFetch('/api/auth/me').then(data => setCurrentUser(data.user)).catch(console.error);
    }

    // Fetch sukarela savings balance
    fetch('/api/savings', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sukarela = data
            .filter(s => (s.description || s.type || '').toLowerCase().includes('sukarela'))
            .reduce((sum, s) => sum + (s.type === 'Withdrawal' ? -(s.amount || 0) : (s.amount || 0)), 0);
          setSukarelaSaldo(Math.max(0, sukarela));
        }
      })
      .catch(() => {});

    fetchWithdrawals();
  }, [user]);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/withdrawals', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setWithdrawals(data);
      } else {
        setWithdrawals([]);
      }
    } catch (err) {
      console.error(err);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/withdrawals', { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          description,
          memberId: currentUser?.id,
          bankName,
          accountNumber,
          accountHolder
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setAmount('');
        setDescription('');
        setBankName('');
        setAccountNumber('');
        setAccountHolder('');
        fetchWithdrawals();
      } else {
        dlgAlert({ message: data.message || 'Gagal mengajukan penarikan', type: 'info', confirmText: 'OK' });
      }
    } catch (err) {
      console.error(err);
      dlgAlert({ title: 'Perhatian', message: 'Terjadi kesalahan', type: 'error', confirmText: 'OK' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, status: 'success' | 'failed') => {
    try {
      await fetch(`/api/withdrawals/${id}/status`, { credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchWithdrawals();
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  const exportWithdrawalsPDF = async () => {
    const doc = new jsPDF();
    const reportId = `WD-${Date.now()}`;
    const color: [number, number, number] = [16, 185, 129];

    const startY = await addPDFHeader(doc, {
      reportId,
      title: 'Laporan Penarikan Dana',
      subtitle: `Periode: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Total: ${withdrawals.length} transaksi`,
      accentColor: color
    });

    const statusMap: Record<string, string> = { pending: 'Menunggu', success: 'Berhasil', failed: 'Ditolak' };
    const totalAmt = withdrawals.filter(w => w.status === 'success').reduce((s, w) => s + (w.amount || 0), 0);

    autoTable(doc, {
      startY,
      head: [['NO', 'ANGGOTA', 'TANGGAL', 'JUMLAH', 'KETERANGAN / REKENING', 'STATUS']],
      body: filteredWithdrawals.map((w, i) => [
        i + 1,
        w.memberName || '-',
        new Date(w.created_at).toLocaleDateString('id-ID'),
        fmtPdf(w.amount),
        w.description || '-',
        statusMap[w.status] || w.status
      ]),
      foot: [['', '', 'TOTAL DICAIRKAN', fmtPdf(totalAmt), '', '']],
      headStyles: { fillColor: color, textColor: [255, 255, 255] as [number,number,number], fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2.5, minCellHeight: 8 },
      footStyles: { fillColor: [15, 23, 42] as [number,number,number], textColor: [255, 255, 255] as [number,number,number], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2, minCellHeight: 6.5, textColor: [15, 23, 42] as [number,number,number] },
      alternateRowStyles: { fillColor: [240, 253, 244] as [number,number,number] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        3: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'center', cellWidth: 22 }
      },
      tableLineColor: [226, 232, 240] as [number,number,number],
      tableLineWidth: 0.3,
      margin: { left: 14, right: 14 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 200;
    if (finalY < 240) addSignatureArea(doc, finalY + 8);
    addPDFFooter(doc, color);
    doc.save(`laporan-penarikan-${Date.now()}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Penarikan Dana</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola pengajuan penarikan simpanan sukarela.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button 
              onClick={exportWithdrawalsPDF}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 dark:shadow-none"
            >
              <FileText size={20} />
              Unduh PDF
            </button>
          )}
          {!isAdmin && (
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
            >
              <Plus size={20} />
              Tarik Dana
            </button>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-200 dark:shadow-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>
            <Wallet className="mb-4 opacity-80" size={32} />
            <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Saldo Sukarela</p>
            <h3 className="text-3xl font-black mt-1">Rp {sukarelaSaldo.toLocaleString('id-ID')}</h3>
            <p className="text-[10px] mt-4 font-bold uppercase tracking-tighter opacity-60">Dapat ditarik kapan saja</p>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Penarikan Pending</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Rp {withdrawals.filter(w => w.status === 'pending' && w.memberId === currentUser?.id).reduce((sum, w) => sum + (w.amount || 0), 0).toLocaleString('id-ID')}
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Ditarik</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Rp {withdrawals.filter(w => w.status === 'success' && w.memberId === currentUser?.id).reduce((sum, w) => sum + (w.amount || 0), 0).toLocaleString('id-ID')}
            </h3>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History size={18} className="text-blue-600" /> Riwayat Penarikan
          </h3>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="success">Berhasil</option>
              <option value="failed">Ditolak</option>
            </select>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs font-medium text-slate-500">Tanggal:</span>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className="px-2 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none" />
              <span className="text-slate-400">—</span>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className="px-2 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none" />
            </div>
            {(filterStatus || filterDateFrom || filterDateTo) && (
              <button onClick={() => { setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">✕ Reset</button>
            )}
            <span className="text-xs text-slate-400 ml-auto">{filteredWithdrawals.length} dari {withdrawals.length} transaksi</span>
          </div>
        </div>

        <style>{`
          .wd-card { display: none; }
          @media (max-width: 640px) {
            .wd-table-wrap { display: none; }
            .wd-card { display: flex; flex-direction: column; gap: 10px; padding: 14px; }
          }
        `}</style>

        {/* DESKTOP: Table */}
        <div className="wd-table-wrap overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Tanggal</th>
                {isAdmin && <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Anggota</th>}
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Jumlah</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Keterangan</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                {isAdmin && <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={isAdmin ? 6 : 4} className="px-6 py-12 text-center text-slate-500">Memuat data...</td></tr>
              ) : filteredWithdrawals.length > 0 ? filteredWithdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {new Date(w.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{w.memberName}</p>
                      <p className="text-[10px] text-slate-500">{w.memberEmail}</p>
                    </td>
                  )}
                  <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                    Rp {(w.amount || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 italic">
                    {w.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-max",
                      w.status === 'pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                      w.status === 'success' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                    )}>
                      {w.status === 'pending' ? <Clock size={12} /> : w.status === 'success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {w.status === 'pending' ? 'Menunggu' : w.status === 'success' ? 'Berhasil' : 'Ditolak'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 space-x-2">
                      {w.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(w.id, 'success')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
                            <CheckCircle2 size={18} />
                          </button>
                          <button onClick={() => handleAction(w.id, 'failed')} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan={isAdmin ? 6 : 4} className="px-6 py-12 text-center text-slate-500">Belum ada riwayat penarikan</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE: Cards */}
        <div className="wd-card">
          {loading ? (
            <div style={{ textAlign:'center', padding:32, color:'#9ca3af' }}>Memuat data...</div>
          ) : withdrawals.length === 0 ? (
            <div style={{ textAlign:'center', padding:32, color:'#9ca3af' }}>Belum ada riwayat penarikan</div>
          ) : filteredWithdrawals.map((w) => (
            <div key={w.id} style={{ background:'#fff', border:'1.5px solid #f3f4f6', borderRadius:14, padding:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  {isAdmin && <p style={{ fontSize:13, fontWeight:700, color:'#111827', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{w.memberName}</p>}
                  <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>{new Date(w.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</p>
                  {w.description && <p style={{ fontSize:12, color:'#9ca3af', margin:'3px 0 0', fontStyle:'italic' }}>{w.description}</p>}
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ fontSize:16, fontWeight:800, color:'#111827', margin:0 }}>Rp {(w.amount||0).toLocaleString('id-ID')}</p>
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, display:'inline-block', marginTop:4,
                    background: w.status==='pending'?'#fffbeb':w.status==='success'?'#f0fdf4':'#fff1f2',
                    color: w.status==='pending'?'#d97706':w.status==='success'?'#059669':'#e11d48',
                    border: `1px solid ${w.status==='pending'?'#fde68a':w.status==='success'?'#86efac':'#fecdd3'}`
                  }}>
                    {w.status==='pending'?'Menunggu':w.status==='success'?'Berhasil':'Ditolak'}
                  </span>
                </div>
              </div>
              {isAdmin && w.status === 'pending' && (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => handleAction(w.id, 'success')}
                    style={{ flex:1, padding:'10px', background:'#f0fdf4', color:'#059669', border:'1.5px solid #86efac', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <CheckCircle2 size={14}/> Setujui
                  </button>
                  <button onClick={() => handleAction(w.id, 'failed')}
                    style={{ flex:1, padding:'10px', background:'#fff1f2', color:'#e11d48', border:'1.5px solid #fecdd3', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <XCircle size={14}/> Tolak
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ajukan Penarikan</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <XCircle size={20} className="text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/10 flex gap-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                  <div className="space-y-1">
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      Penarikan hanya bisa dilakukan dari saldo <strong>Simpanan Sukarela</strong>.
                    </p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase">
                      Biaya Admin: Rp {adminFee.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Jumlah Penarikan (Rp)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Contoh: 500000"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all font-black text-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Bank Tujuan <span className="text-red-400">*</span></label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all text-sm"
                    required
                  >
                    <option value="">-- Pilih Bank --</option>
                    {['BCA','BRI','BNI','Mandiri','BSI','CIMB Niaga','Danamon','BTN','Permata','BRImo','Jenius','GoPay','OVO','Dana','ShopeePay'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nomor Rekening <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 1234567890"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Atas Nama <span className="text-red-400">*</span></label>
                  <input 
                    type="text" 
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Nama sesuai rekening"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Keterangan (Opsional)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Untuk keperluan mendesak"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all text-sm min-h-[80px]"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : (
                    <>
                      Kirim Pengajuan
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}