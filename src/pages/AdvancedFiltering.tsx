import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Download, RotateCcw } from 'lucide-react';
import ReportPreviewModal from '../components/ReportPreviewModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addPDFHeader, addPDFFooter } from '../utils/pdfHelper';

const fmt = (n: number) => n ? `Rp ${n.toLocaleString('id-ID')}` : '-';

interface FilterState {
  type: 'members' | 'loans' | 'savings';
  search: string;
  status: string;
  memberType: string;
  minAmount: string;
  maxAmount: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function AdvancedFiltering({ user }: { user: any }) {
  const [filters, setFilters] = useState<FilterState>({
    type: 'members', search: '', status: '', memberType: '',
    minAmount: '', maxAmount: '', sortBy: 'name', sortOrder: 'asc'
  });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [afPreviewOpen, setAfPreviewOpen] = useState(false);

  // ── PDF Generator ─────────────────────────────────────────────────────
  const generateFilterPDF = async (): Promise<jsPDF> => {
    const doc = new jsPDF();
    const typeLabel = filters.type === 'members' ? 'Anggota' : filters.type === 'loans' ? 'Pinjaman' : 'Simpanan';
    const startY = await addPDFHeader(doc, {
      reportId: `FILTER-${Date.now()}`,
      title: `Hasil Filter Lanjutan — ${typeLabel}`,
      subtitle: `Total: ${results.length} data · ${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}`,
      printedBy: user?.name,
    });
    const heads = filters.type === 'members'
      ? [['NO','NAMA','EMAIL','STATUS','TIPE','TOTAL SIMPANAN']]
      : filters.type === 'loans'
        ? [['NO','ANGGOTA','JUMLAH','BUNGA','STATUS','TUJUAN']]
        : [['NO','ANGGOTA','JUMLAH','JENIS','STATUS','TANGGAL']];
    const body = results.map((item, i) => {
      if (filters.type === 'members')
        return [i+1, item.name||'-', item.email||'-', item.status||'-', item.type||'-', fmt(item.total_savings)];
      if (filters.type === 'loans')
        return [i+1, item.member_name||'-', fmt(item.amount), `${item.interest_rate||0}%`, item.status||'-', item.purpose||'-'];
      return [i+1, item.member_name||'-', fmt(item.amount), item.type||'-', item.status||'-', item.date ? new Date(item.date).toLocaleDateString('id-ID') : '-'];
    });
    autoTable(doc, {
      startY, head: heads, body,
      headStyles: { fillColor:[99,102,241] as [number,number,number], textColor:[255,255,255] as [number,number,number], fontSize:8, fontStyle:'bold', halign:'center', cellPadding:2.5 },
      bodyStyles: { fontSize:8, cellPadding:2, textColor:[15,23,42] as [number,number,number] },
      alternateRowStyles: { fillColor:[240,240,255] as [number,number,number] },
      columnStyles: { 0: { halign:'center', cellWidth:10 } },
      tableLineColor:[226,232,240] as [number,number,number], tableLineWidth:0.3,
      margin: { left:14, right:14 }
    });
    addPDFFooter(doc);
    return doc;
  };

  // ── Fetch data ────────────────────────────────────────────────────────
  const applyFilters = async (f?: FilterState) => {
    const ff = f || filters;
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (ff.search)     params.append('search', ff.search);
      if (ff.sortBy)     params.append('sortBy', ff.sortBy);
      if (ff.sortOrder)  params.append('order', ff.sortOrder);

      let endpoint = '';
      if (ff.type === 'members') {
        if (ff.status)     params.append('status', ff.status);
        if (ff.memberType) params.append('type', ff.memberType);
        endpoint = `/api/members/filter?${params}`;
      } else if (ff.type === 'loans') {
        if (ff.status)     params.append('status', ff.status);
        if (ff.minAmount)  params.append('minAmount', ff.minAmount);
        if (ff.maxAmount)  params.append('maxAmount', ff.maxAmount);
        endpoint = `/api/loans/filter?${params}`;
      } else {
        if (ff.status)     params.append('status', ff.status);
        if (ff.minAmount)  params.append('minAmount', ff.minAmount);
        if (ff.maxAmount)  params.append('maxAmount', ff.maxAmount);
        endpoint = `/api/savings/filter?${params}`;
      }

      // PENTING: credentials:'include' agar session cookie ikut terkirim
      const res = await fetch(endpoint, { credentials: 'include' });
      if (!res.ok) {
        setErrorMsg(`Gagal memuat data (${res.status})`);
        setResults([]);
        return;
      }
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { applyFilters(); }, [filters.type]);

  const resetFilters = () => {
    const def: FilterState = { type: filters.type, search:'', status:'', memberType:'', minAmount:'', maxAmount:'', sortBy:'name', sortOrder:'asc' };
    setFilters(def);
    applyFilters(def);
  };

  const memberStatuses = ['Pending', 'Aktif', 'Ditolak'];
  const memberTypes    = ['Reguler', 'Premium'];
  const loanStatuses   = ['pending', 'approved', 'rejected', 'paid_off'];
  const savingsStatuses = ['pending', 'success', 'failed'];

  // ── Preview rows ─────────────────────────────────────────────────────
  const previewRows: (string|number)[][] = results.map((item, i) => {
    if (filters.type === 'members')
      return [i+1, item.name||'-', item.email||'-', item.status||'-', item.type||'-', fmt(item.total_savings)];
    if (filters.type === 'loans')
      return [i+1, item.member_name||'-', fmt(item.amount), `${item.interest_rate||0}%`, item.status||'-', item.purpose||'-'];
    return [i+1, item.member_name||'-', fmt(item.amount), item.type||'-', item.status||'-',
      item.date ? new Date(item.date).toLocaleDateString('id-ID') : '-'];
  });

  const previewHeaders = filters.type === 'members'
    ? ['NO','NAMA','EMAIL','STATUS','TIPE','TOTAL SIMPANAN']
    : filters.type === 'loans'
      ? ['NO','ANGGOTA','JUMLAH','BUNGA','STATUS','TUJUAN']
      : ['NO','ANGGOTA','JUMLAH','JENIS','STATUS','TANGGAL'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Filter Lanjutan</h1>
        <p className="text-indigo-100">Cari dan filter data dengan kriteria yang lebih detail</p>
      </motion.div>

      {/* Filter Panel */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">

        {/* Tipe Data */}
        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-3">Tipe Data</p>
          <div className="flex flex-wrap gap-2">
            {(['members','loans','savings'] as const).map(type => (
              <button key={type} onClick={() => setFilters({ ...filters, type, search:'', status:'' })}
                className={`flex-1 min-w-[90px] px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                  filters.type === type ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-indigo-200'
                }`}>
                {type === 'members' ? 'Anggota' : type === 'loans' ? 'Pinjaman' : 'Simpanan'}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pencarian</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text"
              placeholder={filters.type === 'members' ? 'Cari nama, email, NIK...' : 'Cari nama anggota...'}
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Semua Status</option>
            {filters.type === 'members'  && memberStatuses.map(s  => <option key={s} value={s}>{s}</option>)}
            {filters.type === 'loans'    && loanStatuses.map(s    => <option key={s} value={s}>{s}</option>)}
            {filters.type === 'savings'  && savingsStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Member Type */}
        {filters.type === 'members' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipe Anggota</label>
            <select value={filters.memberType} onChange={e => setFilters({ ...filters, memberType: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Semua Tipe</option>
              {memberTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        {/* Amount Range */}
        {(filters.type === 'loans' || filters.type === 'savings') && (
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Min Jumlah (Rp)</label>
              <input type="number" placeholder="0" value={filters.minAmount}
                onChange={e => setFilters({ ...filters, minAmount: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Jumlah (Rp)</label>
              <input type="number" placeholder="999.999.999" value={filters.maxAmount}
                onChange={e => setFilters({ ...filters, maxAmount: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        )}

        {/* Sort */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Urutkan Berdasarkan</label>
            <select value={filters.sortBy} onChange={e => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="name">Nama</option>
              {filters.type === 'members' && <option value="total_savings">Total Simpanan</option>}
              {filters.type === 'members' && <option value="join_date">Tanggal Bergabung</option>}
              {filters.type !== 'members' && <option value="amount">Jumlah</option>}
              {filters.type !== 'members' && <option value="date">Tanggal</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Urutan</label>
            <select value={filters.sortOrder} onChange={e => setFilters({ ...filters, sortOrder: e.target.value as 'asc'|'desc' })}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="asc">Ascending (↑)</option>
              <option value="desc">Descending (↓)</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={() => applyFilters()}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
            <Filter size={16} /> Terapkan Filter
          </button>
          <button onClick={resetFilters}
            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-900 dark:text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </motion.div>

      {/* Error */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm font-medium">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Results */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Hasil ({loading ? 'Memuat...' : results.length})
          </h3>
          <button onClick={() => setAfPreviewOpen(true)} disabled={results.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded text-sm font-semibold transition-all">
            <Download size={16} /> Export PDF
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            {errorMsg ? 'Terjadi kesalahan saat memuat data' : 'Tidak ada hasil yang sesuai dengan filter'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Nama</th>
                  {filters.type === 'members' && <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Total Simpanan</th>
                  </>}
                  {filters.type === 'loans' && <>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Jumlah</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Tujuan</th>
                  </>}
                  {filters.type === 'savings' && <>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Jumlah</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Jenis</th>
                  </>}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    {filters.type === 'members' ? 'Tipe' : 'Tanggal'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, idx) => (
                  <tr key={idx} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {item.name || item.member_name || '-'}
                    </td>
                    {filters.type === 'members' && <>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">
                        {item.email || '-'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">
                        {fmt(item.total_savings)}
                      </td>
                    </>}
                    {filters.type === 'loans' && <>
                      <td className="px-4 py-3 text-right font-bold text-amber-600">
                        {fmt(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">
                        {item.purpose || '-'}
                      </td>
                    </>}
                    {filters.type === 'savings' && <>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {fmt(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">
                        {item.type || '-'}
                      </td>
                    </>}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        (item.status||'').toLowerCase() === 'aktif' || (item.status||'').toLowerCase() === 'active' || (item.status||'').toLowerCase() === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : (item.status||'').toLowerCase() === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">
                      {filters.type === 'members'
                        ? (item.type || '-')
                        : (item.date || item.created_date
                            ? new Date(item.date || item.created_date).toLocaleDateString('id-ID')
                            : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <ReportPreviewModal
        isOpen={afPreviewOpen}
        onClose={() => setAfPreviewOpen(false)}
        title={`Filter — ${filters.type === 'members' ? 'Anggota' : filters.type === 'loans' ? 'Pinjaman' : 'Simpanan'}`}
        generatePDF={generateFilterPDF}
        pdfFilename={`filter-lanjutan-${Date.now()}.pdf`}
        excelData={{
          headers: previewHeaders,
          rows: previewRows,
          filename: `filter-lanjutan-${Date.now()}.xlsx`,
          onDownload: () => {},
        }}
      />
    </div>
  );
}