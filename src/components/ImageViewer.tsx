import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

interface ImageViewerProps {
  src: string | null;
  onClose: () => void;
  title?: string;
}

export default function ImageViewer({ src, onClose, title }: ImageViewerProps) {
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  if (!src) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex flex-col">
            <h3 className="text-white font-bold text-lg">{title || 'Pratinjau Gambar'}</h3>
            <p className="text-slate-400 text-xs">Gunakan kontrol di bawah untuk menyesuaikan tampilan</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
          <motion.div
            style={{ 
              scale, 
              rotate: rotation,
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="max-w-full max-h-full"
          >
            <img 
              src={src} 
              alt={title || 'Preview'} 
              className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>

        {/* Controls */}
        <div className="p-6 flex justify-center gap-4">
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10">
            <button 
              onClick={handleZoomOut}
              className="p-3 hover:bg-white/10 text-white rounded-xl transition-all"
              title="Perkecil"
            >
              <ZoomOut size={20} />
            </button>
            <button 
              onClick={handleZoomIn}
              className="p-3 hover:bg-white/10 text-white rounded-xl transition-all"
              title="Perbesar"
            >
              <ZoomIn size={20} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <button 
              onClick={handleRotate}
              className="p-3 hover:bg-white/10 text-white rounded-xl transition-all"
              title="Putar"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={handleReset}
              className="p-3 hover:bg-white/10 text-white rounded-xl transition-all text-xs font-bold"
            >
              RESET
            </button>
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <a 
              href={src} 
              download={`dokumen-${Date.now()}.png`}
              className="p-3 hover:bg-white/10 text-white rounded-xl transition-all"
              title="Unduh"
            >
              <Download size={20} />
            </a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
