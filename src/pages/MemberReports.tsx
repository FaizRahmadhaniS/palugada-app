import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, Search, Wallet, HandCoins, TrendingUp } from 'lucide-react';
import { cn } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';

const generateBarcode = (text: string) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, { format: 'CODE128', displayValue: false, height: 40, width: 2, margin: 0 });
  return canvas.toDataURL('image/png');
};

export default function MemberReports({ user }: { user: any }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user?.id) {
      setError('User tidak ditemukan');
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        // Try member payments endpoint first
        const res = await fetch(`/api/member_payments/${user.id}`, { credentials: 'include' });
        if (res.ok) {
          const ct = res.headers.get("content-type");
          if (ct && ct.includes("application/json")) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setHistory(data);
              setLoading(false);
              return;
            }
          }
        }
        // Fallback: use savings transactions API
        const savRes = await fetch('/api/savings', { credentials: 'include' });
        if (savRes.ok) {
          const savData = await savRes.json();
          if (Array.isArray(savData)) {
            const mapped = savData.map((t: any) => ({
              id: t.id,
              date: t.date || t.createdDate,
              type: t.description || t.type || 'Simpanan',
              amount: t.amount,
              status: t.status || 'Success'
            }));
            setHistory(mapped);
          }
        }
      } catch (err: any) {
        console.error('Failed to load history:', err);
        setError(err.message || 'Gagal memuat laporan');
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [user?.id]);

  const exportPersonalPDF = () => {
    const doc = new jsPDF();
    const reportId = `REP-MEM-${user.id.substring(0, 5)}-${Date.now()}`;
    
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('PALUGADA COOP', 14, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Laporan Aktivitas: ${user.name}`, 14, 32);
    doc.text(`NIK: ${user.nik || '-'}`, 14, 37);

    const barcodeData = generateBarcode(reportId);
    doc.addImage(barcodeData, 'PNG', 140, 10, 55, 20);
    doc.setFontSize(8);
    doc.text(`REPORT ID: ${reportId}`, 140, 35);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('RIWAYAT TRANSAKSI PRIBADI', 14, 65);
    
    const tableData = history.map((h, index) => [
      index + 1,
      new Date(h.date).toLocaleDateString('id-ID'),
      h.type,
      h.status,
      `Rp ${(h.amount || 0).toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['NO', 'TANGGAL', 'JENIS', 'STATUS', 'JUMLAH']],
      body: tableData,
      headStyles: { fillColor: [16, 185, 129], halign: 'center' },
      columnStyles: {
        0: { halign: 'center' },
        4: { halign: 'right' }
      }
    });

    doc.save(`laporan-saya-${Date.now()}.pdf`);
  };

  const handlePrintReceipt = (transaction: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Bukti Transaksi - ${transaction.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #333; }
            .receipt-box { border: 1px dashed #ccc; padding: 30px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 14px; color: #666; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
            .total-row { border-top: 1px dashed #ccc; padding-top: 15px; margin-top: 15px; font-weight: bold; font-size: 16px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; border-top: 1px dashed #ccc; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div class="title">PALUGADA SIMPLE</div>
              <div class="subtitle">Koperasi Simpan Pinjam</div>
              <div style="margin-top: 10px; font-size: 12px;">ID: ${transaction.id}</div>
            </div>
            
            <div class="row">
              <span>Tanggal</span>
              <span>${new Date(transaction.date).toLocaleString('id-ID')}</span>
            </div>
            <div class="row">
              <span>Member</span>
              <span>${user.name}</span>
            </div>
            <div class="row">
              <span>Jenis Transaksi</span>
              <span>${transaction.type}</span>
            </div>
            <div class="row">
              <span>Status</span>
              <span>${transaction.status}</span>
            </div>
            
            <div class="row total-row">
              <span>TOTAL</span>
              <span>Rp ${transaction.amount.toLocaleString('id-ID')}</span>
            </div>
            
            <div class="footer">
              Terima kasih atas kepercayaan Anda.<br/>
              Simpan bukti ini sebagai referensi yang sah.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const filteredHistory = history.filter(h => 
    h.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-800 dark:border-t-emerald-500 animate-spin"></div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat laporan Anda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <div className="text-red-600 dark:text-red-400 text-xl font-bold">Terjadi Kesalahan</div>
        <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">{error}</p>
        <button 
          onClick={() => { setLoading(true); setError(null); }}
          className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Riwayat Transaksi & Laporan</h1>
          <p className="text-slate-500 dark:text-slate-400">Riwayat transaksi dan bukti pembayaran Anda</p>
        </div>
        <button 
          onClick={exportPersonalPDF}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
        >
          <Download size={18} />
          Unduh Laporan PDF
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium text-center">Aksi</th>
                <th className="px-6 py-4 font-medium">Tanggal</th>
                <th className="px-6 py-4 font-medium">ID Transaksi</th>
                <th className="px-6 py-4 font-medium">Jenis Transaksi</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Memuat data...</td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Belum ada riwayat transaksi</td>
                </tr>
              ) : (
                filteredHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handlePrintReceipt(h)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                      >
                        <Printer size={14} />
                        Cetak Bukti
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {new Date(h.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{h.id}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{h.type}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {h.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                      Rp {h.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}