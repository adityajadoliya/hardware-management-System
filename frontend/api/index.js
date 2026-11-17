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

import fs from 'fs';
import path from 'path';
const TMP_FILE = '/tmp/machines.json';

// Real scanned machines from user (Total 29)
const initialScannedMachines = [
  { id: 29, serial_no: 'GS3763033', product_company: 'Hikvision', model: 'DS-K1T320EFWX', authorised_person: 'Aditya Sharma', plant: 'Gujarat -- Gujarat Plant', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-K1T320EFWX S/N: GS3763033' },
  { id: 28, serial_no: 'GS8602931', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS8602931' },
  { id: 27, serial_no: 'GS3918204', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat -- Gandhinagar Unit', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS3918204' },
  { id: 26, serial_no: 'GS7492016', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS7492016' },
  { id: 25, serial_no: 'GS5203948', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS5203948' },
  { id: 24, serial_no: 'GS8174920', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS8174920' },
  { id: 23, serial_no: 'GS6392015', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS6392015' },
  { id: 22, serial_no: 'GS9481723', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS9481723' },
  { id: 21, serial_no: 'GS2849103', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat -- Ahmedabad Plant', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS2849103' },
  { id: 20, serial_no: 'GS7592031', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS7592031' },
  { id: 19, serial_no: 'GS4182956', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS4182956' },
  { id: 18, serial_no: 'GS6294018', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS6294018' },
  { id: 17, serial_no: 'GS8301924', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS8301924' },
  { id: 16, serial_no: 'GS5482917', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS5482917' },
  { id: 15, serial_no: 'GS7193025', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat -- Ahmedabad Plant', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS7193025' },
  { id: 14, serial_no: 'GS3829104', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS3829104' },
  { id: 13, serial_no: 'GS9247183', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat -- Gandhinagar Unit', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS9247183' },
  { id: 12, serial_no: 'GS6159281', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS6159281' },
  { id: 11, serial_no: 'GS4918234', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat -- Ahmedabad Plant', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS4918234' },
  { id: 10, serial_no: 'GS7697849', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS7697849' },
  { id: 9, serial_no: 'GS5873194', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS5873194' },
  { id: 8, serial_no: 'GS7399893', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS7399893' },
  { id: 7, serial_no: 'GS2091974', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS2091974' },
  { id: 6, serial_no: 'GS7913858', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS7913858' },
  { id: 5, serial_no: 'GS8378952', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS8378952' },
  { id: 4, serial_no: 'GS1266816', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS1266816' },
  { id: 3, serial_no: 'GS8826729', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Delhi -- Delhi NCR', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS8826729' },
  { id: 2, serial_no: 'GS2802831', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS2802831' },
  { id: 1, serial_no: 'GS3440470', product_company: 'Hikvision', model: 'DS-KIT302EFWX', authorised_person: 'Bobby', plant: 'Gujarat', purchase_date: '2026-11-17', warranty_expiry_date: '2027-11-17', warranty_months: 12, status: 'Active', notes: 'Type: Access Control & Biometric Terminal | Ratings: 12V == 2A | 24 W | Origin: China', raw_scan_text: 'Hardware Plate: Hikvision DS-KIT302EFWX S/N: GS3440470' }
];

function getStoredMachines() {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {}
  return [...initialScannedMachines];
}

function saveStoredMachines(machines) {
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(machines), 'utf8');
  } catch (e) {}
}

let machinesStore = getStoredMachines();

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
    serial_no: resolvedSerial || (cleanQuery && /^[A-Za-z0-9\-_\/]{5,25}$/.test(cleanQuery) ? cleanQuery.toUpperCase() : ''),
    product_company: resolvedCompany || 'Hikvision',
    model: resolvedModel || (cleanQuery && cleanQuery.startsWith('DS-') ? cleanQuery.toUpperCase() : 'DS-KIT302EFWX'),
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

    // 6. Two-Way Bidirectional Sync Endpoint (Local DB <-> Vercel Cloud)
    if (pathname === '/sync' || pathname === '/sync/') {
      if (method === 'POST') {
        const { machines: incomingMachines = [] } = req.body || {};
        let addedCount = 0;
        let updatedCount = 0;

        for (const item of incomingMachines) {
          if (!item.serial_no) continue;
          const idx = machinesStore.findIndex(m => m.serial_no.toLowerCase() === item.serial_no.toLowerCase());
          if (idx !== -1) {
            machinesStore[idx] = {
              ...machinesStore[idx],
              ...item,
              updated_at: item.updated_at || new Date().toISOString()
            };
            updatedCount++;
          } else {
            const newId = machinesStore.length ? Math.max(...machinesStore.map(m => m.id)) + 1 : 1;
            machinesStore.push({
              ...item,
              id: item.id || newId,
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString()
            });
            addedCount++;
          }
          if (item.plant && !plantsStore.some(p => p.toLowerCase() === item.plant.toLowerCase())) {
            plantsStore.push(item.plant);
          }
        }
        saveStoredMachines(machinesStore);
        return res.status(200).json({
          success: true,
          added: addedCount,
          updated: updatedCount,
          cloudTotal: machinesStore.length,
          machines: machinesStore.map(enrichMachineData)
        });
      }
      if (method === 'GET') {
        return res.status(200).json({
          success: true,
          cloudTotal: machinesStore.length,
          machines: machinesStore.map(enrichMachineData)
        });
      }
    }

    // 7. CSV Export
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
        const serial_no = (body.serial_no || '').trim();
        if (!serial_no) {
          return res.status(400).json({ error: 'Serial number is required' });
        }
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
          saveStoredMachines(machinesStore);
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
        saveStoredMachines(machinesStore);
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
        saveStoredMachines(machinesStore);
        return res.status(200).json(enrichMachineData(machinesStore[idx]));
      }

      if (method === 'DELETE') {
        machinesStore.splice(idx, 1);
        saveStoredMachines(machinesStore);
        return res.status(200).json({ success: true, message: 'Machine deleted successfully' });
      }
    }

    return res.status(404).json({ error: `Path ${pathname} not found on serverless API` });
  } catch (err) {
    console.error('Serverless function error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
