import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

const generateBarcode = (text: string) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, { format: 'CODE128', displayValue: false, height: 40, width: 2, margin: 0 });
  return canvas.toDataURL('image/png');
};

export default function DigitalCard({ user }: { user: any }) {
  const exportCardPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 53.98] // Standard CR80 credit card size
    });
    
    // Background
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.rect(0, 0, 85.6, 53.98, 'F');
    
    // Header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PALUGADA COOP', 5, 10);
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Koperasi Simpan Pinjam', 5, 14);
    
    // Member Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(user.name?.toUpperCase() || 'NAMA ANGGOTA', 5, 30);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIK: ${user.nik || '-'}`, 5, 35);
    doc.text(`Bergabung: ${new Date(user.join_date || Date.now()).toLocaleDateString('id-ID')}`, 5, 40);
    
    // Barcode
    const barcodeData = generateBarcode(user.id || 'MEM-000');
    doc.addImage(barcodeData, 'PNG', 45, 25, 35, 15);
    
    doc.setFontSize(5);
    doc.text(user.id || 'MEM-000', 62.5, 43, { align: 'center' });

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
        <button 
          onClick={exportCardPDF}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
        >
          <Download size={18} />
          Unduh Kartu PDF
        </button>
      </div>

      <div className="flex justify-center p-8 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
        {/* Card Design */}
        <div className="relative w-full max-w-[400px] aspect-[1.586/1] bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-2xl overflow-hidden text-white p-6 flex flex-col justify-between">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-black/10 blur-xl"></div>

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black tracking-tight">PALUGADA COOP</h2>
              <p className="text-[10px] text-emerald-100 font-medium tracking-widest uppercase">Koperasi Simpan Pinjam</p>
            </div>
            <CreditCard size={28} className="text-emerald-200/80" />
          </div>

          <div className="relative z-10 mt-auto">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-emerald-200 mb-1">Nama Anggota</p>
                <p className="text-lg font-bold tracking-wide uppercase">{user.name || 'Nama Anggota'}</p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <p className="text-[10px] text-emerald-200">NIK</p>
                    <p className="text-xs font-medium">{user.nik || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-200">Bergabung</p>
                    <p className="text-xs font-medium">{new Date(user.join_date || Date.now()).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-2 rounded-lg text-center">
                <img 
                  src={generateBarcode(user.id || 'MEM-000')} 
                  alt="Barcode" 
                  className="h-10 w-24 object-cover mix-blend-multiply"
                />
                <p className="text-[8px] text-slate-900 font-mono mt-1">{user.id || 'MEM-000'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-2xl text-sm flex gap-3 items-start">
        <div className="mt-0.5">ℹ️</div>
        <p>Kartu digital ini dapat digunakan sebagai bukti identitas keanggotaan Anda. Anda dapat mengunduhnya dan menyimpannya di perangkat Anda untuk kemudahan akses.</p>
      </div>
    </motion.div>
  );
}
