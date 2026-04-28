import db from './server/db.js';

async function seedSavingsData() {
  const now = new Date().toISOString();

  // Sample savings data for different members
  const savingsData = [
    // For admin user (google-103122950385590746281)
    {
      member_id: 'google-103122950385590746281',
      amount: 50000,
      type: 'Deposit',
      description: 'Setoran awal',
      status: 'approved',
      category: 'Savings',
      created_at: now
    },
    {
      member_id: 'google-103122950385590746281',
      amount: 25000,
      type: 'Deposit',
      description: 'Setoran bulan Januari',
      status: 'approved',
      category: 'Savings',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    // For member user (google-113844516203247875593)
    {
      member_id: 'google-113844516203247875593',
      amount: 30000,
      type: 'Deposit',
      description: 'Setoran pokok',
      status: 'approved',
      category: 'Savings',
      created_at: now
    },
    {
      member_id: 'google-113844516203247875593',
      amount: 15000,
      type: 'Deposit',
      description: 'Setoran wajib',
      status: 'approved',
      category: 'Savings',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    // For another member (user-1776089255121)
    {
      member_id: 'user-1776089255121',
      amount: 40000,
      type: 'Deposit',
      description: 'Setoran awal',
      status: 'approved',
      category: 'Savings',
      created_at: now
    },
    {
      member_id: 'user-1776089255121',
      amount: 10000,
      type: 'Withdrawal',
      description: 'Penarikan darurat',
      status: 'approved',
      category: 'Savings',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  console.log('Inserting sample savings data...');

  for (const saving of savingsData) {
    try {
      const { error } = await db.from('transactions').insert(saving);
      if (error) {
        console.error('Error inserting saving:', saving.id, error);
      } else {
        console.log('Inserted saving:', saving.id, 'for', saving.member_name);
      }
    } catch (err) {
      console.error('Exception inserting saving:', saving.id, err);
    }
  }

  console.log('Sample savings data seeding completed!');
}

seedSavingsData();