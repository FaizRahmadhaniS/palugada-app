import React, { useState, useEffect } from 'react';
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
import JsBarcode from 'jsbarcode';

const generateBarcode = (text: string) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, { format: 'CODE128', displayValue: false, height: 40, width: 2, margin: 0 });
  return canvas.toDataURL('image/png');
};

export default function Withdrawals({ user }: { user?: any }) {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [adminFee, setAdminFee] = useState(5000);

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
          memberId: currentUser?.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setAmount('');
        setDescription('');
        fetchWithdrawals();
      } else {
        alert(data.message || 'Gagal mengajukan penarikan');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan');
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

  const isAdmin = currentUser?.role === 'admin';

  const exportWithdrawalsPDF = () => {
    const doc = new jsPDF();
    const reportId = `WITHDRAW-${Date.now()}`;
    
    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('PALUGADA COOP', 14, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Koperasi Simpan Pinjam Masa Depan', 14, 32);
    doc.text('Jl. Modern No. 123, Jakarta Selatan', 14, 37);

    // Barcode
    const barcodeData = generateBarcode(reportId);
    doc.addImage(barcodeData, 'PNG', 140, 10, 55, 20);
    doc.setFontSize(8);
    doc.text(`REPORT ID: ${reportId}`, 140, 35);
    doc.text(`GENERATED: ${new Date().toLocaleString('id-ID')}`, 140, 40);

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('LAPORAN PENARIKAN DANA', 14, 65);
    
    const tableData = withdrawals.map((w, index) => [
      index + 1,
      w.memberName || 'Admin',
      new Date(w.created_at).toLocaleDateString('id-ID'),
      `Rp ${(w.amount || 0).toLocaleString('id-ID')}`,
      w.description || '-',
      w.status === 'pending' ? 'Menunggu' : w.status === 'success' ? 'Berhasil' : 'Ditolak'
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['NO', 'ANGGOTA', 'TANGGAL', 'JUMLAH', 'KETERANGAN', 'STATUS']],
      body: tableData,
      headStyles: { 
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        3: { halign: 'right' },
        5: { halign: 'center' }
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Halaman ${i} dari ${pageCount} - Dokumen ini sah dikeluarkan oleh sistem Palugada.`, 105, 285, { align: 'center' });
    }

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
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History size={18} className="text-blue-600" />
            Riwayat Penarikan
          </h3>
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
              ) : withdrawals.length > 0 ? withdrawals.map((w) => (
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
          ) : withdrawals.map((w) => (
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
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
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
                      Penarikan hanya bisa dilakukan dari saldo **Simpanan Sukarela**.
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
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Keterangan (Opsional)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Untuk keperluan mendesak"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none transition-all text-sm min-h-[100px]"
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