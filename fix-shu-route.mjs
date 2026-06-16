/**
 * fix-shu-route.mjs
 * 
 * Jalankan di folder root project (sejajar server.ts):
 *   node fix-shu-route.mjs
 */

import fs from 'fs';
import path from 'path';

const serverPath = path.join(process.cwd(), 'server.ts');

if (!fs.existsSync(serverPath)) {
  console.error('❌ server.ts tidak ditemukan! Pastikan dijalankan di folder root project.');
  process.exit(1);
}

let content = fs.readFileSync(serverPath, 'utf-8');

// Backup dulu
fs.writeFileSync(serverPath + '.backup', content, 'utf-8');
console.log('✓ Backup disimpan: server.ts.backup');

// ── STEP 1: Hapus catch-all dari posisi yang salah ─────────────────────────
const catchAllRegex = /[ \t]*\/\/[^\n]*(?:Handle 404|Vite middleware)[^\n]*\n[ \t]*app\.use\(["']\/api\/\*["'][^)]+\}\s*\)\s*;/g;
const matches = [...content.matchAll(catchAllRegex)];
console.log(`ℹ Ditemukan ${matches.length} catch-all route`);

// Hapus semua yang ada dulu
content = content.replace(catchAllRegex, '// [catch-all dipindah ke bawah]');

// Juga hapus versi tanpa comment
content = content.replace(
  /[ \t]*app\.use\(["']\/api\/\*["'],\s*\(req,\s*res\)\s*=>\s*\{[^}]+\}\s*\)\s*;/g,
  '// [catch-all dipindah ke bawah]'
);
console.log('✓ Catch-all lama dihapus');

// ── STEP 2: Hapus SHU routes lama (akan diganti yang sudah difix) ──────────
// Hapus blok SHU distribution GET
content = content.replace(
  /[ \t]*\/\/ SHU Distribution\s*\n[\s\S]*?app\.get\(["']\/api\/shu\/distribution["'][\s\S]*?\}\s*\)\s*;\s*\n/,
  '// [SHU GET dipindah]\n'
);

// Hapus blok SHU calculate POST
content = content.replace(
  /[ \t]*app\.post\(["']\/api\/shu\/calculate["'][\s\S]*?\}\s*\)\s*;\s*\n/,
  '// [SHU POST dipindah]\n'
);

console.log('✓ SHU routes lama dihapus (akan diganti yang sudah difix)');

// ── STEP 3: Sisipkan SHU routes + catch-all sebelum error handler ──────────
const errorHandlerMarker = `  app.use((err: any, req: any, res: any, next: any) => {`;

if (!content.includes(errorHandlerMarker)) {
  console.error('❌ Error handler tidak ditemukan. Coba cari "app.use((err" di server.ts Anda.');
  process.exit(1);
}

const newBlock = `
  // ══ SHU Distribution (fixed) ══════════════════════════════════════════════
  // GET: admin lihat semua, member lihat miliknya saja
  app.get("/api/shu/distribution", async (req, res) => {
    const user = (req.session as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    try {
      let query = db.from('shu_distributions').select('*').order('created_at', { ascending: false });
      if (user.role !== 'admin') {
        query = query.eq('member_id', user.id);
      }
      const { data: distributions } = await query;
      res.json(distributions || []);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // POST: hitung & simpan SHU baru (admin only)
  app.post("/api/shu/calculate", async (req, res) => {
    const user = (req.session as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { period, totalProfit, distributionRate } = req.body;

    // Validasi input
    if (!period || !totalProfit || Number(totalProfit) <= 0) {
      return res.status(400).json({ success: false, message: 'Period dan total laba wajib diisi dan harus lebih dari 0' });
    }

    try {
      // Cek duplikat periode
      const { data: existing } = await db.from('shu_distributions').select('id').eq('period', period).limit(1);
      if (existing && existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: \`SHU untuk periode \${period} sudah pernah dihitung. Hapus data lama terlebih dahulu jika ingin menghitung ulang.\`
        });
      }

      // Ambil semua anggota yang statusnya 'Aktif' (huruf kapital sesuai DB) DAN punya simpanan
      // Fallback: kalau tidak ada yang 'Aktif', ambil semua yang punya simpanan
      let { data: members } = await db.from('members')
        .select('id, name, total_savings')
        .eq('status', 'Aktif')
        .gt('total_savings', 0);

      // Fallback jika tidak ada anggota dengan status 'Aktif'
      if (!members || members.length === 0) {
        const { data: allMembers } = await db.from('members')
          .select('id, name, total_savings, status')
          .gt('total_savings', 0);
        
        // Filter status yang berarti aktif (case-insensitive)
        members = (allMembers || []).filter((m: any) => {
          const s = (m.status || '').toLowerCase();
          return s === 'aktif' || s === 'active' || s === 'approved';
        });

        // Last resort: ambil semua yang punya simpanan
        if (members.length === 0) {
          members = allMembers || [];
        }
      }

      if (!members || members.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada anggota dengan simpanan yang dapat menerima SHU'
        });
      }

      const totalSavings = members.reduce((sum: number, m: any) => sum + (m.total_savings || 0), 0);

      if (totalSavings <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Total simpanan anggota adalah 0, SHU tidak dapat dihitung'
        });
      }

      // distributionRate benar-benar dipakai dalam perhitungan (Bug Fix)
      const profitToDistribute = Number(totalProfit) * (Number(distributionRate) / 100);

      const distributions = members.map((m: any) => ({
        member_id: m.id,
        member_name: m.name,
        period,
        share_amount: Math.round((m.total_savings / totalSavings) * profitToDistribute),
        distribution_rate: distributionRate,
        created_by: user.id
      }));

      const { data: result, error: insertError } = await db.from('shu_distributions').insert(distributions).select();
      if (insertError) throw insertError;

      // Update total_shu di tabel members
      for (const dist of (result || [])) {
        const { data: memberData } = await db.from('members').select('total_shu').eq('id', dist.member_id).single();
        if (memberData) {
          await db.from('members')
            .update({ total_shu: (memberData.total_shu || 0) + dist.share_amount })
            .eq('id', dist.member_id);
        }
      }

      res.json({
        success: true,
        distributions: result,
        summary: {
          totalMembers: distributions.length,
          totalDistributed: profitToDistribute,
          period,
          distributionRate
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  // ══════════════════════════════════════════════════════════════════════════

  // Handle 404 untuk API routes — HARUS di paling bawah setelah semua routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "Not Found", message: \`Route \${req.method} \${req.originalUrl} not found\` });
  });

`;

content = content.replace(errorHandlerMarker, newBlock + errorHandlerMarker);
console.log('✓ SHU routes (fixed) + catch-all dipasang di posisi yang benar');

// ── STEP 4: Save ────────────────────────────────────────────────────────────
fs.writeFileSync(serverPath, content, 'utf-8');
console.log('✓ server.ts berhasil diperbarui!');
console.log('');
console.log('════════════════════════════════════════');
console.log('✅ SELESAI! Sekarang restart server:');
console.log('   Ctrl+C  lalu  npm run dev');
console.log('════════════════════════════════════════');
