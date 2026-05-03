import db from './server/db.js';

async function seedLoansData() {
  const now = new Date().toISOString();

  // Sample loans data
  const loansData = [
    {
      id: `LOAN-${Date.now()}-1`,
      member_id: 'google-113844516203247875593',
      member_name: 'Faiz Sagita',
      amount: 5000000,
      duration: 12,
      purpose: 'Modal usaha',
      status: 'approved',
      interest_rate: 1.5,
      total_interest: 750000,
      total_repayment: 5750000,
      remaining_balance: 5000000,
      paid_amount: 0,
      company_code: 'PALUGADA',
      system_status: 1,
      is_deleted: 0,
      created_by: 'admin',
      created_date: now,
      last_updated_by: 'admin',
      last_updated_date: now,
      date: now
    },
    {
      id: `LOAN-${Date.now()}-2`,
      member_id: 'user-1776089255121',
      member_name: 'Guardian',
      amount: 3000000,
      duration: 6,
      purpose: 'Pendidikan',
      status: 'approved',
      interest_rate: 1.2,
      total_interest: 216000,
      total_repayment: 3216000,
      remaining_balance: 3000000,
      paid_amount: 0,
      company_code: 'PALUGADA',
      system_status: 1,
      is_deleted: 0,
      created_by: 'admin',
      created_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      last_updated_by: 'admin',
      last_updated_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `LOAN-${Date.now()}-3`,
      member_id: 'google-114979413430474349425',
      member_name: 'Zexs Zyna',
      amount: 10000000,
      duration: 24,
      purpose: 'Investasi properti',
      status: 'pending',
      interest_rate: 2.0,
      total_interest: 4000000,
      total_repayment: 14000000,
      remaining_balance: 10000000,
      paid_amount: 0,
      company_code: 'PALUGADA',
      system_status: 1,
      is_deleted: 0,
      created_by: 'admin',
      created_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      last_updated_by: 'admin',
      last_updated_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  console.log('Inserting sample loans data...');

  for (const loan of loansData) {
    try {
      const { error } = await db.from('loans').insert(loan);
      if (error) {
        console.error('Error inserting loan:', error);
      } else {
        console.log('Inserted loan for:', loan.member_name, 'amount:', loan.amount);
      }
    } catch (err) {
      console.error('Exception inserting loan:', err);
    }
  }

  console.log('Sample loans data seeding completed!');
}

seedLoansData();