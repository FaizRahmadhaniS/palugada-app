import React, { useState, useEffect, useMemo } from 'react';
import { useDialog } from '../components/Dialog';
import { Users, Search, Eye, X, Printer, ZoomIn, FileText, Trash2, Table } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import ImageViewer from '../components/ImageViewer';
import jsPDF from 'jspdf';
import { addPDFHeader, addPDFFooter, addSignatureArea } from '../utils/pdfHelper';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ReportPreviewModal from '../components/ReportPreviewModal';

export default function Members() {
  const { confirm: dlgConfirm, alert: dlgAlert } = useDialog();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'pdf' | 'excel'>('pdf');
  const [loadError, setLoadError] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [viewerData, setViewerData] = useState<{ src: string; title: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const { t } = useLanguage();

  const filteredMembers = useMemo(() =>
    members.filter(m => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.nik?.toLowerCase().includes(q);
      const matchStatus = !filterStatus || m.status === filterStatus;
      const matchType = !filterType || m.type === filterType;
      const joinDate = m.joinDate ? m.joinDate.split('T')[0] : '';
      const matchFrom = !filterDateFrom || joinDate >= filterDateFrom;
      const matchTo = !filterDateTo || joinDate <= filterDateTo;
      return matchSearch && matchStatus && matchType && matchFrom && matchTo;
    }),
    [members, searchTerm, filterStatus, filterType, filterDateFrom, filterDateTo]
  );

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async (retry = 0) => {
    setLoadError(false); setLoading(true);
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch('/api/members', { credentials: 'include', signal: ctrl.signal });
      clearTimeout(tid);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      if (retry < 1) { setTimeout(() => fetchMembers(retry + 1), 2000); }
      else { setMembers([]); setLoadError(true); setLoading(false); }
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!await dlgConfirm({ title: 'Hapus Anggota', message: `Yakin hapus "${name}"?`, type: 'confirm', confirmText: 'Ya, Hapus', cancelText: 'Batal' })) return;
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (data.success) setMembers(prev => prev.filter(m => m.id !== id));
    else dlgAlert({ title: 'Error', message: data.error || 'Gagal menghapus', type: 'error', confirmText: 'OK' });
  };

  // ── Print detail anggota — preview dulu ───────────────────────────────
  const [memberDetailPreview, setMemberDetailPreview] = useState<{ open: boolean; member: any | null }>({ open: false, member: null });

  const generateMemberDetailPDF = async (): Promise<jsPDF> => {
    const member = memberDetailPreview.member;
    if (!member) throw new Error('No member');
    const doc = new jsPDF();
    const color: [number, number, number] = [16, 185, 129];
    const startY = await addPDFHeader(doc, {
      reportId: `MEM-DTL-${Date.now()}`,
      title: 'Data Detail Anggota',
      subtitle: `Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      accentColor: color
    });
    autoTable(doc, {
      startY,
      body: [
        ['Nama Lengkap', member.name || '-'],
        ['ID Anggota', member.id || '-'],
        ['Email', member.email || '-'],
        ['No. HP', member.phone || '-'],
        ['NIK', member.nik || '-'],
        ['Alamat', member.address || '-'],
        ['Tipe Anggota', member.type || '-'],
        ['Status', member.status || '-'],
        ['Tanggal Bergabung', member.joinDate ? new Date(member.joinDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'],
        ['Total Simpanan', `Rp ${(member.total_savings || 0).toLocaleString('id-ID')}`],
        ['Total SHU', `Rp ${(member.total_shu || 0).toLocaleString('id-ID')}`],
      ],
      theme: 'grid',
      bodyStyles: { fontSize: 9, cellPadding: 3.5, textColor: [15, 23, 42] as [number, number, number] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 252] as [number, number, number], textColor: [15, 23, 42] as [number, number, number] },
        1: { textColor: [15, 23, 42] as [number, number, number] }
      },
      tableLineColor: [226, 232, 240] as [number, number, number],
      tableLineWidth: 0.3,
      margin: { left: 14, right: 14 },
    });
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    if (finalY < 240) addSignatureArea(doc, finalY + 10);
    addPDFFooter(doc, color);
    return doc;
  };

  const handlePrintMember = (member: any) => {
    setMemberDetailPreview({ open: true, member });
  };

  // ── Export PDF daftar (pakai filter) ─────────────────────────────────
  const generateMembersPDF = async (): Promise<jsPDF> => {
    const doc = new jsPDF();
    const filterInfo = [filterStatus && `Status: ${filterStatus}`, filterType && `Tipe: ${filterType}`].filter(Boolean).join(' · ');
    const startY = await addPDFHeader(doc, {
      reportId: `MEM-LIST-${Date.now()}`,
      title: 'Daftar Anggota Koperasi',
      subtitle: `Total: ${filteredMembers.length} anggota${filterInfo ? ' · Filter: ' + filterInfo : ''} · ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
    });
    autoTable(doc, {
      startY,
      head: [['NO', 'NAMA', 'EMAIL', 'TELEPON', 'NIK', 'TIPE', 'STATUS', 'TGL BERGABUNG']],
      body: filteredMembers.map((m, i) => [i + 1, m.name, m.email, m.phone || '-', m.nik || '-', m.type, m.status, m.joinDate ? new Date(m.joinDate).toLocaleDateString('id-ID') : '-']),
      headStyles: { fillColor: [16, 185, 129] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2.5, minCellHeight: 8 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2, minCellHeight: 6.5, textColor: [15, 23, 42] as [number, number, number] },
      alternateRowStyles: { fillColor: [240, 253, 244] as [number, number, number] },
      columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 6: { halign: 'center' }, 7: { halign: 'center' } },
      tableLineColor: [226, 232, 240] as [number, number, number], tableLineWidth: 0.3,
      margin: { left: 14, right: 14 }
    });
    addPDFFooter(doc);
    return doc;
  };

  // ── Export Excel ──────────────────────────────────────────────────────
  const doMembersExcelDownload = () => {
    const wsData = [
      ['NO', 'NAMA', 'EMAIL', 'TELEPON', 'NIK', 'ALAMAT', 'TIPE', 'STATUS', 'TGL BERGABUNG', 'TOTAL SIMPANAN', 'TOTAL SHU'],
      ...filteredMembers.map((m, i) => [
        i + 1, m.name, m.email, m.phone || '', m.nik || '', m.address || '',
        m.type, m.status,
        m.joinDate ? new Date(m.joinDate).toLocaleDateString('id-ID') : '',
        m.total_savings || 0, m.total_shu || 0
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Anggota');
    XLSX.writeFile(wb, `daftar-anggota-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const excelPreviewRows = filteredMembers.map((m, i) => [
    i + 1, m.name, m.email, m.phone || '-', m.nik || '-', m.type, m.status,
    m.joinDate ? new Date(m.joinDate).toLocaleDateString('id-ID') : '-'
  ]) as (string | number)[][];


  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"></div>
      <p className="text-slate-600 font-medium">Memuat data anggota...</p>
    </div>
  );

  if (loadError) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
      <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl">⚠️</div>
      <p className="font-bold text-lg">Gagal memuat data</p>
      <p className="text-sm text-slate-500 text-center max-w-sm">Server tidak merespons atau ada masalah koneksi.</p>
      <button onClick={() => fetchMembers()} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">Coba Lagi</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('members.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('members.desc')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Filter + Actions Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          {/* Row 1: Search + Status + Tipe + Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Cari nama / email / NIK..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Semua Status</option>
              <option value="Active">Aktif</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Tidak Aktif</option>
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Semua Tipe</option>
              <option value="Reguler">Reguler</option>
              <option value="Premium">Premium</option>
            </select>
            <span className="text-xs text-slate-500 dark:text-slate-400">{filteredMembers.length} dari {members.length} anggota</span>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => { setPreviewMode('excel'); setPreviewOpen(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium">
                <Table size={15} /> Excel
              </button>
              <button onClick={() => { setPreviewMode('pdf'); setPreviewOpen(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium">
                <FileText size={15} /> PDF
              </button>
            </div>
          </div>
          {/* Row 2: Date range filter */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tanggal Bergabung:</span>
            <div className="flex items-center gap-2">
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              <span className="text-slate-400 text-sm">—</span>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {(filterDateFrom || filterDateTo) && (
              <button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                ✕ Reset tanggal
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 sticky top-0">
              <tr>
                <th className="px-4 py-3 font-bold">{t('members.actions')}</th>
                <th className="px-4 py-3 font-bold">{t('members.name')}</th>
                <th className="px-4 py-3 font-bold">{t('members.email')}</th>
                <th className="px-4 py-3 font-bold text-center">{t('members.type')}</th>
                <th className="px-4 py-3 font-bold text-center">{t('members.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredMembers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Tidak ada anggota yang sesuai filter</td></tr>
              ) : filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={async () => {
                        try {
                          const res = await fetch(`/api/members/${member.id}`, { credentials: 'include' });
                          setSelectedMember(res.ok ? await res.json() : member);
                        } catch { setSelectedMember(member); }
                      }} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 rounded transition-colors">
                        <Eye size={12} /> {t('members.detail')}
                      </button>
                      <button onClick={() => handlePrintMember(member)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 rounded transition-colors">
                        <Printer size={12} />
                      </button>
                      <button onClick={() => handleDeleteMember(member.id, member.name)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 rounded transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase flex-shrink-0">
                        {member.name?.charAt(0) || 'M'}
                      </div>
                      <span className="truncate">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate text-xs">{member.email}</td>
                  <td className="px-4 py-3 text-center text-xs text-slate-600 dark:text-slate-300">{member.type}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${member.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : member.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('members.detail')}</h2>
                <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={24} /></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                {[
                  ['ID Anggota', selectedMember.id, 'font-mono'],
                  ['Nama Lengkap', selectedMember.name, 'font-medium'],
                  ['NIK', selectedMember.nik || '-'],
                  ['Email', selectedMember.email],
                  ['No. HP', selectedMember.phone || '-'],
                  ['Alamat', selectedMember.address || '-'],
                  ['Tipe', selectedMember.type],
                  ['Tanggal Bergabung', selectedMember.joinDate],
                ].map(([label, value, extra]) => (
                  <div key={label as string} className="grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="col-span-1 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
                    <div className={`col-span-2 text-sm text-slate-900 dark:text-white ${extra || ''}`}>{value}</div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="col-span-1 text-sm font-medium text-slate-500 dark:text-slate-400">Status</div>
                  <div className="col-span-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedMember.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : selectedMember.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{selectedMember.status}</span>
                  </div>
                </div>
                {/* Dokumen */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4">{t('members.documents')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[['ktp_url', t('members.ktp')], ['selfie_url', t('members.selfie')]].map(([key, label]) => (
                      <div key={key as string} className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">{label}</p>
                        {selectedMember[key as string] ? (
                          <div onClick={() => setViewerData({ src: selectedMember[key as string], title: `${label} - ${selectedMember.name}` })}
                            className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 cursor-zoom-in group relative">
                            <img src={selectedMember[key as string]} alt={label as string} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><ZoomIn size={24} className="text-white" /></div>
                          </div>
                        ) : (
                          <div className="aspect-video rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">Tidak ada</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                <button onClick={() => handlePrintMember(selectedMember)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium text-sm flex items-center gap-2">
                  <Printer size={16} /> {t('common.print')} PDF
                </button>
                <button onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 font-medium text-sm">
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {viewerData && <ImageViewer src={viewerData.src} title={viewerData.title} onClose={() => setViewerData(null)} />}

      <ReportPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Daftar Anggota Koperasi"
        generatePDF={previewMode === 'pdf' ? generateMembersPDF : undefined}
        pdfFilename={`daftar-anggota-${Date.now()}.pdf`}
        excelData={{
          headers: ['NO', 'NAMA', 'EMAIL', 'TELEPON', 'NIK', 'TIPE', 'STATUS', 'TGL BERGABUNG'],
          rows: excelPreviewRows,
          filename: `daftar-anggota-${new Date().toISOString().split('T')[0]}.xlsx`,
          onDownload: doMembersExcelDownload,
        }}
      />

      <ReportPreviewModal
        isOpen={memberDetailPreview.open}
        onClose={() => setMemberDetailPreview({ open: false, member: null })}
        title={`Detail Anggota — ${memberDetailPreview.member?.name || ''}`}
        generatePDF={memberDetailPreview.member ? generateMemberDetailPDF : undefined}
        pdfFilename={`anggota-${(memberDetailPreview.member?.name || 'detail').replace(/\s+/g, '-')}.pdf`}
      />
    </div>
  );
}