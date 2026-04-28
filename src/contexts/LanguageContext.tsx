import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    // Navigation
    'nav.dashboard': 'Beranda',
    'nav.members': 'Anggota',
    'nav.savings': 'Simpanan',
    'nav.loans': 'Pinjaman',
    'nav.finance': 'Keuangan',
    'nav.complaints': 'Pengaduan',
    'nav.approvals': 'Persetujuan',
    'nav.settings': 'Pengaturan',
    'nav.payment': 'Setor / Bayar',
    'nav.loan_request': 'Ajukan Pinjaman',
    'nav.payment_gateway': 'Payment Gateway',
    'nav.reports': 'Laporan',
    'nav.withdrawals': 'Penarikan',
    'nav.audit_logs': 'Audit Log',
    'nav.logout': 'Keluar',
    
    // Header
    'header.search': 'Cari...',
    'header.notifications': 'Notifikasi',
    'header.profile': 'Profil',
    'header.welcome': 'Selamat Datang',
    'header.logout': 'Keluar',
    
    // Dashboard
    'dashboard.title': 'Beranda',
    'dashboard.desc': 'Ringkasan Aktivitas Koperasi',
    'dashboard.welcome': 'Selamat Datang',
    'dashboard.summary': 'Berikut adalah ringkasan aktivitas koperasi hari ini.',
    'dashboard.total_members': 'Total Anggota',
    'dashboard.active': 'Aktif',
    'dashboard.total_savings': 'Total Simpanan',
    'dashboard.safe': 'Aman',
    'dashboard.circulating_loans': 'Pinjaman Beredar',
    'dashboard.controlled': 'Terkendali',
    'dashboard.estimated_shu': 'Estimasi SHU',
    'dashboard.profit': 'Profit',
    'dashboard.my_savings': 'Simpanan Saya',
    'dashboard.total': 'Total',
    'dashboard.active_loans': 'Pinjaman Aktif',
    'dashboard.running': 'Berjalan',
    'dashboard.shu_received': 'SHU Diterima',
    'dashboard.dividend': 'Dividen',
    'dashboard.account_status': 'Status Akun',
    'dashboard.verified': 'Terverifikasi',
    'dashboard.pending': 'Pending',
    'dashboard.kyc': 'KYC',
    'dashboard.system_online': 'Sistem Online',
    'dashboard.financial_growth': 'Pertumbuhan Finansial',
    'dashboard.savings': 'Simpanan',
    'dashboard.loans': 'Pinjaman',
    'dashboard.recent_activities': 'Aktivitas Terbaru',
    'dashboard.total_loans': 'Total Pinjaman',
    'dashboard.recent_activity': 'Aktivitas Terbaru',
    
    // Members
    'members.title': 'Data Anggota',
    'members.desc': 'Kelola data anggota koperasi',
    'members.search': 'Cari anggota...',
    'members.download_csv': 'Unduh CSV',
    'members.download_pdf': 'Unduh PDF',
    'members.actions': 'Aksi',
    'members.name': 'Nama',
    'members.email': 'Email',
    'members.type': 'Tipe',
    'members.status': 'Status',
    'members.detail': 'Detail',
    'members.print': 'Cetak',
    'members.no_members': 'Belum ada anggota',
    'members.id': 'ID Anggota',
    'members.full_name': 'Nama Lengkap',
    'members.nik': 'NIK',
    'members.phone': 'No. HP',
    'members.address': 'Alamat',
    'members.join_date': 'Tanggal Daftar',
    'members.documents': 'Dokumen e-KYC',
    'members.ktp': 'Foto KTP',
    'members.selfie': 'Foto Selfie',
    'members.no_data': 'Tidak ada',
    
    // Savings
    'savings.title': 'Simpanan',
    'savings.desc': 'Kelola simpanan anggota',
    'savings.my_savings': 'Simpanan Saya',
    'savings.all_members': 'Semua Anggota',
    'savings.total': 'Total Simpanan',
    'savings.member': 'Anggota',
    'savings.amount': 'Jumlah',
    'savings.date': 'Tanggal',
    'savings.download_pdf': 'Unduh PDF',
    'savings.no_savings': 'Belum ada data simpanan',
    
    // Loans
    'loans.title': 'Pinjaman',
    'loans.desc': 'Kelola pinjaman anggota',
    'loans.member_name': 'Nama Anggota',
    'loans.amount': 'Jumlah Pinjaman',
    'loans.interest_rate': 'Suku Bunga',
    'loans.status': 'Status',
    'loans.date': 'Tanggal',
    'loans.no_loans': 'Belum ada pinjaman',
    'loans.request_loan': 'Ajukan Pinjaman',
    
    // Finance
    'finance.title': 'Keuangan',
    'finance.desc': 'Laporan keuangan koperasi',
    'finance.income': 'Pendapatan',
    'finance.expense': 'Pengeluaran',
    'finance.balance': 'Saldo',
    'finance.download_pdf': 'Unduh PDF',
    
    // Approvals
    'approvals.title': 'Persetujuan',
    'approvals.desc': 'Kelola persetujuan pendaftaran dan pinjaman',
    'approvals.members': 'Pendaftaran (Anggota)',
    'approvals.loans': 'Pinjaman',
    'approvals.pending': 'Menunggu Persetujuan',
    'approvals.approve': 'Setujui',
    'approvals.reject': 'Tolak',
    'approvals.loading': 'Memuat data persetujuan...',
    
    // Settings
    'settings.title': 'Pengaturan',
    'settings.desc': 'Kelola preferensi akun dan aplikasi Anda',
    'settings.preferences': 'Preferensi',
    'settings.language': 'Bahasa',
    'settings.language_desc': 'Pilih bahasa antarmuka aplikasi',
    'settings.theme': 'Mode Tampilan',
    'settings.theme_desc': 'Pilih mode terang atau gelap',
    'settings.light': 'Terang',
    'settings.dark': 'Gelap',
    'settings.cooperative_info': 'Informasi Koperasi',
    'settings.coop_name': 'Nama Koperasi',
    'settings.phone': 'Nomor Telepon',
    'settings.address': 'Alamat Kantor',
    'settings.financial_rules': 'Aturan Finansial',
    'settings.loan_interest': 'Bunga Pinjaman (%)',
    'settings.withdrawal_fee': 'Biaya Admin Penarikan (Rp)',
    'settings.min_deposit': 'Min. Setoran (Rp)',
    'settings.payment_gateway': 'Gerbang Pembayaran',
    'settings.provider': 'Provider',
    'settings.mode': 'Mode',
    'settings.sandbox': 'Sandbox',
    'settings.production': 'Production',
    'settings.api_key': 'API Key',
    'settings.save_all': 'Simpan Semua',
    'settings.danger_zone': 'Zona Bahaya',
    'settings.reset_system': 'Reset Sistem',
    'settings.app_version': 'Versi Aplikasi',
    'settings.check_updates': 'Periksa Pembaruan',
    'settings.up_to_date': 'Aplikasi Anda sudah menggunakan versi terbaru (v1.2.0-stable).',
    'settings.otp_verification': 'Verifikasi OTP',
    'settings.otp_description': 'Aktifkan verifikasi kode OTP untuk transaksi kritikal',
    'settings.enable_otp': 'Aktifkan OTP',
    'settings.disable_otp': 'Nonaktifkan OTP',
    'settings.otp_enabled': '✓ OTP Aktif',
    'settings.otp_disabled': '○ OTP Tidak Aktif',
    
    // Common
    'common.loading': 'Memuat...',
    'common.error': 'Terjadi kesalahan',
    'common.success': 'Berhasil',
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.delete': 'Hapus',
    'common.edit': 'Edit',
    'common.view': 'Lihat',
    'common.close': 'Tutup',
    'common.back': 'Kembali',
    'common.yes': 'Ya',
    'common.no': 'Tidak',
    'common.active': 'Aktif',
    'common.inactive': 'Tidak Aktif',
    'common.pending': 'Menunggu',
    'common.approved': 'Disetujui',
    'common.rejected': 'Ditolak',
    'common.print': 'Cetak',
    'common.export': 'Ekspor',
    'common.download': 'Unduh',
    'common.history': 'Riwayat',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.members': 'Members',
    'nav.savings': 'Savings',
    'nav.loans': 'Loans',
    'nav.finance': 'Finance',
    'nav.complaints': 'Complaints',
    'nav.approvals': 'Approvals',
    'nav.settings': 'Settings',
    'nav.payment': 'Deposit / Pay',
    'nav.loan_request': 'Request Loan',
    'nav.payment_gateway': 'Payment Gateway',
    'nav.reports': 'Reports',
    'nav.withdrawals': 'Withdrawals',
    'nav.audit_logs': 'Audit Logs',
    'nav.logout': 'Logout',
    
    // Header
    'header.search': 'Search...',
    'header.notifications': 'Notifications',
    'header.profile': 'Profile',
    'header.welcome': 'Welcome',
    'header.logout': 'Logout',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.desc': 'Cooperative Activity Summary',
    'dashboard.summary': 'Here is a summary of cooperative activities today.',
    'dashboard.welcome': 'Welcome',
    'dashboard.total_members': 'Total Members',
    'dashboard.active': 'Active',
    'dashboard.total_savings': 'Total Savings',
    'dashboard.safe': 'Safe',
    'dashboard.circulating_loans': 'Circulating Loans',
    'dashboard.controlled': 'Controlled',
    'dashboard.estimated_shu': 'Estimated SHU',
    'dashboard.profit': 'Profit',
    'dashboard.my_savings': 'My Savings',
    'dashboard.total': 'Total',
    'dashboard.active_loans': 'Active Loans',
    'dashboard.running': 'Running',
    'dashboard.shu_received': 'SHU Received',
    'dashboard.dividend': 'Dividend',
    'dashboard.account_status': 'Account Status',
    'dashboard.verified': 'Verified',
    'dashboard.pending': 'Pending',
    'dashboard.kyc': 'KYC',
    'dashboard.system_online': 'System Online',
    'dashboard.financial_growth': 'Financial Growth',
    'dashboard.savings': 'Savings',
    'dashboard.loans': 'Loans',
    'dashboard.recent_activities': 'Recent Activities',
    'dashboard.total_loans': 'Total Loans',
    'dashboard.recent_activity': 'Recent Activity',
    
    // Members
    'members.title': 'Member Data',
    'members.desc': 'Manage cooperative member data',
    'members.search': 'Search members...',
    'members.download_csv': 'Download CSV',
    'members.download_pdf': 'Download PDF',
    'members.actions': 'Actions',
    'members.name': 'Name',
    'members.email': 'Email',
    'members.type': 'Type',
    'members.status': 'Status',
    'members.detail': 'Detail',
    'members.print': 'Print',
    'members.no_members': 'No members yet',
    'members.id': 'Member ID',
    'members.full_name': 'Full Name',
    'members.nik': 'NIK',
    'members.phone': 'Phone Number',
    'members.address': 'Address',
    'members.join_date': 'Join Date',
    'members.documents': 'e-KYC Documents',
    'members.ktp': 'ID Photo',
    'members.selfie': 'Selfie Photo',
    'members.no_data': 'No data',
    
    // Savings
    'savings.title': 'Savings',
    'savings.desc': 'Manage member savings',
    'savings.my_savings': 'My Savings',
    'savings.all_members': 'All Members',
    'savings.total': 'Total Savings',
    'savings.member': 'Member',
    'savings.amount': 'Amount',
    'savings.date': 'Date',
    'savings.download_pdf': 'Download PDF',
    'savings.no_savings': 'No savings data yet',
    
    // Loans
    'loans.title': 'Loans',
    'loans.desc': 'Manage member loans',
    'loans.member_name': 'Member Name',
    'loans.amount': 'Loan Amount',
    'loans.interest_rate': 'Interest Rate',
    'loans.status': 'Status',
    'loans.date': 'Date',
    'loans.no_loans': 'No loans yet',
    'loans.request_loan': 'Request Loan',
    
    // Finance
    'finance.title': 'Finance',
    'finance.desc': 'Cooperative financial reports',
    'finance.income': 'Income',
    'finance.expense': 'Expense',
    'finance.balance': 'Balance',
    'finance.download_pdf': 'Download PDF',
    
    // Approvals
    'approvals.title': 'Approvals',
    'approvals.desc': 'Manage registration and loan approvals',
    'approvals.members': 'Registration (Members)',
    'approvals.loans': 'Loans',
    'approvals.pending': 'Pending Approval',
    'approvals.approve': 'Approve',
    'approvals.reject': 'Reject',
    'approvals.loading': 'Loading approval data...',
    
    // Settings
    'settings.title': 'Settings',
    'settings.desc': 'Manage your account and application preferences',
    'settings.preferences': 'Preferences',
    'settings.language': 'Language',
    'settings.language_desc': 'Select application interface language',
    'settings.theme': 'Display Theme',
    'settings.theme_desc': 'Choose light or dark mode',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.cooperative_info': 'Cooperative Info',
    'settings.coop_name': 'Cooperative Name',
    'settings.phone': 'Phone Number',
    'settings.address': 'Office Address',
    'settings.financial_rules': 'Financial Rules',
    'settings.loan_interest': 'Loan Interest Rate (%)',
    'settings.withdrawal_fee': 'Withdrawal Admin Fee (Rp)',
    'settings.min_deposit': 'Min. Deposit (Rp)',
    'settings.payment_gateway': 'Payment Gateway',
    'settings.provider': 'Provider',
    'settings.mode': 'Mode',
    'settings.sandbox': 'Sandbox',
    'settings.production': 'Production',
    'settings.api_key': 'API Key',
    'settings.save_all': 'Save All',
    'settings.danger_zone': 'Danger Zone',
    'settings.reset_system': 'Reset System',
    'settings.app_version': 'App Version',
    'settings.check_updates': 'Check for Updates',
    'settings.up_to_date': 'Your app is up to date (v1.2.0-stable).',
    'settings.otp_verification': 'OTP Verification',
    'settings.otp_description': 'Enable OTP code verification for critical transactions',
    'settings.enable_otp': 'Enable OTP',
    'settings.disable_otp': 'Disable OTP',
    'settings.otp_enabled': '✓ OTP Enabled',
    'settings.otp_disabled': '○ OTP Disabled',
    
    // Common
    'common.loading': 'Memuat...',
    'common.error': 'Terjadi kesalahan',
    'common.success': 'Berhasil',
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.delete': 'Hapus',
    'common.edit': 'Edit',
    'common.view': 'Lihat',
    'common.close': 'Tutup',
    'common.back': 'Kembali',
    'common.yes': 'Ya',
    'common.no': 'Tidak',
    'common.active': 'Aktif',
    'common.inactive': 'Tidak Aktif',
    'common.pending': 'Menunggu',
    'common.approved': 'Disetujui',
    'common.rejected': 'Ditolak',
    'common.print': 'Cetak',
    'common.export': 'Ekspor',
    'common.download': 'Unduh',
    'common.history': 'Riwayat',
    
    // Additional pages
    'page.withdrawals': 'Penarikan',
    'page.complaints': 'Pengaduan',
    'page.reports': 'Laporan',
    'page.payment_gateway': 'Gerbang Pembayaran',
    'page.payment_history': 'Riwayat Pembayaran',
    'page.member_dashboard': 'Beranda Anggota',
    'page.loan_request': 'Ajukan Pinjaman',
    'page.member_reports': 'Laporan & Riwayat',
    'page.digital_card': 'Kartu Digital',
    'page.audit_logs': 'Audit Log',
    'page.shu_distribution': 'Distribusi SHU',
    'page.monthly_reports': 'Laporan Bulanan',
    'page.advanced_filter': 'Filter Lanjutan',
    'page.email_settings': 'Pengaturan Email',
    'page.profile': 'Profil',
    'page.onboarding': 'Registrasi',
    'page.landing': 'Beranda',
    'page.member_statement': 'Laporan Rekening',
    'page.loan_payment_history': 'Riwayat Pembayaran Pinjaman',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    const saved = localStorage.getItem('app_language') as Language;
    if (saved && (saved === 'id' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string) => {
    const value = translations[language]?.[key];
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
