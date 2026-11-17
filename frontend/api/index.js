/**
 * Vercel Serverless Function Handler for Hardware Management System
 * Self-contained, zero-dependency, ultra-fast API handler.
 */

// Initial Seed Data
const plantsStore = [
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

// Clean state - No dummy machines
let machinesStore = [];

// Global Hardware Catalog
const GLOBAL_CATALOG = [
  { company: 'Hikvision', modelPrefixes: ['DS-', 'DS-KIT', 'DS-K', 'DS-2CD', 'DS-7'], serialPatterns: [/^(?:GS|SN|HK)\d{6,12}$/i, /^GS3762838/i], defaultModel: 'DS-KIT302EFWX', machineName: 'Access Control & Biometric Terminal', category: 'Security & Biometrics' },
  { company: 'Cisco', modelPrefixes: ['C9200', 'C9300', 'WS-C', 'CBS', 'ISR', 'ASR', 'Catalyst'], serialPatterns: [/^[A-Z]{3}\d{4}[A-Z0-9]{4}$/i, /^FOC\d{4}/i], defaultModel: 'C9200L-24P-4G', machineName: 'Industrial Gigabit Managed Switch', category: 'Enterprise Networking' },
  { company: 'Siemens', modelPrefixes: ['6ES7', '6GK', '6AV', 'SIMATIC', 'S7-1200', 'S7-1500', 'S7-300'], serialPatterns: [/^[A-Z]{4}\d{6,10}$/i, /^SVPB\d+/i], defaultModel: '6ES7515-2AM01-0AB0', machineName: 'SIMATIC S7-1500 Programmable Controller (PLC)', category: 'Industrial Automation' },
  { company: 'ABB', modelPrefixes: ['M3BP', 'M2BAX', 'ACS580', 'ACS880'], serialPatterns: [/^\d[A-Z]{3}\d{6}-[A-Z]{3}$/i, /^3GBA\d+/i], defaultModel: 'M3BP-160MLB4', machineName: 'Three-Phase Industrial Induction Motor', category: 'Electric Motors & Drives' },
  { company: 'Atlas Copco', modelPrefixes: ['GA-', 'GX-', 'ZT-', 'ZR-', 'G-'], serialPatterns: [/^[A-Z]{3}-\d{6,10}$/i, /^APF-\d+/i], defaultModel: 'GA-22-VSD+', machineName: 'Rotary Screw Air Compressor', category: 'Compressors & Pneumatics' },
  { company: 'Grundfos', modelPrefixes: ['CR-', 'CM-', 'NB-', 'NK-', 'MAGNA'], serialPatterns: [/^GF\d{8,12}[A-Z]?$/i, /^GF\d+/i], defaultModel: 'CR-15-04', machineName: 'Industrial Centrifugal Water Pump', category: 'Pumps & Fluid Handling' },
  { company: 'Dell', modelPrefixes: ['PowerEdge', 'R740', 'R640', 'R750', 'OptiPlex'], serialPatterns: [/^[A-Z0-9]{7}$/i], defaultModel: 'PowerEdge R740xd', machineName: 'Enterprise Rack Server', category: 'Computing & IT' },
  { company: 'HP', modelPrefixes: ['ProLiant', 'DL380', 'DL360', 'EliteBook'], serialPatterns: [/^[A-Z]{2}[0-9A-Z]{8}$/i], defaultModel: 'ProLiant DL380 Gen10', machineName: 'Enterprise Rack Server', category: 'Computing & IT' }
];

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
    product_company: machine.product_company || 'Hikvision',
    pending_days: diffDays,
    warranty_status,
    label_image_url: machine.label_image || null
  };
}

function resolveGlobalMachine(query, rawText = '') {
  const cleanQuery = (query || '').trim();
  const fullText = `${cleanQuery}\n${rawText || ''}`.trim();

  let resolvedSerial = '';
  let resolvedCompany = '';
  let resolvedModel = '';
  let resolvedName = '';
  let found = false;

  for (const entry of GLOBAL_CATALOG) {
    const modelMatched = entry.modelPrefixes.some(p => new RegExp(`\\b${p}`, 'i').test(fullText));
    const serialMatched = entry.serialPatterns.some(p => p.test(cleanQuery) || p.test(fullText));
    const companyMatched = new RegExp(`\\b${entry.company}\\b`, 'i').test(fullText);

    if (modelMatched || serialMatched || (companyMatched && (cleanQuery || rawText))) {
      resolvedCompany = entry.company;
      resolvedName = entry.machineName;

      for (const prefix of entry.modelPrefixes) {
        const m = fullText.match(new RegExp(`\\b(${prefix}[A-Za-z0-9\\-_\\/]{1,25})\\b`, 'i'));
        if (m && m[1]) {
          resolvedModel = m[1].toUpperCase();
          break;
        }
      }
      if (!resolvedModel && entry.defaultModel) resolvedModel = entry.defaultModel;
      found = true;
      break;
    }
  }

  const serialMatches = [
    /(?:S\/N|SN|Serial\s*No\.?|Serial|Service\s*Tag)\s*[:=\-—#]?\s*([A-Za-z0-9\-_\/]{5,32})/i,
    /\b(GS\d{6,14})\b/i,
    /\b(FOC\d{4}[A-Za-z0-9]{4})\b/i,
    /\b(SN[-_]?[A-Za-z0-9]{6,22})\b/i
  ];
  for (const rx of serialMatches) {
    const m = fullText.match(rx);
    if (m && m[1]) {
      resolvedSerial = m[1].toUpperCase();
      break;
    }
  }
  if (!resolvedSerial && /^[A-Za-z0-9\-_\/]{5,25}$/.test(cleanQuery) && !/^(HIKVISION|SIEMENS|CISCO|MODEL|SERIAL)$/i.test(cleanQuery)) {
    resolvedSerial = cleanQuery.toUpperCase();
  }

  const existing = machinesStore.find(m => m.serial_no.toLowerCase() === (resolvedSerial || cleanQuery).toLowerCase());
  if (existing) {
    resolvedCompany = resolvedCompany || existing.product_company;
    resolvedModel = resolvedModel || existing.model;
    found = true;
  }

  return {
    serial_no: resolvedSerial || cleanQuery || 'GS3762838',
    product_company: resolvedCompany || 'Hikvision',
    model: resolvedModel || 'DS-KIT302EFWX',
    machine_name: resolvedName || 'Access Control & Biometric Terminal',
    found
  };
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/^\/api/, '');
  const method = req.method;

  try {
    // 1. Healthcheck
    if (pathname === '/health' || pathname === '') {
      return res.status(200).json({ status: 'ok', serverless: true, count: machinesStore.length });
    }

    // 2. Stats
    if (pathname === '/stats' && method === 'GET') {
      const enriched = machinesStore.map(enrichMachineData);
      const total = enriched.length;
      const active = enriched.filter(m => m.warranty_status === 'ACTIVE').length;
      const expiringSoon = enriched.filter(m => m.warranty_status === 'EXPIRING_SOON').length;
      const expired = enriched.filter(m => m.warranty_status === 'EXPIRED').length;
      const plantCount = plantsStore.length;
      return res.status(200).json({ total, active, expiringSoon, expired, plantCount });
    }

    // 3. Plants
    if (pathname === '/plants') {
      if (method === 'GET') {
        const result = plantsStore.map((name, i) => {
          const count = machinesStore.filter(m => m.plant.toLowerCase() === name.toLowerCase()).length;
          return { id: i + 1, name, count };
        });
        return res.status(200).json(result);
      }
      if (method === 'POST') {
        const { name } = req.body || {};
        if (name && !plantsStore.some(p => p.toLowerCase() === name.trim().toLowerCase())) {
          plantsStore.push(name.trim());
        }
        return res.status(201).json({ success: true, name });
      }
    }

    // 4. Check Serial Number
    if (pathname.startsWith('/machines/check-serial/')) {
      const serial = decodeURIComponent(pathname.replace('/machines/check-serial/', '')).trim();
      const existing = machinesStore.find(m => m.serial_no.toLowerCase() === serial.toLowerCase());
      return res.status(200).json({ exists: !!existing, machine: existing || null });
    }

    // 5. Global Search
    if (pathname === '/scan/global-search' && method === 'POST') {
      const { query, raw_text } = req.body || {};
      const resolved = resolveGlobalMachine(query, raw_text);
      return res.status(200).json(resolved);
    }

    // 6. CSV Export
    if (pathname === '/export/csv' && method === 'GET') {
      const enriched = machinesStore.map(enrichMachineData);
      const headers = ['ID', 'Serial No', 'Product Company', 'Model', 'Plant (Destination)', 'Authorised Person', 'Purchase Date', 'Date Uploaded', 'Warranty Expiry Date', 'Pending Warranty Days', 'Warranty Status', 'Status', 'Notes'];
      const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
      const rows = enriched.map(m => [m.id, m.serial_no, m.product_company, m.model, m.plant, m.authorised_person, m.purchase_date, m.created_at, m.warranty_expiry_date, m.pending_days, m.warranty_status, m.status, m.notes || ''].map(escapeCsv).join(','));
      const csv = [headers.join(','), ...rows].join('\r\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="hardware-inventory-${Date.now()}.csv"`);
      return res.status(200).send(csv);
    }

    // 7. Machines Collection (GET, POST)
    if (pathname === '/machines' || pathname === '/machines/') {
      if (method === 'GET') {
        let results = machinesStore.map(enrichMachineData);
        const search = url.searchParams.get('search');
        const plant = url.searchParams.get('plant');
        const warranty_status = url.searchParams.get('warranty_status');

        if (plant && plant !== 'ALL') {
          results = results.filter(m => m.plant.toLowerCase() === plant.toLowerCase());
        }
        if (warranty_status && warranty_status !== 'ALL') {
          results = results.filter(m => m.warranty_status === warranty_status.toUpperCase());
        }
        if (search) {
          const s = search.toLowerCase();
          results = results.filter(m =>
            (m.serial_no && m.serial_no.toLowerCase().includes(s)) ||
            (m.model && m.model.toLowerCase().includes(s)) ||
            (m.product_company && m.product_company.toLowerCase().includes(s)) ||
            (m.authorised_person && m.authorised_person.toLowerCase().includes(s)) ||
            (m.plant && m.plant.toLowerCase().includes(s)) ||
            (m.notes && m.notes.toLowerCase().includes(s))
          );
        }
        return res.status(200).json(results);
      }

      if (method === 'POST') {
        const body = req.body || {};
        const serial_no = (body.serial_no || `GS${Date.now()}`).trim();
        const product_company = (body.product_company || 'Hikvision').trim();
        const model = (body.model || 'DS-KIT302EFWX').trim();
        const authorised_person = (body.authorised_person || 'Aditya Sharma').trim();
        const plant = (body.plant || 'Gujarat -- Gujarat Plant').trim();
        const purchase_date = (body.purchase_date || new Date().toISOString().split('T')[0]).trim();
        const warranty_months = parseInt(body.warranty_months || 12, 10);

        let warranty_expiry_date = body.warranty_expiry_date;
        if (!warranty_expiry_date) {
          const p = new Date(purchase_date);
          p.setMonth(p.getMonth() + warranty_months);
          warranty_expiry_date = p.toISOString().split('T')[0];
        }

        if (!plantsStore.some(p => p.toLowerCase() === plant.toLowerCase())) {
          plantsStore.push(plant);
        }

        const existingIdx = machinesStore.findIndex(m => m.serial_no.toLowerCase() === serial_no.toLowerCase());
        if (existingIdx !== -1) {
          machinesStore[existingIdx] = {
            ...machinesStore[existingIdx],
            product_company,
            model,
            authorised_person,
            plant,
            purchase_date,
            warranty_expiry_date,
            warranty_months,
            status: body.status || 'Active',
            notes: body.notes || machinesStore[existingIdx].notes,
            label_image: body.base64_image || machinesStore[existingIdx].label_image,
            updated_at: new Date().toISOString()
          };
          return res.status(200).json(enrichMachineData(machinesStore[existingIdx]));
        }

        const newId = machinesStore.length ? Math.max(...machinesStore.map(m => m.id)) + 1 : 1;
        const newMachine = {
          id: newId,
          serial_no,
          product_company,
          model,
          authorised_person,
          plant,
          purchase_date,
          warranty_expiry_date,
          warranty_months,
          status: body.status || 'Active',
          label_image: body.base64_image || null,
          notes: body.notes || '',
          raw_scan_text: body.raw_scan_text || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        machinesStore.unshift(newMachine);
        return res.status(201).json(enrichMachineData(newMachine));
      }
    }

    // 8. Single Machine (GET, PUT, DELETE)
    const singleMatch = pathname.match(/^\/machines\/(\d+)$/);
    if (singleMatch) {
      const id = parseInt(singleMatch[1], 10);
      const idx = machinesStore.findIndex(m => m.id === id);

      if (idx === -1) {
        return res.status(404).json({ error: 'Machine not found' });
      }

      if (method === 'GET') {
        return res.status(200).json(enrichMachineData(machinesStore[idx]));
      }

      if (method === 'PUT') {
        const body = req.body || {};
        machinesStore[idx] = {
          ...machinesStore[idx],
          product_company: body.product_company || machinesStore[idx].product_company,
          model: body.model || machinesStore[idx].model,
          authorised_person: body.authorised_person || machinesStore[idx].authorised_person,
          plant: body.plant || machinesStore[idx].plant,
          purchase_date: body.purchase_date || machinesStore[idx].purchase_date,
          warranty_expiry_date: body.warranty_expiry_date || machinesStore[idx].warranty_expiry_date,
          warranty_months: parseInt(body.warranty_months || machinesStore[idx].warranty_months, 10),
          status: body.status || machinesStore[idx].status,
          notes: body.notes !== undefined ? body.notes : machinesStore[idx].notes,
          label_image: body.base64_image || machinesStore[idx].label_image,
          updated_at: new Date().toISOString()
        };
        return res.status(200).json(enrichMachineData(machinesStore[idx]));
      }

      if (method === 'DELETE') {
        machinesStore.splice(idx, 1);
        return res.status(200).json({ success: true, message: 'Machine deleted successfully' });
      }
    }

    return res.status(404).json({ error: `Path ${pathname} not found on serverless API` });
  } catch (err) {
    console.error('Serverless function error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
