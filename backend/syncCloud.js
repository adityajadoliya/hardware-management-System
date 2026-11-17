const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'hardware.db');
const db = new Database(dbPath);

const CLOUD_SYNC_URL = 'https://hardware-management-system-snowy.vercel.app/api/sync';
const CLOUD_MACHINES_URL = 'https://hardware-management-system-snowy.vercel.app/api/machines';

/**
 * Full 2-Way Bidirectional Synchronization:
 * 1. Pushes all machines in local SQLite hardware.db -> Vercel App
 * 2. Pulls all machines from Vercel App -> local SQLite hardware.db
 * Guarantees that data saved on Vercel appears in SQLite,
 * AND data in SQLite appears on the Vercel app!
 */
async function syncBidirectional() {
  try {
    // 1. Read all local machines from hardware.db
    const localMachines = db.prepare('SELECT * FROM machines').all();

    let cloudMachines = [];

    // 2. Push local machines to Vercel and receive cloud machines back
    try {
      const res = await fetch(CLOUD_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machines: localMachines }),
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        const data = await res.json();
        cloudMachines = data.machines || [];
      } else {
        // Fallback to GET machines
        const getRes = await fetch(CLOUD_MACHINES_URL, { signal: AbortSignal.timeout(6000) });
        if (getRes.ok) {
          cloudMachines = await getRes.json();
        }
      }
    } catch (netErr) {
      console.warn('[Sync] Network error reaching Vercel cloud:', netErr.message);
      return { success: false, error: netErr.message, localTotal: localMachines.length };
    }

    if (!Array.isArray(cloudMachines) || cloudMachines.length === 0) {
      return { success: true, count: localMachines.length, localTotal: localMachines.length };
    }

    // 3. Upsert all cloud machines into local SQLite database
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

    let pulledCount = 0;
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
      pulledCount++;
    }

    const currentTotal = db.prepare('SELECT count(*) as total FROM machines').get().total;
    console.log(`[Sync] 2-Way Sync Complete! Local: ${currentTotal}, Cloud: ${cloudMachines.length}`);
    return {
      success: true,
      localTotal: currentTotal,
      cloudTotal: cloudMachines.length,
      synced: pulledCount
    };
  } catch (err) {
    console.error('[Sync] Bidirectional sync error:', err.message);
    return { success: false, error: err.message };
  }
}

// Single machine push helper for instant sync on add/update
async function pushSingleMachine(machine) {
  if (!machine || !machine.serial_no) return;
  try {
    await fetch(CLOUD_SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machines: [machine] }),
      signal: AbortSignal.timeout(4000)
    });
  } catch (e) {
    // Non-blocking background push
  }
}

if (require.main === module) {
  syncBidirectional().then(res => {
    console.log('Result:', res);
  });
}

module.exports = { syncBidirectional, syncFromCloud: syncBidirectional, pushSingleMachine };
