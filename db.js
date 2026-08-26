const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function query(text, params) {
  return pool.query(text, params);
}

async function init() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('retailer', 'dispatcher', 'rider')),
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      retailer_id TEXT NOT NULL REFERENCES users(id),
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      address TEXT NOT NULL,
      item_description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'assigned', 'picked_up', 'delivered', 'cancelled')),
      rider_id TEXT REFERENCES users(id),
      assigned_at TIMESTAMPTZ,
      picked_up_at TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
    CREATE INDEX IF NOT EXISTS idx_deliveries_rider ON deliveries(rider_id);
    CREATE INDEX IF NOT EXISTS idx_deliveries_retailer ON deliveries(retailer_id);
  `);
  console.log('PostgreSQL tables ready');
}

module.exports = { query, init, pool };
