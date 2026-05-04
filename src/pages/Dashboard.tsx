import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  HandCoins,
  Clock,
  Receipt,
  PiggyBank,
  Coins,
  ShieldCheck,
  BarChart3,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { cn } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Inline theme hook to avoid circular dependency
function useAppTheme() {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export default function Dashboard() {
  const [finances, setFinances] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [savingsList, setSavingsList] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { t } = useLanguage();
  const isDark = useAppTheme();

  useEffect(() => {
    const fetchUser = async (retry = 0) => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', signal: AbortSignal.timeout(20000) });
        if (res.ok) {
          const data = await res.json();
          if (data.user) setUser(data.user);
          else if (retry < 3) setTimeout(() => fetchUser(retry + 1), 5000);
        }
      } catch {
        if (retry < 3) setTimeout(() => fetchUser(retry + 1), 6000);
      }
    };
    fetchUser();
    fetchData();
  }, []);

  const fetchData = async (retryCount = 0) => {
    setLoadError(false);
    setLoading(true);

    // Fetch dengan timeout 25 detik (toleransi cold start Railway)
    const safeFetch = (url: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);
      return fetch(url, { credentials: 'include', signal: controller.signal })
        .then(res => {
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const ct = res.headers.get("content-type");
          if (!ct || !ct.includes("application/json")) throw new TypeError("Not JSON!");
          return res.json();
        })
        .catch(err => {
          clearTimeout(timeoutId);
          throw err;
        });
    };

    try {
      const [financeData, membersData, loansData, savingsData] = await Promise.all([
        safeFetch('/api/finance'),
        safeFetch('/api/members'),
        safeFetch('/api/loans'),
        safeFetch('/api/savings')
      ]);
      setFinances(Array.isArray(financeData) ? financeData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setLoans(Array.isArray(loansData) ? loansData : []);
      setSavingsList(Array.isArray(savingsData) ? savingsData : []);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error (attempt ' + (retryCount + 1) + '):', err);
      // Auto-retry max 2 kali untuk handle Railway cold start
      if (retryCount < 2) {
        setTimeout(() => fetchData(retryCount + 1), 2000);
      } else {
        setLoadError(true);
        setLoading(false);
      }
    }
  };

  const totalIncome = finances.filter(f => f.type === 'Income').reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalExpense = finances.filter(f => f.type === 'Expense').reduce((sum, f) => sum + (f.amount || 0), 0);
  const activeLoans = loans.filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalSavings = savingsList.reduce((sum, s) => sum + (s.type === 'Withdrawal' || s.type === 'withdrawal' ? -(s.amount || 0) : (s.amount || 0)), 0);
  const totalSHU = members.reduce((sum, m) => sum + (m.total_shu || m.totalShu || 0), 0);
  const isAdmin = user?.role === 'admin';
  const activeMembers = members.filter(m => m.status === 'Aktif').length;

  const stats = isAdmin ? [
    {
      name: t('dashboard.total_members'),
      value: activeMembers.toString(),
      change: '+47%',
      trend: 'up',
      icon: Users,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      accent: '#059669',
      label: 'Dari bulan lalu'
    },
    {
      name: t('dashboard.total_savings'),
      value: `Rp ${totalSavings.toLocaleString('id-ID')}`,
      change: '+47%',
      trend: 'up',
      icon: PiggyBank,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      accent: '#10b981',
      label: 'Dari bulan lalu'
    },
    {
      name: t('dashboard.circulating_loans'),
      value: `Rp ${activeLoans.toLocaleString('id-ID')}`,
      change: '+12%',
      trend: 'up',
      icon: HandCoins,
      color: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      accent: '#f59e0b',
      label: 'Sedang berjalan'
    },
    {
      name: t('dashboard.estimated_shu'),
      value: `Rp ${totalSHU.toLocaleString('id-ID')}`,
      change: '+8%',
      trend: 'up',
      icon: Coins,
      color: 'text-purple-400',
      iconBg: 'bg-purple-500/20',
      accent: '#a855f7',
      label: 'Estimasi SHU'
    },
  ] : [
    { name: t('dashboard.my_savings'), value: `Rp ${(savingsList.filter(s => s.memberId === user?.id).reduce((sum, s) => sum + (s.type === 'Withdrawal' ? -(s.amount || 0) : (s.amount || 0)), 0)).toLocaleString('id-ID')}`, change: 'Total', trend: 'up', icon: Wallet, color: 'text-emerald-400', iconBg: 'bg-emerald-500/20', accent: '#10b981', label: 'Simpanan Anda' },
    { name: t('dashboard.active_loans'), value: `Rp ${(loans.filter(l => l.memberId === user?.id && l.status === 'approved').reduce((sum, l) => sum + (l.amount || 0), 0)).toLocaleString('id-ID')}`, change: 'Aktif', trend: 'down', icon: HandCoins, color: 'text-amber-400', iconBg: 'bg-amber-500/20', accent: '#f59e0b', label: 'Pinjaman berjalan' },
    { name: t('dashboard.shu_received'), value: `Rp ${(user?.total_shu || 0).toLocaleString('id-ID')}`, change: 'Dividen', trend: 'up', icon: Coins, color: 'text-purple-400', iconBg: 'bg-purple-500/20', accent: '#a855f7', label: 'SHU Anda' },
    { name: t('dashboard.account_status'), value: user?.status === 'active' ? 'Aktif ✓' : 'Pending', change: 'KYC', trend: 'up', icon: ShieldCheck, color: 'text-emerald-400', iconBg: 'bg-emerald-500/20', accent: '#059669', label: 'Status akun' },
  ];

  const generateChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyData: { [key: number]: { simpanan: number; pinjaman: number } } = {};
    for (let i = 0; i < 12; i++) monthlyData[i] = { simpanan: 0, pinjaman: 0 };

    savingsList.forEach(s => {
      try {
        const date = new Date(s.date || s.createdDate || Date.now());
        if (!isNaN(date.getTime())) {
          const month = date.getMonth();
          const amount = s.type === 'Withdrawal' ? -(s.amount || 0) : (s.amount || 0);
          monthlyData[month].simpanan += amount;
        }
      } catch (e) {}
    });

    loans.forEach(l => {
      try {
        const date = new Date(l.date || l.createdDate || Date.now());
        if (!isNaN(date.getTime()) && l.status === 'approved') {
          monthlyData[date.getMonth()].pinjaman += l.amount || 0;
        }
      } catch (e) {}
    });

    let cs = 0; let cp = 0;
    return months.map((name, i) => {
      cs += monthlyData[i].simpanan;
      cp += monthlyData[i].pinjaman;
      return { name, simpanan: Math.max(0, cs), pinjaman: Math.max(0, cp) };
    });
  };

  const chartData = generateChartData();

  const recentActivities = [
    ...finances.map(f => ({ id: `f-${f.id}`, type: 'finance', title: f.type === 'Income' ? 'Pemasukan Baru' : 'Pengeluaran Baru', desc: f.description, date: new Date(f.createdDate || f.date || Date.now()) })),
    ...members.map(m => ({ id: `m-${m.id}`, type: 'member', title: 'Anggota Baru', desc: `${m.name} bergabung`, date: new Date(m.createdDate || m.joinDate || Date.now()) })),
    ...loans.map(l => ({ id: `l-${l.id}`, type: 'loan', title: 'Pengajuan Pinjaman', desc: `${l.memberName} mengajukan pinjaman`, date: new Date(l.createdDate || l.date || Date.now()) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 4);

  // Card base styles
  const card = isDark
    ? "bg-[#161a23] border border-white/[0.06] rounded-2xl"
    : "bg-white border border-slate-200 rounded-2xl shadow-sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Error banner kalau gagal load setelah retry */}
      {loadError && !loading && (
        <div className={cn("p-4 rounded-2xl border flex items-center justify-between gap-4", isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-700")}>
          <div>
            <p className="font-semibold text-sm">Gagal memuat data</p>
            <p className="text-xs opacity-80 mt-1">Server mungkin sedang tidur (cold start). Silakan coba lagi.</p>
          </div>
          <button
            onClick={() => fetchData()}
            className={cn("px-4 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap", isDark ? "bg-red-500/20 hover:bg-red-500/30" : "bg-red-600 hover:bg-red-700 text-white")}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Stat Cards — 4 kolom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={stat.name} className={cn(card, "p-5 hover:border-opacity-20 transition-all group")}>
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-2.5 rounded-xl", stat.iconBg)}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <button className={cn("p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity", isDark ? "hover:bg-white/10 text-slate-500" : "hover:bg-slate-100 text-slate-400")}>
                <MoreVertical size={14} />
              </button>
            </div>
            <p className={cn("text-xs font-semibold mb-1", isDark ? "text-slate-400" : "text-slate-500")}>{stat.name}</p>
            {loading ? (
              <div className={cn("h-8 mb-2 rounded-lg animate-pulse", isDark ? "bg-white/10" : "bg-slate-200")} />
            ) : (
              <p className={cn("text-2xl font-black tracking-tight mb-2", isDark ? "text-white" : "text-slate-900")}>{stat.value}</p>
            )}
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                stat.trend === 'up' ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
              )}>
                {stat.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.change}
              </span>
              <span className={cn("text-[11px]", isDark ? "text-slate-500" : "text-slate-400")}>
                {loading ? 'Memuat...' : stat.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sales Analytics */}
          <div className={cn(card, "p-5 lg:col-span-2")}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className={cn("text-sm font-bold", isDark ? "text-white" : "text-slate-900")}>Analitik Keuangan</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs px-3 py-1.5 rounded-lg font-medium", isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600")}>
                  Pertumbuhan
                </span>
                <button className={cn("p-1.5 rounded-lg", isDark ? "hover:bg-white/5 text-slate-500" : "hover:bg-slate-100 text-slate-400")}>
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSimpanan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={isDark ? 0.25 : 0.15} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gPinjaman" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={isDark ? 0.25 : 0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#475569' : '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#475569' : '#94a3b8', fontSize: 11 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(0)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : `${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#fff',
                      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                      borderRadius: '10px',
                      color: isDark ? '#fff' : '#1e293b',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}
                    itemStyle={{ color: isDark ? '#94a3b8' : '#475569' }}
                  />
                  <Area type="monotone" dataKey="simpanan" name="Simpanan" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#gSimpanan)" dot={false} />
                  <Area type="monotone" dataKey="pinjaman" name="Pinjaman" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#gPinjaman)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-3">
              {[{ label: 'Simpanan', color: 'bg-blue-500' }, { label: 'Pinjaman', color: 'bg-amber-500' }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={cn("w-2 h-2 rounded-full", l.color)} />
                  <span className={cn("text-[11px] font-medium", isDark ? "text-slate-500" : "text-slate-400")}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products / Activity */}
          <div className={cn(card, "p-5")}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn("text-sm font-bold", isDark ? "text-white" : "text-slate-900")}>Aktivitas Terbaru</h3>
              <button className={cn("p-1.5 rounded-lg", isDark ? "hover:bg-white/5 text-slate-500" : "hover:bg-slate-100 text-slate-400")}>
                <ExternalLink size={14} />
              </button>
            </div>
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                <div key={activity.id} className="flex gap-3 group">
                  <div className="relative shrink-0">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center",
                      activity.type === 'finance' ? isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600" :
                      activity.type === 'member' ? isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-50 text-emerald-600" :
                      isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600"
                    )}>
                      {activity.type === 'finance' ? <Wallet size={14} /> : activity.type === 'member' ? <Users size={14} /> : <HandCoins size={14} />}
                    </div>
                    {index !== recentActivities.length - 1 && (
                      <div className={cn("absolute top-8 left-4 w-px h-4", isDark ? "bg-white/5" : "bg-slate-100")} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-semibold", isDark ? "text-white" : "text-slate-800")}>{activity.title}</p>
                    <p className={cn("text-[11px] truncate", isDark ? "text-slate-500" : "text-slate-400")}>{activity.desc}</p>
                    <p className={cn("text-[10px] mt-0.5 font-medium", isDark ? "text-slate-600" : "text-slate-400")}>
                      {activity.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {activity.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )) : (
                <div className={cn("text-xs text-center py-8", isDark ? "text-slate-600" : "text-slate-400")}>Belum ada aktivitas</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transactions + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <div className={cn(card, "lg:col-span-2 overflow-hidden")}>
          <div className={cn("flex items-center justify-between px-5 py-4 border-b", isDark ? "border-white/[0.06]" : "border-slate-100")}>
            <h3 className={cn("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
              <Receipt size={15} className="text-emerald-500" />
              Transaksi Terbaru
            </h3>
            <button className={cn("text-xs font-semibold", isDark ? "text-emerald-400 hover:text-blue-300" : "text-emerald-600 hover:text-emerald-700")}>
              Lihat Semua
            </button>
          </div>
          <div>
            {finances.length > 0 ? finances.slice(0, 5).map((finance) => (
              <div key={finance.id} className={cn(
                "flex items-center justify-between px-5 py-3.5 border-b last:border-0 transition-colors",
                isDark ? "border-white/[0.04] hover:bg-white/[0.02]" : "border-slate-50 hover:bg-slate-50/50"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    finance.type === 'Income'
                      ? isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                      : isDark ? "bg-red-500/15 text-red-400" : "bg-red-50 text-red-600"
                  )}>
                    {finance.type === 'Income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div>
                    <p className={cn("text-xs font-semibold", isDark ? "text-white" : "text-slate-800")}>{finance.category}</p>
                    <p className={cn("text-[11px]", isDark ? "text-slate-500" : "text-slate-400")}>{finance.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold",
                    finance.type === 'Income' ? "text-emerald-500" : "text-red-500"
                  )}>
                    {finance.type === 'Income' ? '+' : '-'} Rp {(finance.amount || 0).toLocaleString('id-ID')}
                  </p>
                  <p className={cn("text-[10px] font-medium", isDark ? "text-slate-600" : "text-slate-400")}>{finance.date}</p>
                </div>
              </div>
            )) : (
              <div className={cn("p-10 text-center text-xs", isDark ? "text-slate-600" : "text-slate-400")}>Belum ada transaksi</div>
            )}
          </div>
        </div>

        {/* Summary & Tips */}
        <div className="space-y-4">
          {/* Finance Summary */}
          <div className={cn(card, "p-5")}>
            <h3 className={cn("text-sm font-bold mb-4", isDark ? "text-white" : "text-slate-900")}>Ringkasan Keuangan</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Pemasukan', amount: totalIncome, color: 'text-emerald-500', bg: 'bg-emerald-500', pct: totalIncome / (totalIncome + totalExpense || 1) },
                { label: 'Total Pengeluaran', amount: totalExpense, color: 'text-red-500', bg: 'bg-red-500', pct: totalExpense / (totalIncome + totalExpense || 1) },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className={cn("text-[11px] font-medium", isDark ? "text-slate-400" : "text-slate-500")}>{item.label}</p>
                    <p className={cn("text-xs font-bold", item.color)}>Rp {item.amount.toLocaleString('id-ID')}</p>
                  </div>
                  <div className={cn("h-1.5 rounded-full", isDark ? "bg-white/5" : "bg-slate-100")}>
                    <div
                      className={cn("h-1.5 rounded-full transition-all duration-1000", item.bg)}
                      style={{ width: `${Math.round(item.pct * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className={cn(
            "p-4 rounded-2xl border",
            isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100"
          )}>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1.5">💡 Tips Koperasi</p>
            <p className={cn("text-[11px] leading-relaxed", isDark ? "text-blue-300" : "text-emerald-700")}>
              Rutin membayar simpanan wajib setiap bulan membantu meningkatkan SHU Anda di akhir tahun!
            </p>
          </div>

          {/* System Status */}
          <div className={cn(card, "p-4")}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className={cn("text-[11px] font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>Sistem Online</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Anggota Aktif', val: activeMembers },
                { label: 'Pinjaman Aktif', val: loans.filter(l => l.status === 'approved').length },
              ].map(item => (
                <div key={item.label} className={cn("p-2.5 rounded-xl text-center", isDark ? "bg-white/[0.04]" : "bg-slate-50")}>
                  <p className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-900")}>{item.val}</p>
                  <p className={cn("text-[10px]", isDark ? "text-slate-500" : "text-slate-400")}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}