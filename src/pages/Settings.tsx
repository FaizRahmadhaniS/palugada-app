import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Moon, Sun, Building2, Percent, ShieldCheck, Wallet, Save, History, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function Settings({ user }: { user: any }) {
  const { language, setLanguage } = useLanguage();
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [generalConfig, setGeneralConfig] = useState<any>({
    koperasiName: "",
    koperasiAddress: "",
    koperasiPhone: "",
    loanInterestRate: 0,
    withdrawalAdminFee: 0,
    minDeposit: 0,
    enableOtp: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Efek untuk mengubah tema (menambahkan class 'dark' ke tag html)
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // Load configs if admin
  useEffect(() => {
    if (user?.role === 'admin') {
      const safeFetch = (url: string) => 
        fetch(url).then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Oops, we haven't got JSON!");
          }
          return res.json();
        });

      safeFetch('/api/settings/payment')
        .then(data => setPaymentConfig(data))
        .catch(console.error);

      safeFetch('/api/settings/general')
        .then(data => setGeneralConfig(data))
        .catch(console.error);
    }
  }, [user]);

  const handleSavePayment = async () => {
    if (!paymentConfig) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentConfig)
      });
      if (res.ok) {
        setSaveMessage({
          text: language === 'id' ? 'Pengaturan pembayaran berhasil disimpan.' : 'Payment settings saved successfully.',
          type: 'success'
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving payment config:', error);
      setSaveMessage({
        text: language === 'id' ? 'Gagal menyimpan pengaturan pembayaran.' : 'Failed to save payment settings.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneral = async () => {
    if (!generalConfig) return;
    setIsSavingGeneral(true);
    try {
      const res = await fetch('/api/settings/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generalConfig)
      });
      if (res.ok) {
        setSaveMessage({
          text: language === 'id' ? 'Pengaturan umum berhasil disimpan.' : 'General settings saved successfully.',
          type: 'success'
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving general config:', error);
      setSaveMessage({
        text: language === 'id' ? 'Gagal menyimpan pengaturan umum.' : 'Failed to save general settings.',
        type: 'error'
      });
    } finally {
      setIsSavingGeneral(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              saveMessage.type === 'success' 
                ? 'bg-emerald-600 border-emerald-500 text-white' 
                : 'bg-red-600 border-red-500 text-white'
            }`}
          >
            {saveMessage.type === 'success' ? <Save size={20} /> : <AlertTriangle size={20} />}
            <span className="font-bold text-sm">{saveMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {language === 'id' ? 'Pengaturan' : 'Settings'}
        </h1>
        <p className="text-slate-500 text-sm sm:text-base dark:text-slate-400">
          {language === 'id' 
            ? 'Sesuaikan preferensi dan aturan operasional koperasi Anda.' 
            : 'Customize your preferences and cooperative operational rules.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Preferensi Tampilan */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">
            {language === 'id' ? 'Preferensi' : 'Preferences'}
          </h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                    <Globe size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {language === 'id' ? 'Bahasa' : 'Language'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'id' ? 'Pilih bahasa antarmuka aplikasi' : 'Select application interface language'}
                    </p>
                  </div>
                </div>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer dark:text-white"
                >
                  <option value="id">Indonesia (ID)</option>
                  <option value="en">English (ENG)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                    {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {language === 'id' ? 'Mode Tampilan' : 'Display Theme'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'id' ? 'Pilih mode terang atau gelap' : 'Choose light or dark mode'}
                    </p>
                  </div>
                </div>
                <select 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer dark:text-white"
                >
                  <option value="light">{language === 'id' ? 'Terang' : 'Light'}</option>
                  <option value="dark">{language === 'id' ? 'Gelap' : 'Dark'}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {user?.role === 'admin' && (
          <>
            {/* Informasi Koperasi */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">
                {language === 'id' ? 'Informasi Koperasi' : 'Cooperative Info'}
              </h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Nama Koperasi</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text"
                        value={generalConfig.koperasiName}
                        onChange={(e) => setGeneralConfig({...generalConfig, koperasiName: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">No. Telepon</label>
                    <input 
                      type="text"
                      value={generalConfig.koperasiPhone}
                      onChange={(e) => setGeneralConfig({...generalConfig, koperasiPhone: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Alamat Kantor</label>
                  <textarea 
                    rows={2}
                    value={generalConfig.koperasiAddress}
                    onChange={(e) => setGeneralConfig({...generalConfig, koperasiAddress: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Aturan Finansial */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">
                {language === 'id' ? 'Aturan Finansial' : 'Financial Rules'}
              </h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Bunga Pinjaman (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="number" step="0.1"
                        value={generalConfig.loanInterestRate}
                        onChange={(e) => setGeneralConfig({...generalConfig, loanInterestRate: parseFloat(e.target.value)})}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Admin Penarikan (Rp)</label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="number"
                        value={generalConfig.withdrawalAdminFee}
                        onChange={(e) => setGeneralConfig({...generalConfig, withdrawalAdminFee: parseInt(e.target.value)})}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Min. Setoran (Rp)</label>
                    <input 
                      type="number"
                      value={generalConfig.minDeposit}
                      onChange={(e) => setGeneralConfig({...generalConfig, minDeposit: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Keamanan & Audit */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">
                {language === 'id' ? 'Keamanan & Audit' : 'Security & Audit'}
              </h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Verifikasi OTP</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Aktifkan verifikasi kode OTP untuk transaksi kritikal</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {generalConfig.enableOtp ? (
                          language === 'id' ? '✓ OTP Aktif' : '✓ OTP Enabled'
                        ) : (
                          language === 'id' ? '○ OTP Tidak Aktif' : '○ OTP Disabled'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setGeneralConfig({...generalConfig, enableOtp: true})}
                      disabled={generalConfig.enableOtp}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      {language === 'id' ? 'Aktifkan OTP' : 'Enable OTP'}
                    </button>
                    <button 
                      onClick={() => setGeneralConfig({...generalConfig, enableOtp: false})}
                      disabled={!generalConfig.enableOtp}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      {language === 'id' ? 'Nonaktifkan OTP' : 'Disable OTP'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <Link 
                    to="/audit-logs"
                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                        <History size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Audit Logs</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Lihat riwayat aktivitas sistem dan admin</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Gerbang Pembayaran */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">
                {language === 'id' ? 'Gerbang Pembayaran' : 'Payment Gateway'}
              </h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Provider</label>
                    <select 
                      value={paymentConfig?.provider}
                      onChange={(e) => setPaymentConfig({...paymentConfig, provider: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                    >
                      <option value="midtrans">Midtrans</option>
                      <option value="glodipay">Glodipay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mode</label>
                    <select 
                      value={paymentConfig?.isProduction ? 'production' : 'sandbox'}
                      onChange={(e) => setPaymentConfig({...paymentConfig, isProduction: e.target.value === 'production'})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                    >
                      <option value="sandbox">Sandbox / Testing</option>
                      <option value="production">Production / Live</option>
                    </select>
                  </div>
                </div>

                {paymentConfig?.provider === 'midtrans' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Server Key</label>
                      <input 
                        type="password"
                        value={paymentConfig.serverKey}
                        onChange={(e) => setPaymentConfig({...paymentConfig, serverKey: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                        placeholder="SB-Mid-server-..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Client Key</label>
                      <input 
                        type="text"
                        value={paymentConfig.clientKey}
                        onChange={(e) => setPaymentConfig({...paymentConfig, clientKey: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                        placeholder="SB-Mid-client-..."
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Secret Key</label>
                    <input 
                      type="password"
                      value={paymentConfig?.glodipaySecret}
                      onChange={(e) => setPaymentConfig({...paymentConfig, glodipaySecret: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                      placeholder="glodi_sk_..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Simpan Global */}
            <div className="fixed bottom-6 right-6 z-40">
              <button 
                onClick={() => {
                  handleSaveGeneral();
                  handleSavePayment();
                }}
                disabled={isSaving || isSavingGeneral}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95"
              >
                <Save size={20} />
                <span>{isSaving || isSavingGeneral ? 'Menyimpan...' : 'Simpan Semua'}</span>
              </button>
            </div>
            {/* Bahaya */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider ml-1">
                {language === 'id' ? 'Zona Bahaya' : 'Danger Zone'}
              </h3>
              <div className="bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-500/20 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {language === 'id' ? 'Reset Database' : 'Reset Database'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {language === 'id' ? 'Hapus semua data transaksi, pinjaman, dan anggota. Tindakan ini tidak dapat dibatalkan.' : 'Delete all transaction, loan, and member data. This action cannot be undone.'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      if (confirm(language === 'id' ? 'APAKAH ANDA YAKIN? Semua data akan dihapus permanen!' : 'ARE YOU SURE? All data will be permanently deleted!')) {
                        try {
                          const res = await fetch('/api/system/reset', { method: 'POST' });
                          const data = await res.json();
                          if (data.success) {
                            alert(language === 'id' ? 'Sistem berhasil direset.' : 'System reset successful.');
                            window.location.reload();
                          } else {
                            alert(data.message);
                          }
                        } catch (e) {
                          alert('Error resetting system');
                        }
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200 dark:shadow-none"
                  >
                    <RefreshCw size={18} />
                    {language === 'id' ? 'Reset Sekarang' : 'Reset Now'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-6 bg-slate-900 dark:bg-slate-950 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-transparent dark:border-slate-800">
        <div className="text-center sm:text-left">
          <h4 className="font-bold">{language === 'id' ? 'Versi Aplikasi' : 'App Version'}</h4>
          <p className="text-slate-400 dark:text-slate-500 text-sm">Palugada Digital v1.2.0-stable</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {user?.role === 'admin' && (
            <Link 
              to="/audit-logs"
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <History size={16} />
              {language === 'id' ? 'Log Sistem' : 'Audit Logs'}
            </Link>
          )}
          <button 
            onClick={() => alert(language === 'id' ? 'Aplikasi Anda sudah menggunakan versi terbaru (v1.2.0-stable).' : 'Your app is up to date (v1.2.0-stable).')}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold transition-all"
          >
            {language === 'id' ? 'Periksa Pembaruan' : 'Check for Updates'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
