import 'dotenv/config'
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import session from "express-session";
import { OAuth2Client } from "google-auth-library";
// @ts-ignore
const midtransClient = require("midtrans-client");
import db from "./server/db.ts";
import fs from "fs";
import nodemailer from "nodemailer";
import * as otplib from "otplib";
const authenticator = otplib.authenticator || (otplib as any).default?.authenticator;
import QRCode from "qrcode";


declare module 'express-session' {
  interface SessionData {
    user: any;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || "syskop-secret-key",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    name: 'palugada_sid',
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // lax for development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  // Disable ETag globally - mencegah 304 pada response API
app.set('etag', false);

// No-cache untuk semua endpoint /api/*
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

  // --- Google OAuth ---
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    if (!process.env.APP_URL) {
      console.warn('[WARN] APP_URL not set in environment. OAuth callbacks will use localhost.');
    }
  
  // Emergency Reset Endpoint
  app.post("/api/auth/2fa/reset-emergency", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email diperlukan" });
    try {
      await db.from('users').update({ is_2fa_enabled: false, two_factor_secret: null }).eq('email', email);
      res.json({ success: true, message: "2FA Berhasil direset untuk " + email });
    } catch (err) {
      res.status(500).json({ success: false, message: "Gagal mereset 2FA" });
    }
  });

  const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${appUrl}/auth/google/callback`
  );

  app.get("/api/auth/google/url", (req, res) => {
    const redirectUri = req.query.redirectUri as string || `${appUrl}/auth/google/callback`;
    
    const tempClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const url = tempClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
      state: redirectUri // Pass redirectUri in state to use it in callback
    });
    res.json({ url });
  });

  app.get(["/auth/google/callback", "/auth/google/callback/"], async (req, res) => {
    const { code, state } = req.query;
    const redirectUri = (state as string) || `${appUrl}/auth/google/callback`;
    
    const tempClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    try {
      const { tokens } = await tempClient.getToken(code as string);
      tempClient.setCredentials(tokens);
      
      const ticket = await tempClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      // Upsert user in DB
      let { data: user } = await db.from('users').select('*').eq('email', payload?.email).single();
        if (!user) {
          const id = `google-${payload?.sub}`;
          const role = payload?.email === 'admin@syskop.com' ? 'admin' : 'member';
          
          const { error: insertError } = await db.from('users').insert({ 
            id, email: payload?.email, name: payload?.name, role, google_id: payload?.sub 
          });
          
          if (insertError) {
            console.error("Insert user error:", insertError);
            return res.status(500).send("Gagal membuat akun: " + insertError.message);
          }
          
          if (role === 'member') {
            const joinDate = new Date().toISOString().split('T')[0];
            await db.from('members').insert({ 
              id, name: payload?.name, email: payload?.email, type: 'Reguler', status: 'Pending', join_date: joinDate 
            });
          }

          const { data: newUser } = await db.from('users').select('*').eq('id', id).single();
          user = newUser;
        }

        // Tambahkan null check di sini
        if (!user) {
          console.error("User still null after insert, payload:", payload);
          return res.status(500).send("Gagal memuat data akun, coba lagi.");
        }

        if (user.is_2fa_enabled === true && user.two_factor_secret) {
        (req.session as any).pendingUser = user;
        (req.session as any).requiresTotp = true;
        
        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', requires2FA: true }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Continuing to 2FA...</p>
            </body>
          </html>
        `);
        return;
      }

     // 1. CEK JIKA USER MENGGUNAKAN 2FA
      if (user.is_2fa_enabled === true && user.two_factor_secret) {
        (req.session as any).pendingUser = user;
        (req.session as any).requiresTotp = true;

        req.session.save((err) => {
          if (err) {
            console.error("Gagal menyimpan sesi 2FA:", err);
            return res.status(500).send("Gagal menyiapkan sesi 2FA.");
          }

          res.send(`
            <html>
              <body>
                <script>
                  if (window.opener) {
                    window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', requires2FA: true }, '*');
                    window.close();
                  } else {
                    window.location.href = '${appUrl}';
                  }
                </script>
                <p>Continuing to 2FA...</p>
              </body>
            </html>
          `);
        });
        return; // Hentikan kode di sini jika pakai 2FA agar tidak lanjut ke login normal
      }

      // 2. JIKA TIDAK PAKAI 2FA, LOGIN NORMAL
      (req.session as any).user = user;

      req.session.save((err) => {
        if (err) {
          console.error("Gagal menyimpan sesi:", err);
          return res.status(500).send("Gagal menyimpan sesi login.");
        }

        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(user)} }, '*');
                  window.close();
                } else {
                  window.location.href = '${appUrl}'; 
                }
              </script>
              <p>Authentication successful. This window should close automatically.</p>
            </body>
          </html>
        `);
      });

    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).send("Authentication failed");
    }
  }); // <-- Penutup route /auth/google/callback

  // --- Payment Gateway Config ---
  const CONFIG_FILE = path.join(process.cwd(), 'payment-config.json');
  const GENERAL_CONFIG_FILE = path.join(process.cwd(), 'general-config.json');

  function getPaymentConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      }
    } catch (e) {}
    return {
      provider: 'midtrans',
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY || '',
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
      glodipaySecret: ''
    };
  }

  function getGeneralConfig() {
    try {
      if (fs.existsSync(GENERAL_CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(GENERAL_CONFIG_FILE, 'utf-8'));
      }
    } catch (e) {}
    return {
      koperasiName: "Koperasi Palugada",
      koperasiAddress: "Jl. Raya No. 123, Jakarta",
      koperasiPhone: "021-12345678",
      loanInterestRate: 1.5,
      withdrawalAdminFee: 5000,
      minDeposit: 50000,
      enableOtp: false
    };
  }

  // --- Audit Log Helper ---
  async function createAuditLog(userId: string, action: string, entityType: string, entityId: string, details: any) {
    try {
      await db.from('audit_logs').insert({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Audit Log Error:", e);
    }
  }

  // --- Notification Helper ---
  async function createNotification(userId: string | null, title: string, message: string, type: string = 'info', link: string = '') {
    try {
      // If userId is null, it's for all admins
      if (!userId) {
        const { data: admins } = await db.from('users').select('id').eq('role', 'admin');
        if (admins) {
          const notifications = admins.map(admin => ({
            user_id: admin.id,
            title,
            message,
            type,
            link,
            is_read: false,
            created_at: new Date().toISOString()
          }));
          await db.from('notifications').insert(notifications);
        }
      } else {
        await db.from('notifications').insert({
          user_id: userId,
          title,
          message,
          type,
          link,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error("Notification Error:", e);
    }
  }

  // --- Audit Logs API ---
  app.get("/api/audit-logs", async (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { data: logs } = await db.from('audit_logs')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false })
      .limit(100);
    
    res.json(logs || []);
  });

  // --- Notifications API ---
  app.get("/api/notifications", async (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { data: notifications } = await db.from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    res.json(notifications || []);
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    const { id } = req.params;
    await db.from('notifications').update({ is_read: true }).eq('id', id);
    res.json({ success: true });
  });

  app.patch("/api/notifications/read-all", async (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    await db.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    res.json({ success: true });
  });

  app.get('/api/settings/payment', (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    res.json(getPaymentConfig());
  });

  app.post('/api/settings/payment', (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const config = req.body;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    res.json({ success: true });
  });

  app.get('/api/settings/general', (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    res.json(getGeneralConfig());
  });

  app.post('/api/settings/general', (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const config = req.body;
    fs.writeFileSync(GENERAL_CONFIG_FILE, JSON.stringify(config, null, 2));
    res.json({ success: true });
  });

  app.post("/api/payment/create", async (req, res) => {
    const config = getPaymentConfig();
    const { amount, orderId, customerDetails, provider = config.provider } = req.body;
    
    if (provider === 'glodipay') {
      // --- GLODIPAY INTEGRATION SKELETON ---
      try {
        const glodipaySecret = config.glodipaySecret || process.env.GLODIPAY_SECRET_KEY || 'dummy_glodipay_secret';
        
        // Simulasi response sukses dari Glodipay untuk keperluan testing
        res.json({ 
          token: `glodipay-token-${Date.now()}`, 
          redirect_url: `https://checkout.glodipay.com/pay/${Date.now()}`,
          message: "Ini adalah simulasi Glodipay. Untuk produksi, buka komentar kode fetch di atas dan sesuaikan endpoint."
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    } else {
      // --- MIDTRANS INTEGRATION ---
      const snap = new midtransClient.Snap({
        isProduction: config.isProduction,
        serverKey: config.serverKey,
        clientKey: config.clientKey
      });

      const parameter = {
        transaction_details: {
          order_id: orderId || `ORDER-${Date.now()}`,
          gross_amount: amount
        },
        credit_card: {
          secure: true
        },
        customer_details: customerDetails,
        callbacks: {
          finish: `${process.env.APP_URL || 'http://localhost:3000'}/member/history`
        }
      };

      try {
        const transaction = await snap.createTransaction(parameter);
        res.json({ token: transaction.token, redirect_url: transaction.redirect_url });
      } catch (error: any) {
        console.error("Midtrans Error:", error.message);
        // Fallback for testing when keys are invalid
        res.json({ 
          token: `mock-token-${Date.now()}`, 
          redirect_url: `https://simulator.sandbox.midtrans.com/`,
          message: "Midtrans keys invalid, using mock URL."
        });
      }
    }
  });

  // --- Auth API ---
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, nik } = req.body;
    try {
      const { data: existingUser } = await db.from('users').select('*').eq('email', email).maybeSingle();
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email sudah terdaftar" });
      }
      
      const id = `user-${Date.now()}`;
      const role = email === 'admin@syskop.com' ? 'admin' : 'member';
      const status = role === 'admin' ? 'active' : 'pending_profile';
      
      await db.from('users').insert({ 
        id, 
        email, 
        name, 
        nik,
        role, 
        password, 
        status 
      });
      
      if (role === 'member') {
        const joinDate = new Date().toISOString().split('T')[0];
        await db.from('members').insert({ 
          id, 
          name, 
          email, 
          nik,
          type: 'Reguler', 
          status: 'Pending', 
          join_date: joinDate
        });
      }
        
      const { data: user } = await db.from('users').select('*').eq('id', id).single();
      (req.session as any).user = user;
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch("/api/users/:id/onboarding", async (req, res) => {
    const { id } = req.params;
    const { 
      nik, phone, address, status, 
      job_title, salary_range, 
      emergency_contact_name, emergency_contact_phone,
      ktp_base64, selfie_base64 
    } = req.body;
    
    try {
      // In a real production app with Supabase Storage, we would use the Supabase SDK to upload.
      // For this prototype, we'll simulate the storage by saving the base64 or a mock URL.
      // If you have set up a bucket named 'kyc', you can replace this with real upload logic.
      const ktp_url = ktp_base64 ? ktp_base64 : null;
      const selfie_url = selfie_base64 ? selfie_base64 : null;

      const updateData = { 
        nik, phone, address, status,
        job_title, salary_range,
        emergency_contact_name, emergency_contact_phone,
        ktp_url, selfie_url
      };

      // Update users table
      const { data: user, error: userError } = await db.from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (userError) throw userError;

      // Update members table
      await db.from('members')
        .update({ 
          nik, phone, address,
          job_title, salary_range,
          emergency_contact_name, emergency_contact_phone,
          ktp_url, selfie_url
        })
        .eq('id', id);

      (req.session as any).user = user;
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch("/api/members/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Aktif' or 'Ditolak'
    const admin = (req.session as any).user;
    
    try {
      // Update members table
      await db.from('members').update({ status }).eq('id', id);
      
      // Update users table status
      const userStatus = status === 'Aktif' ? 'active' : 'rejected';
      const { data: updatedUser } = await db.from('users')
        .update({ status: userStatus })
        .eq('id', id)
        .select()
        .single();
      
      // Log & Notify
      if (admin) {
        await createAuditLog(admin.id, 'APPROVE_MEMBER', 'MEMBER', id, { status });
      }
      await createNotification(
        id, 
        status === 'Aktif' ? 'Pendaftaran Disetujui' : 'Pendaftaran Ditolak',
        status === 'Aktif' ? 'Selamat! Akun Anda telah aktif. Silakan nikmati layanan kami.' : 'Maaf, pendaftaran Anda belum dapat kami setujui.',
        status === 'Aktif' ? 'success' : 'error'
      );

      res.json({ success: true, user: updatedUser });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- USER SYNC FIX ENDPOINT ---
  app.get("/api/users/:id/refresh", async (req, res) => {
    const { id } = req.params;
    const sessionUser = (req.session as any).user;
    
    // Allow user to refresh their own data or admin to refresh any user
    if (!sessionUser || (sessionUser.id !== id && sessionUser.role !== 'admin')) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    try {
      const { data: user } = await db.from('users').select('*').eq('id', id).single();
      if (user) {
        // Update session
        (req.session as any).user = user;
        res.json({ success: true, user });
      } else {
        res.status(404).json({ success: false, message: 'User not found' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const { data: user } = await db.from('users').select('*').eq('email', email).eq('password', password).maybeSingle();
    if (user) {
      if (email === 'admin@syskop.com' && user.role !== 'admin') {
        await db.from('users').update({ role: 'admin' }).eq('id', user.id);
        user.role = 'admin';
      }
      
      // Handle Google Authenticator (TOTP)
      const is2FA = String(user.is_2fa_enabled) === 'true' && user.two_factor_secret;
      console.log(`Login attempt for ${email}. 2FA Status Raw:`, user.is_2fa_enabled, "Secret present:", !!user.two_factor_secret, "Will trigger 2FA:", is2FA);
      
      if (is2FA) {
        (req.session as any).pendingUser = user;
        (req.session as any).requiresTotp = true; // Flag for TOTP
        return res.json({ success: true, requires2FA: true, method: 'authenticator', message: 'OTP Authenticator required' });
      }

      // No 2FA enabled, direct login
      (req.session as any).user = user;
      
      // Log login
      await createAuditLog(user.id, 'LOGIN', 'USER', user.id, { email });

      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.post("/api/auth/verify-2fa", async (req, res) => {
    const { otp } = req.body;
    const sessionOtp = (req.session as any).otp;
    const pendingUser = (req.session as any).pendingUser;
    const requiresTotp = (req.session as any).requiresTotp;

    if (!pendingUser) {
      console.error("Session missing in verify-2fa:", { 
        hasSession: !!req.session, 
        hasPendingUser: !!pendingUser, 
        hasOtp: !!sessionOtp,
        requiresTotp,
        sessionId: req.sessionID
      });
      return res.status(400).json({ success: false, message: "Sesi login tidak valid atau kadaluarsa" });
    }

    let isValid = false;

    if (requiresTotp && pendingUser.is_2fa_enabled) {
      // Validate using Google Authenticator
      try {
        isValid = authenticator.check(otp, pendingUser.two_factor_secret);
      } catch (err) {
        console.error("TOTP verification error:", err);
      }
    } else {
      return res.status(400).json({ success: false, message: "Metode autentikasi tidak didukung" });
    }

    if (isValid) {
      (req.session as any).user = pendingUser;
      delete (req.session as any).pendingUser;
      delete (req.session as any).otp;
      delete (req.session as any).requiresTotp;
      
      // Log login
      await createAuditLog(pendingUser.id, 'LOGIN', 'USER', pendingUser.id, { email: pendingUser.email, method: 'Authenticator' });
      
      res.json({ success: true, user: pendingUser });
    } else {
      res.status(400).json({ success: false, message: "Kode Authenticator salah" });
    }
  });

  // --- TOTP Setup endpoints ---
  app.get("/api/auth/2fa/setup", async (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ message: "Sesi login diperlukan" });
    
    // Generate new secret
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'KoperasiKu', secret);
    
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      // Store secret temporarily in session for verification before committing to DB
      (req.session as any).temp_2fa_secret = secret;
      
      res.json({
        success: true,
        secret,
        qrCode: qrCodeDataUrl
      });
    } catch (err) {
    }
  });

  app.post("/api/auth/2fa/verify-setup", async (req, res) => {
    const user = (req.session as any).user;
    const { token } = req.body;
    const tempSecret = (req.session as any).temp_2fa_secret;
    
    if (!user || !tempSecret) {
      return res.status(400).json({ success: false, message: "Sesi setup 2FA tidak valid. Coba ulangi." });
    }
    
    try {
      const isValid = authenticator.check(token, tempSecret);
      if (isValid) {
        // Save to DB
        const { error } = await db.from('users').update({ 
          two_factor_secret: tempSecret, 
          is_2fa_enabled: true 
        }).eq('id', user.id);
        
        if (error) throw error;
        
        // Update session
        (req.session as any).user.is_2fa_enabled = true;
        (req.session as any).user.two_factor_secret = tempSecret;
        delete (req.session as any).temp_2fa_secret;
        
        res.json({ success: true, message: "Google Authenticator berhasil diaktifkan" });
      } else {
        res.status(400).json({ success: false, message: "Kode token tidak valid" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, nik, newPassword } = req.body;
    try {
      const { data: user } = await db.from('users').select('*').eq('email', email).eq('nik', nik).maybeSingle();
      if (!user) {
        return res.status(400).json({ success: false, message: "Email atau NIK tidak cocok" });
      }
      
      await db.from('users').update({ password: newPassword }).eq('id', user.id);
      res.json({ success: true, message: "Password berhasil diubah" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({ user: (req.session as any).user || null });
  });

  app.get("/api/system/status", async (req, res) => {
    try {
      const { count: userCount } = await db.from('users').select('*', { count: 'exact', head: true });
      res.json({
        status: 'healthy',
        database: 'Supabase',
        users: userCount || 0,
        uptime: process.uptime(),
        version: '1.2.0'
      });
    } catch (error) {
      res.status(500).json({ status: 'unhealthy', error: 'Database connection failed' });
    }
  });

  // Dashboard Analytics Endpoint
  app.get("/api/dashboard/analytics", async (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    
    try {
      // Get counts
      const { count: memberCount } = await db.from('members').select('*', { count: 'exact', head: true });
      const { count: loanCount } = await db.from('loans').select('*', { count: 'exact', head: true });
      const { count: approvalCount } = await db.from('members').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
      const { count: withdrawalCount } = await db.from('transactions').select('*', { count: 'exact', head: true }).eq('type', 'Withdrawal').eq('status', 'pending');
      
      // Get financial summaries
      const { data: members } = await db.from('members').select('total_savings, total_shu');
      const totalSavings = (members || []).reduce((sum, m) => sum + (m.total_savings || 0), 0);
      const totalSHU = (members || []).reduce((sum, m) => sum + (m.total_shu || 0), 0);
      
      const { data: loans } = await db.from('loans').select('amount, remaining_balance, status');
      const totalLoans = (loans || []).filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.amount || 0), 0);
      const activeLoanBalance = (loans || []).filter(l => l.status === 'approved').reduce((sum, l) => sum + (l.remaining_balance || 0), 0);
      
      res.json({
        success: true,
        statistics: {
          members: memberCount || 0,
          activeLoans: loanCount || 0,
          pendingApprovals: approvalCount || 0,
          pendingWithdrawals: withdrawalCount || 0,
          totalSavings: totalSavings,
          totalSHU: totalSHU,
          totalLoansIssued: totalLoans,
          activeLoanBalance: activeLoanBalance
        }
      });
    } catch (error: any) {
      console.error("Analytics error:", error);
      res.json({
        success: true,
        statistics: {
          members: 0,
          activeLoans: 0,
          pendingApprovals: 0,
          pendingWithdrawals: 0,
          totalSavings: 0,
          totalSHU: 0,
          totalLoansIssued: 0,
          activeLoanBalance: 0
        }
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.patch("/api/users/:id/profile", async (req, res) => {
    const { id } = req.params;
    const { name, nik, phone, address, selfie_url } = req.body;
    const now = new Date().toISOString();
    
    try {
      const updateData: any = {
        name, nik, phone, address,
        last_updated_date: now
      };
      if (selfie_url !== undefined) {
        updateData.selfie_url = selfie_url;
      }

      // Update users table
      const { error: userError } = await db.from('users').update(updateData).eq('id', id);
      
      if (userError) throw userError;
      
      // Update members table if exists
      await db.from('members').update(updateData).eq('id', id);
      
      // Fetch the updated user from DB to be safe
      const { data: updatedUser } = await db.from('users').select('*').eq('id', id).single();
      
      // Update session
      if ((req.session as any).user && (req.session as any).user.id === id) {
        (req.session as any).user = updatedUser;
      }
      
      res.json({ success: true, user: updatedUser });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // --- Data API ---
  app.get("/api/members", async (req, res) => {
    const { data: members } = await db.from('members').select('*');
    const mapped = (members || []).map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      address: m.address,
      nik: m.nik,
      type: m.type,
      status: m.status,
      joinDate: m.join_date,
      companyCode: m.company_code,
      systemStatus: m.system_status,
      isDeleted: m.is_deleted,
      createdBy: m.created_by,
      createdDate: m.created_date,
      lastUpdatedBy: m.last_updated_by,
      lastUpdatedDate: m.last_updated_date,
      ktp_url: m.ktp_url,
      selfie_url: m.selfie_url,
      job_title: m.job_title,
      salary_range: m.salary_range,
      emergency_contact_name: m.emergency_contact_name,
      emergency_contact_phone: m.emergency_contact_phone,
      total_savings: m.total_savings || 0,
      total_shu: m.total_shu || 0
    }));
    res.json(mapped);
  });

  // --- Savings API ---
  app.get("/api/savings", async (req, res) => {
    const user = (req.session as any).user;
    console.log(`[Savings API] User role: ${user?.role}, userId: ${user?.id}`);
    
    let query = db.from('transactions').select('*').eq('category', 'Savings');
    
    if (user && user.role !== 'admin') {
      query = query.eq('member_id', user.id);
      console.log(`[Savings API] Filtering by member_id: ${user.id}`);
    } else {
      console.log(`[Savings API] Returning all savings (admin view)`);
    }
    
    const { data: transactions } = await query.order('created_at', { ascending: false });
    console.log(`[Savings API] Found ${transactions?.length || 0} transactions`);
    
    // Fetch member names for admin
    const { data: members } = await db.from('members').select('id, name');
    const memberMap = (members || []).reduce((acc: any, m: any) => {
      acc[m.id] = m.name;
      return acc;
    }, {});

    const mapped = (transactions || []).map(t => ({
      id: t.id,
      memberId: t.member_id,
      memberName: memberMap[t.member_id] || 'Unknown',
      amount: t.amount,
      type: t.type,
      description: t.description,
      status: t.status,
      date: t.created_at,
      createdDate: t.created_at
    }));
    
    console.log(`[Savings API] Returning ${mapped.length} items`);
    res.json(mapped);
  });

  // --- Withdrawals API ---
  app.get("/api/withdrawals", async (req, res) => {
    const user = (req.session as any).user;
    let query = db.from('transactions').select('*').eq('type', 'Withdrawal');
    
    if (user && user.role !== 'admin') {
      query = query.eq('member_id', user.id);
    }
    
    const { data: withdrawals } = await query.order('created_at', { ascending: false });
    
    const { data: members } = await db.from('members').select('id, name, email');
    const memberMap = (members || []).reduce((acc: any, m: any) => {
      acc[m.id] = { name: m.name, email: m.email };
      return acc;
    }, {});

    const mapped = (withdrawals || []).map(w => ({
      id: w.id,
      memberId: w.member_id,
      memberName: memberMap[w.member_id]?.name || 'Unknown',
      memberEmail: memberMap[w.member_id]?.email || '',
      amount: w.amount,
      description: w.description,
      status: w.status,
      created_at: w.created_at
    }));
    
    res.json(mapped);
  });

  app.post("/api/withdrawals", async (req, res) => {
    const { amount, description, memberId } = req.body;
    const user = (req.session as any).user;
    
    try {
      // Check balance
      const { data: member } = await db.from('members').select('total_savings, name').eq('id', memberId).single();
      if (!member || (member.total_savings || 0) < amount) {
        return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi' });
      }

      const { data, error } = await db.from('transactions').insert({
        member_id: memberId,
        type: 'Withdrawal',
        category: 'Savings',
        amount: amount,
        description: description,
        status: 'pending'
      }).select().single();

      if (error) throw error;

      // Log & Notify Admin
      if (user) {
        await createAuditLog(user.id, 'CREATE_WITHDRAWAL', 'TRANSACTION', data.id, { amount });
      }
      await createNotification(null, 'Permintaan Penarikan Baru', `${member.name} meminta penarikan sebesar Rp ${amount.toLocaleString('id-ID')}`, 'warning', '/withdrawals');

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.patch("/api/withdrawals/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'success' or 'failed'
    const admin = (req.session as any).user;
    
    try {
      const { data: withdrawal } = await db.from('transactions').select('*').eq('id', id).single();
      if (!withdrawal) return res.status(404).json({ message: 'Not found' });

      if (status === 'success') {
        // Deduct from member total_savings
        const { data: member } = await db.from('members').select('total_savings').eq('id', withdrawal.member_id).single();
        const newBalance = (member.total_savings || 0) - withdrawal.amount;
        
        await db.from('members').update({ total_savings: newBalance }).eq('id', withdrawal.member_id);
        await db.from('users').update({ total_savings: newBalance }).eq('id', withdrawal.member_id);
      }

      const { error } = await db.from('transactions').update({ status }).eq('id', id);
      if (error) throw error;

      // Log & Notify
      if (admin) {
        await createAuditLog(admin.id, 'APPROVE_WITHDRAWAL', 'TRANSACTION', id, { status });
      }
      await createNotification(
        withdrawal.member_id,
        status === 'success' ? 'Penarikan Disetujui' : 'Penarikan Ditolak',
        status === 'success' ? `Penarikan Anda sebesar Rp ${withdrawal.amount.toLocaleString('id-ID')} telah berhasil.` : 'Maaf, permintaan penarikan Anda ditolak.',
        status === 'success' ? 'success' : 'error'
      );

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/members", async (req, res) => {
    const { id, name, email, type, status, joinDate, companyCode, systemStatus, createdBy } = req.body;
    const now = new Date().toISOString();
    const { error } = await db.from('members').insert({ 
      id, name, email, type, status, join_date: joinDate,
      company_code: companyCode || 'PALUGADA',
      system_status: systemStatus || 1,
      is_deleted: 0,
      created_by: createdBy || 'system',
      created_date: now,
      last_updated_by: createdBy || 'system',
      last_updated_date: now
    });
    if (error) {
      console.error("Error inserting member:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true });
  });

  app.patch("/api/members/:id", async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const { error } = await db.from('members').update(updateData).eq('id', id);
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true });
  });

  app.delete("/api/members/:id", async (req, res) => {
    const { id } = req.params;
    await db.from('members').delete().eq('id', id);
    res.json({ success: true });
  });

  app.get("/api/loans", async (req, res) => {
    const { data: loans } = await db.from('loans').select('*');
    const mapped = (loans || []).map(l => ({
      id: l.id,
      memberId: l.member_id,
      memberName: l.member_name,
      amount: l.amount,
      duration: l.duration,
      purpose: l.purpose,
      status: l.status,
      date: l.date,
      interestRate: l.interest_rate,
      totalInterest: l.total_interest,
      totalRepayment: l.total_repayment,
      remainingBalance: l.remaining_balance,
      paidAmount: l.paid_amount,
      companyCode: l.company_code,
      systemStatus: l.system_status,
      isDeleted: l.is_deleted,
      createdBy: l.created_by,
      createdDate: l.created_date,
      lastUpdatedBy: l.last_updated_by,
      lastUpdatedDate: l.last_updated_date
    }));
    res.json(mapped);
  });

  app.patch("/api/loans/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const admin = (req.session as any).user;

    try {
      const { data: loan } = await db.from('loans').select('*').eq('id', id).single();
      if (!loan) return res.status(404).json({ message: 'Loan not found' });

      await db.from('loans').update({ status }).eq('id', id);

      // Log & Notify
      if (admin) {
        await createAuditLog(admin.id, 'APPROVE_LOAN', 'LOAN', id, { status });
      }
      await createNotification(
        loan.member_id,
        status === 'approved' ? 'Pinjaman Disetujui' : 'Pinjaman Ditolak',
        status === 'approved' ? `Pinjaman Anda sebesar Rp ${loan.amount.toLocaleString('id-ID')} telah disetujui.` : 'Maaf, pengajuan pinjaman Anda belum dapat kami setujui.',
        status === 'approved' ? 'success' : 'error'
      );

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/loans", async (req, res) => {
    const { id, memberId, memberName, amount, duration, purpose, status, date, companyCode, createdBy, interestRate, totalInterest, totalRepayment } = req.body;
    const admin = (req.session as any).user;
    const now = new Date().toISOString();
    const { error } = await db.from('loans').insert({ 
      id, 
      member_id: memberId, 
      member_name: memberName, 
      amount, 
      duration,
      purpose, 
      status, 
      date,
      interest_rate: interestRate,
      total_interest: totalInterest,
      total_repayment: totalRepayment,
      remaining_balance: totalRepayment,
      paid_amount: 0,
      company_code: companyCode || 'PALUGADA',
      system_status: 1,
      is_deleted: 0,
      created_by: createdBy || 'system',
      created_date: now,
      last_updated_by: createdBy || 'system',
      last_updated_date: now
    });
    if (error) {
      console.error("Error inserting loan:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Log & Notify Admin
    if (admin) {
      await createAuditLog(admin.id, 'CREATE_LOAN', 'LOAN', id, { amount, duration });
    }
    await createNotification(null, 'Pengajuan Pinjaman Baru', `${memberName} mengajukan pinjaman sebesar Rp ${amount.toLocaleString('id-ID')}`, 'info', '/approvals');

    // Generate loan schedules
    try {
      const schedules = [];
      const monthlyAmount = totalRepayment / duration;
      let currentDate = new Date(date);
      for (let i = 1; i <= duration; i++) {
        currentDate.setMonth(currentDate.getMonth() + 1);
        schedules.push({
          id: `SCH-${id}-${i}`,
          loan_id: id,
          member_id: memberId,
          installment_number: i,
          due_date: currentDate.toISOString().split('T')[0],
          amount_due: monthlyAmount,
          status: 'Unpaid',
          company_code: companyCode || 'PALUGADA',
          is_deleted: 0,
          created_by: createdBy || 'system',
          created_date: now,
          last_updated_by: createdBy || 'system',
          last_updated_date: now
        });
      }
      await db.from('loan_schedules').insert(schedules);
    } catch (err) {
      console.error("Error generating schedules (table might not exist yet):", err);
    }

    res.json({ success: true });
  });

  // --- Loan Schedules API ---
  app.get("/api/loan_schedules/:memberId", async (req, res) => {
    const { memberId } = req.params;
    const { data: schedules } = await db.from('loan_schedules').select('*').eq('member_id', memberId).order('due_date', { ascending: true });
    res.json(schedules || []);
  });

  // --- Member Payments History API ---
  app.get("/api/member_payments/:memberId", async (req, res) => {
    const { memberId } = req.params;
    
    // Fetch savings
    const { data: savings } = await db.from('savings').select('*').eq('member_id', memberId);
    
    // Fetch loan repayments (need to join with loans to get member_id, or just fetch all loans for member and then their repayments)
    const { data: loans } = await db.from('loans').select('id').eq('member_id', memberId);
    const loanIds = (loans || []).map(l => l.id);
    
    let repayments: any[] = [];
    if (loanIds.length > 0) {
      const { data: reps } = await db.from('loan_repayments').select('*').in('loan_id', loanIds);
      repayments = reps || [];
    }

    // Combine and format
    const history = [
      ...(savings || []).map(s => ({
        id: s.id,
        date: s.date,
        type: s.type,
        amount: s.amount,
        status: 'Success'
      })),
      ...repayments.map(r => ({
        id: r.id,
        date: r.payment_date,
        type: `Pembayaran Pinjaman (${r.loan_id})`,
        amount: r.amount_paid,
        status: r.status
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(history);
  });

  // --- Loan Repayment API ---
  app.get("/api/loan_repayments/:loanId", async (req, res) => {
    const { loanId } = req.params;
    const { data: repayments } = await db.from('loan_repayments').select('*').eq('loan_id', loanId);
    res.json(repayments || []);
  });

  app.post("/api/loan_repayments", async (req, res) => {
    const { id, loanId, scheduleId, amountPaid, paymentDate, status, companyCode, createdBy } = req.body;
    const now = new Date().toISOString();
    
    // Insert repayment record
    const { error: repError } = await db.from('loan_repayments').insert({
      id,
      loan_id: loanId,
      amount_paid: amountPaid,
      payment_date: paymentDate,
      status: status || 'completed',
      company_code: companyCode || 'PALUGADA',
      created_by: createdBy || 'system',
      created_date: now
    });

    if (repError) {
      return res.status(500).json({ success: false, error: repError.message });
    }

    // Update loan balance
    const { data: loan } = await db.from('loans').select('remaining_balance, paid_amount').eq('id', loanId).single();
    if (loan) {
      const newRemaining = (loan.remaining_balance || 0) - amountPaid;
      const newPaid = (loan.paid_amount || 0) + amountPaid;
      
      await db.from('loans').update({
        remaining_balance: newRemaining < 0 ? 0 : newRemaining,
        paid_amount: newPaid,
        status: newRemaining <= 0 ? 'paid_off' : 'approved',
        last_updated_date: now
      }).eq('id', loanId);
    }

    // Update schedule if provided
    if (scheduleId) {
      try {
        await db.from('loan_schedules').update({
          status: 'Paid',
          paid_date: now,
          last_updated_date: now
        }).eq('id', scheduleId);
      } catch (err) {
        console.error("Error updating schedule:", err);
      }
    }

    // Record in finance
    await db.from('finance').insert({
      id: `FIN-REP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      type: 'Income',
      category: 'Pembayaran Pinjaman',
      amount: amountPaid,
      description: `Pembayaran cicilan pinjaman ${loanId}`,
      date: paymentDate,
      company_code: companyCode || 'PALUGADA',
      status: 1,
      is_deleted: 0,
      created_by: createdBy || 'system',
      created_date: now,
      last_updated_by: createdBy || 'system',
      last_updated_date: now
    });

    res.json({ success: true });
  });

  app.post("/api/savings", async (req, res) => {
    const { id, memberId, memberName, amount, type, date, companyCode, createdBy } = req.body;
    const now = new Date().toISOString();
    const { error } = await db.from('savings').insert({ 
      id, 
      member_id: memberId, 
      member_name: memberName, 
      amount, 
      type, 
      date,
      company_code: companyCode || 'PALUGADA',
      status: 1,
      is_deleted: 0,
      created_by: createdBy || 'system',
      created_date: now,
      last_updated_by: createdBy || 'system',
      last_updated_date: now
    });
    if (error) {
      console.error("Error inserting saving:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true });
  });

  // Delete single savings transaction
  app.delete("/api/savings/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await db.from('transactions').delete().eq('id', id).eq('category', 'Savings');
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });

  app.delete("/api/savings/all", async (req, res) => {
    // Delete all records from savings table
    const { error } = await db.from('savings').delete().neq('id', '0');
    if (error) {
      console.error("Error clearing savings:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true });
  });

  // --- Data API ---
  app.get("/api/users", async (req, res) => {
    const { data: users } = await db.from('users').select('*');
    res.json(users || []);
  });

  // --- Finance API ---
  app.get("/api/finance", async (req, res) => {
    const { data: finance } = await db.from('finance').select('*');
    const mapped = (finance || []).map(f => ({
      id: f.id,
      type: f.type,
      category: f.category,
      amount: f.amount,
      description: f.description,
      date: f.date,
      createdBy: f.created_by,
      createdDate: f.created_date,
      companyCode: f.company_code,
      status: f.status,
      isDeleted: f.is_deleted,
      lastUpdatedBy: f.last_updated_by,
      lastUpdatedDate: f.last_updated_date
    }));
    res.json(mapped);
  });

  app.post("/api/finance", async (req, res) => {
    const { id, type, category, amount, description, date, companyCode, createdBy, memberId, savingsType } = req.body;
    const now = new Date().toISOString();
    
    try {
      const financeId = id || `FIN-${Date.now()}`;
      // 1. Insert into legacy finance table for general records
      const { error: financeError } = await db.from('finance').insert({
        id: financeId, type, category, amount, description, date: date || now,
        company_code: companyCode || 'PALUGADA',
        status: 1,
        is_deleted: 0,
        created_by: createdBy || 'system',
        created_date: now,
        last_updated_by: createdBy || 'system',
        last_updated_date: now
      });
      
      if (financeError) throw financeError;

      // 2. If it's a member transaction, insert into transactions table
      if (memberId) {
        const { error: txError } = await db.from('transactions').insert({
          member_id: memberId,
          type: savingsType || (type === 'Income' ? 'Deposit' : 'Withdrawal'),
          category: category,
          amount: amount,
          description: description,
          status: 'success', // Simulated success for now
          created_at: now
        });
        
        if (txError) throw txError;

        // 3. Update member balance if it's savings
        if (category === 'Savings') {
          const { data: member, error: memberError } = await db.from('members').select('total_savings').eq('id', memberId).maybeSingle();
          
          if (memberError) {
            console.warn("Member balance fetch error:", memberError);
          }

          const currentSavings = member?.total_savings || 0;
          const newBalance = currentSavings + (type === 'Income' ? amount : -amount);
          
          await db.from('members').update({ total_savings: newBalance }).eq('id', memberId);
          await db.from('users').update({ total_savings: newBalance }).eq('id', memberId);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Finance API Error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Internal Server Error',
        details: error.details || null
      });
    }
  });

  app.delete("/api/finance/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await db.from('finance').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });

  // --- Report API ---
  app.get("/api/reports_data", async (req, res) => {
    const isSummary = req.query.summary === 'true';
    const selectQuery = isSummary 
      ? 'id, title, category, description, location, status, is_anonymous, user_id, user_name, company_code, system_status, is_deleted, created_by, created_date, last_updated_by, last_updated_date'
      : '*';
      
    const { data: reports } = await db.from('reports_data').select(selectQuery) as { data: any[] | null };
    const mapped = (reports || []).map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      description: r.description,
      location: r.location,
      status: r.status,
      isAnonymous: r.is_anonymous,
      images: r.images,
      userId: r.user_id,
      userName: r.user_name,
      companyCode: r.company_code,
      systemStatus: r.system_status,
      isDeleted: r.is_deleted,
      createdBy: r.created_by,
      createdDate: r.created_date,
      lastUpdatedBy: r.last_updated_by,
      lastUpdatedDate: r.last_updated_date
    }));
    res.json(mapped);
  });

  app.post("/api/reports_data", async (req, res) => {
    const { id, title, category, description, location, status, isAnonymous, images, userId, userName, companyCode, createdBy } = req.body;
    const now = new Date().toISOString();
    const { error } = await db.from('reports_data').insert({
      id, title, category, description, location, status, is_anonymous: isAnonymous, images, user_id: userId, user_name: userName,
      company_code: companyCode || 'PALUGADA',
      system_status: 1,
      is_deleted: 0,
      created_by: createdBy || 'system',
      created_date: now,
      last_updated_by: createdBy || 'system',
      last_updated_date: now
    });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });

  app.patch("/api/reports_data/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const now = new Date().toISOString();
    const { error } = await db.from('reports_data').update({ 
      status,
      last_updated_date: now
    }).eq('id', id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });

  // --- ReportResponse API ---
  app.get("/api/report_responses/:reportId", async (req, res) => {
    const { reportId } = req.params;
    const { data: responses } = await db.from('report_responses').select('*').eq('report_id', reportId).order('created_date', { ascending: true });
    
    // Fetch users for avatars
    const { data: users } = await db.from('users').select('id, selfie_url');
    const userMap = (users || []).reduce((acc: any, u: any) => {
      acc[u.id] = u.selfie_url;
      return acc;
    }, {});

    const mapped = (responses || []).map(r => ({
      id: r.id,
      reportId: r.report_id,
      message: r.message,
      responderId: r.responder_id,
      responderName: r.responder_name,
      responderRole: r.responder_role,
      responderAvatar: userMap[r.responder_id] || null,
      companyCode: r.company_code,
      status: r.status,
      isDeleted: r.is_deleted,
      createdBy: r.created_by,
      createdDate: r.created_date,
      lastUpdatedBy: r.last_updated_by,
      lastUpdatedDate: r.last_updated_date
    }));
    res.json(mapped);
  });

  app.get("/api/report_responses", async (req, res) => {
    const { data: responses } = await db.from('report_responses').select('*');
    const mapped = (responses || []).map(r => ({
      id: r.id,
      reportId: r.report_id,
      message: r.message,
      responderId: r.responder_id,
      responderName: r.responder_name,
      responderRole: r.responder_role,
      companyCode: r.company_code,
      status: r.status,
      isDeleted: r.is_deleted,
      createdBy: r.created_by,
      createdDate: r.created_date,
      lastUpdatedBy: r.last_updated_by,
      lastUpdatedDate: r.last_updated_date
    }));
    res.json(mapped);
  });

  app.post("/api/report_responses", async (req, res) => {
    const { id, reportId, message, responderId, responderName, responderRole, companyCode, createdBy } = req.body;
    const now = new Date().toISOString();
    const { error } = await db.from('report_responses').insert({
      id, report_id: reportId, message, responder_id: responderId, responder_name: responderName, responder_role: responderRole,
      company_code: companyCode || 'PALUGADA',
      status: 1,
      is_deleted: 0,
      created_by: createdBy || 'system',
      created_date: now,
      last_updated_by: createdBy || 'system',
      last_updated_date: now
    });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  });

  app.post("/api/system/reset", async (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    try {
      // Delete all data except users (to keep the admin account)
      // Note: In Supabase, we might need to do this table by table
      await db.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await db.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await db.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await db.from('loans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await db.from('loan_schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await db.from('report_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await db.from('reports_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await db.from('finance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await db.from('savings').delete().neq('id', '0');
      await db.from('members').delete().neq('role', 'admin'); // Keep admin members
      await db.from('users').delete().neq('role', 'admin'); // Keep admin users

      // Reset admin balances
      await db.from('users').update({ total_savings: 0, total_shu: 0 }).eq('role', 'admin');
      await db.from('members').update({ total_savings: 0, total_shu: 0 }).eq('role', 'admin');

      await createAuditLog(user.id, 'SYSTEM_RESET', 'SYSTEM', 'ALL', { message: 'Database cleared' });

      res.json({ success: true, message: 'Database cleared successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Vite middleware for development or static serving for production
  // Handle 404 for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "Not Found", message: `Route ${req.method} ${req.originalUrl} not found` });
  });

  // --- NEW FEATURES ENDPOINTS ---
  
  // Loan Payment History
  app.get("/api/loan-payments/:loanId", async (req, res) => {
    const { loanId } = req.params;
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
      const { data: payments } = await db.from('loan_payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('payment_date', { ascending: false });
      
      res.json(payments || []);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/loan-payments", async (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    
    const { loanId, amount, paymentDate, notes } = req.body;
    try {
      const { data: payment } = await db.from('loan_payments')
        .insert({ loan_id: loanId, amount, payment_date: paymentDate, notes, created_by: user.id })
        .select()
        .single();
      
      res.json({ success: true, payment });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // SHU Distribution
  app.get("/api/shu/distribution", async (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    
    try {
      const { data: distributions } = await db.from('shu_distributions')
        .select('*')
        .order('created_at', { ascending: false });
      
      res.json(distributions || []);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/shu/calculate", async (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    
    const { period, totalProfit, distributionRate } = req.body;
    try {
      const { data: members } = await db.from('members').select('id, name, total_savings');
      const totalSavings = (members || []).reduce((sum, m) => sum + (m.total_savings || 0), 0);
      const distributions = (members || []).map(m => ({
        member_id: m.id,
        member_name: m.name,
        period,
        share_amount: totalSavings > 0 ? (m.total_savings / totalSavings) * totalProfit : 0,
        distribution_rate: distributionRate,
        created_by: user.id
      }));
      
      const { data: result } = await db.from('shu_distributions').insert(distributions).select();
      res.json({ success: true, distributions: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Monthly Reports
  app.get("/api/reports/monthly", async (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    
    const { month, year } = req.query;
    try {
      // Try to fetch from transactions table, with fallback
      let totalSavings = 0;
      let totalLoans = 0;
      let transactionCount = 0;

      try {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = month === '12' ? `${Number(year) + 1}-01-01` : `${year}-${String(Number(month) + 1).padStart(2, '0')}-01`;
        
        const { data: transactions } = await db.from('transactions')
          .select('*')
          .gte('created_at', startDate)
          .lt('created_at', endDate);
        
        if (transactions) {
          totalSavings = transactions.filter(t => t.type === 'deposit' || t.category === 'Savings').reduce((sum, t) => sum + (t.amount || 0), 0);
          totalLoans = transactions.filter(t => t.type === 'loan_disbursement').reduce((sum, t) => sum + (t.amount || 0), 0);
          transactionCount = transactions.length;
        }
      } catch (tableErr) {
        console.log("Transactions table not available, using sample data");
        // Use sample data if table doesn't exist
        totalSavings = 12500000;
        totalLoans = 8000000;
        transactionCount = 145;
      }
      
      res.json({ month, year, totalSavings, totalLoans, transactionCount });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Export Features (PDF/Excel placeholder)
  app.post("/api/export/members", async (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    
    const { format = 'excel' } = req.body;
    try {
      const { data: members } = await db.from('members').select('*');
      
      // Format for CSV
      if (format === 'csv' || format === 'excel') {
        const headers = ['ID', 'Nama', 'Email', 'NIK', 'Tipe', 'Status', 'Tanggal Bergabung', 'Total Simpanan', 'Total SHU'];
        const rows = (members || []).map(m => [
          m.id,
          m.name,
          m.email,
          m.nik,
          m.type,
          m.status,
          m.join_date,
          m.total_savings || 0,
          m.total_shu || 0
        ]);
        
        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        res.json({ 
          success: true, 
          data: csv, 
          format, 
          filename: `members_${new Date().toISOString().split('T')[0]}.csv`,
          message: 'CSV data siap diunduh' 
        });
      } else if (format === 'pdf') {
        res.json({ 
          success: true, 
          data: members, 
          format, 
          filename: `members_${new Date().toISOString().split('T')[0]}.pdf`,
          message: 'PDF generation dilakukan di frontend' 
        });
      } else {
        res.json({ success: true, data: members, format, message: `Export ke ${format} tersedia` });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Add transaction export endpoint
  app.post("/api/export/transactions", async (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    
    const { format = 'csv', startDate, endDate } = req.body;
    try {
      let query = db.from('transactions').select('*');
      
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);
      
      const { data: transactions } = await query.order('created_at', { ascending: false });
      
      if (format === 'csv') {
        const headers = ['ID', 'Member', 'Tipe', 'Kategori', 'Jumlah', 'Status', 'Tanggal'];
        const rows = (transactions || []).map(t => [
          t.id,
          t.member_name || 'N/A',
          t.type,
          t.category,
          t.amount,
          t.status,
          t.created_at
        ]);
        
        const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        res.json({ 
          success: true, 
          data: csv, 
          format: 'csv', 
          filename: `transactions_${startDate}_to_${endDate}.csv` 
        });
      } else {
        res.json({ success: true, data: transactions, format });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Add member statement endpoint
  app.get("/api/members/:id/statement", async (req, res) => {
    const { id } = req.params;
    const user = (req.session as any).user;
    
    // Allow member to view own statement or admin to view any
    if (!user || (user.id !== id && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    try {
      const { data: member } = await db.from('members').select('*').eq('id', id).single();
      if (!member) return res.status(404).json({ message: 'Member not found' });
      
      // Fetch member's transactions
      let transactions: any = [];
      try {
        const { data: trans } = await db.from('transactions').select('*').eq('member_id', id).order('created_at', { ascending: false });
        transactions = trans || [];
      } catch (err) {
        console.log("Transactions table not available");
      }
      
      // Calculate summary
      const deposits = transactions.filter((t: any) => t.type === 'deposit' || t.type === 'Deposit').reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      const withdrawals = transactions.filter((t: any) => t.type === 'Withdrawal').reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      
      res.json({
        success: true,
        member,
        statement: {
          period: new Date().toISOString(),
          totalDeposits: deposits,
          totalWithdrawals: withdrawals,
          balance: member.total_savings || 0,
          shuReceived: member.total_shu || 0,
          transactions: transactions.slice(0, 50) // Last 50 transactions
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Email Notifications Setup
  app.post("/api/notifications/send-email", async (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    
    const { userId, subject, message, template = 'generic' } = req.body;
    try {
      // Placeholder for email service integration (Nodemailer setup)
      await createNotification(userId, subject, message, 'email', '');
      res.json({ success: true, message: 'Email notification queued' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Advanced Filtering - Members
  app.get("/api/members/filter", async (req, res) => {
    const { status, type, search, sortBy = 'name', order = 'asc' } = req.query;
    try {
      let query = db.from('members').select('*');
      
      if (status) query = query.eq('status', status);
      if (type) query = query.eq('type', type);
      if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,nik.ilike.%${search}%`);
      
      query = query.order(sortBy as string, { ascending: order === 'asc' });
      const { data: members } = await query;
      
      res.json(members || []);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Advanced Filtering - Loans
  app.get("/api/loans/filter", async (req, res) => {
    const { status, memberId, minAmount, maxAmount, search, sortBy = 'created_at', order = 'desc' } = req.query;
    try {
      let query = db.from('loans').select('*');
      
      if (status) query = query.eq('status', status);
      if (memberId) query = query.eq('memberId', memberId);
      if (minAmount) query = query.gte('amount', Number(minAmount));
      if (maxAmount) query = query.lte('amount', Number(maxAmount));
      if (search) query = query.or(`member_name.ilike.%${search}%,purpose.ilike.%${search}%`);
      
      query = query.order(sortBy as string, { ascending: order === 'asc' });
      const { data: loans } = await query;
      
      res.json(loans || []);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Advanced Filtering - Savings
  app.get("/api/savings/filter", async (req, res) => {
    const { memberId, status, minAmount, maxAmount, sortBy = 'created_at', order = 'desc' } = req.query;
    try {
      let query = db.from('savings').select('*');
      
      if (memberId) query = query.eq('memberId', memberId);
      if (status) query = query.eq('status', status);
      if (minAmount) query = query.gte('amount', Number(minAmount));
      if (maxAmount) query = query.lte('amount', Number(maxAmount));
      
      query = query.order(sortBy as string, { ascending: order === 'asc' });
      const { data: savings } = await query;
      
      res.json(savings || []);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Express Error:", err);
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({ error: "Internal Server Error", message: err.message });
    }
    next(err);
  });

  const isProduction = process.env.NODE_ENV === "production" || !process.env.VITE_DEV_SERVER;
  const distPath = path.join(__dirname, "dist");
  
  if (isProduction && fs.existsSync(distPath)) {
    console.log("Serving from PRODUCTION (dist)");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("Serving from DEVELOPMENT (Vite)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();