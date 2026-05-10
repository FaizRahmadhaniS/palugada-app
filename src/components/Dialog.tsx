import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, X } from 'lucide-react';

type DialogType = 'confirm' | 'success' | 'error' | 'info';

interface DialogOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
}

interface DialogState extends DialogOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

interface DialogContextType {
  confirm: (opts: DialogOptions | string) => Promise<boolean>;
  alert: (opts: DialogOptions | string, type?: DialogType) => Promise<void>;
}

const DialogContext = createContext<DialogContextType>({
  confirm: async () => false,
  alert: async () => {},
});

export const useDialog = () => useContext(DialogContext);

const icons: Record<DialogType, React.ReactNode> = {
  confirm: <AlertTriangle size={24} color="#d97706" />,
  success: <CheckCircle size={24} color="#059669" />,
  error: <XCircle size={24} color="#e11d48" />,
  info: <Info size={24} color="#3b82f6" />,
};

const colors: Record<DialogType, { bg: string; border: string; btn: string; light: string }> = {
  confirm: { bg: '#fffbeb', border: '#fde68a', btn: '#d97706', light: '#fef3c7' },
  success: { bg: '#f0fdf4', border: '#86efac', btn: '#059669', light: '#dcfce7' },
  error:   { bg: '#fff1f2', border: '#fecdd3', btn: '#e11d48', light: '#ffe4e6' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', btn: '#3b82f6', light: '#dbeafe' },
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({ open: false, message: '' });

  const confirm = useCallback((opts: DialogOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const options = typeof opts === 'string' ? { message: opts } : opts;
      setDialog({ open: true, type: 'confirm', confirmText: 'Ya, Hapus', cancelText: 'Batal', ...options, resolve });
    });
  }, []);

  const alert = useCallback((opts: DialogOptions | string, type: DialogType = 'info'): Promise<void> => {
    return new Promise((resolve) => {
      const options = typeof opts === 'string' ? { message: opts, type } : { type, ...opts };
      setDialog({ open: true, confirmText: 'OK', ...options, resolve: (v) => resolve() });
    });
  }, []);

  const close = (value: boolean) => {
    dialog.resolve?.(value);
    setDialog({ open: false, message: '' });
  };

  const type = dialog.type || 'confirm';
  const c = colors[type];

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}

      {dialog.open && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={() => close(false)}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(3px)' }} />

          <div style={{ position:'relative', background:'#fff', borderRadius:18, width:'100%', maxWidth:400,
            boxShadow:'0 24px 60px rgba(0,0,0,.2)', border:`1.5px solid ${c.border}`,
            animation:'dialogIn .2s cubic-bezier(.34,1.56,.64,1) both' }}
            onClick={e => e.stopPropagation()}>

            <style>{`@keyframes dialogIn{from{opacity:0;transform:scale(.92) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

            {/* Header */}
            <div style={{ background:c.bg, borderRadius:'16px 16px 0 0', padding:'20px 22px 16px', borderBottom:`1px solid ${c.border}`, display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ background:c.light, borderRadius:12, padding:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {icons[type]}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                {dialog.title && <p style={{ fontSize:14, fontWeight:800, color:'#111827', margin:'0 0 4px' }}>{dialog.title}</p>}
                <p style={{ fontSize:14, color:'#374151', margin:0, lineHeight:1.6 }}>{dialog.message}</p>
              </div>
              <button onClick={() => close(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:2, flexShrink:0 }}>
                <X size={16} />
              </button>
            </div>

            {/* Buttons */}
            <div style={{ padding:'14px 22px', display:'flex', justifyContent:'flex-end', gap:8 }}>
              {type === 'confirm' && (
                <button onClick={() => close(false)}
                  style={{ padding:'9px 20px', background:'#f3f4f6', color:'#374151', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  {dialog.cancelText || 'Batal'}
                </button>
              )}
              <button onClick={() => close(true)}
                style={{ padding:'9px 20px', background:c.btn, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                {dialog.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}