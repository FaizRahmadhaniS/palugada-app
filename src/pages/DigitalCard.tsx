import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, Download, Shield } from 'lucide-react';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

const generateBarcode = (text: string) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, { format: 'CODE128', displayValue: false, height: 40, width: 2, margin: 0 });
  return canvas.toDataURL('image/png');
};

const loadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch { return ''; }
};

export default function DigitalCard({ user }: { user: any }) {
  const exportCardPDF = async () => {
    // Kartu ukuran CR80 (85.6 x 53.98 mm) landscape
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 53.98] });
    const W = 85.6, H = 53.98;

    const [logoPalugada, logoUpb] = await Promise.all([
      loadImageAsBase64('/logo-palugada.png'),
      loadImageAsBase64('/logo-upb.png'),
    ]);

    // Background putih
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');

    // Stripe atas hijau
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, W, 14, 'F');

    // Accent stripe kiri
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 2.5, H, 'F');

    // Logo Palugada di stripe atas (kiri)
    if (logoPalugada) {
      doc.addImage(logoPalugada, 'PNG', 4, 1, 11, 11);
    }

    // Nama koperasi di tengah atas
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9.5); doc.setFont('helvetica', 'bold');
    doc.text('KOPERASI PALUGADA', W / 2, 7, { align: 'center' });
    doc.setFontSize(5.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 250, 229);
    doc.text('Sistem Manajemen Koperasi Digital', W / 2, 11, { align: 'center' });

    // Logo UPB di kanan atas
    if (logoUpb) {
      doc.addImage(logoUpb, 'PNG', W - 16, 1, 11, 11);
    }

    // Garis pemisah
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(4, 17, W - 4, 17);

    // Label KARTU ANGGOTA
    doc.setFontSize(5.5); doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('KARTU ANGGOTA', 6, 21);

    // Nama anggota
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text((user.name || 'NAMA ANGGOTA').toUpperCase(), 6, 28);

    // Detail info
    doc.setFontSize(6); doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`NIK: ${user.nik || '-'}`, 6, 33);
    doc.text(`Bergabung: ${new Date(user.join_date || Date.now()).toLocaleDateString('id-ID')}`, 6, 37);
    doc.text(`Email: ${user.email || '-'}`, 6, 41);

    // Barcode di kanan
    const bc = generateBarcode(user.id || 'MEM-000');
    doc.addImage(bc, 'PNG', 52, 20, 28, 14);
    doc.setFontSize(4.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(user.id || 'MEM-000', 66, 36, { align: 'center' });

    // Footer strip
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 46, W, H - 46, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 46, W, 0.5, 'F');
    doc.setFontSize(4.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Universitas Pelita Bangsa  ·  Kelompok 7  ·  Pemrograman Web 2', W / 2, 50, { align: 'center' });
    doc.text('palugada-app.my.id', W / 2, 53, { align: 'center' });

    doc.save(`kartu-anggota-${user.name || 'palugada'}.pdf`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kartu Digital</h1>
          <p className="text-slate-500 dark:text-slate-400">Kartu identitas keanggotaan koperasi Anda</p>
        </div>
        <button onClick={exportCardPDF}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none">
          <Download size={18} /> Unduh Kartu PDF
        </button>
      </div>

      {/* Preview Kartu */}
      <div className="flex justify-center p-8 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full max-w-[420px]" style={{ aspectRatio: '85.6/53.98' }}>
          {/* Card */}
          <div className="w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            {/* Header strip */}
            <div className="flex items-center justify-between px-4 py-2" style={{ background: '#10b981', minHeight: 48 }}>
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <img src="/logo-palugada.png" alt="Logo" className="w-8 h-8 object-contain" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              </div>
              <div className="text-center flex-1">
                <p className="text-white font-black text-sm tracking-tight">KOPERASI PALUGADA</p>
                <p className="text-emerald-100 text-[9px] tracking-widest">Sistem Manajemen Koperasi Digital</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <img src="/logo-upb.png" alt="UPB" className="w-8 h-8 object-contain" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex items-stretch px-4 py-3" style={{ background: '#fff' }}>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Kartu Anggota</p>
                  <p className="text-slate-900 font-black text-base tracking-wide uppercase leading-tight">{user.name || 'Nama Anggota'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-500">NIK: <span className="font-bold text-slate-700">{user.nik || '-'}</span></p>
                  <p className="text-[10px] text-slate-500">Bergabung: <span className="font-bold text-slate-700">{new Date(user.join_date || Date.now()).toLocaleDateString('id-ID')}</span></p>
                </div>
              </div>
              {/* Barcode */}
              <div className="flex flex-col items-center justify-center ml-4 bg-white border border-slate-100 rounded-xl px-2 py-1.5">
                <img src={generateBarcode(user.id || 'MEM-000')} alt="Barcode" className="h-10 w-24 object-contain" />
                <p className="text-[7px] text-slate-400 font-mono mt-0.5 text-center max-w-[96px] truncate">{user.id || 'MEM-000'}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-1.5 text-center" style={{ background: '#f8fafc', borderTop: '0.5px solid #e2e8f0' }}>
              <p className="text-[8px] text-slate-400">Universitas Pelita Bangsa · Kelompok 7 · palugada-app.my.id</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-2xl text-sm flex gap-3 items-start">
        <Shield size={18} className="mt-0.5 flex-shrink-0" />
        <p>Kartu digital ini dapat digunakan sebagai bukti identitas keanggotaan Anda. Unduh dan simpan di perangkat Anda untuk kemudahan akses.</p>
      </div>
    </motion.div>
  );
}