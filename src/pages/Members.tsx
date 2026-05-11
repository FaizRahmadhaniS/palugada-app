import React, { useState, useEffect } from 'react';
import { useDialog } from '../components/Dialog';
import { Users, Search, Filter, Eye, X, Printer, CreditCard, Camera, ZoomIn, Download, FileText, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import ImageViewer from '../components/ImageViewer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';

const generateBarcode = (text: string) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, { format: 'CODE128', displayValue: false, height: 40, width: 2, margin: 0 });
  return canvas.toDataURL('image/png');
};

export default function Members() {
  const { confirm: dlgConfirm, alert: dlgAlert } = useDialog();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [viewerData, setViewerData] = useState<{src: string, title: string} | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async (retryCount = 0) => {
    setLoadError(false);
    setLoading(true);
    try {
      // Timeout 25 detik untuk handle Railway cold start
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const res = await fetch('/api/members', { credentials: 'include', signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setMembers(data);
      } else {
        setMembers([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching members (attempt ' + (retryCount + 1) + '):', error);
      // Auto-retry max 2 kali untuk handle cold start
      if (retryCount < 2) {
        setTimeout(() => fetchMembers(retryCount + 1), 2000);
      } else {
        setMembers([]);
        setLoadError(true);
        setLoading(false);
      }
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!await dlgConfirm({ title: 'Konfirmasi Hapus', message: `Yakin ingin menghapus anggota "${name}"? Data tidak dapat dikembalikan.`, type: 'confirm', confirmText: 'Ya, Hapus', cancelText: 'Batal' })) return;
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setMembers((prev: any[]) => prev.filter((m: any) => m.id !== id));
      } else {
        alert('Gagal menghapus anggota: ' + (data.error || 'Error'));
      }
    } catch {
      dlgAlert({ title: 'Perhatian', message: 'Terjadi kesalahan koneksi', type: 'error', confirmText: 'OK' });
    }
  };

  const handlePrintMember = (member: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Data Anggota - ${member.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; margin: 0; color: #334155; background-color: #f8fafc; }
            .container { max-width: 800px; margin: 40px auto; background: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px; text-align: center; }
            .title { font-size: 32px; font-weight: 800; margin-bottom: 8px; letter-spacing: 1px; }
            .subtitle { font-size: 16px; opacity: 0.9; font-weight: 500; }
            .content { padding: 40px; }
            .section-title { font-size: 18px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
            .row { display: flex; padding: 16px 0; border-bottom: 1px dashed #e2e8f0; align-items: center; }
            .row:last-child { border-bottom: none; }
            .label { font-weight: 600; width: 180px; flex-shrink: 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
            .value { flex-grow: 1; color: #0f172a; font-weight: 500; font-size: 16px; }
            .status-badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
            .status-active { background-color: #d1fae5; color: #047857; border: 1px solid #a7f3d0; }
            .status-pending { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
            .status-rejected { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
            .footer { text-align: center; padding: 24px; background-color: #f8fafc; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
            @media print {
              body { background-color: white; padding: 0; }
              .container { box-shadow: none; margin: 0; max-width: 100%; border-radius: 0; border: none; }
              .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .status-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:16px">
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MCA2MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyOCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjIpIi8+PHRleHQgeD0iMzAiIHk9IjM4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjMyIiBmb250LWZhbWlseT0iR2VvcmdpYSxzZXJpZiIgZm9udC13ZWlnaHQ9IjkwMCIgZmlsbD0id2hpdGUiPlA8L3RleHQ+PC9zdmc+" 
                     style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.15);padding:4px;flex-shrink:0" alt="Palugada" />
                <div style="flex:1;text-align:center">
                  <div class="title">PALUGADA</div>
                  <div class="subtitle">Formulir Data Anggota Koperasi</div>
                </div>
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADkCAMAAAAVb+kqAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAHyUExURQ8DfAACggACggACggACggACggACggACggICgQACggACggACggACggACggACggACggACggACggACggACggACggACggACggACggACggACggACggACggACggACggACggACguUhKeUhKeYhKeYhKeYhKQACguYhKeUhKeUhKeUhKQACguYhKQACguYhKeYhKQACguYhKeYhKeUhKeYhKeYhKeYhKeUhKeYhKeUhKeUgKeYhKeYhKeYhKeYhKeYgKeYhKeUhKeYhKeUhKQACguUhKQACguUhKeQgKQACguUhKQACggACguYhKeUhKeYhKQACguYhKeUhKeYhKeYhKeYhKeYhKQACguUhKQACguYhKQACggACggACggACguYhKQcIhQkLhx0ekBkbjxIUiwwOiA8RiRcZjT0+oF1fsGdotXN0u4OEwouMxoqLxn5/wGRls0dIpSIkk3d4vLe43NPU6vDw9/7+/vT0+t/g8MPD4pOUyk1PqB8gkePj8c/Q6L+/4MvL5ezs9vf4+y8wmaus1l9gsOfo9JeYzGprtikrlkpMppqbzsvL5i0umDM1m29wuI+QyE9Qqa+w2G5vuKyt1ru83ldYrdzc7rO02icolUNFozc4naOk0p+g0D9AoX+AwFJUqp6f0Fpbrnp7vjo8n////6dufkkAAABddFJOUwATVGU0I15DC77+3XTt6X72xIOTtNSjnsnjP/30+SsfJX6PtsEb1ypMbA+Xbr3JO8PjsPL2xhSkHRlgWETrEOgh3jtOU5lkDFqDS4raM6wvXmk40vX4qpWOztlqzZd8vG8AAAABYktHRKUuuUovAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH6QgRCyAWSE/lwwAAK1VJREFUeNrtffl/G8eRb/X0DKZQMwBmeg5g0APAq6xtLZPs5vRaL9cm603y1jn2iN/b3bc9IEzalCzZEi0SlGTrIKOIlmQ53sTWYSmJHecPfT/MCRCSKH8cElJY/sGkAAKYL6qrv/Wt6hqAAzuwAzuwAzuwAzuwAzuwAzuwAzuwAzuwAzuwAzuwAzuwA3vyjWmcc41zHQDA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" 
                     style="width:56px;height:56px;object-fit:contain;background:white;border-radius:50%;padding:3px;flex-shrink:0" alt="UPB" />
              </div>
            </div>
            <div class="content">
              <div class="section-title">Informasi Pribadi</div>
              <div class="row"><div class="label">ID Anggota</div><div class="value" style="font-family: monospace; color: #059669; font-size: 18px;">${member.id}</div></div>
              <div class="row"><div class="label">Nama Lengkap</div><div class="value" style="font-size: 18px;"><strong>${member.name}</strong></div></div>
              <div class="row"><div class="label">NIK</div><div class="value">${member.nik || '-'}</div></div>
              <div class="row"><div class="label">Email</div><div class="value">${member.email}</div></div>
              <div class="row"><div class="label">No. HP</div><div class="value">${member.phone ? `08${member.phone}` : '-'}</div></div>
              <div class="row"><div class="label">Alamat</div><div class="value">${member.address || '-'}</div></div>
              
              <div class="section-title" style="margin-top: 40px;">Status Keanggotaan</div>
              <div class="row"><div class="label">Tipe Anggota</div><div class="value">${member.type}</div></div>
              <div class="row">
                <div class="label">Status</div>
                <div class="value">
                  <span class="status-badge ${member.status === 'Active' ? 'status-active' : member.status === 'Pending' ? 'status-pending' : 'status-rejected'}">
                    ${member.status}
                  </span>
                </div>
              </div>
              <div class="row"><div class="label">Tanggal Daftar</div><div class="value">${member.joinDate}</div></div>
            </div>
            <div class="footer">
              Dicetak pada: ${new Date().toLocaleString('id-ID')} &bull; Sistem Informasi Koperasi Palugada Simple
            </div>
          </div>
          <script>
            window.onload = function() { setTimeout(function() { window.print(); }, 500); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const exportMembersPDF = () => {
    const doc = new jsPDF();
    const reportId = `MEM-${Date.now()}`;
    
    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('PALUGADA COOP', 14, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Koperasi Simpan Pinjam Masa Depan', 14, 32);
    doc.text('Jl. Modern No. 123, Jakarta Selatan', 14, 37);

    // Barcode
    const barcodeData = generateBarcode(reportId);
    doc.addImage(barcodeData, 'PNG', 140, 10, 55, 20);
    doc.setFontSize(8);
    doc.text(`REPORT ID: ${reportId}`, 140, 35);
    doc.text(`GENERATED: ${new Date().toLocaleString('id-ID')}`, 140, 40);

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('DAFTAR ANGGOTA KOPERASI', 14, 65);
    
    const tableData = members.map((m, index) => [
      index + 1,
      m.name,
      m.email,
      m.phone || '-',
      m.nik || '-',
      m.type,
      m.status,
      m.joinDate || new Date().toLocaleDateString('id-ID')
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['NO', 'NAMA', 'EMAIL', 'PHONE', 'NIK', 'TIPE', 'STATUS', 'TGL BERGABUNG']],
      body: tableData,
      headStyles: { 
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 }
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Halaman ${i} dari ${pageCount} - Total anggota: ${members.length}`, 105, 285, { align: 'center' });
    }

    doc.save(`daftar-anggota-${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-purple-600 dark:border-slate-800 dark:border-t-purple-500 animate-spin"></div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data anggota...</p>

      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl">⚠️</div>
        <p className="text-slate-900 dark:text-white font-bold text-lg">Gagal memuat data</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">Server tidak merespons. Mungkin sedang tidur (Railway free tier) atau ada masalah koneksi.</p>
        <button
          onClick={() => fetchMembers()}
          className="mt-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all active:scale-95"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('members.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('members.desc')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder={t('members.search')} 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button
            onClick={() => {
              // Generate CSV
              const headers = ['ID', 'Nama', 'Email', 'NIK', 'No. HP', 'Alamat', 'Tipe', 'Status', 'Tanggal Bergabung', 'Total Simpanan', 'Total SHU'];
              const rows = members.map(m => [
                m.id,
                m.name,
                m.email,
                m.nik || '',
                m.phone || '',
                m.address || '',
                m.type,
                m.status,
                m.joinDate,
                m.total_savings || 0,
                m.total_shu || 0
              ]);
              const csv = [headers, ...rows].map(row => row.map(cell => typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv; charset=utf-8;' });
              const link = document.createElement('a');
              const url = URL.createObjectURL(blob);
              link.setAttribute('href', url);
              link.setAttribute('download', `members_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Download size={18} />
            {t('members.download_csv')}
          </button>
          <button
            onClick={exportMembersPDF}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <FileText size={18} />
            {t('members.download_pdf')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 sticky top-0">
              <tr>
                <th className="px-3 sm:px-4 py-3 font-bold text-left">{t('members.actions')}</th>
                <th className="px-3 sm:px-4 py-3 font-bold">{t('members.name')}</th>
                <th className="px-3 sm:px-4 py-3 font-bold">{t('members.email')}</th>
                <th className="px-3 sm:px-4 py-3 font-bold text-center">{t('members.type')}</th>
                <th className="px-3 sm:px-4 py-3 font-bold text-center">{t('members.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-slate-500">{t('common.loading')}</td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-slate-500">{t('members.no_members')}</td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setSelectedMember(member)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded transition-colors"
                        >
                          <Eye size={12} />
                          {t('members.detail')}
                        </button>
                        <button 
                          onClick={() => handlePrintMember(member)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                          <Printer size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded transition-colors"
                          title="Hapus anggota"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase flex-shrink-0">
                          {member.name?.substring(0, 1) || 'M'}
                        </div>
                        <span className="truncate">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-slate-500 dark:text-slate-400 truncate text-xs sm:text-sm">{member.email}</td>
                    <td className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{member.type}</td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap ${
                        member.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        member.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('members.detail')}</h2>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="col-span-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t('members.id')}</div>
                  <div className="col-span-2 text-sm text-slate-900 dark:text-white font-mono">{selectedMember.id}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="col-span-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t('members.full_name')}</div>
                  <div className="col-span-2 text-sm text-slate-900 dark:text-white font-medium">{selectedMember.name}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="col-span-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t('members.nik')}</div>
                  <div className="col-span-2 text-sm text-slate-900 dark:text-white">{selectedMember.nik || '-'}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="col-span-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t('members.email')}</div>
                  <div className="col-span-2 text-sm text-slate-900 dark:text-white">{selectedMember.email}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="col-span-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t('members.phone')}</div>
                  <div className="col-span-2 text-sm text-slate-900 dark:text-white">{selectedMember.phone ? `08${selectedMember.phone}` : '-'}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="col-span-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t('members.address')}</div>
                  <div className="col-span-2 text-sm text-slate-900 dark:text-white">{selectedMember.address || '-'}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="col-span-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t('members.status')}</div>
                  <div className="col-span-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      selectedMember.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      selectedMember.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {selectedMember.status}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 text-sm font-medium text-slate-500 dark:text-slate-400">{t('members.join_date')}</div>
                  <div className="col-span-2 text-sm text-slate-900 dark:text-white">{selectedMember.joinDate}</div>
                </div>

                {/* Dokumen Section */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4">{t('members.documents')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('members.ktp')}</p>
                      {selectedMember.ktp_url ? (
                        <div 
                          onClick={() => setViewerData({ src: selectedMember.ktp_url, title: `KTP - ${selectedMember.name}` })}
                          className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-zoom-in group relative"
                        >
                          <img 
                            src={selectedMember.ktp_url} 
                            alt="KTP" 
                            className="w-full h-full object-contain" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ZoomIn size={24} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs">
                          Tidak ada
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('members.selfie')}</p>
                      {selectedMember.selfie_url ? (
                        <div 
                          onClick={() => setViewerData({ src: selectedMember.selfie_url, title: `${t('members.selfie')} - ${selectedMember.name}` })}
                          className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-zoom-in group relative"
                        >
                          <img 
                            src={selectedMember.selfie_url} 
                            alt={t('members.selfie')} 
                            className="w-full h-full object-contain" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ZoomIn size={24} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs">
                          {t('members.no_data')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                <button 
                  onClick={() => handlePrintMember(selectedMember)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center gap-2"
                >
                  <Printer size={16} />
                  {t('common.print')} PDF
                </button>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Viewer Overlay */}
      {viewerData && (
        <ImageViewer 
          src={viewerData.src} 
          title={viewerData.title} 
          onClose={() => setViewerData(null)} 
        />
      )}
    </div>
  );
}