import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquareWarning, Plus, Search, Filter, AlertTriangle, CheckCircle, MapPin, Image as ImageIcon, Send } from 'lucide-react';
import { cn } from '../types';

export default function Complaints({ user }: { user: any }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Layanan',
    description: '',
    location: '',
    images: '',
    isAnonymous: false
  });
  const [responses, setResponses] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');

  const safeFetch = (url: string, options?: any) => 
    fetch(url, { credentials: 'include', ...options }).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      return res.json();
    });

  useEffect(() => {
    if (selectedReport && isDetailModalOpen) {
      safeFetch(`/api/report_responses/${selectedReport.id}`)
        .then(data => setResponses(data))
        .catch(console.error);
    }
  }, [selectedReport, isDetailModalOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormData({ ...formData, images: dataUrl });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    try {
      await fetch('/api/report_responses', { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `RSP-${Date.now()}`,
          reportId: selectedReport.id,
          message: replyMessage,
          responderId: user.id,
          responderName: user.name,
          responderRole: user.role,
          createdBy: user.id
        })
      });
      setReplyMessage('');
      const res = await fetch(`/api/report_responses/${selectedReport.id}`, { credentials: 'include' });
      const data = await res.json();
      setResponses(data);
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      let data = await safeFetch('/api/reports_data');
      const reportsArray = Array.isArray(data) ? data : [];
      
      if (user.role !== 'admin') {
        setReports(reportsArray.filter((r: any) => r.userId === user.id));
      } else {
        setReports(reportsArray);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    // We need an endpoint for this, but let's assume we can patch it or add a response
    try {
      // Assuming we have a patch endpoint for reports_data status
      await fetch(`/api/reports_data/${id}/status`, { credentials: 'include',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setIsDetailModalOpen(false);
      fetchReports();
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/reports_data', { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `REP-${Date.now()}`,
          ...formData,
          status: 'Open',
          userId: user.id,
          userName: formData.isAnonymous ? 'Anonim' : user.name,
          createdBy: user.id
        })
      });
      setIsModalOpen(false);
      setFormData({ title: '', category: 'Layanan', description: '', location: '', images: '', isAnonymous: false });
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle size={14} /> Selesai</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><AlertTriangle size={14} /> Terbuka</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengaduan & Laporan</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {user.role === 'admin' ? 'Kelola laporan dan pengaduan dari anggota' : 'Sampaikan keluhan atau laporan masalah'}
          </p>
        </div>
        {user.role !== 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Buat Laporan
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari laporan..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium w-full sm:w-auto justify-center">
            <Filter size={18} />
            Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium text-left">Aksi</th>
                <th className="px-6 py-4 font-medium">ID Laporan</th>
                {user.role === 'admin' && <th className="px-6 py-4 font-medium">Pelapor</th>}
                <th className="px-6 py-4 font-medium">Kategori</th>
                <th className="px-6 py-4 font-medium">Judul</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={user.role === 'admin' ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Memuat data...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={user.role === 'admin' ? 6 : 5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Belum ada laporan</td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-left">
                      <button 
                        onClick={() => {
                          setSelectedReport(r);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium text-sm"
                      >
                        Detail
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{r.id}</td>
                    {user.role === 'admin' && (
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {r.isAnonymous ? <span className="italic text-slate-400">Anonim</span> : r.userName}
                      </td>
                    )}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{r.category}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">{r.title}</td>
                    <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Buat Laporan</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sampaikan keluhan atau laporan masalah Anda</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kategori</label>
                <select 
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                >
                  <option value="Layanan">Layanan</option>
                  <option value="Sistem/Aplikasi">Sistem/Aplikasi</option>
                  <option value="Keuangan">Keuangan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Judul Laporan</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                  placeholder="Singkat dan jelas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Deskripsi Detail</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white resize-none"
                  rows={4}
                  placeholder="Jelaskan masalah secara detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Lokasi Kejadian (Opsional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                    placeholder="Contoh: Kantor Cabang Utama"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Lampiran Foto (Opsional)</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
                    <ImageIcon size={18} />
                    Pilih Foto
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {formData.images && (
                    <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                      <img 
                        src={formData.images} 
                        alt="Preview" 
                        className="h-full w-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="anonymous"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="anonymous" className="text-sm text-slate-700 dark:text-slate-300">
                  Kirim sebagai Anonim (Nama disembunyikan)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Kirim Laporan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isDetailModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detail Pengaduan</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedReport.id}</p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedReport.status)}
                {user.role === 'admin' && selectedReport.status === 'Open' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id, 'Resolved')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <CheckCircle size={14} />
                    Tandai Selesai
                  </button>
                )}
              </div>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pelapor</p>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {selectedReport.isAnonymous ? <span className="italic text-slate-400">Anonim</span> : selectedReport.userName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Kategori</p>
                  <p className="text-slate-900 dark:text-white mt-1">{selectedReport.category}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Judul Laporan</p>
                <p className="text-slate-900 dark:text-white mt-1">{selectedReport.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Deskripsi Detail</p>
                <p className="text-slate-900 dark:text-white mt-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">{selectedReport.description}</p>
              </div>

              {(selectedReport.location || selectedReport.images) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedReport.location && (
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lokasi</p>
                      <p className="text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                        <MapPin size={16} className="text-slate-400" />
                        {selectedReport.location}
                      </p>
                    </div>
                  )}
                  {selectedReport.images && (
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Lampiran Foto</p>
                      <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-[200px]">
                        <img 
                          src={selectedReport.images} 
                          alt="Lampiran" 
                          className="w-full h-auto" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chat / Responses Section */}
              <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Balasan & Tindak Lanjut</h3>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-4">
                  {responses.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Belum ada balasan.</p>
                  ) : (
                    responses.map(resp => (
                      <div key={resp.id} className={`flex gap-2 ${resp.responderId === user.id ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase overflow-hidden">
                            {resp.responderAvatar ? (
                              <img src={resp.responderAvatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              resp.responderName?.substring(0, 2) || 'US'
                            )}
                          </div>
                        </div>
                        <div className={`flex flex-col ${resp.responderId === user.id ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                            resp.responderId === user.id 
                              ? 'bg-emerald-600 text-white rounded-tr-sm' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-sm'
                          }`}>
                            <p className="text-xs font-medium opacity-75 mb-1">
                              {resp.responderName} {resp.responderRole === 'admin' && '(Admin)'}
                            </p>
                            <p className="text-sm">{resp.message}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1">
                            {new Date(resp.createdDate).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {selectedReport.status === 'Open' && (
                  <form onSubmit={handleReplySubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Ketik balasan..."
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white"
                    />
                    <button 
                      type="submit"
                      disabled={!replyMessage.trim()}
                      className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                )}
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Tutup
                </button>
                {user.role === 'admin' && selectedReport.status === 'Open' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedReport.id, 'Resolved')}
                    className="flex-1 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-medium transition-colors"
                  >
                    Tandai Selesai
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}