/**
 * fix-old-withdrawals.mjs
 * 
 * Memperbaiki transaksi penarikan LAMA yang sudah ada di database
 * agar description-nya mengandung kata "Sukarela" (supaya saldo terhitung benar).
 * 
 * Jalankan SEKALI saja di folder root project:
 *   node fix-old-withdrawals.mjs
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL atau SUPABASE_ANON_KEY tidak ditemukan di .env');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Mencari transaksi penarikan (Withdrawal) yang descriptionnya belum mengandung kata "sukarela"...\n');

  const { data: withdrawals, error } = await db
    .from('transactions')
    .select('*')
    .eq('type', 'Withdrawal')
    .eq('category', 'Savings');

  if (error) {
    console.error('❌ Gagal mengambil data:', error.message);
    process.exit(1);
  }

  if (!withdrawals || withdrawals.length === 0) {
    console.log('Tidak ada transaksi penarikan ditemukan.');
    return;
  }

  console.log(`Ditemukan ${withdrawals.length} transaksi penarikan total.\n`);

  const needFix = withdrawals.filter(w => 
    !(w.description || '').toLowerCase().includes('sukarela')
  );

  if (needFix.length === 0) {
    console.log('✅ Semua transaksi penarikan sudah benar (mengandung kata "Sukarela"). Tidak ada yang perlu diperbaiki.');
    return;
  }

  console.log(`⚠ Ditemukan ${needFix.length} transaksi penarikan yang PERLU diperbaiki:\n`);
  needFix.forEach((w, i) => {
    console.log(`  ${i + 1}. ID: ${w.id} | Jumlah: Rp ${(w.amount||0).toLocaleString('id-ID')} | Status: ${w.status}`);
    console.log(`     Description lama: "${w.description}"`);
  });

  console.log('\n🔧 Memperbaiki description...\n');

  let fixed = 0;
  for (const w of needFix) {
    const newDescription = `Penarikan Simpanan Sukarela | ${w.description || ''}`.trim();
    const { error: updateError } = await db
      .from('transactions')
      .update({ description: newDescription })
      .eq('id', w.id);

    if (updateError) {
      console.error(`  ❌ Gagal update ID ${w.id}: ${updateError.message}`);
    } else {
      console.log(`  ✓ ID ${w.id} diperbaiki`);
      fixed++;
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`✅ SELESAI! ${fixed} dari ${needFix.length} transaksi berhasil diperbaiki.`);
  console.log(`Sekarang saldo Sukarela seharusnya sudah terhitung dengan benar.`);
  console.log(`Refresh halaman Penarikan di browser untuk melihat perubahan.`);
  console.log(`════════════════════════════════════════`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
