import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, ExternalLink, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../types';
import { Link } from 'react-router-dom';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (res.status === 401) {
        // Session expired, just clear notifications silently
        setNotifications([]);
        return;
      }
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError("Oops, we haven't got JSON!");
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      // Only log non-401 errors
      console.error("Failed to fetch notifications:", e);
      setNotifications([]);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH', credentials: 'include' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-96 max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell size={16} className="text-emerald-500" />
                Notifikasi
              </h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider hover:underline"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={cn(
                      "p-4 transition-colors relative group",
                      !n.is_read ? "bg-emerald-50/30 dark:bg-emerald-500/5" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        n.type === 'success' ? "bg-emerald-500" : 
                        n.type === 'error' ? "bg-red-500" : 
                        n.type === 'warning' ? "bg-amber-500" : "bg-blue-500",
                        n.is_read && "opacity-0"
                      )} />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm font-bold leading-tight",
                            n.is_read ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"
                          )}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="p-1 text-slate-400 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Tandai dibaca"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                            <Clock size={10} />
                            {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {n.link && (
                            <Link 
                              to={n.link} 
                              onClick={() => {
                                setIsOpen(false);
                                markAsRead(n.id);
                              }}
                              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 hover:underline"
                            >
                              Detail <ExternalLink size={10} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell size={24} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada notifikasi baru</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                <button className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">
                  Lihat Semua Riwayat
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}