import { useDialog } from '../components/Dialog';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Clock, CreditCard, Camera, Eye, Briefcase, Phone, MapPin, User, ZoomIn } from 'lucide-react';
import ImageViewer from '../components/ImageViewer';

export default function Approvals() {
  const { confirm: dlgConfirm, alert: dlgAlert } = useDialog();
  const [activeTab, setActiveTab] = useState('Pendaftaran');
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [viewerData, setViewerData] = useState<{src: string, title: string} | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const safeFetch = (url: string) => 
        fetch(url, { credentials: 'include' }).then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Oops, we haven't got JSON!");
          }
          return res.json();
        });

      const [members, loans] = await Promise.all([
        safeFetch('/api/members'),
        safeFetch('/api/loans')
      ]);
      
      const membersArray = Array.isArray(members) ? members : [];
      const loansArray = Array.isArray(loans) ? loans : [];

      setPendingMembers(membersArray.filter((m: any) => m.status === 'Pending'));
      setPendingLoans(loansArray.filter((l: any) => l.status === 'pending'));
    } catch (err) {
      console.error('Failed to fetch approvals', err);
      setPendingMembers([]);
      setPendingLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMemberAction = async (id: string, action: 'Aktif' | 'Ditolak') => {
    try {
      await fetch(`/api/members/${id}/status`, { credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });
      setSelectedMember(null);
      fetchData();
    } catch (err) {
      console.error(err);
      dlgAlert({ title: 'Perhatian', message: 'Gagal memproses pendaftaran', type: 'error', confirmText: 'OK' });
    }
  };

  const handleLoanAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/loans/${id}/status`, { credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });
      fetchData();
    } catch (err) {
      console.error(err);
      dlgAlert({ title: 'Perhatian', message: 'Gagal memproses pinjaman', type: 'error', confirmText: 'OK' });
    }
  };

  const tabs = [
    { id: 'Pendaftaran', label: `Pendaftaran (${pendingMembers.length})` },
    { id: 'Pinjaman', label: `Pinjaman (${pendingLoans.length})` },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-800 dark:border-t-blue-500 animate-spin"></div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data persetujuan...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Persetujuan</h1>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-t border-x border-slate-200 dark:border-slate-700' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Aksi</th>
                <th className="px-6 py-4 font-medium">Nama / NIK</th>
                <th className="px-6 py-4 font-medium">
                  {activeTab === 'Pendaftaran' ? 'Kontak / Alamat' : 'Jumlah'}
                </th>
                {activeTab === 'Pendaftaran' ? (
                  <th className="px-6 py-4 font-medium">Dokumen</th>
                ) : (
                  <th className="px-6 py-4 font-medium">Tenor</th>
                )}
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                  </td>
                </tr>
              ) : activeTab === 'Pendaftaran' ? (
                pendingMembers.length > 0 ? pendingMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 space-x-2">
                      <button 
                        onClick={() => setSelectedMember(member)}
                        className="px-3 py-1.5 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye size={14} /> Detail
                      </button>
                      <button 
                        onClick={() => handleMemberAction(member.id, 'Aktif')}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                      >
                        <Check size={14} /> Setujui
                      </button>
                      <button 
                        onClick={() => handleMemberAction(member.id, 'Ditolak')}
                        className="px-3 py-1.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors inline-flex items-center gap-1"
                      >
                        <X size={14} /> Tolak
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{member.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{member.nik || 'NIK Belum Diisi'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600 dark:text-slate-400">{member.email}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">{member.address || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {member.ktp_url ? (
                          <button 
                            onClick={() => setViewerData({ src: member.ktp_url, title: `KTP - ${member.name}` })}
                            className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-emerald-500/30 overflow-hidden flex-shrink-0 hover:scale-110 transition-transform relative group shadow-sm"
                          >
                            <img 
                              src={member.ktp_url} 
                              alt="KTP" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'https://placehold.co/400x250?text=KTP+Error';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn size={14} className="text-white" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                            <CreditCard size={16} />
                          </div>
                        )}
                        {member.selfie_url ? (
                          <button 
                            onClick={() => setViewerData({ src: member.selfie_url, title: `Selfie - ${member.name}` })}
                            className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-emerald-500/30 overflow-hidden flex-shrink-0 hover:scale-110 transition-transform relative group shadow-sm"
                          >
                            <img 
                              src={member.selfie_url} 
                              alt="Selfie" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'https://placehold.co/400x250?text=Selfie+Error';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn size={14} className="text-white" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                            <Camera size={16} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 flex items-center gap-1 w-max">
                        <Clock size={12} /> Pending
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Tidak ada pendaftaran pending</td></tr>
                )
              ) : activeTab === 'Pinjaman' ? (
                pendingLoans.length > 0 ? pendingLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 space-x-2">
                      <button 
                        onClick={() => handleLoanAction(loan.id, 'approved')}
                        className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                      >
                        <Check size={14} /> Setujui
                      </button>
                      <button 
                        onClick={() => handleLoanAction(loan.id, 'rejected')}
                        className="px-3 py-1.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors inline-flex items-center gap-1"
                      >
                        <X size={14} /> Tolak
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{loan.id}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white">{loan.memberName}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      Rp {(loan.amount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {(loan.duration || 0)} bulan
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 flex items-center gap-1 w-max">
                        <Clock size={12} /> Pending
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Tidak ada pinjaman pending</td></tr>
                )
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl text-emerald-600">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detail Verifikasi Anggota</h2>
                    <p className="text-sm text-slate-500">{selectedMember.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Data Diri */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Data Identitas</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">NIK</p>
                          <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{selectedMember.nik}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Kontak & Email</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedMember.phone}</p>
                          <p className="text-xs text-slate-500">{selectedMember.email}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Alamat</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{selectedMember.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Pekerjaan & Darurat</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pekerjaan</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedMember.job_title || '-'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Penghasilan</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedMember.salary_range || '-'}</p>
                        </div>
                        <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Kontak Darurat</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedMember.emergency_contact_name || '-'}</p>
                          <p className="text-xs text-slate-500">{selectedMember.emergency_contact_phone || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dokumen */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Dokumen e-KYC</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Foto KTP</p>
                          {selectedMember.ktp_url && (
                            <button 
                              onClick={() => setViewerData({ src: selectedMember.ktp_url, title: `KTP - ${selectedMember.name}` })}
                              className="text-[10px] font-bold text-emerald-600 hover:underline"
                            >
                              Lihat Fullscreen
                            </button>
                          )}
                        </div>
                        {selectedMember.ktp_url ? (
                          <div 
                            onClick={() => setViewerData({ src: selectedMember.ktp_url, title: `KTP - ${selectedMember.name}` })}
                            className="aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 cursor-zoom-in hover:border-emerald-500 transition-colors group relative"
                          >
                            <img 
                              src={selectedMember.ktp_url} 
                              alt="KTP" 
                              className="w-full h-full object-contain" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'https://placehold.co/400x250?text=KTP+Error';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn size={32} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                            Tidak ada foto KTP
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Foto Selfie + KTP</p>
                          {selectedMember.selfie_url && (
                            <button 
                              onClick={() => setViewerData({ src: selectedMember.selfie_url, title: `Selfie - ${selectedMember.name}` })}
                              className="text-[10px] font-bold text-emerald-600 hover:underline"
                            >
                              Lihat Fullscreen
                            </button>
                          )}
                        </div>
                        {selectedMember.selfie_url ? (
                          <div 
                            onClick={() => setViewerData({ src: selectedMember.selfie_url, title: `Selfie - ${selectedMember.name}` })}
                            className="aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 cursor-zoom-in hover:border-emerald-500 transition-colors group relative"
                          >
                            <img 
                              src={selectedMember.selfie_url} 
                              alt="Selfie" 
                              className="w-full h-full object-contain" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'https://placehold.co/400x250?text=Selfie+Error';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn size={32} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                            Tidak ada foto Selfie
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                <button 
                  onClick={() => handleMemberAction(selectedMember.id, 'Ditolak')}
                  className="px-6 py-2.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                >
                  Tolak Pendaftaran
                </button>
                <button 
                  onClick={() => handleMemberAction(selectedMember.id, 'Aktif')}
                  className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                >
                  Setujui & Aktifkan
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
    </motion.div>
  );
}