const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const path = require('path');
const { query, init } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const JWT_SECRET = process.env.JWT_SECRET || 'reflex-sprint-secret-change-in-prod';
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function auth(requiredRoles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      if (requiredRoles.length && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

app.post('/api/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const result = await query('SELECT * FROM users WHERE name = $1 AND password = $2', [name, password]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, phone: user.phone } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/me', auth(), async (req, res) => {
  const result = await query('SELECT id, name, phone, role FROM users WHERE id = $1', [req.user.id]);
  res.json(result.rows[0] || null);
});

app.get('/api/riders', auth(['dispatcher']), async (req, res) => {
  const result = await query("SELECT id, name, phone FROM users WHERE role = 'rider'");
  res.json(result.rows);
});

app.post('/api/deliveries', auth(['retailer']), async (req, res) => {
  try {
    const { customer_name, customer_phone, address, item_description } = req.body;
    if (!customer_name || !address || !item_description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const id = uuidv4();
    await query(
      `INSERT INTO deliveries (id, retailer_id, customer_name, customer_phone, address, item_description, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')`,
      [id, req.user.id, customer_name, customer_phone || null, address, item_description]
    );
    const result = await query('SELECT * FROM deliveries WHERE id = $1', [id]);
    const delivery = result.rows[0];
    io.emit('delivery:new', delivery);
    res.status(201).json(delivery);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/deliveries', auth(), async (req, res) => {
  try {
    let sql = `
      SELECT d.*, 
             r.name AS retailer_name, 
             rd.name AS rider_name
      FROM deliveries d
      LEFT JOIN users r ON d.retailer_id = r.id
      LEFT JOIN users rd ON d.rider_id = rd.id
    `;
    const params = [];
    if (req.user.role === 'retailer') {
      sql += ' WHERE d.retailer_id = $1';
      params.push(req.user.id);
    } else if (req.user.role === 'rider') {
      sql += ' WHERE d.rider_id = $1';
      params.push(req.user.id);
    }
    sql += ' ORDER BY d.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/deliveries/:id/assign', auth(['dispatcher']), async (req, res) => {
  try {
    const { rider_id } = req.body;
    const check = await query('SELECT * FROM deliveries WHERE id = $1', [req.params.id]);
    const delivery = check.rows[0];
    if (!delivery) return res.status(404).json({ error: 'Not found' });
    if (delivery.status !== 'pending') return res.status(400).json({ error: 'Only pending can be assigned' });

    const rider = await query("SELECT id FROM users WHERE id = $1 AND role = 'rider'", [rider_id]);
    if (!rider.rows[0]) return res.status(400).json({ error: 'Invalid rider' });

    await query(
      `UPDATE deliveries SET status = 'assigned', rider_id = $1, assigned_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [rider_id, req.params.id]
    );
    const updated = await query('SELECT * FROM deliveries WHERE id = $1', [req.params.id]);
    io.emit('delivery:updated', updated.rows[0]);
    res.json(updated.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/deliveries/:id/status', auth(['rider']), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = { assigned: 'picked_up', picked_up: 'delivered' };
    const check = await query('SELECT * FROM deliveries WHERE id = $1', [req.params.id]);
    const delivery = check.rows[0];
    if (!delivery) return res.status(404).json({ error: 'Not found' });
    if (delivery.rider_id !== req.user.id) return res.status(403).json({ error: 'Not your delivery' });
    if (!allowed[delivery.status] || allowed[delivery.status] !== status) {
      return res.status(400).json({ error: `Cannot go from ${delivery.status} to ${status}` });
    }

    const tsField = status === 'picked_up' ? 'picked_up_at' : 'delivered_at';
    await query(
      `UPDATE deliveries SET status = $1, ${tsField} = NOW(), updated_at = NOW() WHERE id = $2`,
      [status, req.params.id]
    );
    const updated = await query('SELECT * FROM deliveries WHERE id = $1', [req.params.id]);
    io.emit('delivery:updated', updated.rows[0]);
    res.json(updated.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/deliveries/:id/qr', auth(), async (req, res) => {
  try {
    const result = await query('SELECT id FROM deliveries WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });

    const host = req.get('host');
    const protocol = req.protocol === 'https' || host.includes('onrender.com') ? 'https' : req.protocol;
    const confirmUrl = `${protocol}://${host}/confirm/${req.params.id}`;

    const dataUrl = await QRCode.toDataURL(confirmUrl);
    res.json({ qr: dataUrl, deliveryId: req.params.id, confirmUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/deliveries/confirm-scan', auth(['rider']), async (req, res) => {
  try {
    const { deliveryId } = req.body;
    const result = await query('SELECT * FROM deliveries WHERE id = $1', [deliveryId]);
    const delivery = result.rows[0];
    if (!delivery) return res.status(404).json({ error: 'Not found' });
    if (delivery.rider_id !== req.user.id) return res.status(403).json({ error: 'Not assigned to you' });

    let nextStatus = null;
    if (delivery.status === 'assigned') nextStatus = 'picked_up';
    else if (delivery.status === 'picked_up') nextStatus = 'delivered';
    else return res.status(400).json({ error: 'Nothing to confirm' });

    const tsField = nextStatus === 'picked_up' ? 'picked_up_at' : 'delivered_at';
    await query(
      `UPDATE deliveries SET status = $1, ${tsField} = NOW(), updated_at = NOW() WHERE id = $2`,
      [nextStatus, deliveryId]
    );
    const updated = await query('SELECT * FROM deliveries WHERE id = $1', [deliveryId]);
    io.emit('delivery:updated', updated.rows[0]);
    res.json(updated.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Public confirmation endpoints
app.get('/api/public/delivery/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT d.id, d.customer_name, d.item_description, d.status,
             r.name AS retailer_name, rd.name AS rider_name
      FROM deliveries d
      LEFT JOIN users r ON d.retailer_id = r.id
      LEFT JOIN users rd ON d.rider_id = rd.id
      WHERE d.id = $1
    `, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Delivery not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/public/confirm/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM deliveries WHERE id = $1', [req.params.id]);
    const delivery = result.rows[0];
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    if (delivery.status === 'delivered') {
      return res.json({ message: 'Already confirmed', delivery });
    }
    if (!['assigned', 'picked_up'].includes(delivery.status)) {
      return res.status(400).json({ error: 'Not ready for confirmation' });
    }

    await query(
      `UPDATE deliveries SET status = 'delivered', delivered_at = NOW(), updated_at = NOW(),
       notes = COALESCE(notes,'') || ' | Confirmed by customer via QR'
       WHERE id = $1`,
      [req.params.id]
    );
    const updated = await query('SELECT * FROM deliveries WHERE id = $1', [req.params.id]);
    io.emit('delivery:updated', updated.rows[0]);
    res.json({ message: 'Thank you! Delivery confirmed.', delivery: updated.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected', socket.id));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  await init();
  server.listen(PORT, () => {
    console.log(`Reflex running at http://localhost:${PORT}`);
  });
}

async function seedIfEmpty() {
  const result = await query('SELECT COUNT(*) FROM users');
  if (parseInt(result.rows[0].count) > 0) {
    console.log('Database already has data – skipping seed');
    return;
  }

  console.log('Empty database detected – seeding...');
  const { v4: uuidv4 } = require('uuid');

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
}

async function start() {
  await init();          // create tables
  await seedIfEmpty();   // seed only if empty
  server.listen(PORT, () => {
    console.log(`Reflex running at http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
