const { v4: uuidv4 } = require('uuid');
const { query, init } = require('./db');

async function seed() {
  await init();

  const existing = await query('SELECT COUNT(*) FROM users');
  if (parseInt(existing.rows[0].count) > 0) {
    console.log('Already seeded');
    process.exit(0);
  }

  const users = [
    { id: uuidv4(), name: 'Wanjiku Electronics', phone: '+254712000001', role: 'retailer', password: 'retailer123' },
    { id: uuidv4(), name: 'Mama Chemist', phone: '+254712000002', role: 'retailer', password: 'retailer123' },
    { id: uuidv4(), name: 'James Dispatcher', phone: '+254712000010', role: 'dispatcher', password: 'dispatch123' },
    { id: uuidv4(), name: 'Brian Rider', phone: '+254712000020', role: 'rider', password: 'rider123' },
    { id: uuidv4(), name: 'Aisha Rider', phone: '+254712000021', role: 'rider', password: 'rider123' },
    { id: uuidv4(), name: 'Kevin Rider', phone: '+254712000022', role: 'rider', password: 'rider123' },
  ];

  for (const u of users) {
    await query(
      'INSERT INTO users (id, name, phone, role, password) VALUES ($1,$2,$3,$4,$5)',
      [u.id, u.name, u.phone, u.role, u.password]
    );
  }

  const retailerId = users[0].id;
  const deliveries = [
    {
      id: uuidv4(),
      customer_name: 'Peter Otieno',
      customer_phone: '+254722111222',
      address: 'Westlands, Nairobi - near Sarit Centre',
      item_description: 'Samsung Galaxy A15 + screen protector'
    },
    {
      id: uuidv4(),
      customer_name: 'Grace Wambui',
      customer_phone: '+254733444555',
      address: 'Kilimani, Argwings Kodhek Rd',
      item_description: 'Laptop charger 65W USB-C'
    }
  ];

  for (const d of deliveries) {
    await query(
      `INSERT INTO deliveries (id, retailer_id, customer_name, customer_phone, address, item_description, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
      [d.id, retailerId, d.customer_name, d.customer_phone, d.address, d.item_description]
    );
  }

  console.log('Seeded successfully');
  console.log('  Retailer:   Wanjiku Electronics / retailer123');
  console.log('  Dispatcher: James Dispatcher / dispatch123');
  console.log('  Rider:      Brian Rider / rider123');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
EOF