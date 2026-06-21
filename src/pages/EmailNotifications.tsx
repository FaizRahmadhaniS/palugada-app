import React, { useState, useEffect } from 'react';
import { useDialog } from '../components/Dialog';
import { motion } from 'motion/react';
import { Mail, CheckCircle, AlertCircle, Send, Loader2, Eye, EyeOff } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  enabled: boolean;
}

const TEMPLATE_META: Omit<EmailTemplate, 'enabled'>[] = [
  { id: 'member_approved',    name: 'Persetujuan Anggota',     subject: 'Pendaftaran Anda Telah Disetujui',     description: 'Dikirim ketika admin menyetujui pendaftaran anggota baru' },
  { id: 'loan_approved',      name: 'Persetujuan Pinjaman',    subject: 'Pinjaman Anda Telah Disetujui',         description: 'Dikirim ketika pinjaman anggota disetujui' },
  { id: 'payment_reminder',   name: 'Pengingat Pembayaran',    subject: 'Pengingat Cicilan Bulanan Anda',        description: 'Pengingat otomatis untuk pembayaran cicilan pinjaman' },
  { id: 'shu_distribution',   name: 'Distribusi SHU',          subject: 'SHU Anda Telah Didistribusikan',        description: 'Pemberitahuan ketika dividen SHU telah diterima' },
  { id: 'monthly_report',     name: 'Laporan Bulanan',         subject: 'Laporan Keuangan Bulanan Anda',         description: 'Laporan aktivitas dan transaksi setiap bulan' },
  { id: 'withdrawal_process', name: 'Status Penarikan',        subject: 'Status Penarikan Dana Anda',            description: 'Konfirmasi dan status proses penarikan dana' },
];

interface EmailConfigState {
  provider: string;
  fromAddress: string;
  fromName: string;
  gmailUser: string;
  gmailAppPassword: string;
  hasAppPassword?: boolean;
  templates: { id: string; enabled: boolean }[];
}

export default function EmailNotifications({ user }: { user: any }) {
  const { alert: dlgAlert } = useDialog();

  const [config, setConfig] = useState<EmailConfigState>({
    provider: 'gmail',
    fromAddress: '',
    fromName: 'Koperasi Palugada',
    gmailUser: '',
    gmailAppPassword: '',
    templates: TEMPLATE_META.map(t => ({ id: t.id, enabled: true })),
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // ── Load existing config ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings/email', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setConfig({
            provider: data.provider || 'gmail',
            fromAddress: data.fromAddress || '',
            fromName: data.fromName || 'Koperasi Palugada',
            gmailUser: data.gmailUser || '',
            gmailAppPassword: data.gmailAppPassword || '',
            hasAppPassword: data.hasAppPassword || false,
            templates: data.templates?.length ? data.templates : TEMPLATE_META.map(t => ({ id: t.id, enabled: true })),
          });
        }
      } catch (err) {
        console.error('Gagal memuat pengaturan email:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const templates: EmailTemplate[] = TEMPLATE_META.map(meta => ({
    ...meta,
    enabled: config.templates.find(t => t.id === meta.id)?.enabled ?? true,
  }));

  const handleToggleTemplate = (id: string) => {
    setConfig(prev => ({
      ...prev,
      templates: prev.templates.some(t => t.id === id)
        ? prev.templates.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t)
        : [...prev.templates, { id, enabled: false }],
    }));
  };

  // ── Save settings (Bug Fix 2 & 3: benar-benar tersimpan ke server) ─────
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordTouched(false);
        dlgAlert({ title: 'Berhasil', message: data.message || 'Pengaturan email berhasil disimpan!', type: 'success', confirmText: 'OK' });
      } else {
        dlgAlert({ title: 'Gagal', message: data.message || 'Gagal menyimpan pengaturan', type: 'error', confirmText: 'OK' });
      }
    } catch (error) {
      dlgAlert({ title: 'Gagal', message: 'Tidak dapat terhubung ke server', type: 'error', confirmText: 'OK' });
    } finally {
      setSaving(false);
    }
  };

  // ── Send test email (Bug Fix 1 & 4: benar-benar terkirim ke alamat yang diketik) ──
  const handleSendTestEmail = async () => {
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      dlgAlert({ title: 'Perhatian', message: 'Masukkan alamat email yang valid', type: 'error', confirmText: 'OK' });
      return;
    }
    if (!config.gmailUser || (!config.gmailAppPassword && !config.hasAppPassword)) {
      dlgAlert({ title: 'Perhatian', message: 'Isi dan simpan Gmail User & App Password terlebih dahulu', type: 'error', confirmText: 'OK' });
      return;
    }

    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/notifications/send-test-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: testEmail }), // Bug Fix 4: kirim toEmail, bukan userId admin
      });
      const data = await res.json();
      setTestResult({ success: !!data.success, message: data.message || (data.success ? 'Email terkirim' : 'Gagal mengirim') });
      if (data.success) setTimeout(() => setTestResult(null), 5000);
    } catch (error) {
      setTestResult({ success: false, message: 'Tidak dapat terhubung ke server' });
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Email Notifications</h1>
        <p className="text-purple-100">Atur template email dan pengaturan pengiriman notifikasi</p>
      </motion.div>

      {/* Email Configuration */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Konfigurasi Email</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Gmail SMTP — gunakan App Password, bukan password akun biasa</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Provider</label>
            <select
              value={config.provider}
              onChange={e => setConfig({ ...config, provider: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="gmail">Gmail SMTP</option>
              <option value="sendgrid" disabled>SendGrid (belum tersedia)</option>
              <option value="mailgun" disabled>Mailgun (belum tersedia)</option>
              <option value="custom" disabled>Custom SMTP (belum tersedia)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gmail User (alamat pengirim)</label>
              <input
                type="email"
                placeholder="namakoperasi@gmail.com"
                value={config.gmailUser}
                onChange={e => setConfig({ ...config, gmailUser: e.target.value, fromAddress: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nama Pengirim</label>
              <input
                type="text"
                placeholder="Koperasi Palugada"
                value={config.fromName}
                onChange={e => setConfig({ ...config, fromName: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Gmail App Password
              {config.hasAppPassword && !passwordTouched && (
                <span className="ml-2 text-xs text-emerald-600 font-semibold">✓ Sudah diset</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="16 karakter, tanpa spasi"
                value={config.gmailAppPassword}
                onChange={e => { setConfig({ ...config, gmailAppPassword: e.target.value }); setPasswordTouched(true); }}
                className="w-full px-4 py-2 pr-10 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Dapatkan App Password di{' '}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">
                myaccount.google.com/apppasswords
              </a>{' '}
              (memerlukan 2-Step Verification aktif)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Email Templates */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Template Email</h2>

        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id}
              className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-600 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{template.name}</h3>
                  {template.enabled && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-semibold">
                      <CheckCircle size={12} /> Aktif
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{template.description}</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">Subject: {template.subject}</p>
              </div>
              <input
                type="checkbox"
                checked={template.enabled}
                onChange={() => handleToggleTemplate(template.id)}
                className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer flex-shrink-0 ml-4 mt-1"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Test Email */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Test Email</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Kirim email percobaan untuk memastikan konfigurasi SMTP berfungsi</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="alamat@email-tujuan.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSendTestEmail}
            disabled={sendingTest}
            className="w-full sm:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sendingTest ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {sendingTest ? 'Mengirim...' : 'Kirim Test'}
          </button>
        </div>

        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            }`}
          >
            {testResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {testResult.message}
          </motion.div>
        )}
      </motion.div>

      {/* Save Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </motion.div>

      {/* Info Box */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
        <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">Cara Mendapatkan Gmail App Password</p>
          <ol className="text-sm text-blue-600 dark:text-blue-300 list-decimal list-inside space-y-1">
            <li>Aktifkan 2-Step Verification di akun Google Anda</li>
            <li>Buka <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline">myaccount.google.com/apppasswords</a></li>
            <li>Buat App Password baru, pilih "Mail" sebagai jenis aplikasi</li>
            <li>Salin 16 karakter yang muncul (tanpa spasi) ke kolom App Password di atas</li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
}