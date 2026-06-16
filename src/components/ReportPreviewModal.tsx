import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileText, Table, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface ExcelData {
  headers: string[];
  rows: (string | number)[][];
  filename: string;
  onDownload: () => void;
}

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  generatePDF?: () => Promise<jsPDF>;
  excelData?: ExcelData;
  pdfFilename?: string;
}

export default function ReportPreviewModal({
  isOpen,
  onClose,
  title,
  generatePDF,
  excelData,
  pdfFilename,
}: ReportPreviewModalProps) {
  const [mode, setMode] = useState<'pdf' | 'excel'>(generatePDF ? 'pdf' : 'excel');
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const buildPDF = useCallback(async () => {
    if (!generatePDF) return;
    setLoading(true);
    setError(null);
    try {
      const doc = await generatePDF();
      setPdfDoc(doc);
    } catch (err) {
      console.error('PDF build error:', err);
      setError('Gagal membuat PDF. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [generatePDF]);

  useEffect(() => {
    if (!isOpen) return;
    setPdfDoc(null);
    setError(null);
    setMode(generatePDF ? 'pdf' : 'excel');
    if (generatePDF) buildPDF();
  }, [isOpen]); // eslint-disable-line

  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleDownloadPDF = async () => {
    if (loading) return;
    setDownloading(true);
    try {
      const doc = pdfDoc ?? await generatePDF!();
      doc.save(pdfFilename || `laporan-${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const hasBoth = !!generatePDF && !!excelData;
  const activeRows = excelData?.rows ?? [];
  const activeHeaders = excelData?.headers ?? [];
  const pdfReady = !loading && !error && !!pdfDoc;

  if (!mounted) return null;

  // ── Render via portal ke document.body ── bypass semua stacking context
  const modal = (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--modal-bg, #fff)',
              borderRadius: 20,
              boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
              border: '1px solid rgba(0,0,0,0.08)',
              width: '95vw',
              maxWidth: 960,
              height: '88vh',
              overflow: 'hidden',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
            className="dark:[--modal-bg:#1e293b]"
          >
            {/* ── Header ── */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid rgba(0,0,0,0.07)', flexShrink:0, background:'inherit' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ padding:8, background:'#ecfdf5', borderRadius:12 }}>
                  <FileText size={16} color="#059669" />
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:700, fontSize:14, color:'#0f172a' }}>{title}</p>
                  <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>Preview laporan sebelum diunduh</p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ padding:8, borderRadius:10, border:'none', background:'transparent', cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Tab switcher ── */}
            {hasBoth && (
              <div style={{ display:'flex', gap:6, padding:'10px 20px', borderBottom:'1px solid rgba(0,0,0,0.06)', background:'#f8fafc', flexShrink:0 }}>
                {(['pdf', 'excel'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 8, border: 'none',
                      cursor: 'pointer', fontSize: 12, fontWeight: 700,
                      background: mode === m ? (m === 'pdf' ? '#7c3aed' : '#059669') : '#fff',
                      color: mode === m ? '#fff' : '#64748b',
                      boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.15)' : '0 0 0 1px #e2e8f0',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {m === 'pdf' ? <FileText size={12} /> : <Table size={12} />}
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* ── Content ── */}
            <div style={{ flex:1, overflowY:'auto', padding:20, background:'#f8fafc', display:'flex', flexDirection:'column', gap:16 }}>

              {/* PDF mode */}
              {mode === 'pdf' && (
                <>
                  {/* Status bar */}
                  <div style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'12px 16px', borderRadius:12, border:'1px solid',
                    fontSize:13, fontWeight:500, flexShrink:0,
                    ...(loading
                      ? { background:'#eff6ff', borderColor:'#bfdbfe', color:'#1d4ed8' }
                      : error
                        ? { background:'#fef2f2', borderColor:'#fecaca', color:'#dc2626' }
                        : { background:'#f0fdf4', borderColor:'#bbf7d0', color:'#15803d' })
                  }}>
                    {loading
                      ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite', flexShrink:0 }} /> Sedang menyiapkan PDF...</>
                      : error
                        ? <><span>⚠</span> {error} <button onClick={buildPDF} style={{ marginLeft:8, textDecoration:'underline', background:'none', border:'none', cursor:'pointer', color:'inherit', fontFamily:'inherit', fontSize:'inherit' }}>Coba lagi</button></>
                        : <><span>✓</span> PDF siap — klik tombol <strong style={{ margin:'0 4px' }}>Unduh PDF</strong> di bawah kanan</>
                    }
                  </div>

                  {/* Preview table */}
                  {excelData && excelData.rows.length > 0 ? (
                    <div style={{ flex:1, overflowY:'auto', borderRadius:12, border:'1px solid #e2e8f0', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ padding:'10px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:8 }}>
                        <FileText size={13} color="#7c3aed" />
                        <span style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>
                          Preview isi PDF — {excelData.rows.length} baris data
                        </span>
                      </div>
                      <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                          <thead>
                            <tr>
                              {excelData.headers.map((h, i) => (
                                <th key={i} style={{ background:'#7c3aed', color:'#fff', padding:'10px 12px', fontWeight:700, textAlign:'left', whiteSpace:'nowrap', position:'sticky', top:0 }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {excelData.rows.map((row, ri) => (
                              <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#faf5ff' }}>
                                {row.map((cell, ci) => (
                                  <td key={ci} style={{ padding:'8px 12px', color:'#334155', borderBottom:'1px solid #f1f5f9', whiteSpace:'nowrap' }}>
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <div style={{ textAlign:'center', padding:40, background:'#fff', borderRadius:20, border:'1px solid #e2e8f0', maxWidth:320, width:'100%' }}>
                        <div style={{ width:64, height:64, background:'#f5f3ff', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                          <FileText size={28} color="#7c3aed" />
                        </div>
                        <p style={{ fontWeight:700, fontSize:15, color:'#0f172a', margin:'0 0 6px' }}>{title}</p>
                        <p style={{ fontSize:13, color:'#64748b', margin:'0 0 20px' }}>
                          {loading ? 'PDF sedang disiapkan...' : pdfReady ? 'PDF siap. Klik Unduh PDF di bawah.' : 'Terjadi kesalahan.'}
                        </p>
                        {pdfReady && (
                          <button onClick={handleDownloadPDF} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, border:'none', background:'#7c3aed', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                            <Download size={15} /> Unduh PDF
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Excel mode */}
              {mode === 'excel' && excelData && (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    <div style={{ padding:6, background:'#ecfdf5', borderRadius:8 }}>
                      <Table size={13} color="#059669" />
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color:'#475569' }}>
                      Preview data Excel — {activeRows.length} baris
                    </span>
                  </div>
                  <div style={{ flex:1, overflowY:'auto', borderRadius:12, border:'1px solid #e2e8f0', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                        <thead>
                          <tr>
                            {activeHeaders.map((h, i) => (
                              <th key={i} style={{ background:'#059669', color:'#fff', padding:'10px 12px', fontWeight:700, textAlign:'left', whiteSpace:'nowrap', position:'sticky', top:0 }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeRows.length === 0 ? (
                            <tr><td colSpan={activeHeaders.length} style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>Tidak ada data</td></tr>
                          ) : (
                            activeRows.map((row, ri) => (
                              <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f0fdf4' }}>
                                {row.map((cell, ci) => (
                                  <td key={ci} style={{ padding:'8px 12px', color:'#334155', borderBottom:'1px solid #f1f5f9', whiteSpace:'nowrap' }}>
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Footer ── */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'12px 20px', borderTop:'1px solid rgba(0,0,0,0.07)', background:'inherit', flexShrink:0 }}>
              <button
                onClick={onClose}
                style={{ padding:'8px 18px', borderRadius:10, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
              >
                Tutup
              </button>
              <div style={{ display:'flex', gap:8 }}>
                {excelData && (mode === 'excel' || !generatePDF) && (
                  <button
                    onClick={excelData.onDownload}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 18px', borderRadius:10, border:'none', background:'#059669', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
                  >
                    <Download size={15} /> Unduh Excel
                  </button>
                )}
                {generatePDF && (mode === 'pdf' || !excelData) && (
                  <button
                    onClick={handleDownloadPDF}
                    disabled={loading || downloading}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 18px', borderRadius:10, border:'none', background: (loading || downloading) ? '#a78bfa' : '#7c3aed', color:'#fff', fontSize:13, fontWeight:700, cursor: (loading || downloading) ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: (loading || downloading) ? 0.7 : 1 }}
                  >
                    {(loading || downloading) ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> : <Download size={15} />}
                    {loading ? 'Menyiapkan...' : 'Unduh PDF'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}