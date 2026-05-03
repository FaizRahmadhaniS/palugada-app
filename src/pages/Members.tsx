import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Eye, X, Printer, CreditCard, Camera, ZoomIn, Download, FileText } from 'lucide-react';
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
              <div class="title">PALUGADA SIMPLE</div>
              <div class="subtitle">Formulir Pendaftaran Anggota Koperasi</div>
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
