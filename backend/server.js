const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./database');
const { parseLabelText } = require('./labelParser');
const { resolveGlobalMachine } = require('./globalMachineCatalog');
const { syncBidirectional, pushSingleMachine } = require('./syncCloud');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder (support Vercel /tmp writable space)
const isVercel = !!process.env.VERCEL;
const uploadsDir = isVercel ? path.join('/tmp', 'uploads', 'labels') : path.join(__dirname, 'uploads', 'labels');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {}
app.use('/uploads', express.static(isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads')));

// Ensure requests without /api prefix match properly in serverless environments
app.use((req, res, next) => {
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
    req.url = '/api' + req.url;
  }
  next();
});

// Health check endpoint 
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), vercel: isVercel });
});

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `label-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

// Helper to compute warranty days and status
function enrichMachineData(machine) {
  if (!machine) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(machine.warranty_expiry_date);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let warranty_status = 'ACTIVE';
  if (diffDays < 0) {
    warranty_status = 'EXPIRED';
  } else if (diffDays <= 30) {
    warranty_status = 'EXPIRING_SOON';
  }

  return {
    ...machine,
    product_company: machine.product_company || 'Generic',
    pending_days: diffDays,
    warranty_status,
    label_image_url: machine.label_image ? `/uploads/labels/${machine.label_image}` : null
  };
}

// 1. Get all unique plants (formatted as "<State> -- <Destination>")
app.get('/api/plants', (req, res) => {
  try {
    const plants = db.prepare(`
      SELECT DISTINCT name FROM (
        SELECT name FROM plants
        UNION
        SELECT plant AS name FROM machines WHERE plant IS NOT NULL AND plant != ''
      ) ORDER BY name ASC
    `).all();

    res.json(plants.map(p => p.name));
  } catch (err) {
    console.error('Error fetching plants:', err);
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

// 2. Add a new plant
app.post('/api/plants', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Plant name is required' });
    }
    const trimmed = name.trim();
    db.prepare('INSERT OR IGNORE INTO plants (name) VALUES (?)').run(trimmed);
    res.json({ success: true, plant: trimmed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add plant' });
  }
});

// 3. Stats for Dashboard
app.get('/api/stats', (req, res) => {
  try {
    const machines = db.prepare('SELECT * FROM machines').all().map(enrichMachineData);
    const total = machines.length;
    const active = machines.filter(m => m.warranty_status === 'ACTIVE').length;
    const expiringSoon = machines.filter(m => m.warranty_status === 'EXPIRING_SOON').length;
    const expired = machines.filter(m => m.warranty_status === 'EXPIRED').length;

    const plantCount = db.prepare(`
      SELECT COUNT(DISTINCT name) as count FROM (
        SELECT name FROM plants
        UNION
        SELECT plant AS name FROM machines WHERE plant IS NOT NULL AND plant != ''
      )
    `).get().count;

    const plantDist = db.prepare(`
      SELECT plant, COUNT(*) as count 
      FROM machines 
      GROUP BY plant 
      ORDER BY count DESC 
      LIMIT 5
    `).all();

    res.json({
      total,
      active,
      expiringSoon,
      expired,
      plantCount,
      plantDist
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// 4. Get machines with filtering & search
app.get('/api/machines', (req, res) => {
  try {
    const { search, plant, status, warranty_status, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

    let query = 'SELECT * FROM machines WHERE 1=1';
    const params = [];

    if (plant && plant !== 'ALL') {
      query += ' AND plant = ?';
      params.push(plant);
    }

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      query += ' AND (serial_no LIKE ? OR product_company LIKE ? OR model LIKE ? OR authorised_person LIKE ? OR plant LIKE ? OR notes LIKE ?)';
      params.push(s, s, s, s, s, s);
    }

    const allowedSort = ['id', 'serial_no', 'product_company', 'model', 'plant', 'authorised_person', 'purchase_date', 'warranty_expiry_date', 'created_at'];
    const safeSort = allowedSort.includes(sort_by) ? sort_by : 'created_at';
    const safeOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${safeSort} ${safeOrder}`;

    let records = db.prepare(query).all(...params).map(enrichMachineData);

    if (warranty_status && warranty_status !== 'ALL') {
      records = records.filter(m => m.warranty_status === warranty_status.toUpperCase());
    }

    res.json(records);
  } catch (err) {
    console.error('Error fetching machines:', err);
    res.status(500).json({ error: 'Failed to fetch machines' });
  }
});

// 5. Get single machine
app.get('/api/machines/:id', (req, res) => {
  try {
    const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(req.params.id);
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.json(enrichMachineData(machine));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch machine' });
  }
});

// 6. Check serial number availability
app.get('/api/machines/check-serial/:serial', (req, res) => {
  try {
    const existing = db.prepare('SELECT id, serial_no, model, plant FROM machines WHERE serial_no = ?').get(req.params.serial.trim());
    res.json({ exists: !!existing, machine: existing || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check serial' });
  }
});

// 7. Add new machine (with Auto-Upsert to prevent duplicate crashes)
app.post('/api/machines', upload.single('label_image'), (req, res) => {
  try {
    let {
      serial_no,
      product_company = 'Hikvision',
      model,
      authorised_person,
      plant,
      purchase_date,
      warranty_expiry_date,
      warranty_months = 12,
      status = 'Active',
      notes = '',
      raw_scan_text = '',
      base64_image
    } = req.body;

    // Validate serial number
    serial_no = (serial_no || '').trim();
    if (!serial_no) {
      return res.status(400).json({ error: 'Serial number is required' });
    }
    product_company = (product_company || 'Hikvision').trim();
    model = (model || 'DS-KIT302EFWX').trim();
    authorised_person = (authorised_person || 'Aditya Sharma').trim();
    plant = (plant || 'Gujarat -- Gujarat Plant').trim();
    purchase_date = (purchase_date || new Date().toISOString().split('T')[0]).trim();

    if (!warranty_expiry_date) {
      const pDate = new Date(purchase_date);
      pDate.setMonth(pDate.getMonth() + parseInt(warranty_months || 12, 10));
      warranty_expiry_date = pDate.toISOString().split('T')[0];
    }

    // Check if machine with this serial already exists
    const existing = db.prepare('SELECT * FROM machines WHERE serial_no = ?').get(serial_no);

    let labelImageFilename = existing ? existing.label_image : null;
    if (req.file) {
      labelImageFilename = req.file.filename;
    } else if (base64_image && base64_image.startsWith('data:image')) {
      const base64Data = base64_image.replace(/^data:image\/\w+;base64,/, '');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      labelImageFilename = `label-${uniqueSuffix}.jpg`;
      fs.writeFileSync(path.join(uploadsDir, labelImageFilename), base64Data, 'base64');
    }

    db.prepare('INSERT OR IGNORE INTO plants (name) VALUES (?)').run(plant);

    if (existing) {
      // Auto-update existing machine record seamlessly
      const stmt = db.prepare(`
        UPDATE machines SET
          product_company = ?,
          model = ?,
          authorised_person = ?,
          plant = ?,
          purchase_date = ?,
          warranty_expiry_date = ?,
          warranty_months = ?,
          status = ?,
          label_image = ?,
          notes = ?,
          raw_scan_text = ?,
          updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      stmt.run(
        product_company,
        model,
        authorised_person,
        plant,
        purchase_date,
        warranty_expiry_date,
        parseInt(warranty_months, 10) || 12,
        status,
        labelImageFilename,
        notes,
        raw_scan_text,
        existing.id
      );

      const updated = db.prepare('SELECT * FROM machines WHERE id = ?').get(existing.id);
      const enriched = enrichMachineData(updated);
      pushSingleMachine(enriched).catch(() => {});
      return res.status(200).json(enriched);
    }

    // Insert new machine record
    const stmt = db.prepare(`
      INSERT INTO machines (
        serial_no, product_company, model, authorised_person, plant,
        purchase_date, warranty_expiry_date, warranty_months,
        status, label_image, notes, raw_scan_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      serial_no,
      product_company,
      model,
      authorised_person,
      plant,
      purchase_date,
      warranty_expiry_date,
      parseInt(warranty_months, 10) || 12,
      status,
      labelImageFilename,
      notes,
      raw_scan_text
    );

    const inserted = db.prepare('SELECT * FROM machines WHERE id = ?').get(result.lastInsertRowid);
    const enriched = enrichMachineData(inserted);
    pushSingleMachine(enriched).catch(() => {});
    res.status(201).json(enriched);
  } catch (err) {
    console.error('Error creating/updating machine:', err);
    res.status(500).json({ error: err.message || 'Failed to save machine' });
  }
});

// 8. Update machine
app.put('/api/machines/:id', upload.single('label_image'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM machines WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    let {
      serial_no,
      product_company,
      model,
      authorised_person,
      plant,
      purchase_date,
      warranty_expiry_date,
      warranty_months,
      status,
      notes,
      base64_image
    } = req.body;

    serial_no = (serial_no || existing.serial_no).trim();
    product_company = (product_company || existing.product_company || 'Hikvision').trim();
    model = (model || existing.model).trim();
    authorised_person = (authorised_person || existing.authorised_person).trim();
    plant = (plant || existing.plant).trim();
    purchase_date = purchase_date || existing.purchase_date;
    warranty_expiry_date = warranty_expiry_date || existing.warranty_expiry_date;
    warranty_months = parseInt(warranty_months || existing.warranty_months, 10);
    status = status || existing.status;
    notes = notes !== undefined ? notes : existing.notes;

    if (serial_no.toLowerCase() !== existing.serial_no.toLowerCase()) {
      const conflict = db.prepare('SELECT id FROM machines WHERE serial_no = ? AND id != ?').get(serial_no, id);
      if (conflict) {
        return res.status(409).json({ error: `Serial No. "${serial_no}" is already used by another machine` });
      }
    }

    db.prepare('INSERT OR IGNORE INTO plants (name) VALUES (?)').run(plant);

    let labelImageFilename = existing.label_image;
    if (req.file) {
      labelImageFilename = req.file.filename;
    } else if (base64_image && base64_image.startsWith('data:image')) {
      const base64Data = base64_image.replace(/^data:image\/\w+;base64,/, '');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      labelImageFilename = `label-${uniqueSuffix}.jpg`;
      fs.writeFileSync(path.join(uploadsDir, labelImageFilename), base64Data, 'base64');
    }

    db.prepare(`
      UPDATE machines SET
        serial_no = ?,
        product_company = ?,
        model = ?,
        authorised_person = ?,
        plant = ?,
        purchase_date = ?,
        warranty_expiry_date = ?,
        warranty_months = ?,
        status = ?,
        label_image = ?,
        notes = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      serial_no,
      product_company,
      model,
      authorised_person,
      plant,
      purchase_date,
      warranty_expiry_date,
      warranty_months,
      status,
      labelImageFilename,
      notes,
      id
    );

    const updated = db.prepare('SELECT * FROM machines WHERE id = ?').get(id);
    const enriched = enrichMachineData(updated);
    pushSingleMachine(enriched).catch(() => {});
    res.json(enriched);
  } catch (err) {
    console.error('Error updating machine:', err);
    res.status(500).json({ error: err.message || 'Failed to update machine' });
  }
});

// 9. Delete machine
app.delete('/api/machines/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM machines WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    if (existing.label_image) {
      const imgPath = path.join(uploadsDir, existing.label_image);
      if (fs.existsSync(imgPath)) {
        try { fs.unlinkSync(imgPath); } catch (e) {}
      }
    }

    db.prepare('DELETE FROM machines WHERE id = ?').run(id);
    res.json({ success: true, message: 'Machine deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete machine' });
  }
});

// 10. Intelligent text/scan parser endpoint
app.post('/api/scan/parse', (req, res) => {
  try {
    const { raw_text } = req.body;
    const parsed = parseLabelText(raw_text || '');
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse scan text' });
  }
});

// 10b. Instant Global Machine Search & Auto-Resolution (Sub-millisecond)
app.post('/api/scan/global-search', (req, res) => {
  try {
    const { query, raw_text } = req.body;
    const resolved = resolveGlobalMachine(query, raw_text, db);
    res.json(resolved);
  } catch (err) {
    res.status(500).json({ error: 'Global search failed' });
  }
});

// 11. CSV Export endpoint (Product Company just before Model!)
app.get('/api/export/csv', (req, res) => {
  try {
    const machines = db.prepare('SELECT * FROM machines ORDER BY id DESC').all().map(enrichMachineData);

    const headers = [
      'ID',
      'Serial No',
      'Product Company',
      'Model',
      'Plant (Destination)',
      'Authorised Person',
      'Purchase Date',
      'Date Uploaded',
      'Warranty Expiry Date',
      'Pending Warranty Days',
      'Warranty Status',
      'Status',
      'Notes'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = machines.map(m => [
      m.id,
      m.serial_no,
      m.product_company,
      m.model,
      m.plant,
      m.authorised_person,
      m.purchase_date,
      m.created_at,
      m.warranty_expiry_date,
      m.pending_days,
      m.warranty_status,
      m.status,
      m.notes || ''
    ].map(escapeCsv).join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="hardware-inventory-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Cloud Sync Endpoint (Synchronizes scans captured on Vercel into local SQLite hardware.db and vice-versa)
app.get('/api/sync-cloud', async (req, res) => {
  try {
    const result = await syncBidirectional();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Cloud sync failed', details: err.message });
  }
});

app.post('/api/sync-cloud', async (req, res) => {
  try {
    const result = await syncBidirectional();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Cloud sync failed', details: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    // Auto 2-way sync on startup
    syncBidirectional().catch(() => {});
    // Polling background 2-way sync every 6 seconds
    setInterval(() => {
      syncBidirectional().catch(() => {});
    }, 6000);
  });
}

module.exports = app;
