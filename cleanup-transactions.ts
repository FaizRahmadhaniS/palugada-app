import db from './server/db.ts';

async function cleanTransactions() {
  try {
    console.log('🗑️  Deleting all transactions...\n');
    
    // Get all transaction IDs first
    const { data: allTransactions, error: fetchError } = await db
      .from('transactions')
      .select('id');
    
    if (fetchError) {
      console.log('Error fetching transactions:', fetchError);
      return;
    }
    
    if (!allTransactions || allTransactions.length === 0) {
      console.log('✅ Transactions table is already empty');
      process.exit(0);
    }
    
    console.log(`Found ${allTransactions.length} transactions to delete`);
    
    // Delete in batches
    const batchSize = 100;
    for (let i = 0; i < allTransactions.length; i += batchSize) {
      const batch = allTransactions.slice(i, i + batchSize);
      const ids = batch.map(t => t.id);
      
      const { error: deleteError } = await db
        .from('transactions')
        .delete()
        .in('id', ids);
      
      if (deleteError) {
        console.log(`⚠️  Error deleting batch ${i / batchSize + 1}:`, deleteError);
      } else {
        console.log(`✓ Deleted batch ${i / batchSize + 1} (${ids.length} records)`);
      }
    }
    
    console.log('\n✅ Transactions cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanTransactions();
