import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, CreditCard, Phone, MapPin, Save, Clock, CheckCircle2, LogOut, ChevronRight, Briefcase, Users2, Camera, Upload, X, ZoomIn } from 'lucide-react';
import ImageViewer from '../components/ImageViewer';

interface OnboardingProps {
  user: any;
  onLogout: () => void;
  onUpdateUser: (user: any) => void;
}

export default function Onboarding({ user, onLogout, onUpdateUser }: OnboardingProps) {
  const [step, setStep] = useState(user.status === 'pending_verification' ? 3 : 2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewerData, setViewerData] = useState<{src: string, title: string} | null>(null);
  
  const [formData, setFormData] = useState({
    nik: user.nik || '',
    phone: user.phone || '',
    address: user.address || '',
    job_title: user.job_title || '',
    salary_range: user.salary_range || '',
    emergency_contact_name: user.emergency_contact_name || '',
    emergency_contact_phone: user.emergency_contact_phone || ''
  });

  const [previews, setPreviews] = useState<{ktp: string | null, selfie: string | null}>({
    ktp: user.ktp_url || null,
    selfie: user.selfie_url || null
  });

  const [files, setFiles] = useState<{ktp: File | null, selfie: File | null}>({
    ktp: null,
    selfie: null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp' | 'selfie') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB');
        return;
      }
      setFiles(prev => ({ ...prev, [type]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nik || formData.nik.length !== 16) {
      setError('Masukan NIK yang valid (16 digit)');
      return;
    }
    if (!formData.phone || !formData.address || !formData.job_title) {
      setError('Mohon lengkapi semua data teks');
      return;
    }
    if (!previews.ktp) {
      setError('Mohon cantumkan Foto KTP Anda');
      return;
    }
    if (!previews.selfie) {
      setError('Mohon cantumkan Foto Wajah (Selfie) dengan KTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Prepare data (using Base64 for images to keep it simple but functional for hosting)
      // In a real Supabase Storage setup, we would upload files first.
      // To ensure this works immediately for the user, we'll send the base64 to the server
      // which will handle the storage logic.
      
      const res = await fetch(`/api/users/${user.id}/onboarding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ktp_base64: previews.ktp.startsWith('data:') ? previews.ktp : null,
          selfie_base64: previews.selfie.startsWith('data:') ? previews.selfie : null,
          status: 'pending_verification'
        })
      });
      
      const data = await res.json();
      if (data.success) {
        onUpdateUser(data.user);
        setStep(3);
      } else {
        setError(data.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Akun', desc: 'Registrasi' },
    { id: 2, title: 'Profil', desc: 'Data Diri & KYC' },
    { id: 3, title: 'Verifikasi', desc: 'Proses Admin' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Lengkapi Profil Anda
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Satu langkah lagi untuk menjadi anggota aktif Koperasi Palugada.
          </p>
        </div>

        {/* Stepper Visual */}
        <div className="relative mb-12 max-w-md mx-auto">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
          <div className="relative z-10 flex justify-between">
            {steps.map((s) => {
              const isCompleted = s.id < step;
              const isActive = s.id === step;
              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-500 text-white' : 
                    isActive ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20' : 
                    'bg-white dark:bg-slate-900 text-slate-400 border-2 border-slate-200 dark:border-slate-800'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={20} /> : s.id}
                  </div>
                  <div className="mt-3 text-center">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {s.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Card */}
        <motion.div 
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
        >
          {step === 2 && (
            <div className="p-6 sm:p-10">
              <form onSubmit={handleSubmitProfile} className="space-y-8">
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold rounded-2xl border border-red-100 dark:border-red-500/20">
                    {error}
                  </div>
                )}

                {/* Section 1: Identitas Dasar */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
                    <User size={18} />
                    <span>Identitas Dasar</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">NIK (16 Digit)</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" required maxLength={16} placeholder="Sesuai KTP"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                          value={formData.nik}
                          onChange={(e) => setFormData({...formData, nik: e.target.value.replace(/\D/g, '')})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Nomor WhatsApp</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="tel" required placeholder="0812..."
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Alamat Lengkap</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                      <textarea 
                        required rows={2} placeholder="Alamat domisili saat ini"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all resize-none"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Pekerjaan & Kontak Darurat */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
                    <Briefcase size={18} />
                    <span>Pekerjaan & Kontak Darurat</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Pekerjaan</label>
                      <input 
                        type="text" required placeholder="Misal: Karyawan Swasta"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                        value={formData.job_title}
                        onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Range Penghasilan</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                        value={formData.salary_range}
                        onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                      >
                        <option value="">Pilih Range</option>
                        <option value="< 2jt">Di bawah 2 Juta</option>
                        <option value="2jt - 5jt">2 - 5 Juta</option>
                        <option value="5jt - 10jt">5 - 10 Juta</option>
                        <option value="> 10jt">Di atas 10 Juta</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Nama Kontak Darurat</label>
                      <input 
                        type="text" required placeholder="Nama Orang Terdekat"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">No. HP Kontak Darurat</label>
                      <input 
                        type="tel" required placeholder="08..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Upload Dokumen (e-KYC) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
                    <Camera size={18} />
                    <span>Verifikasi Identitas (e-KYC)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* KTP Upload */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Foto KTP Asli</label>
                        <span className="text-[10px] bg-red-100 dark:bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">Wajib</span>
                      </div>
                      <div className="relative group">
                        {previews.ktp ? (
                          <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-emerald-500 group">
                            <img 
                              src={previews.ktp} 
                              alt="KTP Preview" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                              <button 
                                type="button" onClick={() => setViewerData({ src: previews.ktp!, title: 'Pratinjau KTP' })}
                                className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors"
                              >
                                <ZoomIn size={16} />
                              </button>
                              <button 
                                type="button" onClick={() => setPreviews({...previews, ktp: null})}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-video bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                            <Upload className="text-slate-400 mb-2" size={24} />
                            <span className="text-xs font-medium text-slate-500">Klik untuk Upload KTP</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'ktp')} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Selfie Upload */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Foto Selfie + KTP</label>
                        <span className="text-[10px] bg-red-100 dark:bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">Wajib</span>
                      </div>
                      <div className="relative group">
                        {previews.selfie ? (
                          <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-emerald-500 group">
                            <img 
                              src={previews.selfie} 
                              alt="Selfie Preview" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                              <button 
                                type="button" onClick={() => setViewerData({ src: previews.selfie!, title: 'Pratinjau Selfie' })}
                                className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors"
                              >
                                <ZoomIn size={16} />
                              </button>
                              <button 
                                type="button" onClick={() => setPreviews({...previews, selfie: null})}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-video bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                            <Camera className="text-slate-400 mb-2" size={24} />
                            <span className="text-xs font-medium text-slate-500">Klik untuk Upload Selfie</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'selfie')} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic text-center">
                    Pastikan foto terlihat jelas, tidak blur, dan pencahayaan cukup. Maksimal 5MB per file.
                  </p>
                </div>

                <button 
                  type="submit" disabled={loading}
                  className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Kirim Data Verifikasi
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6">
                <Clock size={40} className="animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Sedang Diverifikasi</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm mx-auto">
                Terima kasih! Data dan dokumen Anda telah kami terima. Admin sedang melakukan pengecekan keaslian identitas Anda.
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-8 text-left border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Apa selanjutnya?</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 p-1 bg-emerald-100 dark:bg-emerald-500/20 rounded-full text-emerald-600">
                      <CheckCircle2 size={12} />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Admin akan memvalidasi NIK dan foto dokumen Anda.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 p-1 bg-emerald-100 dark:bg-emerald-500/20 rounded-full text-emerald-600">
                      <CheckCircle2 size={12} />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Proses verifikasi memakan waktu maksimal 24 jam kerja.</p>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-slate-400 italic">
                Halaman ini akan otomatis berubah setelah akun Anda diaktifkan.
              </p>
            </div>
          )}
        </motion.div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-center">
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
            Keluar dari Akun
          </button>
        </div>
      </div>

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