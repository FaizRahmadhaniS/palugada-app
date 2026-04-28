import db from './server/db.ts';

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // Tables to delete (keep: users and members)
    const tablesToClean = [
      'transactions',
      'loans',
      'savings',
      'withdrawals',
      'complaints',
      'finance_transactions',
      'approvals',
      'audit_logs',
      'shu_distributions',
      'monthly_reports',
      'payments',
      'finance',
      'notifications',
      'report_responses',
      'reports_data',
      'loan_payments',
      'loan_repayments',
      'loan_schedules'
    ];

    for (const table of tablesToClean) {
      try {
        console.log(`🗑️  Cleaning table: ${table}`);
        
        // Delete all records using a simple condition that always matches
        const { data, error } = await db
          .from(table)
          .delete()
          .neq('id', '');
        
        if (error) {
          console.log(`   ⚠️  ${error.message}`);
        } else {
          console.log(`   ✓ Table cleaned successfully`);
        }
      } catch (e: any) {
        console.log(`   ⚠️  Error: ${e.message}`);
      }
    }

    console.log('\n✅ Database cleanup completed!');
    console.log('📊 Kept tables: users, members');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupDatabase();
