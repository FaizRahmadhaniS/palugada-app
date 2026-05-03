import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, MapPin, CreditCard, Lock, Save, Camera, CheckCircle } from 'lucide-react';
import { cn } from '../types';

export default function Profile({ user, onUpdate }: { user: any, onUpdate: (user: any) => void }) {
  const [name, setName] = useState(user?.name || '');
  const [nik, setNik] = useState(user?.nik || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [password, setPassword] = useState('');
  const [selfieUrl, setSelfieUrl] = useState(user?.selfie_url || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setSelfieUrl(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (nik && nik.length !== 16) {
      setError('NIK harus berisi tepat 16 digit angka');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nik, phone, address, password: password || undefined, selfie_url: selfieUrl })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Profil berhasil diperbarui');
        onUpdate(data.user);
        setPassword('');
      } else {
        setError(data.message || 'Gagal memperbarui profil');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <div className="p-6 lg:p-8 border-b border-slate-200 dark:border-slate-800 flex items-center gap-6">
          <div className="relative group">
            <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-3xl uppercase overflow-hidden">
              {selfieUrl ? (
                <img src={selfieUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.substring(0, 2) || 'US'
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors shadow-sm"
              title="Ubah Foto Profil"
            >
              <Camera size={14} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profil Saya</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          {message && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold rounded-xl border border-emerald-100 dark:border-emerald-500/20">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl border border-red-100 dark:border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email (Tidak dapat diubah)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                    value={user?.email || ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">NIK {user?.status === 'active' && '(Terverifikasi)'}</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    maxLength={16}
                    disabled={user?.status === 'active'}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all",
                      user?.status === 'active' ? "bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed" : "bg-slate-50 dark:bg-slate-800"
                    )}
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">No. HP</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="tel" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Alamat</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                  <textarea 
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all resize-none"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Ubah Password (Opsional)</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Kosongkan jika tidak ingin mengubah password.</p>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    placeholder="Password Baru"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save size={18} />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Security Settings Section for 2FA */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-8"
      >
        <div className="p-6 lg:p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Keamanan & 2FA</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola metode Two-Factor Authentication</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Lock size={24} />
          </div>
        </div>
        <div className="p-6 lg:p-8 space-y-6">
          <TwoFactorSetup isEnabled={user?.is_2fa_enabled} onUpdate={onUpdate} userEmail={user?.email} />
        </div>
      </motion.div>
    </div>
  );
}

// Sub-component for handling 2FA setup to keep the main component clean
function TwoFactorSetup({ isEnabled, onUpdate, userEmail }: { isEnabled?: boolean, onUpdate: (user: any) => void, userEmail?: string }) {
  const [setupMode, setSetupMode] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const startSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setQrCode(data.qrCode);
        setSetupMode(true);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal memulai setup 2FA' });
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: setupToken }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setSetupMode(false);
        // Refresh user info
        fetch('/api/auth/me', { credentials: 'include' }).then(res => res.json()).then(data => data.user && onUpdate(data.user));
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal memverifikasi token' });
    } finally {
      setLoading(false);
    }
  };

  const [disableLoading, setDisableLoading] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const disable2FA = async () => {
    if (!userEmail) return;
    setDisableLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/reset-emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '2FA berhasil dinonaktifkan.' });
        setShowDisableConfirm(false);
        // Refresh user info
        fetch('/api/auth/me', { credentials: 'include' })
          .then(res => res.json())
          .then(d => d.user && onUpdate(d.user));
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal menonaktifkan 2FA' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menonaktifkan 2FA' });
    } finally {
      setDisableLoading(false);
    }
  };

  if (isEnabled) {
    return (
      <div className="space-y-4">
        {message.text && (
          <div className={`p-4 text-sm font-medium rounded-xl border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800 dark:text-emerald-400">Google Authenticator Aktif</h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">Akun Anda dilindungi dengan autentikator eksternal.</p>
            </div>
          </div>
          {!showDisableConfirm ? (
            <button
              onClick={() => setShowDisableConfirm(true)}
              className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 dark:bg-slate-800 dark:hover:bg-red-900/20 dark:border-red-900/40 text-sm font-semibold rounded-xl transition-all whitespace-nowrap self-start sm:self-auto"
            >
              Nonaktifkan
            </button>
          ) : (
            <div className="flex gap-2 self-start sm:self-auto">
              <button
                onClick={() => setShowDisableConfirm(false)}
                disabled={disableLoading}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={disable2FA}
                disabled={disableLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {disableLoading ? 'Memproses...' : 'Ya, Nonaktifkan'}
              </button>
            </div>
          )}
        </div>

        {showDisableConfirm && (
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900/40 rounded-xl text-sm text-amber-800 dark:text-amber-300">
            ⚠️ <strong>Peringatan:</strong> Menonaktifkan 2FA akan menurunkan tingkat keamanan akun Anda. Akun hanya akan dilindungi dengan password saja.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message.text && (
        <div className={`p-4 text-sm font-medium rounded-xl border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
          {message.text}
        </div>
      )}

      {!setupMode ? (
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Gunakan Google Authenticator</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">Tingkatkan keamanan akun Anda dengan aplikasi autentikator. Metode ini lebih aman dan praktis dibandingkan OTP Email.</p>
          </div>
          <button
            onClick={startSetup}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors whitespace-nowrap self-stretch sm:self-auto"
          >
            Mulai Setup 2FA
          </button>
        </div>
      ) : (
        <form onSubmit={verifySetup} className="p-6 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row gap-8 items-center jutsify-center">
            <div className="flex-shrink-0 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
              {qrCode ? <img src={qrCode} alt="QR Code" className="w-48 h-48" /> : <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg" />}
            </div>
            <div className="space-y-4 flex-1 w-full text-center md:text-left">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Scan Barcode Ini</h3>
              <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside text-left">
                <li>Buka aplikasi <b>Google Authenticator</b> atau <b>Authy</b>.</li>
                <li>Pilih menu <b>Scan a QR code</b> dan arahkan kamera.</li>
                <li>Masukkan 6 digit angka yang muncul pada aplikasi di bawah ini.</li>
              </ol>
              
              <div className="pt-2">
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Masukkan 6 Digit Token"
                  className="w-full md:max-w-xs px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-blue-500 dark:text-white"
                  value={setupToken}
                  onChange={(e) => setSetupToken(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSetupMode(false)}
              className="px-5 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || setupToken.length !== 6}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi & Aktifkan'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}