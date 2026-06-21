import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Shield, Sparkles, Wifi } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

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

const generateQR = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: 240,
      margin: 0,
      color: { dark: '#0f172a', light: '#ffffff00' },
      errorCorrectionLevel: 'M',
    });
  } catch { return ''; }
};

export default function DigitalCard({ user }: { user: any }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    const payload = JSON.stringify({
      id: user?.id || 'MEM-000',
      name: user?.name || '',
      type: 'palugada-member',
    });
    generateQR(payload).then(setQrDataUrl);
  }, [user?.id, user?.name]);

  const memberSince = new Date(user?.join_date || Date.now());
  const memberSinceYear = memberSince.getFullYear();
  const initials = (user?.name || 'A N')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ── Export PDF — desain kartu premium dengan gradient & efek glossy ──────
  const exportCardPDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 53.98] });
    const W = 85.6, H = 53.98;

    const [logoPalugada, logoUpb, selfie, qr] = await Promise.all([
      loadImageAsBase64('/logo-palugada-baru.png'),
      loadImageAsBase64('/logo-upb.png'),
      user?.selfie_url ? loadImageAsBase64(user.selfie_url) : Promise.resolve(''),
      generateQR(JSON.stringify({ id: user?.id || 'MEM-000', name: user?.name || '', type: 'palugada-member' })),
    ]);

    // ── Background gradasi dark navy → emerald (simulasi gradient halus dengan banyak layer) ──
    doc.setFillColor(8, 20, 24);
    doc.rect(0, 0, W, H, 'F');

    // Gradient diagonal halus: dari emerald gelap (kiri-atas) ke navy gelap (kanan-bawah)
    // Pakai banyak strip tipis horizontal dengan interpolasi warna agar terlihat menyatu
    const gradientSteps = 24;
    const colorTop: [number, number, number] = [6, 78, 59];     // emerald-800
    const colorBottom: [number, number, number] = [4, 20, 26];  // dark navy

    for (let i = 0; i < gradientSteps; i++) {
      const t = i / (gradientSteps - 1);
      const r = Math.round(colorTop[0] + (colorBottom[0] - colorTop[0]) * t);
      const g = Math.round(colorTop[1] + (colorBottom[1] - colorTop[1]) * t);
      const b = Math.round(colorTop[2] + (colorBottom[2] - colorTop[2]) * t);
      doc.setFillColor(r, g, b);
      const stripH = H / gradientSteps;
      doc.rect(0, i * stripH, W, stripH + 0.3, 'F'); // +0.3 overlap kecil agar tidak ada celah antar strip
    }

    // Pola dekoratif — lingkaran besar transparan pojok kanan atas
    doc.setFillColor(16, 185, 129);
    doc.setGState((doc as any).GState({ opacity: 0.15 }));
    doc.circle(W - 8, 6, 22, 'F');
    doc.setGState((doc as any).GState({ opacity: 1 }));

    // ══════════════════════════════════════════════════════════════════════
    // ROW 1 (y: 3–13): Logo kiri | Nama koperasi | Logo kanan
    // ══════════════════════════════════════════════════════════════════════
    const headerCY = 8;

    doc.setFillColor(255, 255, 255);
    doc.circle(8, headerCY, 4, 'F');
    if (logoPalugada) doc.addImage(logoPalugada, 'PNG', 5, headerCY - 3, 6, 6);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.2); doc.setFont('helvetica', 'bold');
    doc.text('KOPERASI PALUGADA', 14.5, headerCY - 0.8);
    doc.setFontSize(4.2); doc.setFont('helvetica', 'normal');
    doc.setTextColor(167, 243, 208);
    doc.text('APA MAU LU GW ADA', 14.5, headerCY + 2.5);

    doc.setFillColor(255, 255, 255);
    doc.circle(W - 8, headerCY, 4, 'F');
    if (logoUpb) doc.addImage(logoUpb, 'PNG', W - 11, headerCY - 3, 6, 6);

    // ══════════════════════════════════════════════════════════════════════
    // ROW 2 (y: 15–18): Chip dekoratif — full width, tidak tumpang tindih apapun
    // ══════════════════════════════════════════════════════════════════════
    doc.setFillColor(251, 191, 36);
    doc.roundedRect(5, 15, 8, 5.5, 1, 1, 'F');
    doc.setFillColor(217, 119, 6);
    doc.setLineWidth(0.12);
    doc.line(5, 16.8, 13, 16.8);
    doc.line(5, 18.3, 13, 18.3);

    // ══════════════════════════════════════════════════════════════════════
    // ROW 3 (y: 21–34): Avatar | Nama anggota — avatar mulai SETELAH chip selesai
    // ══════════════════════════════════════════════════════════════════════
    const avatarCX = 10, avatarCY = 28, avatarR = 5.2;
    const textStartX = avatarCX + avatarR + 3.5; // mulai teks setelah avatar + jarak aman

    if (selfie) {
      doc.saveGraphicsState();
      doc.circle(avatarCX, avatarCY, avatarR, 'S');
      (doc as any).clip();
      doc.discardPath();
      doc.addImage(selfie, 'JPEG', avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
      doc.restoreGraphicsState();
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.4);
      doc.circle(avatarCX, avatarCY, avatarR, 'S');
    } else {
      doc.setFillColor(52, 211, 153);
      doc.circle(avatarCX, avatarCY, avatarR, 'F');
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.4);
      doc.circle(avatarCX, avatarCY, avatarR, 'S');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7); doc.setFont('helvetica', 'bold');
      doc.text(initials, avatarCX, avatarCY + 1.2, { align: 'center' });
    }

    doc.setFontSize(4.5); doc.setFont('helvetica', 'bold');
    doc.setTextColor(110, 231, 183);
    doc.text('KARTU ANGGOTA RESMI', textStartX, avatarCY - 4.5);

    doc.setFontSize(9.5); doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const nameText = (user?.name || 'NAMA ANGGOTA').toUpperCase();
    const maxNameWidth = W - textStartX - 4;
    const fittedName = doc.splitTextToSize(nameText, maxNameWidth)[0]; // ambil baris pertama saja, cegah overflow
    doc.text(fittedName, textStartX, avatarCY);

    doc.setFontSize(4.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 250, 229);
    doc.text(`Anggota sejak ${memberSinceYear}`, textStartX, avatarCY + 4);

    // ══════════════════════════════════════════════════════════════════════
    // Garis pemisah — di bawah avatar, tidak overlap
    // ══════════════════════════════════════════════════════════════════════
    const dividerY = avatarCY + avatarR + 2.5;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.3);
    doc.line(5, dividerY, W - 5, dividerY);

    // ══════════════════════════════════════════════════════════════════════
    // ROW 4: NIK / ID Anggota (kiri) | QR Code (kanan) — sejajar, tidak overlap
    // ══════════════════════════════════════════════════════════════════════
    const infoStartY = dividerY + 5;

    doc.setFontSize(4.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(167, 243, 208);
    doc.text('NIK', 5, infoStartY);
    doc.text('ID ANGGOTA', 5, infoStartY + 5.5);

    doc.setFontSize(5.5); doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(user?.nik || '-', 5, infoStartY + 3.2);
    doc.text(String(user?.id || 'MEM-000').toUpperCase(), 5, infoStartY + 8.7);

    // QR Code kanan bawah — ukuran disesuaikan agar tidak keluar dari card
    if (qr) {
      const qrSize = 15;
      const qrX = W - qrSize - 5;
      const qrY = dividerY + 2;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrX, qrY, qrSize, qrSize, 1.2, 1.2, 'F');
      doc.addImage(qr, 'PNG', qrX + 0.7, qrY + 0.7, qrSize - 1.4, qrSize - 1.4);
    }

    doc.save(`kartu-anggota-${(user?.name || 'palugada').replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kartu Digital</h1>
          <p className="text-slate-500 dark:text-slate-400">Kartu identitas keanggotaan koperasi Anda</p>
        </div>
        <button onClick={exportCardPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25">
          <Download size={18} /> Unduh Kartu PDF
        </button>
      </div>

      {/* Preview Kartu — Premium Design */}
      <div className="flex justify-center p-6 sm:p-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800">
        <motion.div
          initial={{ rotateY: -8, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[440px]"
          style={{ aspectRatio: '85.6/53.98', perspective: 1000 }}
        >
          {/* Card */}
          <div
            className="relative w-full h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #042f2e 50%, #08141a 100%)',
              boxShadow: '0 25px 50px -12px rgba(5, 150, 105, 0.35), 0 0 0 1px rgba(16,185,129,0.1)',
            }}
          >
            {/* Decorative glow circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

            {/* Diagonal shine effect */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.06) 45%, transparent 60%)',
              }}
            />

            {/* Header */}
            <div className="relative flex items-center justify-between px-4 sm:px-5 pt-3.5 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                  <img src="/logo-palugada.png" alt="Logo" className="w-6 h-6 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div>
                  <p className="text-white font-black text-[11px] sm:text-xs tracking-tight leading-none">KOPERASI PALUGADA</p>
                  <p className="text-emerald-300/70 text-[6.5px] sm:text-[7px] tracking-[0.15em] mt-0.5">APA MAU LU GW ADA</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Wifi size={14} className="text-emerald-300/50 rotate-90" />
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                  <img src="/logo-upb.png" alt="UPB" className="w-6 h-6 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              </div>
            </div>

            {/* Chip decoration */}
            <div className="relative px-4 sm:px-5 pt-2">
              <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 relative overflow-hidden shadow-sm">
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-[1px] p-0.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-amber-700/30 rounded-[1px]" />
                  ))}
                </div>
              </div>
            </div>

            {/* Body: Avatar + Name + Info */}
            <div className="relative flex-1 px-4 sm:px-5 pt-2.5 flex items-start gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 ring-2 ring-white/20 flex items-center justify-center overflow-hidden shadow-lg" style={{ borderRadius: '9999px' }}>
                {user?.selfie_url ? (
                  <img
                    src={user.selfie_url}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '9999px', width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-white font-black text-sm sm:text-base">{initials}</span>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <Sparkles size={9} className="text-emerald-400" />
                  <p className="text-[8px] sm:text-[9px] font-bold text-emerald-300/90 uppercase tracking-[0.12em]">Kartu Anggota Resmi</p>
                </div>
                <p className="text-white font-black text-sm sm:text-lg tracking-wide uppercase leading-tight truncate">
                  {user?.name || 'Nama Anggota'}
                </p>
                <p className="text-[8px] sm:text-[9px] text-emerald-200/60 mt-0.5">
                  Anggota sejak {memberSinceYear}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="relative mx-4 sm:mx-5 mt-2.5 h-px bg-gradient-to-r from-emerald-500/40 via-emerald-400/20 to-transparent" />

            {/* Footer: NIK/ID + QR */}
            <div className="relative flex items-end justify-between px-4 sm:px-5 py-2.5 sm:py-3">
              <div className="space-y-1">
                <div>
                  <p className="text-[6.5px] sm:text-[7px] text-emerald-300/60 uppercase tracking-widest leading-none">NIK</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-white font-mono mt-0.5">{user?.nik || '-'}</p>
                </div>
                <div>
                  <p className="text-[6.5px] sm:text-[7px] text-emerald-300/60 uppercase tracking-widest leading-none">ID Anggota</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-white font-mono mt-0.5">{String(user?.id || 'MEM-000').toUpperCase()}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex-shrink-0 bg-white rounded-xl p-1.5 shadow-lg">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Info box */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-2xl text-sm flex gap-3 items-start border border-blue-100 dark:border-blue-900/40">
        <Shield size={18} className="mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold mb-1">Kartu identitas resmi keanggotaan</p>
          <p className="text-blue-700/80 dark:text-blue-300/80">
            Scan QR code untuk verifikasi cepat keanggotaan Anda. Unduh dan simpan kartu ini di perangkat untuk kemudahan akses kapan saja.
          </p>
        </div>
      </div>
    </motion.div>
  );
}