import React from 'react';
import { X, Calendar, MapPin, User, Cpu, Hash, Clock, ShieldCheck, Printer, FileText, Image as ImageIcon, Building2 } from 'lucide-react';

export default function MachineDetailModal({ isOpen, onClose, machine }) {
  if (!isOpen || !machine) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Machine Specification Card
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Asset ID #{machine.id} &bull; S/N: {machine.serial_no}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Label Image */}
          {machine.label_image_url && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                Archived Label Photo
              </span>
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                <img
                  src={machine.label_image_url}
                  alt="Scanned machine label"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Key Spec Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Serial Number
              </span>
              <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5 block">
                {machine.serial_no}
              </span>
            </div>

            {/* Product Company */}
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-400" />
                Product Company
              </span>
              <span className="text-sm font-bold text-indigo-300 mt-0.5 block">
                {machine.product_company || 'Hikvision'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Machine Model
              </span>
              <span className="text-sm font-mono font-bold text-cyan-300 mt-0.5 block">
                {machine.model}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Authorised Person
              </span>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">
                  {machine.authorised_person}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Destination Plant (State -- Destination)
              </span>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">
                  {machine.plant}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline & Warranty Panel */}
          <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                Warranty Status & Timeline
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  machine.warranty_status === 'ACTIVE'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : machine.warranty_status === 'EXPIRING_SOON'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {machine.pending_days >= 0
                  ? `${machine.pending_days} Days Remaining`
                  : `Expired ${Math.abs(machine.pending_days)} Days Ago`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block">Purchased:</span>
                <span className="text-white font-medium">{formatDate(machine.purchase_date)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Date Uploaded:</span>
                <span className="text-white font-medium">{formatDate(machine.created_at)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Warranty Until:</span>
                <span className="text-white font-medium">{formatDate(machine.warranty_expiry_date)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {machine.notes && (
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                Operational Notes & Deployment Details
              </span>
              <p className="text-slate-200 text-xs">{machine.notes}</p>
            </div>
          )}

          {/* Raw Scan Text */}
          {machine.raw_scan_text && (
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Raw Scanned OCR Text
              </span>
              <pre className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {machine.raw_scan_text}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Card</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
