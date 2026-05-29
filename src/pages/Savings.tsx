import React, { useState, useEffect, useMemo } from 'react';
import { useDialog } from '../components/Dialog';
import { Search, ChevronDown, ChevronUp, Plus, PiggyBank, History, CreditCard, Receipt, AlertTriangle, CheckCircle2, FileText, Trash2, Clock, ExternalLink, X, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addPDFHeader, addPDFFooter, addSignatureArea, fmt as pdfFmt } from '../utils/pdfHelper';

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_KEY = 'palugada_pending_payments';

function getLSPending(userId: string): any[] {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    return Array.isArray(all) ? all.filter((p: any) => p.userId === userId) : [];
  } catch { return []; }
}

function saveLSPending(userId: string, items: any[]) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    const others = Array.isArray(all) ? all.filter((p: any) => p.userId !== userId) : [];
    localStorage.setItem(LS_KEY, JSON.stringify([...others, ...items]));
  } catch {}
}

function addLSPending(item: any) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    localStorage.setItem(LS_KEY, JSON.stringify([...(Array.isArray(all) ? all : []), item]));
  } catch {}
}

function removeLSPending(orderId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    localStorage.setItem(LS_KEY, JSON.stringify(Array.isArray(all) ? all.filter((p: any) => p.orderId !== orderId) : []));
  } catch {}
}

// ── Payment Pending Modal ─────────────────────────────────────────────────────
function PaymentPendingModal({ pending, onConfirm, onCancel, loading }: {
  pending: any; onConfirm: (p: any) => void; onCancel: (orderId: string) => void; loading: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const exp = new Date(pending.createdAt).getTime() + 24 * 60 * 60 * 1000;
    return Math.max(0, Math.floor((exp - Date.now()) / 1000));
  });
  useEffect(() => { const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000); return () => clearInterval(t); }, []);
  const fmt = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(timeLeft / 3600), m = Math.floor((timeLeft % 3600) / 60), s = timeLeft % 60;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/30 p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="text-amber-600 dark:text-amber-400" size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Menunggu Pembayaran</h2>
          <p className="text-sm text-slate-500 mt-1">Selesaikan pembayaran sebelum waktu habis</p>
        </div>
        <div className="p-6 space-y-5">
          {/* Timer */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Batas Waktu</p>
            <div className="flex items-center justify-center gap-2">
              {[{ label: 'Jam', val: h }, { label: 'Menit', val: m }, { label: 'Detik', val: s }].map((item, i) => (
                <React.Fragment key={item.label}>
                  {i > 0 && <span className="text-2xl font-black text-slate-400">:</span>}
                  <div className="text-center">
                    <div className="text-3xl font-black text-amber-600 font-mono w-16 bg-white dark:bg-slate-700 rounded-xl py-1 shadow-sm">{fmt(item.val)}</div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">{item.label}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          {/* Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">ID Pesanan</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">{pending.orderId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Jenis</span>
              <span className="font-bold text-slate-900 dark:text-white">{pending.depositType}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Total Bayar</span>
              <span className="text-lg font-black text-emerald-600">Rp {(pending.amount || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>
          {pending.redirectUrl && (
            <a href={pending.redirectUrl} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl font-bold text-sm transition-all">
              <ExternalLink size={18} /> Buka Halaman Pembayaran
            </a>
          )}
          <p className="text-xs text-slate-400 text-center">Setelah membayar, klik <strong>Konfirmasi Pembayaran</strong>.</p>
          <div className="flex gap-3">
            <button onClick={() => onCancel(pending.orderId)} disabled={loading}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50">
              Batalkan
            </button>
            <button onClick={() => onConfirm(pending)} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20">
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <><CheckCircle2 size={16} /> Konfirmasi Pembayaran</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Savings({ user }: { user?: any }) {
  const { confirm: dlgConfirm, alert: dlgAlert } = useDialog();
  const [savings, setSavings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(user);
  const [activeTab, setActiveTab] = useState<'history' | 'deposit'>(() => {
    const p = new URLSearchParams(window.location.search);
    return (p.get('tab') as 'history' | 'deposit') || 'history';
  });
  const { t } = useLanguage();

  // Filter states
  const [filterType, setFilterType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Pending (dari localStorage)
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [activePendingModal, setActivePendingModal] = useState<any | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Form
  const [amount, setAmount] = useState('');
  const [depositType, setDepositType] = useState('Simpanan Wajib');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMessage, setDepositMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedLoan, setSelectedLoan] = useState('');
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [minDeposit, setMinDeposit] = useState(50000);

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  // Load user + savings saat mount
  useEffect(() => {
    if (!user) {
      fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).then(d => {
        setCurrentUser(d.user);
        if (d.user?.id) setPendingPayments(getLSPending(d.user.id));
      });
    } else {
      setPendingPayments(getLSPending(user.id));
    }
    fetchSavings();
  }, []);

  // Load loans + schedules untuk member
  useEffect(() => {
    if (!isAdmin && currentUser) {
      const sf = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());
      sf('/api/settings/general').then(d => { if (d?.minDeposit) setMinDeposit(d.minDeposit); }).catch(() => {});
      sf('/api/loans').then(data => {
        const active = Array.isArray(data) ? data.filter((l: any) => l.memberId === currentUser.id && l.status === 'approved' && l.remainingBalance > 0) : [];
        setLoans(active);
        if (active.length > 0) setSelectedLoan(active[0].id);
      }).catch(() => {});
      sf(`/api/loan_schedules/${currentUser.id}`).then(d => setSchedules(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }, [currentUser, isAdmin]);

  // Hitung total cicilan yang dipilih
  useEffect(() => {
    if (depositType === 'Pembayaran Pinjaman') {
      const total = selectedSchedules.reduce((sum, sid) => {
        const s = schedules.find(x => x.id === sid);
        return sum + (s ? Math.round(s.amount_due) : 0);
      }, 0);
      setAmount(total.toString());
    }
  }, [depositType, selectedSchedules, schedules]);

  const fetchSavings = async () => {
    try {
      const res = await fetch('/api/savings', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSavings(Array.isArray(data) ? data : []);
    } catch { setSavings([]); } finally { setLoading(false); }
  };

  // ── SUBMIT: Ambil token → simpan ke localStorage DAN DB → tampilkan modal ──
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(amount);
    if (depositType !== 'Pembayaran Pinjaman' && amountNum < minDeposit) {
      setDepositMessage({ text: `Minimal setoran Rp ${minDeposit.toLocaleString('id-ID')}`, type: 'error' });
      return;
    }
    setDepositLoading(true);
    setDepositMessage(null);

    try {
      const orderId = `PAY-${Date.now()}`;

      // 1. Minta token/redirect dari payment gateway
      const payRes = await fetch('/api/payment/create', {
        credentials: 'include', method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum, orderId,
          customerDetails: { first_name: currentUser?.name || 'Guest', email: currentUser?.email || '' }
        })
      });
      const payData = payRes.ok ? await payRes.json() : {};
      const redirectUrl = payData.redirect_url || '';

      // 2. Simpan ke DB (agar admin bisa lihat) — insert transactions status='pending'
      await fetch('/api/payment/pending', {
        credentials: 'include', method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId, amount: amountNum, redirectUrl, depositType,
          selectedSchedules: depositType === 'Pembayaran Pinjaman' ? [...selectedSchedules] : [],
          selectedLoan: depositType === 'Pembayaran Pinjaman' ? selectedLoan : null,
        })
      });

      // 3. Simpan ke localStorage (untuk session member)
      const pendingItem = {
        orderId, userId: currentUser?.id, amount: amountNum, redirectUrl, depositType,
        selectedSchedules: depositType === 'Pembayaran Pinjaman' ? [...selectedSchedules] : [],
        selectedLoan: depositType === 'Pembayaran Pinjaman' ? selectedLoan : null,
        createdAt: new Date().toISOString(),
      };
      addLSPending(pendingItem);
      setPendingPayments(getLSPending(currentUser?.id));

      // 4. Refresh savings list (pending muncul di riwayat)
      await fetchSavings();

      // 5. Tampilkan modal
      setActivePendingModal(pendingItem);

      setAmount('');
      setSelectedSchedules([]);
      setActiveTab('history');
    } catch (err: any) {
      setDepositMessage({ text: 'Terjadi kesalahan saat memproses pembayaran.', type: 'error' });
    } finally {
      setDepositLoading(false);
    }
  };

  // ── KONFIRMASI: Cek status Midtrans dulu, HANYA lanjut jika benar-benar paid ─
  const handleConfirmPayment = async (pending: any) => {
    setConfirmLoading(true);
    try {
      // 1. Cek status ke Midtrans
      const statusRes = await fetch(`/api/payment/status/${pending.orderId}`, { credentials: 'include' });
      const statusData = await statusRes.json();

      // WHITELIST: hanya lanjut jika paid === true (settlement / capture)
      if (!statusData.paid) {
        const st = statusData.status || 'unknown';
        let msg = 'Selesaikan pembayaran di halaman Midtrans terlebih dahulu, lalu klik Konfirmasi.';
        if (st === 'expire') {
          msg = 'Pembayaran telah kedaluwarsa. Silakan buat transaksi baru.';
          removeLSPending(pending.orderId);
          setPendingPayments(getLSPending(currentUser?.id));
          setActivePendingModal(null);
        } else if (st === 'deny' || st === 'cancel') {
          msg = `Pembayaran ${st === 'deny' ? 'ditolak' : 'dibatalkan'} oleh Midtrans. Silakan buat transaksi baru.`;
          removeLSPending(pending.orderId);
          setPendingPayments(getLSPending(currentUser?.id));
          setActivePendingModal(null);
        }
        dlgAlert({
          title: st === 'expire' || st === 'deny' || st === 'cancel' ? '❌ Pembayaran Gagal' : '⏳ Belum Dibayar',
          message: msg,
          type: 'error',
          confirmText: 'OK'
        });
        setConfirmLoading(false);
        return;
      }

      // Hanya sampai sini jika Midtrans konfirmasi paid = true (settlement/capture)
      // Update record di DB dari pending → success (via server endpoint)
      const confirmRes = await fetch(`/api/payment/confirm/${pending.orderId}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const confirmData = await confirmRes.json();
      if (!confirmData.success) throw new Error(confirmData.error || 'Gagal konfirmasi pembayaran');

      // Hapus dari localStorage
      removeLSPending(pending.orderId);
      setPendingPayments(getLSPending(currentUser?.id));
      setActivePendingModal(null);
      await fetchSavings();
      dlgAlert({ title: '✅ Pembayaran Berhasil!', message: 'Transaksi telah dikonfirmasi dan saldo diperbarui.', type: 'success', confirmText: 'OK' });
    } catch (err: any) {
      dlgAlert({ title: 'Gagal Konfirmasi', message: err.message || 'Terjadi kesalahan', type: 'error', confirmText: 'OK' });
    } finally {
      setConfirmLoading(false);
    }
  };

  // ── BATALKAN ─────────────────────────────────────────────────────────────
  const handleCancelPayment = async (orderId: string) => {
    const ok = await dlgConfirm({ title: 'Batalkan Pembayaran', message: 'Yakin ingin membatalkan pembayaran ini?', type: 'confirm', confirmText: 'Ya, Batalkan', cancelText: 'Tidak' });
    if (!ok) return;
    // Hapus dari DB dan localStorage
    await fetch(`/api/payment/pending/${orderId}`, { method: 'DELETE', credentials: 'include' });
    removeLSPending(orderId);
    setPendingPayments(getLSPending(currentUser?.id));
    setActivePendingModal(null);
    await fetchSavings();
  };

  const handleDeleteSaving = async (id: string) => {
    if (!await dlgConfirm({ title: 'Hapus Transaksi', message: 'Yakin ingin menghapus transaksi ini?', type: 'confirm', confirmText: 'Ya, Hapus', cancelText: 'Batal' })) return;
    const res = await fetch(`/api/savings/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (data.success) setSavings(prev => prev.filter(s => s.id !== id));
    else dlgAlert({ title: 'Perhatian', message: 'Gagal menghapus transaksi', type: 'error', confirmText: 'OK' });
  };

  // Filtered savings (member view)
  const filteredSavings = useMemo(() => savings.filter(s => {
    const matchType = !filterType || s.type === filterType;
    const d = (s.date || '').split('T')[0];
    const matchFrom = !filterDateFrom || d >= filterDateFrom;
    const matchTo = !filterDateTo || d <= filterDateTo;
    return matchType && matchFrom && matchTo;
  }), [savings, filterType, filterDateFrom, filterDateTo]);

  const groupedSavings = useMemo(() => {
    const groups: Record<string, any> = {};
    savings.forEach(s => {
      if (!groups[s.memberId]) groups[s.memberId] = { memberId: s.memberId, memberName: s.memberName || 'Unknown', totalAmount: 0, transactions: [] };
      groups[s.memberId].totalAmount += s.type === 'Withdrawal' ? -(s.amount || 0) : (s.amount || 0);
      groups[s.memberId].transactions.push(s);
    });
    return Object.values(groups).filter((g: any) => g.memberName.toLowerCase().includes(searchTerm.toLowerCase())).sort((a: any, b: any) => b.totalAmount - a.totalAmount);
  }, [savings, searchTerm]);

  const toggleExpand = (id: string) => setExpandedMember(expandedMember === id ? null : id);

  const exportSavingsPDF = async () => {
    const doc = new jsPDF();
    const reportId = `SAV-${Date.now()}`;
    const filterInfo = [filterType && `Jenis: ${filterType}`, filterDateFrom && `Dari: ${filterDateFrom}`, filterDateTo && `s/d: ${filterDateTo}`].filter(Boolean).join(' · ');
    const startY = await addPDFHeader(doc, {
      reportId,
      title: isAdmin ? 'Laporan Simpanan Semua Anggota' : 'Laporan Simpanan Pribadi',
      subtitle: filterInfo || `Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      printedBy: currentUser?.name
    });
    const confirmedSavings = filteredSavings.filter(s => s.status !== 'pending');
    const td = isAdmin
      ? (groupedSavings as any[]).map((g, i) => [i + 1, g.memberName, `Rp ${g.totalAmount.toLocaleString('id-ID')}`, g.transactions.length])
      : confirmedSavings.map((s, i) => [i + 1, new Date(s.date).toLocaleDateString('id-ID'), s.type, `Rp ${(s.amount || 0).toLocaleString('id-ID')}`, s.description || '-']);
    autoTable(doc, {
      startY,
      head: [isAdmin ? ['NO', 'ANGGOTA', 'SALDO', 'JML TRANSAKSI'] : ['NO', 'TANGGAL', 'JENIS', 'JUMLAH', 'KETERANGAN']],
      body: td,
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2.5, minCellHeight: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2, minCellHeight: 6.5, textColor: [15, 23, 42] as [number,number,number] },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 3: { halign: 'right' } },
      tableLineColor: [226, 232, 240], tableLineWidth: 0.3,
    });
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    if (finalY < 240) addSignatureArea(doc, finalY + 10);
    addPDFFooter(doc);
    doc.save(`laporan-simpanan-${Date.now()}.pdf`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-6xl mx-auto">

      {/* Modal */}
      <AnimatePresence>
        {activePendingModal && (
          <PaymentPendingModal pending={activePendingModal} onConfirm={handleConfirmPayment} onCancel={handleCancelPayment} loading={confirmLoading} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t('savings.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{isAdmin ? t('savings.desc') : t('savings.my_savings')}</p>
        </div>
        <div className="flex gap-2">
          {!isAdmin && <button onClick={() => setActiveTab('history')} className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", activeTab === 'history' ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}><History size={16} /> {t('common.history') || 'Riwayat'}</button>}
          <button onClick={exportSavingsPDF} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium"><FileText size={18} /> {t('common.download')} PDF</button>
          {!isAdmin && <button onClick={() => setActiveTab('deposit')} className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", activeTab === 'deposit' ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}><Plus size={16} /> Setor / Bayar</button>}
        </div>
      </div>

      {/* Banner Pending */}
      {!isAdmin && pendingPayments.length > 0 && activeTab === 'history' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="text-amber-600 dark:text-amber-400" size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm">Pembayaran Tertunda</h3>
              <p className="text-xs text-slate-500">Anda memiliki <strong>{pendingPayments.length}</strong> pembayaran belum diselesaikan</p>
            </div>
          </div>
          <div className="space-y-3">
            {pendingPayments.map(p => (
              <div key={p.orderId} className="bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-800/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest"><Clock size={10} /> Pending</span>
                    <span className="text-xs text-slate-400 font-mono truncate">{p.orderId}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{p.depositType}</p>
                  <p className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-base font-black text-emerald-600">Rp {(p.amount || 0).toLocaleString('id-ID')}</span>
                  <button onClick={() => setActivePendingModal(p)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all"><RefreshCw size={13} /> Lanjutkan</button>
                  <button onClick={() => handleCancelPayment(p.orderId)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-all" title="Batalkan"><X size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Deposit Form */}
      {!isAdmin && activeTab === 'deposit' ? (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><CreditCard className="text-emerald-500" /> Formulir Pembayaran</h2>
            <p className="text-sm text-slate-500 mt-1">Lakukan penyetoran simpanan atau pembayaran pinjaman.</p>
          </div>
          <form onSubmit={handleDepositSubmit} className="space-y-6">
            {depositMessage && (
              <div className={cn("p-4 rounded-2xl text-sm font-medium flex items-center gap-3", depositMessage.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100")}>
                {depositMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} {depositMessage.text}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Jenis Pembayaran</label>
              <select value={depositType} onChange={e => { setDepositType(e.target.value); if (e.target.value === 'Pembayaran Pinjaman') { const f = schedules.find(s => s.status !== 'Paid'); setSelectedSchedules(f ? [f.id] : []); } }}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="Simpanan Wajib">Simpanan Wajib</option>
                <option value="Simpanan Sukarela">Simpanan Sukarela</option>
                <option value="Pembayaran Pinjaman">Pembayaran Pinjaman</option>
              </select>
            </div>
            {depositType === 'Pembayaran Pinjaman' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pilih Pinjaman</label>
                  {loans.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {loans.map((loan, i) => (
                        <button key={loan.id} type="button" onClick={() => { setSelectedLoan(loan.id); setSelectedSchedules([]); }}
                          className={cn("px-4 py-3 rounded-2xl border text-left transition-all", selectedLoan === loan.id ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/10" : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-800 text-slate-700")}>
                          <div className="font-bold text-sm">Pinjaman {i + 1}</div>
                          <div className="text-[10px] opacity-60 font-mono">{loan.id}</div>
                        </button>
                      ))}
                    </div>
                  ) : <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl text-sm flex items-center gap-2"><AlertTriangle size={16} /> Tidak ada pinjaman aktif.</div>}
                </div>
                {selectedLoan && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pilih Cicilan</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {schedules.filter(s => s.loan_id === selectedLoan).sort((a, b) => a.installment_number - b.installment_number).map(sch => {
                        const isPaid = sch.status === 'Paid', isSel = selectedSchedules.includes(sch.id);
                        return (
                          <button key={sch.id} type="button" disabled={isPaid}
                            onClick={() => setSelectedSchedules(isSel ? selectedSchedules.filter(id => id !== sch.id) : [...selectedSchedules, sch.id])}
                            className={cn("w-full px-4 py-3 rounded-2xl border text-left transition-all flex items-center justify-between",
                              isPaid ? "opacity-60 cursor-not-allowed bg-slate-100 border-slate-200" : isSel ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20" : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-800 text-slate-700")}>
                            <div><div className="font-bold text-sm">Cicilan Ke-{sch.installment_number}</div><div className="text-[10px] opacity-60">Jatuh Tempo: {new Date(sch.due_date).toLocaleDateString('id-ID')}</div></div>
                            <div className="text-right"><div className="font-black text-sm">Rp {Math.round(sch.amount_due).toLocaleString('id-ID')}</div>{isPaid && <div className="text-[9px] uppercase font-black text-emerald-600">Lunas</div>}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Jumlah Pembayaran (Rp)</label>
              <div className="relative">
                <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min={minDeposit} readOnly={depositType === 'Pembayaran Pinjaman'}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder={`Minimal Rp ${minDeposit.toLocaleString('id-ID')}`} />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-blue-700 dark:text-blue-400">Status akan <strong>Pending</strong> sampai Anda mengklik <strong>Konfirmasi Pembayaran</strong> setelah membayar.</p>
            </div>
            <button type="submit" disabled={depositLoading || (depositType === 'Pembayaran Pinjaman' && selectedSchedules.length === 0)}
              className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95">
              {depositLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <><CreditCard size={22} /> Bayar Sekarang</>}
            </button>
          </form>
        </motion.div>
      ) : (
        <>
          {!isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[{ label: 'Pokok', filter: 'pokok', color: 'text-emerald-600', sub: '✓ Simpanan Awal' }, { label: 'Wajib', filter: 'wajib', color: 'text-blue-600', sub: 'Bulanan' }, { label: 'Sukarela', filter: 'sukarela', color: 'text-purple-600', sub: 'Fleksibel' }].map(c => (
                <div key={c.label} className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Rp {savings.filter(s => (s.description || s.type || '').toLowerCase().includes(c.filter)).reduce((sum, s) => sum + (s.amount || 0), 0).toLocaleString('id-ID')}
                  </h3>
                  <p className={`text-[10px] font-bold mt-2 uppercase tracking-tighter ${c.color}`}>{c.sub}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><History size={18} className="text-blue-600" />{isAdmin ? 'Data Simpanan Seluruh Anggota' : 'Riwayat Transaksi Simpanan'}</h3>
                {isAdmin && (
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Cari nama anggota..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                )}
              </div>
              {/* Filter tanggal + jenis (member only) */}
              {!isAdmin && (
                <div className="flex flex-wrap items-center gap-3">
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Semua Jenis</option>
                    <option value="Simpanan Wajib">Simpanan Wajib</option>
                    <option value="Simpanan Sukarela">Simpanan Sukarela</option>
                    <option value="Pembayaran Pinjaman">Pembayaran Pinjaman</option>
                    <option value="Deposit">Deposit</option>
                  </select>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="text-xs font-medium">Tanggal:</span>
                    <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                      className="px-2 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none" />
                    <span className="text-slate-400">—</span>
                    <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                      className="px-2 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none" />
                  </div>
                  {(filterType || filterDateFrom || filterDateTo) && (
                    <button onClick={() => { setFilterType(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">✕ Reset</button>
                  )}
                  <span className="text-xs text-slate-400">{filteredSavings.filter(s => s.status !== 'pending').length} transaksi</span>
                </div>
              )}
            </div>

            <style>{`.sav-card{display:none}@media(max-width:640px){.sav-table-wrap{display:none}.sav-card{display:flex;flex-direction:column;gap:10px;padding:14px}}`}</style>

            {/* DESKTOP */}
            <div className="sav-table-wrap overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">{isAdmin ? 'Nama Anggota' : 'Tanggal'}</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">{isAdmin ? 'Total Transaksi' : 'Tipe Simpanan'}</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">{isAdmin ? 'Total Saldo' : 'Jumlah'}</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Status</th>
                    {!isAdmin && <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Memuat data...</td></tr>
                    : isAdmin ? (
                      (groupedSavings as any[]).length === 0 ? <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Belum ada data simpanan</td></tr>
                        : (groupedSavings as any[]).map(group => (
                          <React.Fragment key={group.memberId}>
                            <tr className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer ${expandedMember === group.memberId ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`} onClick={() => toggleExpand(group.memberId)}>
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs">{group.memberName.charAt(0).toUpperCase()}</div>
                                <div><p>{group.memberName}</p><p className="text-[10px] text-slate-400 font-normal">ID: {group.memberId.substring(0, 8)}</p></div>
                              </td>
                              <td className="px-6 py-4 text-slate-500">{group.transactions.length} Transaksi</td>
                              <td className="px-6 py-4 font-black text-emerald-600">Rp {group.totalAmount.toLocaleString('id-ID')}</td>
                              <td className="px-6 py-4 text-right"><div className="inline-flex p-2 text-slate-400 rounded-xl hover:bg-slate-100">{expandedMember === group.memberId ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div></td>
                            </tr>
                            <AnimatePresence>
                              {expandedMember === group.memberId && (
                                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-slate-50/30">
                                  <td colSpan={4} className="px-6 py-4">
                                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                                      <table className="w-full text-xs">
                                        <thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3 font-bold uppercase text-left">Tanggal</th><th className="px-4 py-3 font-bold uppercase text-left">Keterangan</th><th className="px-4 py-3 font-bold uppercase text-right">Jumlah</th><th className="px-4 py-3 font-bold uppercase text-center">Hapus</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {group.transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx: any) => (
                                            <tr key={tx.id} className="hover:bg-slate-50/50">
                                              <td className="px-4 py-3 text-slate-600">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">{tx.type}</span></td>
                                              <td className="px-4 py-3 text-right font-black text-slate-900">Rp {(tx.amount || 0).toLocaleString('id-ID')}</td>
                                              <td className="px-4 py-3 text-center"><button onClick={() => handleDeleteSaving(tx.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500"><Trash2 size={13} /></button></td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </motion.tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        ))
                    ) : (
                      filteredSavings.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Belum ada riwayat simpanan</td></tr>
                        : filteredSavings.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                            <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center"><PiggyBank size={16} /></div><span className="font-bold text-slate-900 dark:text-white">{tx.type || 'Simpanan'}</span></div></td>
                            <td className="px-6 py-4 font-black text-emerald-600">+ Rp {(tx.amount || 0).toLocaleString('id-ID')}</td>
                            <td className="px-6 py-4 text-right"><span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Berhasil</span></td>
                            <td className="px-6 py-4 text-center"><button onClick={() => handleDeleteSaving(tx.id)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700"><Trash2 size={15} /></button></td>
                          </tr>
                        ))
                    )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="sav-card">
              {loading ? <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>Memuat data...</div>
                : isAdmin ? (
                  (groupedSavings as any[]).length === 0 ? <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>Belum ada data simpanan</div>
                    : (groupedSavings as any[]).map(group => (
                      <div key={group.memberId} style={{ background: '#fff', border: '1.5px solid #f3f4f6', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f9fafb', cursor: 'pointer' }} onClick={() => toggleExpand(group.memberId)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{group.memberName.charAt(0).toUpperCase()}</div>
                            <div><p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{group.memberName}</p><p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{group.transactions.length} transaksi</p></div>
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>Rp {group.totalAmount.toLocaleString('id-ID')}</p>
                        </div>
                        {expandedMember === group.memberId && (
                          <div style={{ padding: '10px 14px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {group.transactions.map((tx: any) => (
                              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f9fafb', borderRadius: 10 }}>
                                <div><p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>{tx.type}</p><p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div>
                                <p style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>Rp {(tx.amount || 0).toLocaleString('id-ID')}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  filteredSavings.length === 0 ? <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>Belum ada riwayat simpanan</div>
                    : filteredSavings.map((tx: any) => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#fff', border: '1.5px solid #f3f4f6', borderRadius: 14 }}>
                        <div><p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 3px' }}>{tx.type || 'Simpanan'}</p><p style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: '#059669', margin: 0 }}>+ Rp {(tx.amount || 0).toLocaleString('id-ID')}</p>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '2px 7px', display: 'inline-block', marginTop: 3 }}>Berhasil</span>
                        </div>
                      </div>
                    ))
                )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}