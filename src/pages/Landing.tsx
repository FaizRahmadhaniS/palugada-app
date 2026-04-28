import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Users, TrendingUp, ArrowRight, CheckCircle2, BarChart3, Lock, Smartphone, Star } from 'lucide-react';

const GG = 'linear-gradient(135deg,#10b981 0%,#059669 55%,#047857 100%)';
const GS = '0 8px 28px rgba(5,150,105,0.34)';

/* Animated section wrapper */
function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const visible = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref}
      animate={visible ? { opacity:1, y:0 } : { opacity:0, y:28 }}
      initial={{ opacity:0, y:28 }}
      transition={{ duration:0.6, delay, ease:[0.22,1,0.36,1] }}>
      {children}
    </motion.div>
  );
}

const feats = [
  { Icon: ShieldCheck, t:'Keamanan Berlapis',  d:'Data anggota dilindungi enkripsi bank-grade dengan autentikasi dua faktor (2FA) terintegrasi.',          c:'#059669', bg:'#ecfdf5' },
  { Icon: Zap,         t:'Real-time & Cepat',  d:'Setiap transaksi tercatat dan tersinkronisasi secara langsung tanpa jeda waktu.',                          c:'#0d9488', bg:'#f0fdfa' },
  { Icon: BarChart3,   t:'Laporan Otomatis',   d:'Laporan keuangan, SHU, dan rekening anggota dihasilkan secara otomatis setiap bulan.',                      c:'#16a34a', bg:'#f0fdf4' },
  { Icon: Smartphone,  t:'Akses Kapan Saja',   d:'Dapat diakses dari perangkat apa pun — desktop, tablet, maupun ponsel dengan tampilan responsif.',          c:'#047857', bg:'#ecfdf5' },
  { Icon: Users,       t:'Manajemen Anggota',  d:'Kelola data, status, dan riwayat transaksi setiap anggota dengan antarmuka yang intuitif.',                  c:'#0f766e', bg:'#f0fdfa' },
  { Icon: Lock,        t:'KYC & Verifikasi',   d:'Proses verifikasi NIK dan dokumen anggota terintegrasi langsung dalam satu alur pendaftaran.',               c:'#15803d', bg:'#f0fdf4' },
];

const stats = [
  { v:'10.000+', l:'Anggota Aktif',   Icon:Users },
  { v:'Rp 50M+', l:'Dana Dikelola',   Icon:TrendingUp },
  { v:'99.9%',   l:'Uptime Sistem',   Icon:Zap },
  { v:'4.9 / 5', l:'Rating Kepuasan', Icon:Star },
];

const steps = [
  { n:'01', t:'Daftar Akun',    d:'Buat akun koperasi dalam hitungan menit. Verifikasi identitas dan langsung siap digunakan.' },
  { n:'02', t:'Tambah Anggota', d:'Impor data anggota atau daftarkan manual. NIK divalidasi otomatis lewat sistem KYC kami.' },
  { n:'03', t:'Kelola Semua',   d:'Catat simpanan, pinjaman, dan keuangan. Lihat laporan real-time dari dashboard utama.' },
];

export default function Landing() {
  return (
    <div style={{ minHeight:'100vh', background:'#fff', color:'#111827', fontFamily:'Inter,system-ui,sans-serif', overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        a{text-decoration:none;color:inherit}
        .lnd-nav-link{font-size:14px;font-weight:500;color:#6b7280;transition:color .2s}
        .lnd-nav-link:hover{color:#059669}
        .lnd-card{transition:transform .28s,box-shadow .28s}
        .lnd-card:hover{transform:translateY(-5px);box-shadow:0 20px 40px rgba(5,150,105,.1)!important}
        .lnd-cta-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 30px;background:${GG};color:#fff;font-weight:700;font-size:14px;border-radius:14px;box-shadow:${GS};transition:all .2s}
        .lnd-cta-btn:hover{transform:translateY(-2px);box-shadow:0 12px 36px rgba(5,150,105,.45)}
        .lnd-out-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 30px;color:#374151;font-weight:600;font-size:14px;border-radius:14px;border:2px solid #e5e7eb;transition:all .2s}
        .lnd-out-btn:hover{border-color:#a7f3d0;color:#059669}
        .green-text{background:linear-gradient(135deg,#059669,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
      `}</style>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(16px)', borderBottom:'1px solid #f3f4f6' }}>
        <div style={{ maxWidth:1160, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:GG, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(5,150,105,.3)' }}>
              <span style={{ color:'#fff', fontWeight:900, fontSize:14 }}>P</span>
            </div>
            <span style={{ fontSize:18, fontWeight:900, color:'#111827' }}>Palugada<span style={{ color:'#10b981' }}>.</span></span>
          </div>
          <div style={{ display:'flex', gap:28 }}>
            <a href="#fitur" className="lnd-nav-link">Fitur</a>
            <a href="#cara-kerja" className="lnd-nav-link">Cara Kerja</a>
            <a href="#statistik" className="lnd-nav-link">Statistik</a>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Link to="/login" className="lnd-nav-link">Masuk</Link>
            <Link to="/login" className="lnd-cta-btn" style={{ padding:'9px 20px', fontSize:13 }}>Daftar Gratis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position:'relative', paddingTop:144, paddingBottom:96, textAlign:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, right:0, width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,.06),transparent)', transform:'translate(32%,-32%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:0, left:0, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(5,150,105,.05),transparent)', transform:'translate(-32%,32%)', pointerEvents:'none' }} />

        <div style={{ maxWidth:820, margin:'0 auto', padding:'0 24px', position:'relative' }}>
          <FadeUp>
            <span style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:50, background:'#ecfdf5', color:'#065f46', fontSize:12, fontWeight:700, marginBottom:24, border:'1px solid #a7f3d0' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'lnd-pulse 1.8s infinite' }} />
              Platform Koperasi Digital Terpercaya
            </span>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 style={{ fontSize:'clamp(36px,5.5vw,66px)', fontWeight:900, lineHeight:1.06, color:'#111827', margin:'0 0 22px', letterSpacing:'-0.02em' }}>
              Koperasi Modern,<br />
              <span className="green-text">Transparan & Efisien</span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p style={{ fontSize:'clamp(15px,2vw,18px)', color:'#6b7280', lineHeight:1.75, marginBottom:36, maxWidth:580, margin:'0 auto 36px' }}>
              Palugada mendigitalisasi seluruh operasional koperasi Anda — simpan pinjam, laporan keuangan, hingga distribusi SHU — dalam satu platform yang aman dan mudah digunakan.
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, flexWrap:'wrap' }}>
              <Link to="/login" className="lnd-cta-btn">Mulai Gratis Sekarang <ArrowRight size={16} /></Link>
              <a href="#fitur" className="lnd-out-btn">Lihat Fitur</a>
            </div>
          </FadeUp>

          <FadeUp delay={0.4}>
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:24, marginTop:44 }}>
              {['Terenkripsi SSL','Backup Harian','KYC Terintegrasi','Open Source'].map(b => (
                <div key={b} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:500, color:'#9ca3af' }}>
                  <CheckCircle2 size={13} color="#10b981" /> {b}
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* STATS */}
      <section id="statistik" style={{ padding:'60px 24px', background:'#f9fafb', borderTop:'1px solid #f3f4f6', borderBottom:'1px solid #f3f4f6' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:28 }}>
          {stats.map(({ v, l, Icon }, i) => (
            <FadeUp key={l} delay={i * 0.08}>
              <div style={{ textAlign:'center' }}>
                <div style={{ width:48, height:48, borderRadius:14, background:GG, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 4px 14px rgba(5,150,105,.25)' }}>
                  <Icon size={20} color="#fff" />
                </div>
                <p style={{ fontSize:34, fontWeight:900, color:'#111827', margin:'0 0 3px', letterSpacing:'-0.02em' }}>{v}</p>
                <p style={{ fontSize:13, color:'#9ca3af', fontWeight:500 }}>{l}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="fitur" style={{ padding:'92px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <FadeUp>
            <div style={{ textAlign:'center', marginBottom:52 }}>
              <span style={{ fontSize:11, fontWeight:800, color:'#059669', textTransform:'uppercase', letterSpacing:'0.14em' }}>Fitur Unggulan</span>
              <h2 style={{ fontSize:'clamp(26px,3.8vw,42px)', fontWeight:900, color:'#111827', margin:'10px 0 14px', letterSpacing:'-0.02em' }}>Semua yang Koperasi Butuhkan</h2>
              <p style={{ fontSize:15, color:'#6b7280', maxWidth:500, margin:'0 auto' }}>Dirancang khusus untuk kebutuhan operasional koperasi Indonesia yang modern dan transparan.</p>
            </div>
          </FadeUp>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
            {feats.map(({ Icon, t, d, c, bg }, i) => (
              <FadeUp key={t} delay={i * 0.06}>
                <div className="lnd-card" style={{ padding:26, borderRadius:18, border:'1px solid #f3f4f6', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                  <div style={{ width:46, height:46, borderRadius:13, background:bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                    <Icon size={21} color={c} />
                  </div>
                  <h3 style={{ fontSize:14, fontWeight:700, color:'#111827', margin:'0 0 7px' }}>{t}</h3>
                  <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.65, margin:0 }}>{d}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="cara-kerja" style={{ padding:'92px 24px', background:'#f9fafb' }}>
        <div style={{ maxWidth:880, margin:'0 auto' }}>
          <FadeUp>
            <div style={{ textAlign:'center', marginBottom:52 }}>
              <span style={{ fontSize:11, fontWeight:800, color:'#059669', textTransform:'uppercase', letterSpacing:'0.14em' }}>Cara Kerja</span>
              <h2 style={{ fontSize:'clamp(26px,3.8vw,42px)', fontWeight:900, color:'#111827', margin:'10px 0', letterSpacing:'-0.02em' }}>Mulai dalam 3 Langkah</h2>
            </div>
          </FadeUp>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:36 }}>
            {steps.map(({ n, t, d }, i) => (
              <FadeUp key={n} delay={i * 0.1}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ width:62, height:62, borderRadius:17, background:GG, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:GS }}>
                    <span style={{ color:'#fff', fontWeight:900, fontSize:19 }}>{n}</span>
                  </div>
                  <h3 style={{ fontSize:16, fontWeight:700, color:'#111827', margin:'0 0 9px' }}>{t}</h3>
                  <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.7, margin:0 }}>{d}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'76px 24px' }}>
        <FadeUp>
          <div style={{ maxWidth:760, margin:'0 auto' }}>
            <div style={{ borderRadius:26, padding:'56px 44px', textAlign:'center', background:GG, boxShadow:'0 24px 60px rgba(5,150,105,.28)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 75% 25%,rgba(255,255,255,.14) 0%,transparent 55%)', pointerEvents:'none' }} />
              <div style={{ position:'relative', zIndex:1 }}>
                <h2 style={{ fontSize:'clamp(22px,3.5vw,34px)', fontWeight:900, color:'#fff', margin:'0 0 12px', lineHeight:1.2 }}>Siap Digitalisasi Koperasi Anda?</h2>
                <p style={{ fontSize:15, color:'rgba(255,255,255,.82)', marginBottom:28, fontWeight:400 }}>Bergabung bersama ribuan koperasi yang telah mempercayai Palugada. Mulai gratis hari ini.</p>
                <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'14px 30px', background:'#fff', color:'#059669', fontWeight:800, fontSize:14, borderRadius:14, boxShadow:'0 8px 24px rgba(0,0,0,.12)', transition:'all .2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform='translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform='translateY(0)'; }}>
                  Daftar Sekarang — Gratis <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid #f3f4f6', padding:'28px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:27, height:27, borderRadius:8, background:GG, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'#fff', fontWeight:900, fontSize:11 }}>P</span>
            </div>
            <span style={{ fontSize:15, fontWeight:900, color:'#111827' }}>Palugada<span style={{ color:'#10b981' }}>.</span></span>
          </div>
          <p style={{ fontSize:12, color:'#9ca3af', margin:0 }}>© 2026 Palugada. Platform Koperasi Digital Indonesia.</p>
          <div style={{ display:'flex', gap:18 }}>
            {['Privasi','Syarat','Kontak'].map(l => (
              <a key={l} href="#" className="lnd-nav-link" style={{ fontSize:12 }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`@keyframes lnd-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}
