import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

/* ─────────────────────────── constants ──────────────────────────────────── */
const GG = 'linear-gradient(135deg,#10b981 0%,#059669 55%,#047857 100%)';
const GS = '0 6px 28px rgba(5,150,105,0.36)';

/* ─────────────────────────── tiny atoms ──────────────────────────────────── */
function GoogleSVG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function Input({ type = 'text', placeholder, value, onChange, required = true, maxLength }: {
  type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; required?: boolean; maxLength?: number;
}) {
  return (
    <input
      type={type} placeholder={placeholder} value={value} required={required} maxLength={maxLength}
      onChange={e => onChange(e.target.value)}
      className="pal-input"
    />
  );
}

function PwdInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'} placeholder={placeholder} value={value} required
        onChange={e => onChange(e.target.value)}
        className="pal-input" style={{ paddingRight: 44 }}
      />
      <button type="button" onClick={() => setShow(s => !s)} className="pal-eye">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function GreenBtn({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="submit" disabled={disabled} className="pal-btn-green">
      {children}
    </button>
  );
}

function OutlineBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="pal-btn-outline">
      {children}
    </button>
  );
}

function GoogleBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="pal-btn-google">
      <GoogleSVG /> {label}
    </button>
  );
}

function Divider({ text }: { text: string }) {
  return (
    <div className="pal-divider">
      <div className="pal-divider-line" />
      <span className="pal-divider-text">{text}</span>
      <div className="pal-divider-line" />
    </div>
  );
}

function Alert({ msg, isErr }: { msg: string; isErr: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={isErr ? 'pal-alert-err' : 'pal-alert-ok'}>
      {msg}
    </motion.div>
  );
}

function LinkBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="pal-link">{children}</button>
  );
}

/* ─────────────────────────── Login form content ─────────────────────────── */
function LoginContent({ onSubmit, onGoogle, onForgot, onToReg, err, ok, loading }: {
  onSubmit: (e: string, p: string) => void;
  onGoogle: () => void; onForgot: () => void; onToReg: () => void;
  err: string; ok: string; loading: boolean;
}) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  return (
    <form onSubmit={ev => { ev.preventDefault(); onSubmit(email, pass); }} className="pal-form">
      <h2 className="pal-title">Selamat Datang</h2>
      <p className="pal-sub">Masuk ke akun Palugada Anda</p>

      <AnimatePresence>
        {err && <Alert msg={err} isErr={true} />}
        {ok  && <Alert msg={ok}  isErr={false} />}
      </AnimatePresence>

      <GoogleBtn onClick={onGoogle} label="Lanjutkan dengan Google" />
      <Divider text="atau gunakan email" />
      <Input type="email" placeholder="Alamat Email" value={email} onChange={setEmail} />
      <PwdInput placeholder="Password" value={pass} onChange={setPass} />

      <div style={{ textAlign: 'right', marginTop: -4 }}>
        <LinkBtn onClick={onForgot}>Lupa Password?</LinkBtn>
      </div>

      <GreenBtn disabled={loading}>{loading ? 'Memproses…' : 'Masuk Sekarang'}</GreenBtn>

      <p className="pal-switch-mobile">
        Belum punya akun? <LinkBtn onClick={onToReg}>Daftar</LinkBtn>
      </p>
    </form>
  );
}

/* ─────────────────────────── Register form content ──────────────────────── */
function RegisterContent({ onSubmit, onGoogle, onToLogin, err, ok, loading }: {
  onSubmit: (n: string, nik: string, e: string, p: string, ph: string) => void;
  onGoogle: () => void; onToLogin: () => void;
  err: string; ok: string; loading: boolean;
}) {
  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [phone, setPhone] = useState('');
  return (
    <form onSubmit={ev => { ev.preventDefault(); onSubmit(name, nik, email, pass, phone); }} className="pal-form">
      <h2 className="pal-title">Buat Akun</h2>
      <p className="pal-sub">Daftar dan mulai kelola koperasi Anda</p>

      <AnimatePresence>
        {err && <Alert msg={err} isErr={true} />}
        {ok  && <Alert msg={ok}  isErr={false} />}
      </AnimatePresence>

      <GoogleBtn onClick={onGoogle} label="Daftar dengan Google" />
      <Divider text="atau daftar dengan email" />
      <Input placeholder="Nama Lengkap" value={name} onChange={setName} />
      <Input placeholder="NIK (16 digit)" value={nik} onChange={v => setNik(v.replace(/\D/g,''))} maxLength={16} />
      <Input type="email" placeholder="Alamat Email" value={email} onChange={setEmail} />
      <PwdInput placeholder="Password" value={pass} onChange={setPass} />
      <Input type="tel" placeholder="No. HP (opsional)" value={phone} onChange={setPhone} required={false} />

      <GreenBtn disabled={loading}>{loading ? 'Mendaftar…' : 'Daftar Sekarang'}</GreenBtn>

      <p className="pal-switch-mobile">
        Sudah punya akun? <LinkBtn onClick={onToLogin}>Masuk</LinkBtn>
      </p>
    </form>
  );
}

/* ─────────────────────────── Main export ────────────────────────────────── */
export default function Login({ onLogin }: { onLogin: (u: any) => void }) {
  // isReg = false → login on LEFT, green on RIGHT
  // isReg = true  → green on LEFT, register on RIGHT  (panel slides)
  const [isReg, setIsReg] = useState(false);
  const [mode, setMode]   = useState<'main' | 'forgot' | '2fa'>('main');
  const [err, setErr]     = useState('');
  const [ok, setOk]       = useState('');
  const [loading, setL]   = useState(false);
  const [otp, setOtp]     = useState('');
  const [authedEmail, setAE] = useState('');
  const [fpE, setFpE]  = useState('');
  const [fpN, setFpN]  = useState('');
  const [fpP, setFpP]  = useState('');

  const clear = () => { setErr(''); setOk(''); };

  useEffect(() => {
    const h = () => setMode('2fa');
    window.addEventListener('oauth-2fa-required', h);
    return () => window.removeEventListener('oauth-2fa-required', h);
  }, []);

  useEffect(() => {
    const h = (e: MessageEvent) => {
      if (e.data?.type === 'OAUTH_AUTH_SUCCESS') {
        if (e.data.requires2FA) setMode('2fa');
        else if (e.data.user) onLogin(e.data.user);
      }
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, [onLogin]);

  const vNIK = (nik: string) => {
    if (nik.length !== 16) return 'NIK harus 16 digit';
    const prov = +nik.slice(0,2);
    if (prov < 11 || prov > 94) return 'Kode provinsi NIK tidak valid';
    const mo = +nik.slice(8,10);
    if (mo < 1 || mo > 12) return 'Bulan lahir NIK tidak valid';
    const dy = +nik.slice(6,8); const d = dy > 40 ? dy - 40 : dy;
    if (d < 1 || d > 31) return 'Tanggal lahir NIK tidak valid';
    return null;
  };

  const gLogin = async () => {
    try {
      const r = `${location.origin}/auth/google/callback`;
      const res = await fetch(`/api/auth/google/url?redirectUri=${encodeURIComponent(r)}`);
      const { url } = await res.json();
      window.open(url, 'g_oauth', 'width=600,height=700');
    } catch { setErr('Gagal memuat Google Login'); }
  };

  const doLogin = async (email: string, pass: string) => {
    setL(true); clear();
    try {
      const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, password:pass }), credentials:'include' });
      if (r.status === 401) { setErr('Email atau password salah'); return; }
      const d = await r.json();
      if (d.success) { if (d.requires2FA) { setAE(email); setMode('2fa'); } else onLogin(d.user); }
      else setErr(d.message || 'Login gagal');
    } catch { setErr('Kesalahan koneksi'); }
    finally { setL(false); }
  };

  const doReg = async (name: string, nik: string, email: string, pass: string, phone: string) => {
    const ne = vNIK(nik); if (ne) { setErr(ne); return; }
    setL(true); clear();
    try {
      const r = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name, nik, email, password:pass, phone }), credentials:'include' });
      const d = await r.json();
      if (d.success) { setOk('Registrasi berhasil! Silakan masuk.'); setIsReg(false); }
      else setErr(d.message || 'Registrasi gagal');
    } catch { setErr('Kesalahan koneksi'); }
    finally { setL(false); }
  };

  const doForgot = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const ne = vNIK(fpN); if (ne) { setErr(ne); return; }
    setL(true); clear();
    try {
      const r = await fetch('/api/auth/reset-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:fpE, nik:fpN, newPassword:fpP }) });
      const d = await r.json();
      if (d.success) { setOk('Password berhasil diubah.'); setMode('main'); }
      else setErr(d.message || 'Gagal mengubah password');
    } catch { setErr('Kesalahan koneksi'); }
    finally { setL(false); }
  };

  const do2FA = async (ev: React.FormEvent) => {
    ev.preventDefault(); setL(true); clear();
    try {
      const r = await fetch('/api/auth/verify-2fa', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ otp }), credentials:'include' });
      if (r.status === 401) { setErr('Sesi berakhir'); setMode('main'); setOtp(''); return; }
      const d = await r.json();
      if (d.success) onLogin(d.user); else setErr(d.message || 'Kode OTP salah');
    } catch { setErr('Kesalahan koneksi'); }
    finally { setL(false); }
  };

  /* 2FA */
  if (mode === '2fa') return (
    <div className="pal-bg">
      <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} className="pal-card-sm">
        <div className="pal-icon-circle"><Lock size={24} color="#fff" /></div>
        <h2 className="pal-title">Verifikasi 2FA</h2>
        <p className="pal-sub">Masukkan kode 6 digit dari Google Authenticator</p>
        <AnimatePresence>{err && <Alert msg={err} isErr />}</AnimatePresence>
        <form onSubmit={do2FA} style={{ display:'flex', flexDirection:'column', gap:12, marginTop:16 }}>
          <input type="text" required maxLength={6} placeholder="● ● ● ● ● ●" value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g,''))} className="pal-otp" />
          <GreenBtn disabled={loading || otp.length !== 6}>{loading ? 'Memverifikasi…' : 'Verifikasi'}</GreenBtn>
        </form>
        <button onClick={() => { setMode('main'); setOtp(''); clear(); }} className="pal-back">
          <ArrowLeft size={13}/> Kembali ke Login
        </button>
      </motion.div>
      <Styles />
    </div>
  );

  /* Forgot password */
  if (mode === 'forgot') return (
    <div className="pal-bg">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="pal-card-sm">
        <div className="pal-icon-circle"><Lock size={22} color="#fff" /></div>
        <h2 className="pal-title">Lupa Password</h2>
        <p className="pal-sub">Verifikasi identitas untuk reset password</p>
        <AnimatePresence>
          {err && <Alert msg={err} isErr />}
          {ok  && <Alert msg={ok}  isErr={false} />}
        </AnimatePresence>
        <form onSubmit={doForgot} style={{ display:'flex', flexDirection:'column', gap:12, marginTop:16 }}>
          <Input type="email" placeholder="Alamat Email"    value={fpE} onChange={setFpE} />
          <Input placeholder="NIK (16 digit)" value={fpN} onChange={v => setFpN(v.replace(/\D/g,''))} maxLength={16} />
          <PwdInput placeholder="Password Baru" value={fpP} onChange={setFpP} />
          <GreenBtn disabled={loading}>{loading ? 'Memproses…' : 'Reset Password'}</GreenBtn>
        </form>
        <button onClick={() => { setMode('main'); clear(); }} className="pal-back-green">
          ← Kembali ke Login
        </button>
      </motion.div>
      <Styles />
    </div>
  );

  /* ── MAIN PANEL (sliding) ──────────────────────────────────────────────── */
  return (
    <div className="pal-bg">
      {/*
        Structure (same as CSS reference):
        - .pal-card  → 900px wide, 580px tall, overflow:hidden, position:relative
        - .pal-login-box  → left 0, width 50%   (login form)
        - .pal-reg-box    → left 0, width 50%   (register form, starts hidden right)
        - .pal-overlay-wrap → left 50%, width 50%  (the sliding green panel)
          └── .pal-overlay   → left -100%, width 200%  (contains two sub-panels)
      */}
      <motion.div
        initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.4, ease:[0.22,1,0.36,1] }}
        className={`pal-card ${isReg ? 'reg-active' : ''}`}>

        {/* Login form box */}
        <div className="pal-form-box pal-login-box">
          <LoginContent
            onSubmit={doLogin} onGoogle={gLogin}
            onForgot={() => { setMode('forgot'); clear(); }}
            onToReg={() => { setIsReg(true); clear(); }}
            err={err} ok={ok} loading={loading} />
        </div>

        {/* Register form box */}
        <div className="pal-form-box pal-reg-box">
          <RegisterContent
            onSubmit={doReg} onGoogle={gLogin}
            onToLogin={() => { setIsReg(false); clear(); }}
            err={err} ok={ok} loading={loading} />
        </div>

        {/* Overlay (green sliding panel) */}
        <div className="pal-overlay-wrap">
          <div className="pal-overlay">
            {/* Left sub-panel — visible when reg mode, says "Selamat Datang" with Masuk btn */}
            <div className="pal-ov-panel pal-ov-left">
              <div className="pal-ov-logo">
                <img src="/logo-palugada-baru.png" alt="Palugada" style={{ width:'70%', height:'70%', objectFit:'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.innerHTML='P'; }} />
              </div>
              <h3 className="pal-ov-title">Selamat Datang!</h3>
              <p className="pal-ov-desc">Sudah punya akun? Masuk dan lanjutkan pengalaman bersama Palugada Cooperative.</p>
              <OutlineBtn onClick={() => { setIsReg(false); clear(); }}>Masuk</OutlineBtn>
            </div>
            {/* Right sub-panel — visible when login mode, says "Bergabung!" with Daftar btn */}
            <div className="pal-ov-panel pal-ov-right">
              <div className="pal-ov-logo">
                <img src="/logo-palugada-baru.png" alt="Palugada" style={{ width:'70%', height:'70%', objectFit:'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.innerHTML='P'; }} />
              </div>
              <h3 className="pal-ov-title">Bergabung!</h3>
              <p className="pal-ov-desc">Belum punya akun? Daftar sekarang dan mulai kelola koperasi Anda secara digital.</p>
              <OutlineBtn onClick={() => { setIsReg(true); clear(); }}>Daftar</OutlineBtn>
            </div>
          </div>
        </div>
      </motion.div>

      <Styles />
    </div>
  );
}

/* ─────────────────────────── All CSS in one place ───────────────────────── */
function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      *, *::before, *::after { box-sizing: border-box; }

      .pal-bg {
        min-height: 100vh;
        display: flex; align-items: center; justify-content: center;
        background: #f0f4f0;
        padding: 24px 16px;
        font-family: 'Inter', sans-serif;
      }

      /* ── Card ── */
      .pal-card {
        position: relative;
        width: 100%;
        max-width: 900px;
        min-height: 580px;
        background: #fff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 24px 64px rgba(0,0,0,0.10);
      }

      /* ── Form boxes ── */
      .pal-form-box {
        position: absolute;
        top: 0;
        height: 100%;
        width: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.65s ease-in-out;
        overflow-y: auto;
      }

      .pal-login-box {
        left: 0;
        z-index: 2;
        opacity: 1;
        transform: translateX(0);
      }
      .pal-card.reg-active .pal-login-box {
        transform: translateX(100%);
        opacity: 0;
        z-index: 1;
      }

      .pal-reg-box {
        left: 0;
        z-index: 1;
        opacity: 0;
        transform: translateX(0);
      }
      .pal-card.reg-active .pal-reg-box {
        z-index: 5;
        opacity: 1;
        transform: translateX(100%);
        animation: __show 0.65s;
      }
      @keyframes __show {
        0%,49.99% { opacity:0; z-index:1; }
        50%,100%  { opacity:1; z-index:5; }
      }

      /* ── Overlay wrapper ── */
      .pal-overlay-wrap {
        position: absolute;
        top: 0;
        left: 50%;
        width: 50%;
        height: 100%;
        overflow: hidden;
        z-index: 100;
        transition: transform 0.65s ease-in-out;
      }
      .pal-card.reg-active .pal-overlay-wrap {
        transform: translateX(-100%);
      }

      /* ── Overlay inner (200% wide, holds two sub-panels) ── */
      .pal-overlay {
        background: linear-gradient(135deg,#10b981 0%,#059669 55%,#047857 100%);
        color: #fff;
        position: relative;
        left: -100%;
        width: 200%;
        height: 100%;
        transition: transform 0.65s ease-in-out;
        display: flex;
      }
      .pal-card.reg-active .pal-overlay {
        transform: translateX(50%);
      }

      /* ── Sub-panels ── */
      .pal-ov-panel {
        width: 50%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 36px;
        text-align: center;
        position: relative;
      }
      .pal-ov-left  { transition: transform 0.65s ease-in-out; transform: translateX(-15%); }
      .pal-ov-right { transition: transform 0.65s ease-in-out; transform: translateX(0); }
      .pal-card.reg-active .pal-ov-left  { transform: translateX(0); }
      .pal-card.reg-active .pal-ov-right { transform: translateX(15%); }

      /* decorative circles on overlay */
      .pal-ov-panel::before {
        content:''; position:absolute; top:-80px; right:-80px;
        width:240px; height:240px; border-radius:50%; background:rgba(255,255,255,0.09);
      }
      .pal-ov-panel::after {
        content:''; position:absolute; bottom:-60px; left:-60px;
        width:190px; height:190px; border-radius:50%; background:rgba(255,255,255,0.09);
      }

      .pal-ov-logo {
        width:58px; height:58px; border-radius:14px;
        background:#ffffff;
        display:flex; align-items:center; justify-content:center;
        font-size:22px; font-weight:900; color:#10b981;
        margin-bottom:20px; position:relative; z-index:1;
        box-shadow:0 8px 24px rgba(0,0,0,0.18);
        overflow:hidden;
      }
      .pal-ov-logo img { width:65%; height:65%; object-fit:contain; }
      .pal-ov-title { font-size:21px; font-weight:900; margin:0 0 10px; position:relative; z-index:1; }
      .pal-ov-desc  { font-size:13px; line-height:1.65; opacity:0.85; margin-bottom:24px; position:relative; z-index:1; }

      /* ── Form inner ── */
      .pal-form {
        width: 100%;
        max-width: 340px;
        display: flex;
        flex-direction: column;
        gap: 13px;
        padding: 32px 40px;
      }

      .pal-title { font-size:24px; font-weight:900; color:#111827; margin:0; text-align:center; }
      .pal-sub   { font-size:13px; color:#9ca3af; margin:0 0 4px; text-align:center; }

      /* ── Inputs ── */
      .pal-input {
        width:100%; padding:13px 16px; font-size:13px; font-family:'Inter',sans-serif;
        background:#f3f4f6; border:2px solid transparent; border-radius:12px;
        outline:none; transition:all 0.2s; color:#111827; display:block;
      }
      .pal-input:focus { border-color:#10b981; background:#fff; }
      .pal-input::placeholder { color:#d1d5db; opacity: 1; }
      .pal-eye {
        position:absolute; right:13px; top:50%; transform:translateY(-50%);
        background:none; border:none; cursor:pointer; color:#9ca3af; padding:3px;
        display:flex; align-items:center;
      }
      .pal-eye:hover { color:#059669; }

      .pal-otp {
        width:100%; padding:16px; font-size:22px; letter-spacing:0.5em;
        text-align:center; font-family:monospace;
        background:#f3f4f6; border:2px solid #e5e7eb; border-radius:12px; outline:none;
      }
      .pal-otp:focus { border-color:#10b981; }

      /* ── Buttons ── */
      .pal-btn-green {
        width:100%; padding:14px; border:none; border-radius:12px; cursor:pointer;
        background:linear-gradient(135deg,#10b981 0%,#059669 55%,#047857 100%);
        box-shadow:0 6px 24px rgba(5,150,105,0.35);
        color:#fff; font-size:13px; font-weight:700; letter-spacing:0.04em;
        font-family:'Inter',sans-serif; transition:all 0.2s;
      }
      .pal-btn-green:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 32px rgba(5,150,105,0.45); }
      .pal-btn-green:disabled { background:#d1d5db; box-shadow:none; cursor:not-allowed; }

      .pal-btn-outline {
        padding:11px 28px; border:2px solid rgba(255,255,255,0.85); border-radius:10px;
        background:transparent; color:#fff; font-size:12px; font-weight:700;
        letter-spacing:0.08em; text-transform:uppercase; cursor:pointer;
        font-family:'Inter',sans-serif; transition:all 0.2s;
      }
      .pal-btn-outline:hover { background:#fff; color:#059669; }

      .pal-btn-google {
        display:flex; align-items:center; gap:10px; width:100%; padding:12px 16px;
        background:#fff; border:2px solid #e5e7eb; border-radius:12px; cursor:pointer;
        font-size:13px; font-weight:600; color:#374151; font-family:'Inter',sans-serif;
        transition:border-color 0.2s;
      }
      .pal-btn-google:hover { border-color:#a7f3d0; }

      /* ── Misc ── */
      .pal-divider { display:flex; align-items:center; gap:10px; }
      .pal-divider-line { flex:1; height:1px; background:#f3f4f6; }
      .pal-divider-text { font-size:11px; color:#9ca3af; white-space:nowrap; }

      .pal-alert-err {
        padding:9px 13px; border-radius:10px; font-size:12px; font-weight:600;
        background:#fef2f2; color:#dc2626; border:1px solid #fecaca;
      }
      .pal-alert-ok {
        padding:9px 13px; border-radius:10px; font-size:12px; font-weight:600;
        background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0;
      }

      .pal-link {
        background:none; border:none; cursor:pointer; color:#059669;
        font-weight:700; font-family:'Inter',sans-serif; font-size:12px;
      }
      .pal-link:hover { color:#047857; }

      .pal-switch-mobile { font-size:12px; color:#9ca3af; text-align:center; margin:0; }

      .pal-back {
        display:flex; align-items:center; gap:6px; margin:20px auto 0;
        background:none; border:none; cursor:pointer; font-size:13px; color:#9ca3af;
        font-family:'Inter',sans-serif;
      }
      .pal-back:hover { color:#6b7280; }

      .pal-back-green {
        display:block; margin:18px auto 0; background:none; border:none;
        cursor:pointer; font-size:13px; font-weight:600; color:#059669;
        font-family:'Inter',sans-serif; text-align:center;
      }

      .pal-icon-circle {
        width:58px; height:58px; border-radius:14px;
        background:linear-gradient(135deg,#10b981,#047857);
        display:flex; align-items:center; justify-content:center;
        margin:0 auto 16px; box-shadow:0 6px 20px rgba(5,150,105,0.35);
      }

      .pal-card-sm {
        background:#fff; border-radius:22px; padding:40px;
        width:100%; max-width:400px; text-align:center;
        box-shadow:0 20px 60px rgba(0,0,0,0.08);
      }

      /* Mobile responsive */
      @media (max-width: 700px) {
        .pal-overlay-wrap { display:none !important; }
        .pal-form-box {
          position:static !important;
          width:100% !important;
          transform:none !important;
          opacity:1 !important;
          z-index:1 !important;
        }
        .pal-login-box { display:flex; }
        .pal-reg-box   { display:none; }
        .pal-card.reg-active .pal-login-box { display:none; }
        .pal-card.reg-active .pal-reg-box   { display:flex; }
        .pal-card { min-height:auto; }
        .pal-form { padding:28px 24px; }
      }
    `}</style>
  );
}