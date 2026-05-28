import jsPDF from 'jspdf';

const PAGE_W = 210;

// Fetch-based image loader — lebih reliable dari new Image()
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
  } catch {
    return '';
  }
};

export const addPDFHeader = async (
  doc: jsPDF,
  options: {
    reportId: string;
    title: string;
    subtitle?: string;
    accentColor?: [number, number, number];
    printedBy?: string;
  }
): Promise<number> => {
  const { title, subtitle, accentColor = [16, 185, 129], printedBy } = options;
  const [r, g, b] = accentColor;

  const [logoPalugada, logoUpb] = await Promise.all([
    loadImageAsBase64('/logo-palugada.png'),
    loadImageAsBase64('/logo-upb.png'),
  ]);

  // ── BACKGROUND PUTIH ────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_W, 46, 'F');

  // ── GARIS AKSEN ATAS (hijau) ─────────────────────────────────────────
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, PAGE_W, 3, 'F');

  // ── LOGO PALUGADA (kiri) ─────────────────────────────────────────────
  if (logoPalugada) {
    doc.addImage(logoPalugada, 'PNG', 8, 6, 26, 26);
  } else {
    doc.setFillColor(r, g, b);
    doc.roundedRect(8, 6, 26, 26, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('P', 21, 23, { align: 'center' });
  }

  // ── TENGAH: Nama + alamat ────────────────────────────────────────────
  const cx = PAGE_W / 2;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15); doc.setFont('helvetica', 'bold');
  doc.text('KOPERASI PALUGADA', cx, 13, { align: 'center' });

  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.setTextColor(r, g, b);
  doc.text('Sistem Manajemen Koperasi Digital', cx, 19, { align: 'center' });

  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text('Jl. Inspeksi Kalimalang No.1, Kab. Bekasi, Jawa Barat 17550', cx, 24.5, { align: 'center' });
  doc.text('Telp: (021) 1234-5678  |  Email: info@palugada.id  |  palugada-app.my.id', cx, 29.5, { align: 'center' });

  // ── LOGO UPB (kanan) ─────────────────────────────────────────────────
  if (logoUpb) {
    doc.addImage(logoUpb, 'PNG', PAGE_W - 36, 6, 26, 26);
  } else {
    doc.setFillColor(30, 58, 138);
    doc.roundedRect(PAGE_W - 36, 6, 26, 26, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('UPB', PAGE_W - 23, 21, { align: 'center' });
  }

  // ── GARIS PEMISAH ───────────────────────────────────────────────────
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.8);
  doc.line(8, 35, PAGE_W - 8, 35);

  // ── INFO BAR ─────────────────────────────────────────────────────────
  doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Universitas Pelita Bangsa  ·  Kelompok 7  ·  Pemrograman Web 2', cx, 40, { align: 'center' });

  // ── GARIS BAWAH HEADER ───────────────────────────────────────────────
  doc.setFillColor(226, 232, 240);
  doc.rect(0, 43, PAGE_W, 0.5, 'F');

  // ── JUDUL DOKUMEN ────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 54);

  const infoY = subtitle ? 59 : 54;
  if (subtitle) {
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(subtitle, 14, 59);
  }

  if (printedBy) {
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Dicetak: ${printedBy}  ·  ${dateStr}`, PAGE_W - 14, 54, { align: 'right' });
  }

  // Garis aksen bawah judul
  doc.setFillColor(r, g, b);
  doc.rect(14, 62, 40, 1, 'F');
  doc.setFillColor(226, 232, 240);
  doc.rect(54, 62.4, PAGE_W - 68, 0.4, 'F');

  return 67;
};

export const addPDFFooter = (
  doc: jsPDF,
  accentColor: [number, number, number] = [16, 185, 129]
): void => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const [r, g, b] = accentColor;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 281, PAGE_W, 16, 'F');
    doc.setFillColor(r, g, b);
    doc.rect(0, 281, PAGE_W, 0.8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(0, 281.8, PAGE_W, 281.8);

    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(`Halaman ${i} dari ${pageCount}`, 14, 290);
    doc.text('Dokumen resmi — Sistem PALUGADA · Universitas Pelita Bangsa', 105, 290, { align: 'center' });
    doc.setTextColor(r, g, b);
    doc.setFont('helvetica', 'bold');
    doc.text('PALUGADA © 2025', PAGE_W - 14, 290, { align: 'right' });
  }
};

export const addSignatureArea = (doc: jsPDF, startY: number): void => {
  const boxY = startY + 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, boxY, PAGE_W - 28, 36, 2, 2);

  const colW = (PAGE_W - 28) / 3;
  ['Ketua Koperasi', 'Bendahara', 'Anggota'].forEach((name, i) => {
    const cx = 14 + i * colW + colW / 2;
    if (i > 0) {
      doc.setDrawColor(226, 232, 240);
      doc.line(14 + i * colW, boxY + 2, 14 + i * colW, boxY + 34);
    }
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(name, cx, boxY + 8, { align: 'center' });
    doc.setDrawColor(100, 116, 139);
    doc.line(cx - 22, boxY + 26, cx + 22, boxY + 26);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('( _________________ )', cx, boxY + 32, { align: 'center' });
  });
};

export const fmt = (n: number): string => `Rp ${(n || 0).toLocaleString('id-ID')}`;

// Style tabel standar — dipakai semua halaman
export const tableStyles = (accentColor: [number, number, number] = [16, 185, 129]) => ({
  headStyles: {
    fillColor: accentColor,
    textColor: [255, 255, 255] as [number, number, number],
    fontSize: 8,
    fontStyle: 'bold' as const,
    halign: 'center' as const,
    cellPadding: 3,
    minCellHeight: 8,
    overflow: 'linebreak' as const,
  },
  bodyStyles: {
    fontSize: 8,
    cellPadding: 2.5,
    overflow: 'linebreak' as const,
    minCellHeight: 7,
  },
  alternateRowStyles: { fillColor: [240, 253, 244] as [number, number, number] },
  tableLineColor: [226, 232, 240] as [number, number, number],
  tableLineWidth: 0.3,
  margin: { left: 14, right: 14 },
});