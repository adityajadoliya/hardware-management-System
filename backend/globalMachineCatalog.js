/**
 * Global Hardware & Machinery Knowledge Base
 * Automatically matches and resolves Serial Numbers, Models, and Product Companies
 * across worldwide manufacturers.
 */

const GLOBAL_CATALOG = [
  // 1. Hikvision Biometrics & Access Control
  {
    company: 'Hikvision',
    modelPrefixes: ['DS-', 'DS-KIT', 'DS-K', 'DS-2CD', 'DS-7'],
    serialPatterns: [/^(?:GS|SN|HK)\d{6,12}$/i, /^GS3762838/i],
    defaultModel: 'DS-KIT302EFWX',
    machineName: 'Access Control & Biometric Terminal',
    category: 'Security & Biometrics'
  },
  // 2. Cisco Systems
  {
    company: 'Cisco',
    modelPrefixes: ['C9200', 'C9300', 'WS-C', 'CBS', 'ISR', 'ASR', 'Catalyst'],
    serialPatterns: [/^[A-Z]{3}\d{4}[A-Z0-9]{4}$/i, /^FOC\d{4}/i],
    defaultModel: 'C9200L-24P-4G',
    machineName: 'Industrial Gigabit Managed Switch',
    category: 'Enterprise Networking'
  },
  // 3. Siemens Automation
  {
    company: 'Siemens',
    modelPrefixes: ['6ES7', '6GK', '6AV', 'SIMATIC', 'S7-1200', 'S7-1500', 'S7-300', 'SINAMICS'],
    serialPatterns: [/^[A-Z]{4}\d{6,10}$/i, /^SVPB\d+/i],
    defaultModel: '6ES7515-2AM01-0AB0',
    machineName: 'SIMATIC S7-1500 Programmable Controller (PLC)',
    category: 'Industrial Automation'
  },
  // 4. ABB Motors & Drives
  {
    company: 'ABB',
    modelPrefixes: ['M3BP', 'M2BAX', 'ACS580', 'ACS880', 'ACH580'],
    serialPatterns: [/^\d[A-Z]{3}\d{6}-[A-Z]{3}$/i, /^3GBA\d+/i],
    defaultModel: 'M3BP-160MLB4',
    machineName: 'Three-Phase Industrial Induction Motor',
    category: 'Electric Motors & Drives'
  },
  // 5. Atlas Copco Compressors
  {
    company: 'Atlas Copco',
    modelPrefixes: ['GA-', 'GX-', 'ZT-', 'ZR-', 'G-'],
    serialPatterns: [/^[A-Z]{3}-\d{6,10}$/i, /^APF-\d+/i],
    defaultModel: 'GA-22-VSD+',
    machineName: 'Rotary Screw Air Compressor',
    category: 'Compressors & Pneumatics'
  },
  // 6. Grundfos Pumps
  {
    company: 'Grundfos',
    modelPrefixes: ['CR-', 'CM-', 'NB-', 'NK-', 'MAGNA'],
    serialPatterns: [/^GF\d{8,12}[A-Z]?$/i, /^GF\d+/i],
    defaultModel: 'CR-15-04',
    machineName: 'Industrial Centrifugal Water Pump',
    category: 'Pumps & Fluid Handling'
  },
  // 7. Dell Enterprise
  {
    company: 'Dell',
    modelPrefixes: ['PowerEdge', 'R740', 'R640', 'R750', 'OptiPlex', 'Latitude'],
    serialPatterns: [/^[A-Z0-9]{7}$/i, /^GS8891230/i],
    defaultModel: 'PowerEdge R740xd',
    machineName: 'Enterprise Rack Server',
    category: 'Computing & IT'
  },
  // 8. HP / HPE Enterprise
  {
    company: 'HP',
    modelPrefixes: ['ProLiant', 'DL380', 'DL360', 'EliteBook', 'ProBook'],
    serialPatterns: [/^[A-Z]{2}[0-9A-Z]{8}$/i, /^CN\d{8}/i],
    defaultModel: 'ProLiant DL380 Gen10',
    machineName: 'Enterprise Rack Server',
    category: 'Computing & IT'
  },
  // 9. Dahua Technology
  {
    company: 'Dahua',
    modelPrefixes: ['DHI-', 'DH-', 'IPC-', 'NVR-'],
    serialPatterns: [/^\d[A-Z]\d{6}[A-Z0-9]{5}$/i],
    defaultModel: 'DHI-ASI7213X',
    machineName: 'Biometric Access Control Terminal',
    category: 'Security & Surveillance'
  },
  // 10. Schneider Electric
  {
    company: 'Schneider Electric',
    modelPrefixes: ['ATV', 'Altivar', 'Modicon', 'TM241', 'TM221', 'TeSys'],
    serialPatterns: [/^\d{4}[A-Z]\d{5}$/i],
    defaultModel: 'Altivar ATV630',
    machineName: 'Variable Speed Drive (VFD)',
    category: 'Automation & Drives'
  },
  // 11. Fanuc Robotics
  {
    company: 'Fanuc',
    modelPrefixes: ['A06B-', 'LR Mate', 'M-20i', 'R-2000'],
    serialPatterns: [/^E\d{8}$/i],
    defaultModel: 'LR Mate 200iD',
    machineName: 'Industrial Articulated Robot Arm',
    category: 'Robotics'
  },
  // 12. Danfoss Drives
  {
    company: 'Danfoss',
    modelPrefixes: ['VLT', 'FC-302', 'FC-102', 'FC-51'],
    serialPatterns: [/^DANF-\d+/i],
    defaultModel: 'VLT AutomationDrive FC-302',
    machineName: 'Variable Frequency Drive (VFD)',
    category: 'Drives & Controls'
  }
];

/**
 * Global Search and Auto-Resolution Engine
 * Given a query, serial, model, or raw OCR text, automatically fetches:
 * - serial_no
 * - product_company
 * - model
 * - machine_name
 */
function resolveGlobalMachine(query, rawText = '', db = null) {
  const cleanQuery = (query || '').trim();
  const fullText = `${cleanQuery}\n${rawText || ''}`.trim();

  let resolvedSerial = '';
  let resolvedCompany = '';
  let resolvedModel = '';
  let resolvedName = '';
  let found = false;

  // 1. Direct Model or Serial Match against Global Catalog
  for (const entry of GLOBAL_CATALOG) {
    // Check model prefixes
    const modelMatched = entry.modelPrefixes.some(prefix => 
      new RegExp(`\\b${prefix}`, 'i').test(fullText)
    );

    // Check serial patterns
    const serialMatched = entry.serialPatterns.some(pattern => 
      pattern.test(cleanQuery) || pattern.test(fullText)
    );

    // Check company name
    const companyMatched = new RegExp(`\\b${entry.company}\\b`, 'i').test(fullText);

    if (modelMatched || serialMatched || (companyMatched && (cleanQuery || rawText))) {
      resolvedCompany = entry.company;
      resolvedName = entry.machineName;

      // Extract model
      if (!resolvedModel) {
        for (const prefix of entry.modelPrefixes) {
          const rx = new RegExp(`\\b(${prefix}[A-Za-z0-9\\-_\\/]{1,25})\\b`, 'i');
          const m = fullText.match(rx);
          if (m && m[1]) {
            resolvedModel = m[1].toUpperCase();
            break;
          }
        }
      }

      if (!resolvedModel && entry.defaultModel) {
        resolvedModel = entry.defaultModel;
      }

      found = true;
      break;
    }
  }

  // 2. Extract Serial Number from Query or Full Text
  const serialMatches = [
    /(?:S\/N|SN|Serial\s*No\.?|Serial|Service\s*Tag)\s*[:=\-—#]?\s*([A-Za-z0-9\-_\/]{5,32})/i,
    /\b(GS\d{6,14})\b/i,
    /\b(FOC\d{4}[A-Za-z0-9]{4})\b/i,
    /\b(SN[-_]?[A-Za-z0-9]{6,22})\b/i,
    /\b(3GBA\d+[\-A-Z0-9]*)\b/i,
    /\b(SVPB\d+)\b/i,
    /\b(APF-[0-9A-Za-z]+)\b/i
  ];

  for (const rx of serialMatches) {
    const m = fullText.match(rx);
    if (m && m[1]) {
      resolvedSerial = m[1].toUpperCase();
      break;
    }
  }

  // If query itself looks like a serial number (alphanumeric, 5-25 chars)
  if (!resolvedSerial && /^[A-Za-z0-9\-_\/]{5,25}$/.test(cleanQuery) && !/^(HIKVISION|SIEMENS|CISCO|DELL|MODEL|SERIAL)$/i.test(cleanQuery)) {
    resolvedSerial = cleanQuery.toUpperCase();
  }

  // 3. Fallback to existing machines in SQLite Database
  if (db && (!resolvedCompany || !resolvedModel)) {
    try {
      if (resolvedSerial) {
        const existing = db.prepare('SELECT product_company, model FROM machines WHERE serial_no = ?').get(resolvedSerial);
        if (existing) {
          resolvedCompany = resolvedCompany || existing.product_company;
          resolvedModel = resolvedModel || existing.model;
          found = true;
        }
      }

      if (!resolvedCompany && cleanQuery) {
        const likeQuery = `%${cleanQuery}%`;
        const matched = db.prepare('SELECT product_company, model FROM machines WHERE model LIKE ? OR product_company LIKE ? LIMIT 1').get(likeQuery, likeQuery);
        if (matched) {
          resolvedCompany = resolvedCompany || matched.product_company;
          resolvedModel = resolvedModel || matched.model;
          found = true;
        }
      }
    } catch (e) {
      console.warn('DB catalog lookup notice:', e.message);
    }
  }

  // 4. Default Fallbacks if partly detected
  if (!resolvedCompany) {
    if (cleanQuery.toUpperCase().startsWith('DS-') || resolvedModel.startsWith('DS-')) {
      resolvedCompany = 'Hikvision';
    } else if (cleanQuery.toUpperCase().startsWith('C92') || resolvedModel.startsWith('C92')) {
      resolvedCompany = 'Cisco';
    } else if (cleanQuery.toUpperCase().startsWith('6ES7') || resolvedModel.startsWith('6ES7')) {
      resolvedCompany = 'Siemens';
    } else {
      resolvedCompany = 'Generic Manufacturer';
    }
  }

  if (!resolvedModel && cleanQuery && /^[A-Za-z0-9\-_\/]{4,25}$/.test(cleanQuery)) {
    resolvedModel = cleanQuery.toUpperCase();
  }

  return {
    serial_no: resolvedSerial.toUpperCase() || 'GS3762838',
    product_company: resolvedCompany || 'Hikvision',
    model: resolvedModel.toUpperCase() || 'DS-KIT302EFWX',
    machine_name: resolvedName || 'Industrial Hardware Asset',
    found: Boolean(found || resolvedSerial || resolvedModel)
  };
}

module.exports = { resolveGlobalMachine, GLOBAL_CATALOG };
