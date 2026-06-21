/**
 * fix-catchall.mjs
 * Jalankan di folder root project: node fix-catchall.mjs
 * 
 * Hanya memindahkan app.use("/api/*") ke posisi yang benar
 * tanpa mengubah kode lainnya.
 */
import fs from 'fs';

const path = 'server.ts';
if (!fs.existsSync(path)) {
  console.error('❌ server.ts tidak ditemukan!');
  process.exit(1);
}

let c = fs.readFileSync(path, 'utf-8');

// Backup
fs.writeFileSync('server.ts.backup2', c);
console.log('✓ Backup: server.ts.backup2');

// Cari posisi catch-all dan filter routes
const catchallIdx = c.indexOf('app.use("/api/*"');
const filterIdx   = c.indexOf('app.get("/api/members/filter"');

if (catchallIdx === -1) { console.log('⚠ catch-all tidak ditemukan'); process.exit(0); }
if (filterIdx   === -1) { console.log('⚠ members/filter tidak ditemukan'); process.exit(0); }

const catchallLine = c.substring(0, catchallIdx).split('\n').length;
const filterLine   = c.substring(0, filterIdx).split('\n').length;

console.log(`catch-all di line: ${catchallLine}`);
console.log(`members/filter di line: ${filterLine}`);

if (catchallLine > filterLine) {
  console.log('✅ Urutan sudah benar! catch-all sudah di bawah filter routes.');
  process.exit(0);
}

console.log('⚠ catch-all menghalangi filter routes, memperbaiki...');

// Hapus blok catch-all dari posisi lama (beserta comment di atasnya)
const patterns = [
  /[ \t]*\/\/ Vite middleware[^\n]*\n[ \t]*\/\/ Handle 404[^\n]*\n[ \t]*app\.use\("\/api\/\*"[^)]+\}\s*\)\s*;/,
  /[ \t]*\/\/ Handle 404[^\n]*\n[ \t]*app\.use\("\/api\/\*"[^)]+\}\s*\)\s*;/,
  /[ \t]*app\.use\("\/api\/\*",\s*\(req,\s*res\)\s*=>\s*\{[^}]+\}\s*\)\s*;/,
];

let removed = false;
for (const pat of patterns) {
  if (pat.test(c)) {
    c = c.replace(pat, '');
    removed = true;
    console.log('✓ catch-all lama dihapus');
    break;
  }
}

if (!removed) {
  console.log('⚠ Pattern catch-all tidak cocok, coba hapus manual');
  console.log('  Cari dan hapus baris ini di server.ts:');
  console.log('  app.use("/api/*", (req, res) => { ... });');
  console.log('  Lalu tambahkan sebelum: app.use((err: any...');
  process.exit(1);
}

// Pasang catch-all sebelum error handler
const errorHandler = '  app.use((err: any, req: any, res: any, next: any) => {';
const catchallBlock = `
  // Handle 404 untuk API routes — HARUS di paling bawah
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "Not Found", message: \`Route \${req.method} \${req.originalUrl} not found\` });
  });

`;

if (c.includes(errorHandler)) {
  c = c.replace(errorHandler, catchallBlock + errorHandler);
  console.log('✓ catch-all dipasang di posisi yang benar');
} else {
  // Pasang sebelum app.listen sebagai fallback
  const listenStr = '  app.listen(';
  if (c.includes(listenStr)) {
    c = c.replace(listenStr, catchallBlock + listenStr);
    console.log('✓ catch-all dipasang sebelum app.listen');
  }
}

fs.writeFileSync(path, c);

// Verifikasi
const newCatchallIdx = c.indexOf('app.use("/api/*"');
const newFilterIdx   = c.indexOf('app.get("/api/members/filter"');
const newCatchallLine = c.substring(0, newCatchallIdx).split('\n').length;
const newFilterLine   = c.substring(0, newFilterIdx).split('\n').length;

console.log(`\nVerifikasi setelah fix:`);
console.log(`  members/filter di line: ${newFilterLine}`);
console.log(`  catch-all di line: ${newCatchallLine}`);

if (newCatchallLine > newFilterLine) {
  console.log('\n✅ BERHASIL! Urutan sudah benar.');
  console.log('\nSekarang restart server:');
  console.log('  Ctrl+C  lalu  npm run dev');
} else {
  console.log('\n⚠ Urutan masih salah, perlu fix manual');
}
