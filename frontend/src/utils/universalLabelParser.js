/**
 * Universal Global Machine Label Parser & Extraction Engine
 * 
 * Supports machine labels from any manufacturer worldwide regardless of brand,
 * country of origin, label format, or machinery type (Electrical, Mechanical,
 * Automation, HVAC, Biometrics, Computing, Heavy Machinery, Pumps, etc.).
 */

const GLOBAL_MANUFACTURERS = [
  'Siemens', 'ABB', 'Schneider Electric', 'Mitsubishi Electric', 'Fanuc', 'Omron',
  'Rockwell Automation', 'Allen-Bradley', 'Yaskawa', 'Kuka', 'Beckhoff', 'Wago',
  'Phoenix Contact', 'B&R Automation', 'Festo', 'SMC', 'Keyence', 'Yokogawa',
  'Caterpillar', 'Cummins', 'Komatsu', 'Liebherr', 'Hitachi', 'Doosan',
  'Danfoss', 'Bosch Rexroth', 'WEG', 'Leroy-Somer', 'Sew-Eurodrive', 'Nidec',
  'General Electric', 'Eaton', 'Alstom', 'Toshiba', 'Hyundai Heavy Industries',
  'Atlas Copco', 'Ingersoll Rand', 'Kaeser', 'Grundfos', 'KSB', 'Sulzer',
  'Flowserve', 'Wilo', 'Parker Hannifin', 'Rexroth', 'Ebara',
  'Daikin', 'Carrier', 'Trane', 'Johnson Controls', 'York', 'Mitsubishi Heavy',
  'Legrand', 'Honeywell', 'Emerson', 'Texas Instruments', 'CP Plus', 'Dahua',
  'Hikvision', 'Hanwha Techwin', 'Axis Communications', 'Bosch',
  'Cisco', 'Dell', 'Dell EMC', 'HP', 'Hewlett Packard', 'HPE', 'Lenovo',
  'IBM', 'Supermicro', 'Fortinet', 'Aruba', 'Ubiquiti', 'MikroTik', 'Juniper'
];

const MACHINE_TYPES = [
  { name: 'Programmable Logic Controller (PLC)', category: 'Industrial Automation', regex: /\b(?:PLC|Programmable\s*Logic\s*Controller|CPU\s*Module|I\/O\s*Module|SIMATIC)\b/i },
  { name: 'Variable Frequency Drive (VFD)', category: 'Drives & Power', regex: /\b(?:VFD|Inverter|Frequency\s*Converter|Variable\s*Speed\s*Drive|AC\s*Drive|Servo\s*Drive)\b/i },
  { name: 'Three-Phase Induction Motor', category: 'Electric Motors', regex: /\b(?:Induction\s*Motor|Electric\s*Motor|Three[\s\-]*Phase\s*Motor|3[\s\-]*Phase\s*Motor|AC\s*Motor)\b/i },
  { name: 'Rotary Screw Air Compressor', category: 'Compressors & Pneumatics', regex: /\b(?:Screw\s*Compressor|Air\s*Compressor|Reciprocating\s*Compressor|Compressor)\b/i },
  { name: 'Centrifugal Water Pump', category: 'Pumps & Fluid Handling', regex: /\b(?:Centrifugal\s*Pump|Submersible\s*Pump|Water\s*Pump|Hydraulic\s*Pump)\b/i },
  { name: 'Access Control Terminal', category: 'Security & Biometrics', regex: /\b(?:Access\s*Control|Biometric\s*Terminal|Face\s*Recognition|Fingerprint\s*Reader|Card\s*Reader)\b/i },
  { name: 'Industrial Network Switch', category: 'Enterprise Networking', regex: /\b(?:Managed\s*Switch|Ethernet\s*Switch|Network\s*Switch|Catalyst|PoE\s*Switch|Router)\b/i },
  { name: 'Enterprise Rack Server', category: 'Computing & IT', regex: /\b(?:PowerEdge|Rack\s*Server|Enterprise\s*Server|Blade\s*Server)\b/i },
  { name: 'Diesel Generator Set', category: 'Power Generation', regex: /\b(?:Diesel\s*Generator|Genset|Alternator|Power\s*Generator)\b/i },
  { name: 'Hydraulic Power Pack', category: 'Hydraulics', regex: /\b(?:Hydraulic\s*Power\s*Pack|Hydraulic\s*Cylinder|Hydraulic\s*Valve)\b/i },
  { name: 'Transformer / Power Supply', category: 'Electrical Equipment', regex: /\b(?:Transformer|Power\s*Supply|SMPS|Switching\s*Power|Rectifier)\b/i }
];

const COUNTRIES = [
  'Germany', 'Japan', 'USA', 'United States', 'India', 'China', 'Italy',
  'Switzerland', 'United Kingdom', 'UK', 'France', 'South Korea', 'Korea',
  'Sweden', 'Finland', 'Denmark', 'Austria', 'Taiwan', 'Canada', 'Spain',
  'Netherlands', 'Brazil', 'Mexico', 'Singapore', 'Malaysia', 'Belgium'
];

export function extractGlobalMachineInfo(text) {
  if (!text || typeof text !== 'string') {
    return createEmptyResult('');
  }

  const cleanText = text.replace(/\r/g, '');
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

  let serialNo = '';
  let modelNo = '';
  let manufacturer = '';
  let machineName = '';
  let category = '';
  let mfgDate = '';
  let countryOfOrigin = '';
  let voltage = '';
  let power = '';
  let capacity = '';
  let protectionClass = '';
  let machineId = '';
  const technicalSpecs = {};

  // 1. JSON payload check
  if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
    try {
      const parsedJson = JSON.parse(text);
      return parseJsonPayload(parsedJson, text);
    } catch (e) {}
  }

  // Key-value pairs check
  if (cleanText.includes(';') || cleanText.includes('&')) {
    const pairs = cleanText.split(/[;&]/);
    for (const p of pairs) {
      const [k, v] = p.split(/[:=]/).map(s => s?.trim());
      if (k && v) {
        const keyLower = k.toLowerCase();
        if (/^(?:s\/n|sn|serial|serial_no|serialno)$/.test(keyLower)) serialNo = v;
        if (/^(?:mod|model|type|pn|p_n)$/.test(keyLower)) modelNo = v;
        if (/^(?:mfr|mfg|brand|company|maker)$/.test(keyLower)) manufacturer = v;
      }
    }
  }

  // 2. Serial Number
  const serialRegexList = [
    /(?:S\/N|S\.N\.|SN|Serial\s*No\.?|Serial\s*Number|Serial|S\/No|Ser\.?\s*Nr\.?|Fabr\.?\s*Nr\.?|Service\s*Tag)\s*[:=\-—#]?\s*([A-Za-z0-9\-_\/]{4,32})/i,
    /\b(GS\d{6,14})\b/i,
    /\b(SN[-_]?[A-Za-z0-9]{6,22})\b/i,
    /\b(FOC\d{4}[A-Za-z0-9]{4})\b/i
  ];

  for (const line of lines) {
    if (!serialNo) {
      for (const regex of serialRegexList) {
        const match = line.match(regex);
        if (match && match[1]) {
          serialNo = match[1].trim();
          break;
        }
      }
    }
  }

  if (!serialNo) {
    for (const regex of serialRegexList) {
      const match = cleanText.match(regex);
      if (match && match[1]) {
        serialNo = match[1].trim();
        break;
      }
    }
  }

  // 3. Model Number (Specific markers first)
  const priorityModelRegexes = [
    /(?:Model\s*No\.?|Model\s*Number|Model|Modell?|M\/N|Cat\.?\s*No\.?|Cat#)\s*[:=\-—#]?\s*([A-Za-z0-9\-_\/]{3,35})/i,
    /(?:P\/N|Part\s*No\.?|Product\s*No\.?|Item\s*No\.?|Article\s*No\.?|Art\.?\s*Nr\.?|MLFB)\s*[:=\-—#]?\s*([A-Za-z0-9\-_\/]{4,35})/i,
    /\b(DS-[A-Za-z0-9\-_\/]{4,25})\b/i,
    /\b(6ES7\s*[0-9A-Za-z\-]+)\b/i,
    /\b([A-Z0-9]{3,8}-[A-Z0-9]{4,14})\b/
  ];

  for (const rx of priorityModelRegexes) {
    const match = cleanText.match(rx);
    if (match && match[1]) {
      modelNo = match[1].trim();
      break;
    }
  }

  if (!modelNo) {
    const typeMatch = cleanText.match(/(?:Typ|Type)\s*[:=\-—#]?\s*([A-Za-z0-9\-_\/]{3,35})/i);
    if (typeMatch && typeMatch[1]) modelNo = typeMatch[1].trim();
  }

  // 4. Manufacturer Recognition
  if (!manufacturer) {
    for (const brand of GLOBAL_MANUFACTURERS) {
      const escaped = brand.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(cleanText)) {
        manufacturer = brand;
        break;
      }
    }

    if (!manufacturer) {
      const mfgMatches = [
        /(?:Manufactured\s*by|Mfg\s*by|Producer|Maker|Brand|Made\s*by)\s*[:=\-—]?\s*([A-Za-z0-9&.,\- ]{3,45})/i,
        /([A-Za-z0-9&.\- ]{3,35})\s*(?:GmbH|AG|Corp(?:\.|oration)?|Inc\.|Co\.,?\s*Ltd\.?|LLC|Pvt\.\s*Ltd\.)/i
      ];

      for (const rx of mfgMatches) {
        const m = cleanText.match(rx);
        if (m && m[1]) {
          const cand = m[1].trim();
          if (cand.length > 2 && !/^(the|model|serial|date|type)$/i.test(cand)) {
            manufacturer = cand;
            break;
          }
        }
      }
    }

    if (!manufacturer && lines.length > 0) {
      const firstLine = lines[0].trim();
      if (/^[A-Z0-9\s&.\-]{3,28}$/.test(firstLine) && !firstLine.includes(':') && !/^(MODEL|SERIAL|WARNING|DANGER|MADE|SPECIFICATION)/i.test(firstLine)) {
        manufacturer = firstLine;
      }
    }
  }

  // 5. Machine Name & Category
  for (const item of MACHINE_TYPES) {
    if (item.regex.test(cleanText)) {
      machineName = item.name;
      category = item.category;
      break;
    }
  }

  // 6. Manufacturing Date
  const dateRegexList = [
    /(?:MFG\.?\s*Date|DOM|Mfg\s*Date|Date\s*of\s*Mfg\.?|Prod\.?\s*Date|Production\s*Date|Date\s*of\s*Manufacture|Baujahr|Fabr\.?\s*Year)\s*[:=\-—]?\s*([A-Za-z0-9\/.\-\s]{4,15})/i,
    /\b(?:Date|Mfg)\s*[:=\-—]?\s*(\d{2}[\/.-]\d{2}[\/.-]\d{4}|\d{4}[\/.-]\d{2}|\d{2}\/\d{4})\b/i
  ];

  for (const rx of dateRegexList) {
    const match = cleanText.match(rx);
    if (match && match[1]) {
      mfgDate = match[1].trim();
      break;
    }
  }

  // 7. Country of Origin
  for (const c of COUNTRIES) {
    const rx = new RegExp(`(?:Made\\s*in|Country\\s*of\\s*Origin|Hergestellt\\s*in|Fabriqu[ée]\\s*en)\\s*[:=\\-—]?\\s*(?:the\\s*)?${c}\\b`, 'i');
    if (rx.test(cleanText)) {
      countryOfOrigin = c;
      break;
    }
    const simpleRx = new RegExp(`Made\\s*in\\s*${c}\\b`, 'i');
    if (simpleRx.test(cleanText)) {
      countryOfOrigin = c;
      break;
    }
  }

  if (!countryOfOrigin && /(?:Made\s*in\s*P\.?R\.?C\.?|Made\s*in\s*China)/i.test(cleanText)) {
    countryOfOrigin = 'China (P.R.C.)';
  }

  // 8. Voltage & Power Ratings
  const voltageMatch = cleanText.match(/(?:Voltage|I\/P|Input|Rated\s*Voltage|Rated)\s*[:=\-—]?\s*(\d{1,4}(?:\s*-\s*\d{1,4})?\s*V(?:\s*(?:AC|DC|~|==|\d+\s*Hz|\d+\s*Phase))?)/i) ||
                       cleanText.match(/\b(\d{2,4}\s*V(?:\s*(?:AC|DC|~|==))?)\b/i);
  if (voltageMatch && voltageMatch[1]) {
    voltage = voltageMatch[1].trim();
  }

  const powerMatch = cleanText.match(/(?:Power|Rating|Output)?\s*[:=\-—]?\s*(\d+(?:\.\d+)?\s*(?:kW|HP|Watts?|W|kVA|MW)\b)/i);
  if (powerMatch && powerMatch[1]) {
    power = powerMatch[1].trim();
  }

  const freqMatch = cleanText.match(/\b(50\/60\s*Hz|50\s*Hz|60\s*Hz)\b/i);
  if (freqMatch && freqMatch[1]) {
    technicalSpecs['Frequency'] = freqMatch[1].trim();
  }

  // 9. Capacity & Performance Ratings
  const rpmMatch = cleanText.match(/\b(\d{3,5}\s*(?:RPM|min[-−]1|r\/min|rpm))\b/i);
  if (rpmMatch && rpmMatch[1]) {
    capacity = rpmMatch[1].trim();
    technicalSpecs['Rated Speed'] = rpmMatch[1].trim();
  }

  const pressMatch = cleanText.match(/\b(\d+(?:\.\d+)?\s*(?:Bar|PSI|MPa|kPa))\b/i);
  if (pressMatch && pressMatch[1]) {
    technicalSpecs['Operating Pressure'] = pressMatch[1].trim();
    if (!capacity) capacity = pressMatch[1].trim();
  }

  const flowMatch = cleanText.match(/\b(\d+(?:\.\d+)?\s*(?:m3\/h|m³\/h|CFM|L\/min|GPM|kg|Tons?))\b/i);
  if (flowMatch && flowMatch[1]) {
    technicalSpecs['Flow/Capacity'] = flowMatch[1].trim();
    if (!capacity) capacity = flowMatch[1].trim();
  }

  const ipMatch = cleanText.match(/\b(IP\s*[0-9]{2}[A-Z]?|NEMA\s*[0-9A-Z]+)\b/i);
  if (ipMatch && ipMatch[1]) {
    protectionClass = ipMatch[1].replace(/\s+/g, '').toUpperCase();
    technicalSpecs['Protection Class'] = protectionClass;
  }

  const tagMatch = cleanText.match(/(?:Tag\s*No\.?|Plant\s*Tag|Asset\s*ID|Mach(?:ine)?\s*ID)\s*[:=\-—]?\s*([A-Za-z0-9\-_\/]+)/i);
  if (tagMatch && tagMatch[1]) {
    machineId = tagMatch[1].trim();
    technicalSpecs['Machine ID'] = machineId;
  }

  if (voltage) technicalSpecs['Voltage'] = voltage;
  if (power) technicalSpecs['Power Rating'] = power;
  if (countryOfOrigin) technicalSpecs['Country of Origin'] = countryOfOrigin;
  if (mfgDate) technicalSpecs['Mfg Date'] = mfgDate;
  if (category) technicalSpecs['Category'] = category;

  const specSummaryParts = [];
  if (machineName) specSummaryParts.push(`Type: ${machineName}`);
  if (voltage) specSummaryParts.push(`Voltage: ${voltage}`);
  if (power) specSummaryParts.push(`Power: ${power}`);
  if (capacity) specSummaryParts.push(`Rating: ${capacity}`);
  if (countryOfOrigin) specSummaryParts.push(`Origin: ${countryOfOrigin}`);
  if (protectionClass) specSummaryParts.push(`IP: ${protectionClass}`);

  const formattedNotes = specSummaryParts.join(' | ');

  let confidence = 0;
  if (serialNo) confidence += 35;
  if (modelNo) confidence += 35;
  if (manufacturer) confidence += 15;
  if (voltage || power || machineName) confidence += 15;

  return {
    serialNo: serialNo.toUpperCase(),
    model: modelNo.toUpperCase(),
    productCompany: manufacturer || 'Unknown Manufacturer',
    machineName: machineName || '',
    category: category || 'Industrial Hardware',
    mfgDate: mfgDate || '',
    countryOfOrigin: countryOfOrigin || '',
    voltage: voltage || '',
    power: power || '',
    capacity: capacity || '',
    protectionClass: protectionClass || '',
    machineId: machineId || '',
    technicalSpecs,
    formattedNotes,
    confidence,
    rawText
  };
}

function parseJsonPayload(json, rawText) {
  const serialNo = json.serial_no || json.serialNo || json.sn || json.serial || json.s_n || '';
  const model = json.model || json.model_no || json.modelNo || json.type || json.pn || '';
  const company = json.manufacturer || json.company || json.product_company || json.brand || json.maker || '';
  const machineName = json.machine_name || json.name || json.title || '';
  const category = json.category || json.machine_type || '';
  const mfgDate = json.mfg_date || json.manufacturing_date || json.date || '';
  const country = json.country || json.country_of_origin || json.origin || '';
  const voltage = json.voltage || json.voltage_rating || '';
  const power = json.power || json.power_rating || '';
  const capacity = json.capacity || '';

  const technicalSpecs = { ...json };

  return {
    serialNo: String(serialNo).toUpperCase(),
    model: String(model).toUpperCase(),
    productCompany: company || 'Unknown Manufacturer',
    machineName: machineName || '',
    category: category || 'Industrial Hardware',
    mfgDate: mfgDate || '',
    countryOfOrigin: country || '',
    voltage: voltage || '',
    power: power || '',
    capacity: capacity || '',
    protectionClass: json.protection_class || json.ip_rating || '',
    machineId: json.machine_id || json.tag || '',
    technicalSpecs,
    formattedNotes: json.notes || `Structured JSON Machine Payload: ${model}`,
    confidence: 100,
    rawText
  };
}

function createEmptyResult(rawText) {
  return {
    serialNo: '',
    model: '',
    productCompany: '',
    machineName: '',
    category: '',
    mfgDate: '',
    countryOfOrigin: '',
    voltage: '',
    power: '',
    capacity: '',
    protectionClass: '',
    machineId: '',
    technicalSpecs: {},
    formattedNotes: '',
    confidence: 0,
    rawText: rawText || ''
  };
}
