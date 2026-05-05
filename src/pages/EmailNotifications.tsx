import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Bell, CheckCircle, AlertCircle, Settings, Send } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  enabled: boolean;
}

const emailTemplates: EmailTemplate[] = [
  {
    id: 'member_approved',
    name: 'Persetujuan Anggota',
    subject: 'Pendaftaran Anda Telah Disetujui',
    description: 'Dikirim ketika admin menyetujui pendaftaran anggota baru',
    enabled: true
  },
  {
    id: 'loan_approved',
    name: 'Persetujuan Pinjaman',
    subject: 'Pinjaman Anda Telah Disetujui',
    description: 'Dikirim ketika pinjaman anggota disetujui',
    enabled: true
  },
  {
    id: 'payment_reminder',
    name: 'Pengingat Pembayaran',
    subject: 'Pengingat Cicilan Bulanan Anda',
    description: 'Pengingat otomatis untuk pembayaran cicilan pinjaman',
    enabled: false
  },
  {
    id: 'shu_distribution',
    name: 'Distribusi SHU',
    subject: 'SHU Anda Telah Didistribusikan',
    description: 'Pemberitahuan ketika dividen SHU telah diterima',
    enabled: true
  },
  {
    id: 'monthly_report',
    name: 'Laporan Bulanan',
    subject: 'Laporan Keuangan Bulanan Anda',
    description: 'Laporan aktivitas dan transaksi setiap bulan',
    enabled: false
  },
  {
    id: 'withdrawal_process',
    name: 'Status Penarikan',
    subject: 'Status Penarikan Dana Anda',
    description: 'Konfirmasi dan status proses penarikan dana',
    enabled: true
  }
];

export default function EmailNotifications({ user }: { user: any }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(emailTemplates);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  const handleToggleTemplate = (id: string) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, enabled: !t.enabled } : t
    ));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Placeholder for saving email settings
      console.log('Saving email templates:', templates);
      alert('Pengaturan email berhasil disimpan!');
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      alert('Masukkan alamat email terlebih dahulu');
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch('/api/notifications/send-email', { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          subject: 'Email Test dari Palugada',
          message: 'Ini adalah email test untuk memverifikasi integrasi email Anda.',
          template: 'test'
        })
      });

      if (res.ok) {
        setTestSuccess(true);
        setTimeout(() => setTestSuccess(false), 3000);
        alert(`Email test telah dikirim ke ${testEmail}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal mengirim email test');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Email Notifications</h1>
        <p className="text-purple-100">Atur template email dan pengaturan pengiriman notifikasi</p>
      </motion.div>

      {/* Email Configuration */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Konfigurasi Email</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Provider</label>
            <select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>Gmail SMTP</option>
              <option>SendGrid</option>
              <option>Mailgun</option>
              <option>Custom SMTP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dari (From Address)</label>
            <input
              type="email"
              placeholder="noreply@palugada.co.id"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nama Pengirim</label>
            <input
              type="text"
              placeholder="Koperasi Palugada"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Email Templates */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Template Email</h2>
        
        <div className="space-y-3">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
                className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Test Email */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Test Email</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Masukkan email untuk test"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSendTestEmail}
            disabled={sendingTest}
            className="w-full sm:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={18} />
            {sendingTest ? 'Mengirim...' : 'Kirim Test'}
          </button>
        </div>

        {testSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400"
          >
            <CheckCircle size={18} />
            Email test telah dikirim!
          </motion.div>
        )}
      </motion.div>

      {/* Save Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </motion.div>

      {/* Info Box */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
        <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">Informasi</p>
          <p className="text-sm text-blue-600 dark:text-blue-300">Email integration memerlukan konfigurasi SMTP atau API key dari email provider Anda. Pastikan pengaturan sudah benar sebelum mengaktifkan notifikasi email.</p>
        </div>
      </motion.div>
    </div>
  );
}