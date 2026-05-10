import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Search, ChevronDown, ChevronUp, Plus, ArrowUpRight, PiggyBank, History, CreditCard, Receipt, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';

const generateBarcode = (text: string) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, { format: 'CODE128', displayValue: false, height: 40, width: 2, margin: 0 });
  return canvas.toDataURL('image/png');
};

export default function Savings({ user }: { user?: any }) {
  const [savings, setSavings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(user);
  const [activeTab, setActiveTab] = useState<'history' | 'deposit'>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('tab') as 'history' | 'deposit') || 'history';
  });
  const { t } = useLanguage();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'deposit' || tab === 'history') {
      setActiveTab(tab as 'history' | 'deposit');
    }
  }, [window.location.search]);

  // Deposit Form State (from Payment.tsx)
  const [amount, setAmount] = useState('');
  const [depositType, setDepositType] = useState('Simpanan Wajib');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMessage, setDepositMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedLoan, setSelectedLoan] = useState('');
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [minDeposit, setMinDeposit] = useState(50000);

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!user) {
      fetch('/api/auth/me', { credentials: 'include' }).then(res => res.json()).then(data => setCurrentUser(data.user));
    }
    fetchSavings();
  }, [user]);

  useEffect(() => {
    if (!isAdmin && currentUser && currentUser.role?.toLowerCase() !== 'admin') {
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
          if (data.minDeposit) setMinDeposit(data.minDeposit);
        })
        .catch(console.error);

      safeFetch('/api/loans')
        .then(data => {
          const activeLoans = Array.isArray(data) ? data.filter((l: any) => l.memberId === currentUser.id && l.status === 'approved' && l.remainingBalance > 0) : [];
          setLoans(activeLoans);
          if (activeLoans.length > 0) setSelectedLoan(activeLoans[0].id);
        })
        .catch(console.error);

      safeFetch(`/api/loan_schedules/${currentUser.id}`)
        .then(data => setSchedules(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (depositType === 'Pembayaran Pinjaman' && selectedSchedules.length > 0) {
      const totalAmount = selectedSchedules.reduce((sum, scheduleId) => {
        const schedule = schedules.find(s => s.id === scheduleId);
        return sum + (schedule ? Math.round(schedule.amount_due) : 0);
      }, 0);
      setAmount(totalAmount.toString());
    } else if (depositType === 'Pembayaran Pinjaman' && selectedSchedules.length === 0) {
      setAmount('0');
    }
  }, [depositType, selectedSchedules, schedules]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(amount);
    if (depositType !== 'Pembayaran Pinjaman' && amountNum < minDeposit) {
      setDepositMessage({
        text: `Minimal setoran adalah Rp ${minDeposit.toLocaleString('id-ID')}`,
        type: 'error'
      });
      return;
    }
    setDepositLoading(true);
    setDepositMessage(null);

    try {
      const paymentRes = await fetch('/api/payment/create', { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount),
          orderId: `PAY-${Date.now()}`,
          customerDetails: {
            first_name: currentUser?.name || 'Guest',
            email: currentUser?.email || '',
          }
        })
      });

      if (!paymentRes.ok) {
        const errorText = await paymentRes.text();
        console.error('Payment API Error:', errorText);
        throw new Error('Gagal membuat transaksi pembayaran (Server Error)');
      }

      const paymentData = await paymentRes.json();

      if (paymentData.redirect_url) {
        if (depositType === 'Pembayaran Pinjaman' && selectedSchedules.length > 0) {
          for (const scheduleId of selectedSchedules) {
            const schedule = schedules.find(s => s.id === scheduleId);
            if (schedule) {
              await fetch('/api/loan_repayments', { credentials: 'include',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: `REP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  loanId: schedule.loan_id || selectedLoan,
                  scheduleId: scheduleId,
                  amountPaid: Math.round(schedule.amount_due),
                  paymentDate: new Date().toISOString(),
                  status: 'completed',
                  companyCode: 'PALUGADA',
                  createdBy: currentUser.id
                })
              });
            }
          }
        } else {
          await fetch('/api/finance', { credentials: 'include',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'Income',
              category: 'Savings',
              amount: parseInt(amount),
              description: `Simpanan ${depositType} - ${currentUser.name}`,
              memberId: currentUser.id,
              savingsType: depositType
            })
          });
        }
        window.location.href = paymentData.redirect_url;
      } else {
        setDepositMessage({ text: 'Gagal membuat transaksi pembayaran.', type: 'error' });
        setDepositLoading(false);
      }
    } catch (error) {
      setDepositMessage({ text: 'Terjadi kesalahan saat memproses pembayaran.', type: 'error' });
      setDepositLoading(false);
    }
  };

  const handleDeleteSaving = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus transaksi simpanan ini?')) return;
    try {
      const res = await fetch(`/api/savings/${id}`, {
        method: 'DELETE', credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setSavings(prev => prev.filter(s => s.id !== id));
      } else {
        alert('Gagal menghapus transaksi');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  const fetchSavings = async () => {
    try {
      const res = await fetch('/api/savings', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch savings');
      const data = await res.json();
      if (Array.isArray(data)) {
        // For members, API already filters. For admin, show all.
        setSavings(data);
      } else {
        setSavings([]);
      }
    } catch (error) {
      console.error('Error fetching savings:', error);
      setSavings([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedSavings = useMemo(() => {
    const groups: Record<string, { memberId: string, memberName: string, totalAmount: number, transactions: any[] }> = {};
    
    savings.forEach(saving => {
      if (!groups[saving.memberId]) {
        groups[saving.memberId] = {
          memberId: saving.memberId,
          memberName: saving.memberName || 'Unknown',
          totalAmount: 0,
          transactions: []
        };
      }
      
      // Calculate balance: deposits add, withdrawals subtract
      const amount = saving.type === 'Withdrawal' ? -(saving.amount || 0) : (saving.amount || 0);
      groups[saving.memberId].totalAmount += amount;
      groups[saving.memberId].transactions.push(saving);
    });

    return Object.values(groups)
      .filter(g => g.memberName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.totalAmount - a.totalAmount); // Sort by balance descending
  }, [savings, searchTerm]);

  const toggleExpand = (memberId: string) => {
    if (expandedMember === memberId) {
      setExpandedMember(null);
    } else {
      setExpandedMember(memberId);
    }
  };

  const exportSavingsPDF = () => {
    const doc = new jsPDF();
    const reportId = `SAV-${Date.now()}`;
    
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
    doc.text(isAdmin ? 'LAPORAN SIMPANAN SEMUA ANGGOTA' : 'LAPORAN SIMPANAN PRIBADI', 14, 65);
    
    const tableData = isAdmin 
      ? groupedSavings.map((g, idx) => [
          idx + 1,
          g.memberName,
          `Rp ${g.totalAmount.toLocaleString('id-ID')}`,
          g.transactions.length
        ])
      : savings.map((s, idx) => [
          idx + 1,
          new Date(s.date).toLocaleDateString('id-ID'),
          s.type,
          `Rp ${(s.amount || 0).toLocaleString('id-ID')}`,
          s.description || '-'
        ]);

    autoTable(doc, {
      startY: 75,
      head: [isAdmin 
        ? ['NO', 'ANGGOTA', 'SALDO', 'JML TRANSAKSI']
        : ['NO', 'TANGGAL', 'JENIS', 'JUMLAH', 'DESKRIPSI']
      ],
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
        2: { halign: 'right' }
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Halaman ${i} dari ${pageCount}`, 105, 285, { align: 'center' });
    }

    doc.save(`laporan-simpanan-${Date.now()}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t('savings.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{isAdmin ? t('savings.desc') : t('savings.my_savings')}</p>
        </div>
        <div className="flex gap-2">
          {!isAdmin && (
            <button 
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'history' ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <History size={16} />
              {t('common.history') || 'Riwayat'}
            </button>
          )}
          <button 
            onClick={exportSavingsPDF}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors text-sm font-medium"
          >
            <FileText size={18} />
            {t('common.download')} PDF
          </button>
          {!isAdmin && (
            <button 
              onClick={() => setActiveTab('deposit')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'deposit' ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <Plus size={16} />
              Setor / Bayar
            </button>
          )}
        </div>
      </div>

      {!isAdmin && activeTab === 'deposit' ? (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm max-w-2xl mx-auto"
        >
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="text-emerald-500" />
              Formulir Pembayaran
            </h2>
            <p className="text-sm text-slate-500 mt-1">Lakukan penyetoran simpanan atau pembayaran pinjaman secara instan.</p>
          </div>

          <form onSubmit={handleDepositSubmit} className="space-y-6">
            {depositMessage && (
              <div className={cn(
                "p-4 rounded-2xl text-sm font-medium flex items-center gap-3",
                depositMessage.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
              )}>
                {depositMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {depositMessage.text}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Jenis Pembayaran</label>
              <select 
                value={depositType}
                onChange={(e) => {
                  setDepositType(e.target.value);
                  if (e.target.value === 'Pembayaran Pinjaman' && schedules.length > 0) {
                    const firstUnpaid = schedules.find(s => s.status !== 'Paid');
                    setSelectedSchedules(firstUnpaid ? [firstUnpaid.id] : []);
                  }
                }}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                <option value="Simpanan Wajib">Simpanan Wajib</option>
                <option value="Simpanan Sukarela">Simpanan Sukarela</option>
                <option value="Pembayaran Pinjaman">Pembayaran Pinjaman</option>
              </select>
            </div>

            {depositType === 'Pembayaran Pinjaman' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pilih Pinjaman</label>
                  {loans.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {loans.map((loan, index) => (
                        <button
                          key={loan.id}
                          type="button"
                          onClick={() => {
                            setSelectedLoan(loan.id);
                            setSelectedSchedules([]);
                          }}
                          className={cn(
                            "px-4 py-3 rounded-2xl border text-left transition-all",
                            selectedLoan === loan.id
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-2 ring-emerald-500/10"
                              : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50"
                          )}
                        >
                          <div className="font-bold text-sm">Pinjaman {index + 1}</div>
                          <div className="text-[10px] opacity-60 font-mono">{loan.id}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-2xl text-sm flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Anda tidak memiliki pinjaman aktif.
                    </div>
                  )}
                </div>

                {selectedLoan && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pilih Cicilan</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {schedules
                        .filter(s => s.loan_id === selectedLoan)
                        .sort((a, b) => a.installment_number - b.installment_number)
                        .map(schedule => {
                          const isPaid = schedule.status === 'Paid';
                          const isSelected = selectedSchedules.includes(schedule.id);
                          
                          return (
                            <button
                              key={schedule.id}
                              type="button"
                              disabled={isPaid}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSchedules(selectedSchedules.filter(id => id !== schedule.id));
                                } else {
                                  setSelectedSchedules([...selectedSchedules, schedule.id]);
                                }
                              }}
                              className={cn(
                                "w-full px-4 py-3 rounded-2xl border text-left transition-all flex items-center justify-between",
                                isPaid
                                  ? "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-800 cursor-not-allowed opacity-60"
                                  : isSelected
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                                  : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50"
                              )}
                            >
                              <div>
                                <div className="font-bold text-sm">Cicilan Ke-{schedule.installment_number}</div>
                                <div className="text-[10px] opacity-60">
                                  Jatuh Tempo: {new Date(schedule.due_date).toLocaleDateString('id-ID')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-black text-sm">Rp {Math.round(schedule.amount_due).toLocaleString('id-ID')}</div>
                                {isPaid && <div className="text-[9px] uppercase tracking-widest font-black text-emerald-600">Lunas</div>}
                              </div>
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
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min={minDeposit}
                  readOnly={depositType === 'Pembayaran Pinjaman'}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-50"
                  placeholder={`Minimal Rp ${minDeposit.toLocaleString('id-ID')}`}
                />
              </div>
              {depositType === 'Pembayaran Pinjaman' && (
                <p className="text-[10px] text-slate-500 ml-1 italic">Jumlah dihitung otomatis berdasarkan cicilan yang dipilih.</p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={depositLoading || (depositType === 'Pembayaran Pinjaman' && selectedSchedules.length === 0)}
              className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95 mt-4"
            >
              {depositLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <CreditCard size={22} />
                  Bayar Sekarang
                </>
              )}
            </button>
          </form>
        </motion.div>
      ) : (
        <>
          {!isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pokok</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Rp {savings.filter(s => (s.description || s.type || '').toLowerCase().includes('pokok')).reduce((sum, s) => sum + (s.amount || 0), 0).toLocaleString('id-ID') || '0'}
                </h3>
                <p className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-tighter">✓ Simpanan Awal</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Wajib</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Rp {savings.filter(s => (s.description || s.type || '').toLowerCase().includes('wajib')).reduce((sum, s) => sum + (s.amount || 0), 0).toLocaleString('id-ID')}
                </h3>
                <p className="text-[10px] text-blue-600 font-bold mt-2 uppercase tracking-tighter">Bulanan</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Sukarela</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Rp {savings.filter(s => (s.description || s.type || '').toLowerCase().includes('sukarela')).reduce((sum, s) => sum + (s.amount || 0), 0).toLocaleString('id-ID')}
                </h3>
                <p className="text-[10px] text-purple-600 font-bold mt-2 uppercase tracking-tighter">Fleksibel</p>
              </div>
            </div>
          )}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History size={18} className="text-blue-600" />
            {isAdmin ? 'Data Simpanan Seluruh Anggota' : 'Riwayat Transaksi Simpanan'}
          </h3>
          {isAdmin && (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari nama anggota..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          )}
        </div>

        <style>{`
          .sav-card { display: none; }
          @media (max-width: 640px) {
            .sav-table-wrap { display: none; }
            .sav-card { display: flex; flex-direction: column; gap: 10px; padding: 14px; }
          }
        `}</style>

        {/* DESKTOP: Table */}
        <div className="sav-table-wrap overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">
                  {isAdmin ? 'Nama Anggota' : 'Tanggal'}
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">
                  {isAdmin ? 'Total Transaksi' : 'Tipe Simpanan'}
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">
                  {isAdmin ? 'Total Saldo' : 'Jumlah'}
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Status</th>
                {!isAdmin && <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : isAdmin ? (
                groupedSavings.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Belum ada data simpanan</td></tr>
                ) : groupedSavings.map((group) => (
                  <React.Fragment key={group.memberId}>
                    <tr 
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${expandedMember === group.memberId ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                      onClick={() => toggleExpand(group.memberId)}
                    >
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                          {group.memberName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p>{group.memberName}</p>
                          <p className="text-[10px] text-slate-400 font-normal uppercase tracking-tighter">ID: {group.memberId.substring(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {group.transactions.length} Transaksi
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">
                        Rp {group.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex p-2 text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          {expandedMember === group.memberId ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedMember === group.memberId && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-50/30 dark:bg-slate-800/10"
                        >
                          <td colSpan={4} className="px-6 py-4">
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-inner">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                  <tr>
                                    <th className="px-4 py-3 font-bold uppercase tracking-tighter">Tanggal</th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-tighter">Keterangan</th>
                                    <th className="px-4 py-3 font-bold uppercase tracking-tighter text-right">Jumlah</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {group.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                        {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[9px]">
                                          {tx.type || 'Simpanan'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                                        Rp {(tx.amount || 0).toLocaleString('id-ID')}
                                      </td>
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
                savings.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Belum ada riwayat simpanan</td></tr>
                ) : savings.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center">
                          <PiggyBank size={16} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{tx.type || 'Simpanan'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-600">
                      + Rp {(tx.amount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Berhasil</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteSaving(tx.id)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors"
                        title="Hapus transaksi"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE: Cards */}
        <div className="sav-card">
          {loading ? (
            <div style={{ textAlign:'center', padding: 32, color: '#9ca3af' }}>Memuat data...</div>
          ) : isAdmin ? (
            groupedSavings.length === 0 ? (
              <div style={{ textAlign:'center', padding: 32, color: '#9ca3af' }}>Belum ada data simpanan</div>
            ) : groupedSavings.map((group) => (
              <div key={group.memberId} style={{ background:'#fff', border:'1.5px solid #f3f4f6', borderRadius:14, overflow:'hidden' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', background:'#f9fafb', cursor:'pointer' }}
                  onClick={() => toggleExpand(group.memberId)}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'#d1fae5', color:'#059669', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, flexShrink:0 }}>
                      {group.memberName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:'#111827', margin:0 }}>{group.memberName}</p>
                      <p style={{ fontSize:11, color:'#9ca3af', margin:'2px 0 0' }}>{group.transactions.length} transaksi</p>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:14, fontWeight:800, color:'#059669', margin:0 }}>Rp {group.totalAmount.toLocaleString('id-ID')}</p>
                    <p style={{ fontSize:10, color:'#9ca3af', margin:'2px 0 0' }}>{expandedMember === group.memberId ? '▲ Tutup' : '▼ Detail'}</p>
                  </div>
                </div>
                {expandedMember === group.memberId && (
                  <div style={{ padding:'10px 14px', borderTop:'1px solid #f3f4f6', display:'flex', flexDirection:'column', gap:8 }}>
                    {group.transactions.map((tx: any) => (
                      <div key={tx.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'#f9fafb', borderRadius:10 }}>
                        <div>
                          <p style={{ fontSize:12, fontWeight:600, color:'#374151', margin:0 }}>{tx.type || 'Simpanan'}</p>
                          <p style={{ fontSize:11, color:'#9ca3af', margin:'2px 0 0' }}>{new Date(tx.date).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}</p>
                        </div>
                        <p style={{ fontSize:13, fontWeight:800, color:'#059669' }}>Rp {(tx.amount||0).toLocaleString('id-ID')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            savings.length === 0 ? (
              <div style={{ textAlign:'center', padding: 32, color: '#9ca3af' }}>Belum ada riwayat simpanan</div>
            ) : savings.map((tx: any) => (
              <div key={tx.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', background:'#fff', border:'1.5px solid #f3f4f6', borderRadius:14 }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#111827', margin:'0 0 3px' }}>{tx.type || 'Simpanan'}</p>
                  <p style={{ fontSize:12, color:'#9ca3af' }}>{new Date(tx.date).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:14, fontWeight:800, color:'#059669', margin:0 }}>+ Rp {(tx.amount||0).toLocaleString('id-ID')}</p>
                  <span style={{ fontSize:10, fontWeight:700, color:'#059669', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:6, padding:'2px 7px', display:'inline-block', marginTop:3 }}>Berhasil</span>
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