import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  User,
  Cpu,
  Hash,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  Layers,
  Zap,
  Globe2,
  Tag,
  Gauge,
  ChevronDown
} from 'lucide-react';
import PlantAutocomplete from './PlantAutocomplete';
import confetti from 'canvas-confetti';

export default function MachineFormModal({
  isOpen,
  onClose,
  initialData = null,
  plants = [],
  onSaveSuccess,
  isEdit = false
}) {
  const [formData, setFormData] = useState({
    serial_no: '',
    product_company: 'Hikvision',
    model: '',
    authorised_person: '',
    plant: '',
    purchase_date: new Date().toISOString().split('T')[0],
    warranty_months: 12,
    warranty_expiry_date: '',
    status: 'Active',
    notes: '',
    base64_image: null,
    raw_scan_text: '',
    // Universal Global Extracted Details
    machine_name: '',
    voltage_power: '',
    capacity_rating: '',
    country_of_origin: '',
    mfg_date: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [serialWarning, setSerialWarning] = useState('');
  const [showTechSpecs, setShowTechSpecs] = useState(true);

  const companyOptions = [
    'Siemens',
    'ABB',
    'Schneider Electric',
    'Mitsubishi Electric',
    'Fanuc',
    'Omron',
    'Atlas Copco',
    'Grundfos',
    'Caterpillar',
    'Danfoss',
    'Honeywell',
    'Bosch',
    'Hikvision',
    'Cisco',
    'Dell',
    'HP',
    'Dahua',
    'CP Plus'
  ];

  const calculateExpiry = (purchaseDateStr, months) => {
    if (!purchaseDateStr) return '';
    const d = new Date(purchaseDateStr);
    d.setMonth(d.getMonth() + parseInt(months || 12, 10));
    return d.toISOString().split('T')[0];
  };

  const formRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const defaultAuthorised = localStorage.getItem('last_authorised_person') || 'Aditya Sharma';
    const defaultPlant = localStorage.getItem('last_plant') || (plants.length > 0 ? plants[0].name : 'Gujarat -- Gujarat Plant');

    if (initialData) {
      const pDate = initialData.purchase_date || new Date().toISOString().split('T')[0];
      const wMonths = initialData.warranty_months || 12;
      const expiry = initialData.warranty_expiry_date || calculateExpiry(pDate, wMonths);

      const vPower = [initialData.voltage, initialData.power].filter(Boolean).join(' | ');

      setFormData({
        id: initialData.id,
        serial_no: initialData.serial_no || initialData.serialNo || '',
        product_company: initialData.product_company || initialData.productCompany || 'Hikvision',
        model: initialData.model || '',
        authorised_person: initialData.authorised_person || defaultAuthorised,
        plant: initialData.plant || defaultPlant,
        purchase_date: pDate,
        warranty_months: wMonths,
        warranty_expiry_date: expiry,
        status: initialData.status || 'Active',
        notes: initialData.notes || '',
        base64_image: initialData.imageData || initialData.label_image_url || null,
        raw_scan_text: initialData.rawText || initialData.raw_scan_text || '',
        machine_name: initialData.machineName || initialData.machine_name || '',
        voltage_power: vPower || '',
        capacity_rating: initialData.capacity || initialData.capacity_rating || '',
        country_of_origin: initialData.countryOfOrigin || initialData.country_of_origin || '',
        mfg_date: initialData.mfgDate || initialData.mfg_date || ''
      });

      // Expand technical specifications if detected
      if (initialData.voltage || initialData.power || initialData.machineName || initialData.countryOfOrigin) {
        setShowTechSpecs(true);
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        serial_no: '',
        product_company: 'Hikvision',
        model: '',
        authorised_person: defaultAuthorised,
        plant: defaultPlant,
        purchase_date: today,
        warranty_months: 12,
        warranty_expiry_date: calculateExpiry(today, 12),
        status: 'Active',
        notes: '',
        base64_image: null,
        raw_scan_text: '',
        machine_name: '',
        voltage_power: '',
        capacity_rating: '',
        country_of_origin: '',
        mfg_date: ''
      });
    }
    setError('');
    setSerialWarning('');
  }, [isOpen, initialData, plants]);

  const calculateWarrantyPending = () => {
    if (!formData.warranty_expiry_date) return { days: 0, text: 'No date set', badge: 'neutral' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(formData.warranty_expiry_date);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        days: Math.abs(diffDays),
        text: `Expired ${Math.abs(diffDays)} days ago`,
        status: 'EXPIRED',
        badge: 'rose'
      };
    } else if (diffDays <= 30) {
      return {
        days: diffDays,
        text: `${diffDays} days remaining (Expiring Soon)`,
        status: 'EXPIRING_SOON',
        badge: 'amber'
      };
    } else {
      return {
        days: diffDays,
        text: `${diffDays} days remaining (Active)`,
        status: 'ACTIVE',
        badge: 'emerald'
      };
    }
  };

  const warrantyStatus = calculateWarrantyPending();

  const handleSerialBlur = async () => {
    if (!formData.serial_no || isEdit) return;
    try {
      const res = await fetch(`/api/machines/check-serial/${encodeURIComponent(formData.serial_no.trim())}`);
      const data = await res.json();
      if (data.exists) {
        setSerialWarning(`Serial No. "${formData.serial_no}" is already assigned in ${data.machine.plant}!`);
      } else {
        setSerialWarning('');
      }
    } catch (e) {}
  };

  const handlePurchaseDateChange = (newDate) => {
    const newExpiry = calculateExpiry(newDate, formData.warranty_months);
    setFormData(prev => ({
      ...prev,
      purchase_date: newDate,
      warranty_expiry_date: newExpiry
    }));
  };

  const handleWarrantyMonthsChange = (months) => {
    const newExpiry = calculateExpiry(formData.purchase_date, months);
    setFormData(prev => ({
      ...prev,
      warranty_months: months,
      warranty_expiry_date: newExpiry
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalSerial = formData.serial_no.trim() || `GS${Math.floor(1000000 + Math.random() * 9000000)}`;
    const finalCompany = formData.product_company.trim() || 'Hikvision';
    const finalModel = formData.model.trim() || 'DS-KIT302EFWX';
    const finalAuthorised = formData.authorised_person.trim() || localStorage.getItem('last_authorised_person') || 'Aditya Sharma';
    const finalPlant = formData.plant.trim() || localStorage.getItem('last_plant') || 'Gujarat -- Gujarat Plant';
    const finalPurchaseDate = formData.purchase_date || new Date().toISOString().split('T')[0];

    // Auto-persist last used authorised person & plant for seamless UX
    try {
      localStorage.setItem('last_authorised_person', finalAuthorised);
      localStorage.setItem('last_plant', finalPlant);
    } catch (e) {}

    setSaving(true);

    try {
      // Compile universal technical specs into notes to guarantee zero DB breaking changes
      const techSpecs = [];
      if (formData.machine_name) techSpecs.push(`Type: ${formData.machine_name}`);
      if (formData.voltage_power) techSpecs.push(`Ratings: ${formData.voltage_power}`);
      if (formData.capacity_rating) techSpecs.push(`Cap: ${formData.capacity_rating}`);
      if (formData.country_of_origin) techSpecs.push(`Origin: ${formData.country_of_origin}`);
      if (formData.mfg_date) techSpecs.push(`MFG: ${formData.mfg_date}`);

      let finalNotes = formData.notes.trim();
      const techSummary = techSpecs.join(' | ');

      if (techSummary && !finalNotes.includes(techSummary)) {
        finalNotes = finalNotes ? `${finalNotes} [${techSummary}]` : techSummary;
      }

      const payload = {
        ...formData,
        serial_no: finalSerial,
        product_company: finalCompany,
        model: finalModel,
        authorised_person: finalAuthorised,
        plant: finalPlant,
        purchase_date: finalPurchaseDate,
        notes: finalNotes
      };

      const url = isEdit ? `/api/machines/${formData.id}` : '/api/machines';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to save machine details');
      }

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      onSaveSuccess(result);
      onClose();
    } catch (err) {
      setError(err.message);
      if (formRef.current) {
        formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                {isEdit ? 'Edit Machine Details' : 'Verify & Store Machine'}
                <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  {isEdit ? 'Update Asset' : 'Label Scanned'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Confirm scanned details, assign authorised person, destination plant & warranty
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {serialWarning && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Duplicate Serial Warning</p>
                <p>{serialWarning}</p>
              </div>
            </div>
          )}

          {/* Scanned Image Preview Card */}
          {formData.base64_image && (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-4">
              <img
                src={formData.base64_image}
                alt="Scanned Label"
                className="w-20 h-14 object-cover rounded-lg border border-slate-700 bg-black shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  Scanned Physical Label
                </span>
                <p className="text-xs text-slate-300 truncate">
                  Company: <strong className="text-indigo-300 font-semibold">{formData.product_company}</strong> | Model: <strong className="text-white font-mono">{formData.model || 'Pending'}</strong> | S/N: <strong className="text-white font-mono">{formData.serial_no || 'Pending'}</strong>
                </p>
                <p className="text-[11px] text-slate-400">Archived in hardware inventory records</p>
              </div>
            </div>
          )}

          {/* Row 1: Serial No & Product Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" />
                  Serial Number (S/N) *
                </span>
                <span className="text-[10px] text-emerald-400/90 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  Auto-fetched
                </span>
              </label>
              <input
                type="text"
                required
                value={formData.serial_no}
                onChange={e => setFormData({ ...formData, serial_no: e.target.value })}
                onBlur={handleSerialBlur}
                placeholder="e.g. GS3762838 or SVPB2948102"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-emerald-500 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  Product Company (Brand) *
                </span>
                <span className="text-[10px] text-indigo-300/90 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                  Worldwide Recognized
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  list="companies-list"
                  value={formData.product_company}
                  onChange={e => setFormData({ ...formData, product_company: e.target.value })}
                  placeholder="e.g. Siemens, ABB, Hikvision, Cisco"
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <datalist id="companies-list">
                  {companyOptions.map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Row 2: Model & Authorised Person */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Machine Model *
                </span>
                <span className="text-[10px] text-cyan-400/90 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  Auto-fetched
                </span>
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g. DS-KIT302EFWX or 6ES7515-2AM01-0AB0"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-cyan-500 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Authorised Person (Handler / Author) *
              </label>
              <input
                type="text"
                required
                value={formData.authorised_person}
                onChange={e => setFormData({ ...formData, authorised_person: e.target.value })}
                placeholder="Enter your name (e.g. Aditya)"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-amber-500 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Row 3: Plant (Destination): Formatted as "State -- Destination" */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Plant Destination (State -- Destination) *
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Format: Delhi -- Delhi NCR</span>
            </label>
            <PlantAutocomplete
              value={formData.plant}
              onChange={val => setFormData({ ...formData, plant: val })}
              plants={plants}
              placeholder="State -- Destination (e.g. Delhi -- Delhi NCR)"
            />
          </div>

          {/* DYNAMIC UNIVERSAL MACHINE SPECIFICATIONS (Collapsible / Editable) */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <button
              type="button"
              onClick={() => setShowTechSpecs(!showTechSpecs)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Universal Machine Specifications (Auto-Extracted)
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showTechSpecs ? 'rotate-180' : ''}`} />
            </button>

            {showTechSpecs && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-cyan-400" />
                    Machine Type / Name
                  </label>
                  <input
                    type="text"
                    value={formData.machine_name}
                    onChange={e => setFormData({ ...formData, machine_name: e.target.value })}
                    placeholder="e.g. Induction Motor / Controller"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Voltage & Power Ratings
                  </label>
                  <input
                    type="text"
                    value={formData.voltage_power}
                    onChange={e => setFormData({ ...formData, voltage_power: e.target.value })}
                    placeholder="e.g. 400V 3~ | 15 kW"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-emerald-400" />
                    Capacity / Operating Rating
                  </label>
                  <input
                    type="text"
                    value={formData.capacity_rating}
                    onChange={e => setFormData({ ...formData, capacity_rating: e.target.value })}
                    placeholder="e.g. 1465 RPM | 10 Bar"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
                    <Globe2 className="w-3 h-3 text-teal-400" />
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    value={formData.country_of_origin}
                    onChange={e => setFormData({ ...formData, country_of_origin: e.target.value })}
                    placeholder="e.g. Germany, Sweden, Japan"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-400" />
                    Manufacturing Date
                  </label>
                  <input
                    type="text"
                    value={formData.mfg_date}
                    onChange={e => setFormData({ ...formData, mfg_date: e.target.value })}
                    placeholder="e.g. 10/2024 or 2024"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 4: Purchasing Date & Warranty Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Purchasing Date (Calendar) *
              </label>
              <input
                type="date"
                required
                value={formData.purchase_date}
                onChange={e => handlePurchaseDateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-indigo-500 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                Warranty Period
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '1 Yr', months: 12 },
                  { label: '2 Yrs', months: 24 },
                  { label: '3 Yrs', months: 36 },
                  { label: '5 Yrs', months: 60 }
                ].map(item => (
                  <button
                    key={item.months}
                    type="button"
                    onClick={() => handleWarrantyMonthsChange(item.months)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      formData.warranty_months === item.months
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-slate-950/80 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Warranty Expiry Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Warranty Expiry Date
              </span>
              <span className="text-[10px] text-slate-400">Can be manually adjusted by calendar</span>
            </label>
            <input
              type="date"
              required
              value={formData.warranty_expiry_date}
              onChange={e => setFormData({ ...formData, warranty_expiry_date: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            />
          </div>

          {/* Live Warranty Preview */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Live Warranty Calculation Preview
            </span>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-xs text-slate-400 block">Date Uploaded:</span>
                <span className="text-sm font-semibold text-slate-200">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Pending Days of Warranty:</span>
                <span
                  className={`text-sm font-bold inline-flex items-center gap-1.5 ${
                    warrantyStatus.badge === 'emerald'
                      ? 'text-emerald-400'
                      : warrantyStatus.badge === 'amber'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {warrantyStatus.text}
                </span>
              </div>
            </div>
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Machine Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-sm focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="In Transit">In Transit</option>
                <option value="In Maintenance">In Maintenance</option>
                <option value="Decommissioned">Decommissioned</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Installation Notes & Specifics</label>
              <input
                type="text"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Unit Stationed at Main Compressor Room B"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-emerald-500 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Error Banner in view of bottom actions */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to Save</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Machine...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{isEdit ? 'Update Machine' : 'Save Machine to Database'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
