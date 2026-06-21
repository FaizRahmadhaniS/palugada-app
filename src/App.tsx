import {
  BrowserRouter as Router, Routes, Route, Link,
  useLocation, Navigate
} from 'react-router-dom';
import { DialogProvider } from './components/Dialog';
import {
  LayoutDashboard, Users, Wallet, HandCoins, FileText,
  Settings as SettingsIcon, Menu, X, LogOut, CreditCard,
  ArrowDownLeft, TrendingUp, PieChart, Clock, Mail, Filter,
  CheckSquare, Receipt, MessageSquareWarning, Sun, Moon
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './types';

import Dashboard        from './pages/Dashboard';
import Reports          from './pages/Reports';
import Login            from './pages/Login';
import Settings         from './pages/Settings';
import PaymentGateway   from './pages/PaymentGateway';
import Approvals        from './pages/Approvals';
import Finance          from './pages/Finance';
import Complaints       from './pages/Complaints';
import Members          from './pages/Members';
import Loans            from './pages/Loans';
import Savings          from './pages/Savings';
import Withdrawals      from './pages/Withdrawals';
import MemberLoanRequest   from './pages/MemberLoanRequest';
import MemberReports       from './pages/MemberReports';
import MemberStatement     from './pages/MemberStatement';
import DigitalCard         from './pages/DigitalCard';
import AuditLogs           from './pages/AuditLogs';
import LoanPaymentHistory  from './pages/LoanPaymentHistory';
import SHUDistribution     from './pages/SHUDistribution';
import MonthlyReports      from './pages/MonthlyReports';
import EmailNotifications  from './pages/EmailNotifications';
import AdvancedFiltering   from './pages/AdvancedFiltering';
import MemberDashboard     from './pages/MemberDashboard';
import Profile             from './pages/Profile';
import NotificationDropdown from './components/NotificationDropdown';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Landing   from './pages/Landing';
import Onboarding from './pages/Onboarding';

/* ── Theme ─────────────────────────────────────────────────────────────────── */
export const ThemeContext = React.createContext<{ theme: string; toggleTheme: () => void }>({ theme:'light', toggleTheme:()=>{} });
export const useTheme = () => React.useContext(ThemeContext);

const GREEN = 'linear-gradient(135deg,#10b981,#059669,#047857)';

/* ── Page transition wrapper ──────────────────────────────────────────────── */
function PT({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity:0, y:14 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-8 }}
      transition={{ duration:0.28, ease:[0.22,1,0.36,1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated routes — MUST live inside <Router> ─────────────────────────── */
function AppRoutes({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const location = useLocation();
  const W = ({ c }: { c: React.ReactNode }) => <PT>{c}</PT>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {user.role === 'admin' ? (
          <>
            <Route path="/"                 element={<W c={<Dashboard />} />} />
            <Route path="/members"          element={<W c={<Members />} />} />
            <Route path="/savings"          element={<W c={<Savings />} />} />
            <Route path="/withdrawals"      element={<W c={<Withdrawals />} />} />
            <Route path="/loans"            element={<W c={<Loans />} />} />
            <Route path="/loan-payments"    element={<W c={<LoanPaymentHistory user={user} />} />} />
            <Route path="/payment-gateway"  element={<W c={<PaymentGateway />} />} />
            <Route path="/finance"          element={<W c={<Finance />} />} />
            <Route path="/complaints"       element={<W c={<Complaints user={user} />} />} />
            <Route path="/reports"          element={<W c={<Reports />} />} />
            <Route path="/shu-distribution" element={<W c={<SHUDistribution user={user} />} />} />
            <Route path="/monthly-reports"  element={<W c={<MonthlyReports user={user} />} />} />
            <Route path="/advanced-filter"  element={<W c={<AdvancedFiltering user={user} />} />} />
            <Route path="/email-settings"   element={<W c={<EmailNotifications user={user} />} />} />
            <Route path="/settings"         element={<W c={<Settings user={user} />} />} />
            <Route path="/audit-logs"       element={<W c={<AuditLogs />} />} />
            <Route path="/approvals"        element={<W c={<Approvals />} />} />
          </>
        ) : (
          <>
            <Route path="/"                 element={<W c={<MemberDashboard user={user} />} />} />
            <Route path="/savings"          element={<W c={<Savings user={user} />} />} />
            <Route path="/withdrawals"      element={<W c={<Withdrawals user={user} />} />} />
            <Route path="/loan-request"     element={<W c={<MemberLoanRequest user={user} />} />} />
            <Route path="/loan-payments"    element={<W c={<LoanPaymentHistory user={user} />} />} />
            <Route path="/member-reports"   element={<W c={<MemberReports user={user} />} />} />
            <Route path="/member-statement" element={<W c={<MemberStatement user={user} />} />} />
            <Route path="/digital-card"     element={<W c={<DigitalCard user={user} />} />} />
            <Route path="/complaints"       element={<W c={<Complaints user={user} />} />} />
            <Route path="/settings"         element={<W c={<Settings user={user} />} />} />
          </>
        )}
        <Route path="/profile" element={<W c={<Profile user={user} onUpdate={setUser} />} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
function Sidebar({ user, onLogout, isOpen, onClose }: { user:any; onLogout:()=>void; isOpen:boolean; onClose:()=>void }) {
  const loc = useLocation();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [exp, setExp] = useState(false);
  const leaveT = useRef<NodeJS.Timeout | null>(null);

  const enter = () => { if (leaveT.current) clearTimeout(leaveT.current); setExp(true); };
  const leave = () => { leaveT.current = setTimeout(() => setExp(false), 180); };

  const adminNav = [
    { name:t('nav.dashboard'),    href:'/',                icon:LayoutDashboard,      group:'MENU' },
    { name:t('nav.members'),      href:'/members',         icon:Users,                group:'MENU' },
    { name:t('nav.savings'),      href:'/savings',         icon:Wallet,               group:'MENU' },
    { name:t('nav.withdrawals'),  href:'/withdrawals',     icon:ArrowDownLeft,        group:'MENU' },
    { name:t('nav.loans'),        href:'/loans',           icon:HandCoins,            group:'MENU' },
    { name:'Riwayat Pembayaran',  href:'/loan-payments',   icon:Clock,                group:'MENU' },
    { name:'Payment Gateway',     href:'/payment-gateway', icon:CreditCard,           group:'MENU' },
    { name:t('nav.approvals'),    href:'/approvals',       icon:CheckSquare,          group:'MENU' },
    { name:t('nav.finance'),      href:'/finance',         icon:Receipt,              group:'LAPORAN' },
    { name:'Distribusi SHU',      href:'/shu-distribution',icon:PieChart,             group:'LAPORAN' },
    { name:'Laporan Bulanan',     href:'/monthly-reports', icon:TrendingUp,           group:'LAPORAN' },
    { name:'Filter Lanjutan',     href:'/advanced-filter', icon:Filter,               group:'LAPORAN' },
    { name:t('nav.complaints'),   href:'/complaints',      icon:MessageSquareWarning, group:'SISTEM' },
    { name:'Email Settings',      href:'/email-settings',  icon:Mail,                 group:'SISTEM' },
    { name:t('nav.audit_logs'),   href:'/audit-logs',      icon:FileText,             group:'SISTEM' },
    { name:t('nav.settings'),     href:'/settings',        icon:SettingsIcon,         group:'SISTEM' },
  ];

  const memberNav = [
    { name:t('nav.dashboard'),    href:'/',                icon:LayoutDashboard,      group:'MENU' },
    { name:t('nav.savings'),      href:'/savings',         icon:Wallet,               group:'MENU' },
    { name:t('nav.withdrawals'),  href:'/withdrawals',     icon:ArrowDownLeft,        group:'MENU' },
    { name:t('nav.loan_request'), href:'/loan-request',    icon:HandCoins,            group:'MENU' },
    { name:'Kartu Digital',       href:'/digital-card',    icon:CreditCard,           group:'MENU' },
    { name:'Riwayat Pembayaran',  href:'/loan-payments',   icon:Receipt,              group:'LAPORAN' },
    { name:'Laporan Rekening',    href:'/member-statement',icon:FileText,             group:'LAPORAN' },
    { name:'Riwayat & Laporan',   href:'/member-reports',  icon:TrendingUp,           group:'LAPORAN' },
    { name:t('nav.complaints'),   href:'/complaints',      icon:MessageSquareWarning, group:'SISTEM' },
    { name:t('nav.settings'),     href:'/settings',        icon:SettingsIcon,         group:'SISTEM' },
  ];

  const items = user?.role === 'admin' ? adminNav : memberNav;
  const groups = [...new Set(items.map(i => i.group))];
  const col = !exp;

  const bg     = isDark ? '#0f1117' : '#fff';
  const border = isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
  const txtDim = isDark ? '#6b7280' : '#9ca3af';

  const body = (mob = false) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:bg, borderRight:`1px solid ${border}`, width: mob ? 256 : (col ? 68 : 228), transition:'width 0.25s ease', overflow:'hidden' }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', height:64, padding:'0 16px', borderBottom:`1px solid ${border}`, gap:10, flexShrink:0, justifyContent: col && !mob ? 'center' : 'space-between' }}>
        {(!col || mob) ? (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(5,150,105,.3)', overflow:'hidden' }}>
              <img src="/logo-palugada-baru.png" alt="Palugada" style={{ width:'80%', height:'80%', objectFit:'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.style.background=GREEN; (e.target as HTMLImageElement).parentElement!.innerHTML='<span style="color:#fff;font-weight:900;font-size:18px">P</span>'; }} />
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color: isDark?'#fff':'#111827', margin:0, letterSpacing:'-0.3px' }}>Palugada</p>
              <p style={{ fontSize:10, color:'#10b981', fontWeight:600, margin:0, textTransform:'capitalize' }}>{user?.role}</p>
            </div>
          </div>
        ) : (
          <div style={{ width:34, height:34, borderRadius:10, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(5,150,105,.3)', overflow:'hidden' }}>
            <img src="/logo-palugada-baru.png" alt="Palugada" style={{ width:'80%', height:'80%', objectFit:'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.style.background=GREEN; (e.target as HTMLImageElement).parentElement!.innerHTML='<span style="color:#fff;font-weight:900;font-size:18px">P</span>'; }} />
          </div>
        )}
        {mob && <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:txtDim, padding:4 }}><X size={18}/></button>}
      </div>

      {/* Nav items */}
      <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto', overflowX:'hidden' }}>
        {groups.map((grp, gi) => (
          <div key={grp} style={{ marginTop: gi > 0 ? 14 : 0 }}>
            {(!col || mob) && <p style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.15em', color:txtDim, padding:'0 10px', marginBottom:5 }}>{grp}</p>}
            {items.filter(i => i.group === grp).map(item => {
              const active = loc.pathname === item.href;
              return (
                <Link key={item.href} to={item.href}
                  onClick={() => { if (mob) onClose(); }}
                  title={col && !mob ? item.name : undefined}
                  style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 10px', borderRadius:11, marginBottom:2, textDecoration:'none', position:'relative', justifyContent: col && !mob ? 'center' : 'flex-start', background: active ? (isDark ? 'rgba(16,185,129,.13)' : '#ecfdf5') : 'transparent', color: active ? '#059669' : txtDim, transition:'all .15s', fontWeight: active ? 600 : 500, fontSize:13 }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = isDark ? 'rgba(255,255,255,.05)' : '#f9fafb'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}>
                  {active && <span style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:18, borderRadius:'0 3px 3px 0', background:'#10b981' }} />}
                  <item.icon size={16} style={{ flexShrink:0, color: active ? '#059669' : txtDim }} />
                  {(!col || mob) && <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding:8, borderTop:`1px solid ${border}`, flexShrink:0 }}>
        {(!col || mob) && (
          <div style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 10px', borderRadius:11, background: isDark ? 'rgba(255,255,255,.04)' : '#f9fafb', marginBottom:4 }}>
            <div style={{ width:26, height:26, borderRadius:'50%', background:GREEN, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:10, flexShrink:0 }}>
              {user?.name?.substring(0,2)?.toUpperCase() || 'US'}
            </div>
            <div style={{ minWidth:0, flex:1 }}>
              <p style={{ fontSize:11, fontWeight:600, color: isDark?'#fff':'#111827', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</p>
              <p style={{ fontSize:10, color:txtDim, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textTransform:'capitalize' }}>{user?.email}</p>
            </div>
          </div>
        )}
        <button onClick={onLogout} title="Keluar"
          style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'8px 10px', borderRadius:11, background:'none', border:'none', cursor:'pointer', color:txtDim, fontSize:13, fontWeight:500, justifyContent: col && !mob ? 'center' : 'flex-start', fontFamily:'inherit', transition:'all .15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(239,68,68,.1)' : '#fef2f2'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = txtDim; }}>
          <LogOut size={16} style={{ flexShrink:0 }} />
          {(!col || mob) && <span>Keluar</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop hover-to-expand */}
      <div data-palugada="sidebar-desktop" style={{ height:'100vh', position:'sticky', top:0, flexShrink:0, zIndex:30 }} onMouseEnter={enter} onMouseLeave={leave}>
        {body(false)}
      </div>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)', zIndex:40 }} />
            <motion.div initial={{ x:'-100%' }} animate={{ x:0 }} exit={{ x:'-100%' }}
              transition={{ type:'spring', damping:28, stiffness:220 }}
              style={{ position:'fixed', top:0, left:0, bottom:0, zIndex:50, boxShadow:'4px 0 20px rgba(0,0,0,.15)' }}>
              {body(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Header ─────────────────────────────────────────────────────────────── */
function Header({ user, onMenuClick }: { user:any; onMenuClick:()=>void }) {
  const { theme, toggleTheme } = useTheme();
  const loc = useLocation();
  const isDark = theme === 'dark';

  const TITLES: Record<string, { title:string; sub:string }> = {
    '/':                 { title:'Beranda',             sub:'Ringkasan performa koperasi hari ini' },
    '/members':          { title:'Anggota',             sub:'Kelola data anggota koperasi' },
    '/savings':          { title:'Simpanan',            sub:'Manajemen simpanan anggota' },
    '/withdrawals':      { title:'Penarikan',           sub:'Riwayat dan permintaan penarikan' },
    '/loans':            { title:'Pinjaman',            sub:'Manajemen pinjaman anggota' },
    '/loan-payments':    { title:'Riwayat Pembayaran',  sub:'Histori cicilan pinjaman' },
    '/payment-gateway':  { title:'Payment Gateway',     sub:'Monitor status pembayaran anggota' },
    '/approvals':        { title:'Persetujuan',         sub:'Kelola permintaan masuk' },
    '/finance':          { title:'Keuangan',            sub:'Laporan keuangan koperasi' },
    '/shu-distribution': { title:'Distribusi SHU',      sub:'Sisa Hasil Usaha anggota' },
    '/monthly-reports':  { title:'Laporan Bulanan',     sub:'Laporan bulanan koperasi' },
    '/advanced-filter':  { title:'Filter Lanjutan',     sub:'Pencarian dan filter data' },
    '/complaints':       { title:'Pengaduan',           sub:'Kelola pengaduan anggota' },
    '/email-settings':   { title:'Email Settings',      sub:'Konfigurasi notifikasi email' },
    '/audit-logs':       { title:'Audit Log',           sub:'Rekam jejak aktivitas sistem' },
    '/settings':         { title:'Pengaturan',          sub:'Konfigurasi sistem' },
    '/loan-request':     { title:'Ajukan Pinjaman',     sub:'Pengajuan pinjaman baru' },
    '/member-statement': { title:'Laporan Rekening',    sub:'Mutasi rekening simpanan' },
    '/member-reports':   { title:'Riwayat & Laporan',   sub:'Riwayat transaksi Anda' },
    '/digital-card':     { title:'Kartu Digital',       sub:'Kartu anggota digital' },
    '/profile':          { title:'Profil Saya',         sub:'Kelola informasi akun Anda' },
  };
  const info = TITLES[loc.pathname] || { title:'Dashboard', sub:'Palugada Cooperative' };

  const bg     = isDark ? 'rgba(15,17,23,0.95)'  : 'rgba(255,255,255,0.95)';
  const border = isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';

  return (
    <header style={{ height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', position:'sticky', top:0, zIndex:20, borderBottom:`1px solid ${border}`, background:bg, backdropFilter:'blur(16px)', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
        <button onClick={onMenuClick} data-palugada="hamburger" style={{ background:'none', border:'none', cursor:'pointer', color: isDark ? '#9ca3af' : '#6b7280', padding:6, display:'none', flexShrink:0 }}>
          <Menu size={20} />
        </button>
        <div style={{ minWidth:0 }}>
          <h1 style={{ fontSize:15, fontWeight:700, color: isDark ? '#fff' : '#111827', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{info.title}</h1>
          <p  style={{ fontSize:11, color: isDark ? '#6b7280' : '#9ca3af', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{info.sub}</p>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        {/* Dark/light toggle */}
        <button onClick={toggleTheme}
          style={{ position:'relative', width:44, height:24, borderRadius:12, background: isDark ? '#059669' : '#e5e7eb', border:'none', cursor:'pointer', transition:'background .3s', flexShrink:0 }}>
          <motion.div animate={{ x: isDark ? 22 : 2 }} transition={{ type:'spring', stiffness:350, damping:28 }}
            style={{ position:'absolute', top:2, width:20, height:20, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {isDark ? <Moon size={10} color="#059669" /> : <Sun size={10} color="#f59e0b" />}
          </motion.div>
        </button>

        <div><NotificationDropdown /></div>

        <Link to="/settings" style={{ display:'flex', padding:7, borderRadius:10, color: isDark ? '#6b7280' : '#9ca3af', transition:'all .15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = isDark ? 'rgba(255,255,255,.05)' : '#f3f4f6'; (e.currentTarget as HTMLAnchorElement).style.color = isDark ? '#fff' : '#374151'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = isDark ? '#6b7280' : '#9ca3af'; }}>
          <SettingsIcon size={17} />
        </Link>

        <Link to="/profile" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{ textAlign:'right' }} className="hidden sm:block">
            <p style={{ fontSize:12, fontWeight:600, color: isDark?'#fff':'#111827', margin:0 }}>{user?.name}</p>
            <p style={{ fontSize:10, color: isDark?'#6b7280':'#9ca3af', margin:0, textTransform:'capitalize' }}>{user?.role}</p>
          </div>
          <div style={{ width:32, height:32, borderRadius:'50%', background:GREEN, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:11, flexShrink:0, overflow:'hidden', boxShadow:'0 2px 8px rgba(5,150,105,.3)' }}>
            {user?.selfie_url ? <img src={user.selfie_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : user?.name?.substring(0,2)?.toUpperCase() || 'US'}
          </div>
        </Link>
      </div>
    </header>
  );
}

/* ── App shell ───────────────────────────────────────────────────────────── */
function AppShell({ user, setUser, onLogout, isDark, serverWaking }: { user:any; setUser:(u:any)=>void; onLogout:()=>void; isDark:boolean; serverWaking?:boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background: isDark ? '#0d0f14' : '#f8faf8', color: isDark ? '#f1f5f9' : '#111827', fontFamily:'Inter,system-ui,sans-serif' }}>
      <style>{`
        /* Sidebar: hidden on mobile, visible on desktop (>=1024px) */
        [data-palugada="sidebar-desktop"] { display: none; }
        @media (min-width: 1024px) {
          [data-palugada="sidebar-desktop"] { display: block; }
          [data-palugada="hamburger"] { display: none !important; }
        }
        @media (max-width: 1023px) {
          [data-palugada="hamburger"] { display: flex !important; }
        }
      `}</style>
      <Sidebar user={user} onLogout={onLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        {serverWaking && (
          <div style={{ background:'#fffbeb', borderBottom:'1px solid #fde68a', padding:'10px 24px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <span style={{ fontSize:16 }}>⚡</span>
            <div>
              <span style={{ fontSize:13, fontWeight:600, color:'#92400e' }}>Server baru menyala — </span>
              <span style={{ fontSize:13, color:'#a16207' }}>Data mungkin membutuhkan waktu untuk muncul. Refresh halaman jika perlu.</span>
            </div>
          </div>
        )}
        <main style={{ flex:1, overflowY:'auto', background: isDark ? '#0d0f14' : '#f8faf8' }}>
          <div style={{ padding:24 }}>
            <AppRoutes user={user} setUser={setUser} />
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Root App ────────────────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [serverWaking, setServerWaking] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');

  const toggleTheme = () => setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark';
    localStorage.setItem('app_theme', next);
    return next;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const stored = localStorage.getItem('palugada_user');
    if (stored) {
      try { const p = JSON.parse(stored); if (p) { setUser(p); setLoading(false); } }
      catch { localStorage.removeItem('palugada_user'); }
    }
    fetch('/api/auth/me')
      .then(r => { if (r.status === 401) { localStorage.removeItem('palugada_user'); setUser(null); throw 0; } return r.json(); })
      .then(d => { if (d.user) { setUser(d.user); localStorage.setItem('palugada_user', JSON.stringify(d.user)); } else { setUser(null); localStorage.removeItem('palugada_user'); } setLoading(false); })
      .catch(() => { setUser(null); localStorage.removeItem('palugada_user'); setLoading(false); });

    const h = (e: MessageEvent) => {
      if (!e.origin.endsWith('.run.app') && !e.origin.includes('localhost')) return;
      if (e.data?.type === 'OAUTH_AUTH_SUCCESS') {
        if (e.data.requires2FA) window.dispatchEvent(new CustomEvent('oauth-2fa-required'));
        else { setUser(e.data.user); localStorage.setItem('palugada_user', JSON.stringify(e.data.user)); }
      }
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    localStorage.removeItem('palugada_user');
    setUser(null);
  };

  const isDark = theme === 'dark';

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, background: isDark ? '#0d0f14' : '#f9fafb' }}>
      <div style={{ width:56, height:56, borderRadius:16, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(5,150,105,.35)', overflow:'hidden' }}>
        <img src="/logo-palugada-baru.png" alt="Palugada" style={{ width:'70%', height:'70%', objectFit:'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.style.background=GREEN; (e.target as HTMLImageElement).parentElement!.innerHTML='<span style="color:#fff;font-weight:900;font-size:24px">P</span>'; }} />
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', animation:`_b .7s ease-in-out ${i*.15}s infinite alternate` }} />
        ))}
      </div>
      {serverWaking && (
        <div style={{ textAlign:'center', maxWidth:280 }}>
          <p style={{ fontSize:14, fontWeight:600, color: isDark ? '#10b981' : '#059669', margin:0 }}>⚡ Server sedang menyala...</p>
          <p style={{ fontSize:12, color: isDark ? '#6b7280' : '#9ca3af', margin:'6px 0 0' }}>Railway membutuhkan 30–60 detik saat pertama dibuka. Harap tunggu.</p>
        </div>
      )}
      <style>{`@keyframes _b { to { transform:translateY(-8px); } }`}</style>
    </div>
  );

  return (
    <DialogProvider>
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {!user ? (
        /* Public routes */
        <Router>
          <Routes>
            <Route path="/"      element={<Landing />} />
            <Route path="/login" element={<Login onLogin={setUser} />} />
            <Route path="*"      element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      ) : user.role === 'member' && user.status !== 'active' ? (
        /* Onboarding */
        <Router>
          <Routes>
            <Route path="/onboarding" element={<Onboarding user={user} onLogout={handleLogout} onUpdateUser={setUser} />} />
            <Route path="*"           element={<Navigate to="/onboarding" replace />} />
          </Routes>
        </Router>
      ) : (
        /* Authenticated app — Router wraps everything so useLocation works */
        <LanguageProvider>
          <Router>
            <AppShell user={user} setUser={setUser} onLogout={handleLogout} isDark={isDark} serverWaking={serverWaking} />
          </Router>
        </LanguageProvider>
      )}
    </ThemeContext.Provider>
    </DialogProvider>
  );
}