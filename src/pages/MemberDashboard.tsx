import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, MessageSquareWarning, Wallet, HandCoins, Clock, CheckCircle, User, Phone, MapPin, CreditCard, Save, TrendingUp, Shield, Eye, FileCheck, Eye as EyeIcon, ArrowUpRight, ExternalLink } from 'lucide-react';
import { cn } from '../types';

// Inline theme hook
function useAppTheme() {
  const [isDark, setIsDark] = React.useState(document.documentElement.classList.contains('dark'));
  React.useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export default function MemberDashboard({ user }: { user: any }) {
  const isDark = useAppTheme();
  const [reports, setReports] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Completion State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    nik: user?.nik || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    // Check if profile is incomplete
    if (user && user.role === 'member') {
      const isIncomplete = !user.nik || !user.phone || !user.address;
      if (isIncomplete) {
        setShowProfileModal(true);
      }
    }

    const safeFetch = (url: string) => 
      fetch(url, { credentials: 'include' }).then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Oops, we haven't got JSON!");
        }
        return res.json();
      }).catch(() => []);

    Promise.all([
      safeFetch('/api/reports_data?summary=true'),
      safeFetch('/api/savings'),
      safeFetch('/api/loans')
    ]).then(([reportsData, savingsData, loansData]) => {
      // Filter by current user
      const userReports = (reportsData?.data || reportsData || []).filter((r: any) => r.userId === user.id);
      const userSavings = (savingsData?.data || savingsData || []).filter((s: any) => s.memberId === user.id);
      const userLoans = (loansData?.data || loansData || []).filter((l: any) => l.memberId === user.id);
      
      setReports(userReports);
      setSavings(userSavings);
      setLoans(userLoans);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.name || !profileData.nik || !profileData.phone || !profileData.address) {
      setProfileError('Semua data wajib diisi');
      return;
    }

    if (profileData.nik.length !== 16) {
      setProfileError('NIK harus 16 digit');
      return;
    }

    setUpdatingProfile(true);
    setProfileError('');

    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (data.success) {
        // Update local storage
        localStorage.setItem('palugada_user', JSON.stringify(data.user));
        
        // Immediate UI feedback
        setUpdatingProfile(false);
        setShowProfileModal(false);
        
        // Update global user state without reloading the page
        window.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: data.user }, '*');
      } else {
        setProfileError(data.message || 'Gagal memperbarui profil');
        setUpdatingProfile(false);
      }
    } catch (err) {
      setProfileError('Terjadi kesalahan koneksi');
      setUpdatingProfile(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat data...</div>;
  }

  const totalSavings = savings.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
  const activeLoans = loans.filter((l: any) => l.status === 'approved' && l.remainingBalance > 0);
  const totalRemainingLoan = activeLoans.reduce((sum: number, l: any) => sum + (l.remainingBalance || 0), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(isDark ? "bg-[#161a23] border-white/[0.08]" : "bg-white border-slate-200", "w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border")}
            >
              <div className="p-6 bg-emerald-600 text-white text-center">
                <h2 className="text-xl font-bold">Lengkapi Data Diri</h2>
                <p className="text-emerald-100 text-sm mt-1">Mohon lengkapi data berikut untuk melanjutkan penggunaan aplikasi.</p>
              </div>
              
              <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
                {profileError && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-100 dark:border-red-500/20">
                    {profileError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="Nama Lengkap Sesuai KTP"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">NIK (No. Induk Kependudukan)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="16 Digit NIK"
                      maxLength={16}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                      value={profileData.nik}
                      onChange={(e) => setProfileData({...profileData, nik: e.target.value.replace(/\D/g, '')})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">No. HP</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input 
                      type="tel" 
                      required
                      placeholder="Contoh: 08123456789"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Alamat</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
                    <textarea 
                      required
                      placeholder="Alamat Lengkap"
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all resize-none"
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={updatingProfile}
                  className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {updatingProfile ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save size={20} />
                      Simpan Data
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Profile Header - Clean & Compact */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl",
          isDark 
            ? "bg-[#161a23] border border-white/[0.08]" 
            : "bg-white border border-slate-200/80"
        )}
        style={{ boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)' }}
      >
        {/* Subtle accent line on top */}
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)' }} />

        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-4">
            {/* Compact Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.25)'
                }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              {/* Small verified dot */}
              {user.nik && (
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-[2.5px]",
                  isDark ? "border-[#161a23]" : "border-white"
                )} style={{ background: '#10b981' }}>
                  <CheckCircle size={10} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Info — single row layout */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className={cn("text-lg font-bold tracking-tight truncate", isDark ? "text-white" : "text-slate-900")}>
                  {user.name}
                </h2>
                {user.nik ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                    style={{ 
                      background: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5',
                      color: isDark ? '#6ee7b7' : '#059669',
                      border: isDark ? '1px solid rgba(16,185,129,0.2)' : '1px solid #a7f3d0'
                    }}>
                    <Shield size={10} strokeWidth={2.5} />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                    style={{ 
                      background: isDark ? 'rgba(251,191,36,0.15)' : '#fef3c7',
                      color: isDark ? '#fcd34d' : '#b45309',
                      border: isDark ? '1px solid rgba(251,191,36,0.2)' : '1px solid #fde68a'
                    }}>
                    <Clock size={10} strokeWidth={2.5} />
                    Pending
                  </span>
                )}
              </div>
              
              {/* Inline details */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={cn("inline-flex items-center gap-1.5 text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                  <CreditCard size={11} />
                  <span className="font-mono font-semibold">{user.id ? user.id.slice(0, 8).toUpperCase() : 'N/A'}</span>
                </span>
                {user.phone && (
                  <span className={cn("inline-flex items-center gap-1.5 text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                    <Phone size={11} />
                    <span className="font-medium">{user.phone}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Status indicator on right */}
            <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
              {user.status === 'active' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px #10b981' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: isDark ? '#6ee7b7' : '#059669' }}>Aktif</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: isDark ? 'rgba(148,163,184,0.1)' : '#f1f5f9' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Pending</span>
                </div>
              )}
              {user.join_date && (
                <span className={cn("text-[10px]", isDark ? "text-slate-500" : "text-slate-400")}>
                  Member sejak {new Date(user.join_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Welcome Message */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Halo, {user.name}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Ringkasan keuangan, dokumen, dan pengaduan Anda.</p>
      </div>

      {/* Quick Actions + Quick Links */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-4">
          <a href="/savings?tab=deposit" className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-emerald-200 dark:shadow-none">
            <Wallet size={18} />
            Setor Simpanan
          </a>
          <a href="/savings?tab=deposit" className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-rose-200 dark:shadow-none">
            <HandCoins size={18} />
            Bayar Cicilan
          </a>
        </div>
        
        {/* Quick Links */}
        <div className="flex flex-wrap gap-3">
          <a href="/digital-card" className={cn(isDark ? "bg-white/[0.05] hover:bg-white/[0.08] text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700", "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors")}>
            <CreditCard size={16} />
            Kartu Digital
          </a>
          <a href="/member-reports" className={cn(isDark ? "bg-white/[0.05] hover:bg-white/[0.08] text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700", "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors")}>
            <FileText size={16} />
            Laporan
          </a>
          <a href="/complaints" className={cn(isDark ? "bg-white/[0.05] hover:bg-white/[0.08] text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700", "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors")}>
            <MessageSquareWarning size={16} />
            Pengaduan
          </a>
          <a href="/profile" className={cn(isDark ? "bg-white/[0.05] hover:bg-white/[0.08] text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700", "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors")}>
            <User size={16} />
            Profil
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={cn(isDark ? "bg-[#161a23] border border-white/[0.06]" : "bg-white border border-slate-200 shadow-sm", "rounded-2xl p-5")}>
          <div className="flex justify-between items-start mb-8">
            <div className={cn(isDark ? "bg-white/20" : "bg-blue-100", "p-3 rounded-2xl")}>
              <Wallet size={24} className={isDark ? "text-white" : "text-blue-600"} />
            </div>
          </div>
          <div>
            <p className={cn(isDark ? "text-blue-200" : "text-blue-700", "text-sm font-medium mb-1")}>Total Simpanan</p>
            <h2 className={cn(isDark ? "text-white" : "text-slate-900", "text-2xl sm:text-3xl font-bold tracking-tight")}>Rp {totalSavings.toLocaleString('id-ID')}</h2>
          </div>
        </div>

        <div className={cn(isDark ? "bg-[#161a23] border border-white/[0.06]" : "bg-white border border-slate-200 shadow-sm", "rounded-2xl p-5")}>
          <div className="flex justify-between items-start mb-8">
            <div className={cn(isDark ? "bg-white/20" : "bg-rose-100", "p-3 rounded-2xl")}>
              <HandCoins size={24} className={isDark ? "text-white" : "text-rose-600"} />
            </div>
          </div>
          <div>
            <p className={cn(isDark ? "text-rose-200" : "text-rose-700", "text-sm font-medium mb-1")}>Sisa Tagihan Pinjaman</p>
            <h2 className={cn(isDark ? "text-white" : "text-slate-900", "text-2xl sm:text-3xl font-bold tracking-tight")}>Rp {totalRemainingLoan.toLocaleString('id-ID')}</h2>
          </div>
        </div>

        <div className={cn(isDark ? "bg-[#161a23] border border-white/[0.06]" : "bg-white border border-slate-200 shadow-sm", "rounded-2xl p-5")}>
          <div className="flex justify-between items-start mb-8">
            <div className={cn(isDark ? "bg-white/20" : "bg-emerald-100", "p-3 rounded-2xl")}>
              <TrendingUp size={24} className={isDark ? "text-white" : "text-emerald-600"} />
            </div>
          </div>
          <div>
            <p className={cn(isDark ? "text-emerald-200" : "text-emerald-700", "text-sm font-medium mb-1")}>SHU Diterima</p>
            <h2 className={cn(isDark ? "text-white" : "text-slate-900", "text-2xl sm:text-3xl font-bold tracking-tight")}>Rp {(user.total_shu || 0).toLocaleString('id-ID')}</h2>
          </div>
        </div>

        <div className={cn(isDark ? "bg-[#161a23] border border-white/[0.06]" : "bg-white border border-slate-200 shadow-sm", "rounded-2xl p-5")}>
          <div className="flex justify-between items-start mb-8">
            <div className={cn(isDark ? "bg-white/20" : "bg-amber-100", "p-3 rounded-2xl")}>
              <MessageSquareWarning size={24} className={isDark ? "text-white" : "text-amber-600"} />
            </div>
          </div>
          <div>
            <p className={cn(isDark ? "text-amber-200" : "text-amber-700", "text-sm font-medium mb-1")}>Laporan Dibuat</p>
            <h2 className={cn(isDark ? "text-white" : "text-slate-900", "text-2xl sm:text-3xl font-bold tracking-tight")}>{reports.length}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Riwayat Pinjaman */}
        <div className={cn(isDark ? "bg-[#161a23] border border-white/[0.06]" : "bg-white border border-slate-200 shadow-sm", "rounded-2xl overflow-hidden")}>
          <div className={cn(isDark ? "border-white/[0.06]" : "border-slate-100", "p-5 border-b flex justify-between items-center")}>
            <h3 className={cn(isDark ? "text-white" : "text-slate-900", "text-sm font-bold")}>Riwayat Pinjaman</h3>
          </div>
          <div className={cn(isDark ? "divide-white/[0.04]" : "divide-slate-50", "divide-y")}>
            {loans.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">Belum ada riwayat pinjaman.</div>
            ) : (
              loans.slice(0, 5).map((l: any) => (
                <div key={l.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <HandCoins size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">Rp {(l.amount || 0).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tenor: {l.duration || 0} bulan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                      l.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      l.status === 'paid_off' ? 'bg-emerald-50 text-emerald-700 dark:bg-blue-900/30 dark:text-emerald-400' :
                      l.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {l.status === 'approved' ? 'Disetujui' : l.status === 'paid_off' ? 'Lunas' : l.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                    </span>
                    {l.status === 'approved' && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">Sisa: Rp {(l.remainingBalance || 0).toLocaleString('id-ID')}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Riwayat Simpanan */}
        <div className={cn(isDark ? "bg-[#161a23] border border-white/[0.06]" : "bg-white border border-slate-200 shadow-sm", "rounded-2xl overflow-hidden")}>
          <div className={cn(isDark ? "border-white/[0.06]" : "border-slate-100", "p-5 border-b flex justify-between items-center")}>
            <h3 className={cn(isDark ? "text-white" : "text-slate-900", "text-sm font-bold")}>Riwayat Simpanan</h3>
          </div>
          <div className={cn(isDark ? "divide-white/[0.04]" : "divide-slate-50", "divide-y")}>
            {savings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">Belum ada riwayat simpanan.</div>
            ) : (
              savings.slice(0, 5).map((s: any) => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">Rp {(s.amount || 0).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{s.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(s.date).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}