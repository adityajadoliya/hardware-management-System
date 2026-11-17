const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'hardware.db');
const db = new Database(dbPath);

const CLOUD_API_URL = 'https://hardware-management-system-snowy.vercel.app/api/machines';

async function syncFromCloud() {
  try {
    const res = await fetch(CLOUD_API_URL);
    if (!res.ok) {
      console.warn(`[CloudSync] Cloud returned status: ${res.status}`);
      return { success: false, error: `Cloud status ${res.status}` };
    }

    const cloudMachines = await res.json();
    if (!Array.isArray(cloudMachines) || cloudMachines.length === 0) {
      return { success: true, count: 0, message: 'No machines on cloud' };
    }

    const upsertStmt = db.prepare(`
      INSERT INTO machines (
        serial_no, product_company, model, authorised_person, plant,
        purchase_date, warranty_expiry_date, warranty_months,
        status, label_image, notes, raw_scan_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(serial_no) DO UPDATE SET
        product_company = excluded.product_company,
        model = excluded.model,
        authorised_person = excluded.authorised_person,
        plant = excluded.plant,
        purchase_date = excluded.purchase_date,
        warranty_expiry_date = excluded.warranty_expiry_date,
        warranty_months = excluded.warranty_months,
        status = excluded.status,
        notes = excluded.notes,
        raw_scan_text = excluded.raw_scan_text,
        updated_at = datetime('now', 'localtime')
    `);

    const plantStmt = db.prepare('INSERT OR IGNORE INTO plants (name) VALUES (?)');

    let synced = 0;
    for (const m of cloudMachines) {
      if (!m.serial_no) continue;
      const plantName = m.plant || 'Delhi -- Delhi NCR';
      plantStmt.run(plantName);

      upsertStmt.run(
        m.serial_no,
        m.product_company || 'Hikvision',
        m.model || 'DS-KIT302EFWX',
        m.authorised_person || 'Bobby',
        plantName,
        m.purchase_date || '2026-11-17',
        m.warranty_expiry_date || '2027-11-17',
        m.warranty_months || 12,
        m.status || 'Active',
        null,
        m.notes || '',
        m.raw_scan_text || ''
      );
      synced++;
    }

    console.log(`[CloudSync] Successfully synchronized ${synced} machines into local SQLite hardware.db`);
    return { success: true, count: synced };
  } catch (err) {
    console.error('[CloudSync] Sync error:', err.message);
    return { success: false, error: err.message };
  }
}

if (require.main === module) {
  syncFromCloud().then(res => {
    console.log('Result:', res);
    const count = db.prepare('SELECT count(*) as total FROM machines').get();
    console.log('Total machines in database:', count.total);
    const machines = db.prepare('SELECT id, serial_no, product_company, model, authorised_person, plant FROM machines').all();
    console.table(machines);
  });
}

module.exports = { syncFromCloud };
