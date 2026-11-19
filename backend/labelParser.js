/**
 * Intelligent Universal Global Label Parser (Backend)
 * Extracts Serial Number, Model, Manufacturer, Voltage, Capacity, Country of Origin, etc.
 */

const GLOBAL_MANUFACTURERS = [
  'Siemens', 'ABB', 'Schneider Electric', 'Mitsubishi Electric', 'Fanuc', 'Omron',
  'Rockwell Automation', 'Allen-Bradley', 'Yaskawa', 'Kuka', 'Danfoss', 'Bosch Rexroth',
  'Caterpillar', 'Cummins', 'Atlas Copco', 'Ingersoll Rand', 'Grundfos', 'KSB',
  'Daikin', 'Carrier', 'Honeywell', 'Emerson', 'Legrand', 'Hikvision', 'Dahua',
  'Cisco', 'Dell', 'HP', 'Lenovo', 'CP Plus', 'Ubiquiti', 'Bosch'
];

function parseLabelText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      serial_no: '',
      model: '',
      product_company: '',
      machine_name: '',
      country_of_origin: '',
      voltage: '',
      power: '',
      capacity: '',
      confidence: 0,
      raw_text: ''
    };
  }

  const cleanText = rawText.replace(/\r\n/g, '\n');
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

  let serialNo = '';
  let modelNo = '';
  let company = '';
  let machineName = '';
  let country = '';
  let voltage = '';
  let power = '';
  let capacity = '';

  // JSON check
  if (rawText.trim().startsWith('{') && rawText.trim().endsWith('}')) {
    try {
      const j = JSON.parse(rawText);
      return {
        serial_no: (j.serial_no || j.sn || j.serial || '').toUpperCase(),
        model: (j.model || j.model_no || j.type || '').toUpperCase(),
        product_company: j.manufacturer || j.company || j.brand || 'Unknown Manufacturer',
        machine_name: j.machine_name || j.name || '',
        country_of_origin: j.country || j.origin || '',
        voltage: j.voltage || '',
        power: j.power || '',
        capacity: j.capacity || '',
        confidence: 100,
        raw_text: rawText
      };
    } catch (e) {}
  }

  // 1. Manufacturer Recognition
  for (const b of GLOBAL_MANUFACTURERS) {
    const rx = new RegExp(`\\b${b.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (rx.test(cleanText)) {
      company = b;
      break;
    }
  }

  if (!company) {
    const mfgMatches = [
      /(?:Manufactured\s*by|Mfg\s*by|Producer|Maker|Brand|Made\s*by)\s*[:=\-—]?\s*([A-Za-z0-9&.,\- ]{3,45})/i,
      /([A-Za-z0-9&.\- ]{3,35})\s*(?:GmbH|AG|Corp(?:\.|oration)?|Inc\.|Co\.,?\s*Ltd\.?|LLC|Pvt\.\s*Ltd\.)/i
    ];
    for (const rx of mfgMatches) {
      const m = cleanText.match(rx);
      if (m && m[1]) {
        const cand = m[1].trim();
        if (cand.length > 2 && !/^(the|model|serial|date|type)$/i.test(cand)) {
          company = cand;
          break;
        }
      }
    }
  }

  // 2. Serial Number
  const serialRegexes = [
    /(?:S\/N|S\.N\.|SN|Serial\s*No\.?|Serial\s*Number|Serial|S\/No|Ser\.?\s*Nr\.?|Fabr\.?\s*Nr\.?|Service\s*Tag)\s*[:=\-—#]?\s*([A-Za-z0-9\-_]{4,25})/i,
    /\b(GS\s*\d{6,14})\b/i,
    /\b(SN[-_]?[A-Za-z0-9]{6,22})\b/i,
    /\b(FOC\d{4}[A-Za-z0-9]{4})\b/i
  ];

  for (const rx of serialRegexes) {
    const m = cleanText.match(rx);
    if (m && m[1]) {
      let cand = m[1].trim().replace(/\s+/g, '').toUpperCase();
      if (/^GS[0-9A-Z]{7}$/.test(cand)) {
        const numPart = cand.substring(2)
          .replace(/O/g, '0').replace(/[IL]/g, '1').replace(/Z/g, '2').replace(/S/g, '5').replace(/B/g, '8');
        if (/^\d{7}$/.test(numPart)) cand = `GS${numPart}`;
      }
      serialNo = cand;
      break;
    }
  }

  // 3. Model Number
  const priorityModelRegexes = [
    /(?:Model\s*No\.?|Model\s*Number|Model|Modell?|M\/N|Cat\.?\s*No\.?|Cat#)\s*[:=\-—#]?\s*([A-Za-z0-9\-_\/]{3,35})/i,
    /\b(DS-K[0-9A-Za-z\-_\/]{4,25})\b/i,
    /\b(DS-[A-Za-z0-9\-_\/]{4,25})\b/i,
    /(?:P\/N|Part\s*No\.?|Product\s*No\.?|Item\s*No\.?|MLFB)\s*[:=\-—#]?\s*([A-Za-z0-9\-_\/]{4,35})/i,
    /\b(6ES7\s*[0-9A-Za-z\-]+)\b/i,
    /\b([A-Z0-9]{3,8}-[A-Z0-9]{4,14})\b/
  ];

  for (const rx of priorityModelRegexes) {
    const m = cleanText.match(rx);
    if (m && m[1]) {
      modelNo = m[1].trim();
      break;
    }
  }

  if (!modelNo) {
    const typeMatch = cleanText.match(/(?:Typ|Type)\s*[:=\-—#]?\s*([A-Za-z0-9\-_\/]{3,35})/i);
    if (typeMatch && typeMatch[1]) modelNo = typeMatch[1].trim();
  }

  // Voltage (avoid matching model numbers ending in V)
  const vMatch = cleanText.match(/(?:Voltage|I\/P|Input|Rated\s*Voltage|Rated)\s*[:=\-—]?\s*(\d{1,4}(?:\s*-\s*\d{1,4})?\s*V(?:\s*(?:AC|DC|~|==|\d+\s*Hz|\d+\s*Phase))?)/i) ||
                 cleanText.match(/\b(\d{2,4}\s*V(?:\s*(?:AC|DC|~|==))?)\b/i);
  if (vMatch && vMatch[1]) voltage = vMatch[1].trim();

  // Power
  const pMatch = cleanText.match(/(?:Power|Rating|Output)?\s*[:=\-—]?\s*(\d+(?:\.\d+)?\s*(?:kW|HP|Watts?|W|kVA)\b)/i);
  if (pMatch && pMatch[1]) power = pMatch[1].trim();

  // Country of Origin
  const cMatch = cleanText.match(/(?:Made\s*in|Country\s*of\s*Origin)\s*[:=\-—]?\s*([A-Za-z\s]{3,20})\b/i);
  if (cMatch && cMatch[1]) country = cMatch[1].trim();

  if (!company) {
    if (/^DS-(?:K|KIT|2CD|7|1)/i.test(modelNo) || /^(?:GS|HK)\d{6,14}/i.test(serialNo)) {
      company = 'Hikvision';
      if (!machineName) machineName = 'Access Control & Biometric Terminal';
    } else if (/^(?:6ES7|6GK|6AV|SIMATIC)/i.test(modelNo)) {
      company = 'Siemens';
      if (!machineName) machineName = 'SIMATIC S7 Controller (PLC)';
    } else if (/^(?:C9200|C9300|WS-C|CBS|ISR|Catalyst)/i.test(modelNo) || /^FOC\d{4}/i.test(serialNo)) {
      company = 'Cisco';
      if (!machineName) machineName = 'Enterprise Managed Switch';
    } else if (/^M3BP/i.test(modelNo) || /^3GBA/i.test(serialNo)) {
      company = 'ABB';
      if (!machineName) machineName = 'Industrial Induction Motor';
    }
  }

  return {
    serial_no: serialNo.toUpperCase(),
    model: modelNo.toUpperCase(),
    product_company: company || 'Unknown Manufacturer',
    machine_name: machineName,
    country_of_origin: country,
    voltage,
    power,
    capacity,
    confidence: (serialNo ? 40 : 0) + (modelNo ? 40 : 0) + (company ? 20 : 0),
    raw_text: rawText
  };
}

module.exports = { parseLabelText };
