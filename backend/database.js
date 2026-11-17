const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'hardware.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency & performance
db.pragma('journal_mode = WAL');

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'labels');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL COLLATE NOCASE,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS machines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_no TEXT UNIQUE NOT NULL COLLATE NOCASE,
    product_company TEXT DEFAULT 'Hikvision',
    model TEXT NOT NULL,
    authorised_person TEXT NOT NULL,
    plant TEXT NOT NULL COLLATE NOCASE,
    purchase_date TEXT NOT NULL,
    warranty_expiry_date TEXT NOT NULL,
    warranty_months INTEGER DEFAULT 12,
    status TEXT DEFAULT 'Active',
    label_image TEXT,
    notes TEXT,
    raw_scan_text TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_machines_serial ON machines(serial_no);
  CREATE INDEX IF NOT EXISTS idx_machines_plant ON machines(plant);
  CREATE INDEX IF NOT EXISTS idx_machines_person ON machines(authorised_person);
`);

// Migration: Check if product_company column exists in machines table
try {
  const tableInfo = db.prepare("PRAGMA table_info(machines)").all();
  const hasProductCompany = tableInfo.some(col => col.name === 'product_company');
  if (!hasProductCompany) {
    db.prepare("ALTER TABLE machines ADD COLUMN product_company TEXT DEFAULT 'Hikvision'").run();
  }
} catch (e) {
  console.warn('Migration note:', e.message);
}

// Migrate/Standardize existing plant records to "State -- Destination" format
try {
  db.prepare(`UPDATE machines SET plant = 'Delhi -- Delhi NCR' WHERE plant = 'Delhi NCR' OR plant = 'Delhi'`).run();
  db.prepare(`UPDATE machines SET plant = 'Gujarat -- Gujarat Plant' WHERE plant = 'Gujarat'`).run();
  db.prepare(`UPDATE machines SET plant = 'Maharashtra -- Mumbai Plant' WHERE plant = 'Maharashtra'`).run();
  db.prepare(`UPDATE machines SET plant = 'Karnataka -- Bengaluru Plant' WHERE plant LIKE 'Karnataka%'`).run();
  
  // Set default companies for existing records if null/empty
  db.prepare(`UPDATE machines SET product_company = 'Hikvision' WHERE (product_company IS NULL OR product_company = '') AND model LIKE '%DS%'`).run();
  db.prepare(`UPDATE machines SET product_company = 'Cisco' WHERE (product_company IS NULL OR product_company = '') AND model LIKE '%C920%'`).run();
  db.prepare(`UPDATE machines SET product_company = 'Dell' WHERE (product_company IS NULL OR product_company = '') AND model LIKE '%PowerEdge%'`).run();
  db.prepare(`UPDATE machines SET product_company = 'Hikvision' WHERE product_company IS NULL OR product_company = ''`).run();
} catch (e) {
  // ignore
}

// Seed default plants formatted as "<State> -- <Destination>"
const seedPlants = [
  'Delhi -- Delhi NCR',
  'Gujarat -- Ahmedabad Plant',
  'Gujarat -- Gandhinagar Unit',
  'Maharashtra -- Mumbai Plant',
  'Maharashtra -- Pune Facility',
  'Karnataka -- Bengaluru Tech Center',
  'Tamil Nadu -- Chennai Plant',
  'Telangana -- Hyderabad Unit',
  'Rajasthan -- Jaipur Facility'
];

const insertPlant = db.prepare('INSERT OR IGNORE INTO plants (name) VALUES (?)');
const insertMany = db.transaction((plants) => {
  for (const p of plants) insertPlant.run(p);
});
insertMany(seedPlants);

// Seed initial machines if empty
const machineCount = db.prepare('SELECT COUNT(*) as count FROM machines').get().count;
if (machineCount === 0) {
  const insertMachine = db.prepare(`
    INSERT INTO machines (
      serial_no, product_company, model, authorised_person, plant, 
      purchase_date, warranty_expiry_date, warranty_months, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];

  const p1 = new Date(today);
  p1.setMonth(p1.getMonth() - 2);
  const exp1 = new Date(p1);
  exp1.setFullYear(exp1.getFullYear() + 2);

  const p2 = new Date(today);
  p2.setMonth(p2.getMonth() - 11);
  const exp2 = new Date(p2);
  exp2.setFullYear(exp2.getFullYear() + 1);

  const p3 = new Date(today);
  p3.setFullYear(p3.getFullYear() - 2);
  const exp3 = new Date(p3);
  exp3.setFullYear(exp3.getFullYear() + 1);

  insertMachine.run(
    'GS3762838',
    'Hikvision',
    'DS-KIT302EFWX',
    'Aditya Sharma',
    'Gujarat -- Ahmedabad Plant',
    fmt(p1),
    fmt(exp1),
    24,
    'Active',
    'Terminal device deployed at Gujarat Plant main access control gate.'
  );

  insertMachine.run(
    'SN-89240194B',
    'Hikvision',
    'DS-KIT302EFWX',
    'Rajesh Patel',
    'Delhi -- Delhi NCR',
    fmt(p2),
    fmt(exp2),
    12,
    'Active',
    'Unit stationed at Warehouse entrance.'
  );

  insertMachine.run(
    'C920-A78129',
    'Cisco',
    'C9200L-24P-4G',
    'Vikram Singh',
    'Maharashtra -- Mumbai Plant',
    fmt(p3),
    fmt(exp3),
    12,
    'Active',
    'Core switch located in Server Rack B.'
  );
}

module.exports = db;
