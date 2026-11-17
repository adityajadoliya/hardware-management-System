const path = require('path');
const fs = require('fs');

let db = null;
const isVercel = !!process.env.VERCEL;
const dbDir = isVercel ? '/tmp' : __dirname;
const dbPath = path.join(dbDir, 'hardware.db');

// Ensure upload directory exists in writable location
const uploadsDir = isVercel ? path.join('/tmp', 'uploads', 'labels') : path.join(__dirname, 'uploads', 'labels');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('Upload directory initialization notice:', e.message);
}

// Copy local database file to /tmp on Vercel if needed
if (isVercel && !fs.existsSync(dbPath)) {
  const localDb = path.join(__dirname, 'hardware.db');
  if (fs.existsSync(localDb)) {
    try {
      fs.copyFileSync(localDb, dbPath);
    } catch (e) {}
  }
}

try {
  const Database = require('better-sqlite3');
  db = new Database(dbPath);
  try { db.pragma('journal_mode = WAL'); } catch (e) {}

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

  // Migration: Ensure product_company column exists
  try {
    const tableInfo = db.prepare("PRAGMA table_info(machines)").all();
    const hasProductCompany = tableInfo.some(col => col.name === 'product_company');
    if (!hasProductCompany) {
      db.prepare("ALTER TABLE machines ADD COLUMN product_company TEXT DEFAULT 'Hikvision'").run();
    }
  } catch (e) {}

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
  const countRow = db.prepare('SELECT COUNT(*) as count FROM machines').get();
  if (!countRow || countRow.count === 0) {
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
} catch (nativeErr) {
  console.warn('Native SQLite driver notice, engaging memory fallback:', nativeErr.message);

  // In-memory fallback for serverless environments where native binary compilation is restricted
  const memPlants = [
    { id: 1, name: 'Delhi -- Delhi NCR' },
    { id: 2, name: 'Gujarat -- Ahmedabad Plant' },
    { id: 3, name: 'Gujarat -- Gandhinagar Unit' },
    { id: 4, name: 'Maharashtra -- Mumbai Plant' },
    { id: 5, name: 'Maharashtra -- Pune Facility' },
    { id: 6, name: 'Karnataka -- Bengaluru Tech Center' },
    { id: 7, name: 'Tamil Nadu -- Chennai Plant' },
    { id: 8, name: 'Telangana -- Hyderabad Unit' },
    { id: 9, name: 'Rajasthan -- Jaipur Facility' }
  ];

  let memMachines = [
    {
      id: 1,
      serial_no: 'GS3762838',
      product_company: 'Hikvision',
      model: 'DS-KIT302EFWX',
      authorised_person: 'Aditya Sharma',
      plant: 'Gujarat -- Ahmedabad Plant',
      purchase_date: '2026-09-17',
      warranty_expiry_date: '2028-09-17',
      warranty_months: 24,
      status: 'Active',
      label_image: null,
      notes: 'Terminal device deployed at Gujarat Plant main access control gate.',
      raw_scan_text: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      serial_no: 'SN-89240194B',
      product_company: 'Hikvision',
      model: 'DS-KIT302EFWX',
      authorised_person: 'Rajesh Patel',
      plant: 'Delhi -- Delhi NCR',
      purchase_date: '2025-12-17',
      warranty_expiry_date: '2026-12-17',
      warranty_months: 12,
      status: 'Active',
      label_image: null,
      notes: 'Unit stationed at Warehouse entrance.',
      raw_scan_text: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      serial_no: 'C920-A78129',
      product_company: 'Cisco',
      model: 'C9200L-24P-4G',
      authorised_person: 'Vikram Singh',
      plant: 'Maharashtra -- Mumbai Plant',
      purchase_date: '2024-11-17',
      warranty_expiry_date: '2025-11-17',
      warranty_months: 12,
      status: 'Active',
      label_image: null,
      notes: 'Core switch located in Server Rack B.',
      raw_scan_text: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  db = {
    pragma: () => {},
    exec: () => {},
    transaction: (fn) => fn,
    prepare: (sql) => {
      const lower = sql.toLowerCase();
      return {
        all: (...params) => {
          if (lower.includes('from plants')) {
            return [...memPlants];
          }
          if (lower.includes('from machines')) {
            let res = [...memMachines];
            if (params.length > 0 && params[0]) {
              const q = String(params[0]).replace(/%/g, '').toLowerCase();
              if (lower.includes('like')) {
                res = res.filter(m => 
                  (m.serial_no && m.serial_no.toLowerCase().includes(q)) ||
                  (m.model && m.model.toLowerCase().includes(q)) ||
                  (m.product_company && m.product_company.toLowerCase().includes(q)) ||
                  (m.plant && m.plant.toLowerCase().includes(q)) ||
                  (m.authorised_person && m.authorised_person.toLowerCase().includes(q))
                );
              }
            }
            return res;
          }
          return [];
        },
        get: (...params) => {
          if (lower.includes('count(*)')) {
            return { count: memMachines.length };
          }
          if (lower.includes('from machines where id =')) {
            return memMachines.find(m => m.id == params[0]) || null;
          }
          if (lower.includes('from machines where serial_no =')) {
            return memMachines.find(m => m.serial_no && m.serial_no.toLowerCase() === String(params[0]).toLowerCase()) || null;
          }
          if (lower.includes('from machines where model like') || lower.includes('from machines where serial_no like')) {
            const q = String(params[0]).replace(/%/g, '').toLowerCase();
            return memMachines.find(m => 
              (m.model && m.model.toLowerCase().includes(q)) ||
              (m.serial_no && m.serial_no.toLowerCase().includes(q)) ||
              (m.product_company && m.product_company.toLowerCase().includes(q))
            ) || null;
          }
          if (lower.includes('from plants where name =')) {
            return memPlants.find(p => p.name.toLowerCase() === String(params[0]).toLowerCase()) || null;
          }
          return null;
        },
        run: (...params) => {
          if (lower.includes('insert into machines')) {
            const newId = memMachines.length ? Math.max(...memMachines.map(m => m.id)) + 1 : 1;
            const newM = {
              id: newId,
              serial_no: params[0],
              product_company: params[1],
              model: params[2],
              authorised_person: params[3],
              plant: params[4],
              purchase_date: params[5],
              warranty_expiry_date: params[6],
              warranty_months: params[7],
              status: params[8] || 'Active',
              label_image: params[9],
              notes: params[10],
              raw_scan_text: params[11],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            memMachines.unshift(newM);
            return { lastInsertRowid: newId };
          }
          if (lower.includes('update machines set')) {
            const targetId = params[params.length - 1];
            const m = memMachines.find(item => item.id == targetId);
            if (m) {
              m.product_company = params[0];
              m.model = params[1];
              m.authorised_person = params[2];
              m.plant = params[3];
              m.purchase_date = params[4];
              m.warranty_expiry_date = params[5];
              m.warranty_months = params[6];
              m.status = params[7];
              m.label_image = params[8] || m.label_image;
              m.notes = params[9];
              m.raw_scan_text = params[10];
              m.updated_at = new Date().toISOString();
            }
            return { changes: 1 };
          }
          if (lower.includes('delete from machines where id =')) {
            memMachines = memMachines.filter(m => m.id != params[0]);
            return { changes: 1 };
          }
          if (lower.includes('insert or ignore into plants') || lower.includes('insert into plants')) {
            const name = params[0];
            if (name && !memPlants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
              memPlants.push({ id: memPlants.length + 1, name });
            }
            return { changes: 1 };
          }
          return { changes: 1, lastInsertRowid: 1 };
        }
      };
    }
  };
}

module.exports = db;
