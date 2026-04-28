import db from './server/db.js';

async function seedFinanceData() {
  const now = new Date().toISOString();

  // Sample finance data
  const financeData = [
    {
      id: `FIN-${Date.now()}-1`,
      type: 'Income',
      category: 'SHU',
      amount: 5000000,
      description: 'Bagi hasil bulan Maret',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      company_code: 'PALUGADA',
      status: 1,
      is_deleted: 0,
      created_by: 'google-103122950385590746281',
      created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_updated_by: 'google-103122950385590746281',
      last_updated_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `FIN-${Date.now()}-2`,
      type: 'Income',
      category: 'Iuran',
      amount: 2000000,
      description: 'Iuran wajib anggota',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      company_code: 'PALUGADA',
      status: 1,
      is_deleted: 0,
      created_by: 'google-103122950385590746281',
      created_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      last_updated_by: 'google-103122950385590746281',
      last_updated_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `FIN-${Date.now()}-3`,
      type: 'Expense',
      category: 'Operasional',
      amount: 1500000,
      description: 'Biaya administrasi',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      company_code: 'PALUGADA',
      status: 1,
      is_deleted: 0,
      created_by: 'google-103122950385590746281',
      created_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      last_updated_by: 'google-103122950385590746281',
      last_updated_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `FIN-${Date.now()}-4`,
      type: 'Income',
      category: 'Bunga Pinjaman',
      amount: 800000,
      description: 'Bunga pinjaman bulan April',
      date: now,
      company_code: 'PALUGADA',
      status: 1,
      is_deleted: 0,
      created_by: 'google-103122950385590746281',
      created_date: now,
      last_updated_by: 'google-103122950385590746281',
      last_updated_date: now
    }
  ];

  console.log('Inserting sample finance data...');

  for (const finance of financeData) {
    try {
      const { error } = await db.from('finance').insert(finance);
      if (error) {
        console.error('Error inserting finance:', error);
      } else {
        console.log('Inserted finance:', finance.type, finance.category, 'amount:', finance.amount);
      }
    } catch (err) {
      console.error('Exception inserting finance:', err);
    }
  }

  console.log('Sample finance data seeding completed!');
}

seedFinanceData();