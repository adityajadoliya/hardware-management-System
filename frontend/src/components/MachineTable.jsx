import React, { useState } from 'react';
import {
  Search,
  ArrowUpDown,
  Copy,
  Check,
  Edit2,
  Trash2,
  ExternalLink,
  Clock,
  MapPin,
  Calendar,
  Layers,
  Building2,
  Camera
} from 'lucide-react';

export default function MachineTable({
  machines = [],
  plants = [],
  onEdit,
  onDelete,
  onView,
  onScanClick,
  searchQuery,
  setSearchQuery,
  selectedPlant,
  setSelectedPlant,
  warrantyFilter,
  setWarrantyFilter,
  sortBy,
  setSortBy
}) {
  const [copiedSerial, setCopiedSerial] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedSerial(text);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const getWarrantyBadge = (pendingDays, status) => {
    if (status === 'EXPIRED' || pendingDays < 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Expired ({Math.abs(pendingDays)}d ago)
        </span>
      );
    }
    if (status === 'EXPIRING_SOON' || pendingDays <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          {pendingDays} days left (Expiring Soon)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {pendingDays} days left
      </span>
    );
  };

  // Format Plant: "Delhi -- Delhi NCR"
  const renderPlantCell = (plantStr) => {
    if (!plantStr) return 'N/A';
    if (plantStr.includes('--')) {
      const [statePart, destPart] = plantStr.split('--').map(s => s.trim());
      return (
        <div className="flex flex-col">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-100 text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-300 font-bold">{statePart}</span>
            <span className="text-slate-500 font-mono">--</span>
            <span className="text-slate-200">{destPart}</span>
          </span>
          <span className="text-[10px] text-slate-500 ml-4.5">State: {statePart} &bull; Dest: {destPart}</span>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-800/50">
        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
        {plantStr}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Serial No, Company, Model, Person, Plant..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-xl text-slate-200 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Plant Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer pr-2 text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Plants</option>
              {plants.map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-white">
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Warranty Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <select
              value={warrantyFilter}
              onChange={(e) => setWarrantyFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer pr-2 text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Warranties</option>
              <option value="ACTIVE" className="bg-slate-900 text-white">Active Warranty</option>
              <option value="EXPIRING_SOON" className="bg-slate-900 text-white">Expiring Soon (&lt;30d)</option>
              <option value="EXPIRED" className="bg-slate-900 text-white">Expired Warranty</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer pr-2 text-xs"
            >
              <option value="created_at" className="bg-slate-900 text-white">Latest Added</option>
              <option value="product_company" className="bg-slate-900 text-white">Company Name</option>
              <option value="warranty_expiry_date" className="bg-slate-900 text-white">Warranty Expiry</option>
              <option value="purchase_date" className="bg-slate-900 text-white">Purchase Date</option>
              <option value="serial_no" className="bg-slate-900 text-white">Serial Number</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {machines.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <Layers className="w-8 h-8 text-emerald-400/80" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Hardware Machines Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                No machines match the selected filter criteria or no machines have been registered yet.
              </p>
            </div>
            <button
              onClick={onScanClick}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Machine Label Now</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Label Photo</th>
                  <th className="py-3.5 px-4">Serial Number</th>
                  {/* NEW COLUMN: Product Company placed just before Model */}
                  <th className="py-3.5 px-4">Product Company</th>
                  <th className="py-3.5 px-4">Model</th>
                  <th className="py-3.5 px-4">Plant (Destination)</th>
                  <th className="py-3.5 px-4">Authorised Person</th>
                  <th className="py-3.5 px-4">Purchasing Date</th>
                  <th className="py-3.5 px-4">Date Uploaded</th>
                  <th className="py-3.5 px-4">Warranty Pending</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {machines.map((machine) => (
                  <tr
                    key={machine.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Label Thumbnail */}
                    <td className="py-3 px-4">
                      {machine.label_image_url ? (
                        <div
                          onClick={() => setPreviewImage(machine.label_image_url)}
                          className="relative w-12 h-10 rounded-lg overflow-hidden border border-slate-700 bg-black cursor-pointer group-hover:border-emerald-500/60 transition-colors"
                          title="Click to view full label"
                        >
                          <img
                            src={machine.label_image_url}
                            alt="Label"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ExternalLink className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-10 rounded-lg border border-dashed border-slate-700/80 bg-slate-950/50 flex items-center justify-center text-slate-500 text-[10px]">
                          No Img
                        </div>
                      )}
                    </td>

                    {/* Serial Number (with Copy) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-white tracking-wider bg-slate-950/70 px-2.5 py-1 rounded-md border border-slate-700/60 text-xs">
                          {machine.serial_no}
                        </span>
                        <button
                          onClick={() => copyToClipboard(machine.serial_no)}
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                          title="Copy Serial Number"
                        >
                          {copiedSerial === machine.serial_no ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* NEW COLUMN: Product Company (Just before Model!) */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 shadow-sm">
                        <Building2 className="w-3 h-3 text-indigo-400 shrink-0" />
                        {machine.product_company || 'Hikvision'}
                      </span>
                    </td>

                    {/* Model */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-100 flex items-center gap-1.5">
                        <span className="text-cyan-400 font-mono">{machine.model}</span>
                      </div>
                      {machine.notes && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {machine.notes}
                        </p>
                      )}
                    </td>

                    {/* Plant (Destination): Formatted as "Delhi -- Delhi NCR" */}
                    <td className="py-3 px-4">
                      {renderPlantCell(machine.plant)}
                    </td>

                    {/* Authorised Person */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-300 shrink-0">
                          {machine.authorised_person?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="font-medium text-slate-200 truncate max-w-[120px]">
                          {machine.authorised_person}
                        </span>
                      </div>
                    </td>

                    {/* Purchasing Date */}
                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{formatDate(machine.purchase_date)}</span>
                      </div>
                    </td>

                    {/* Date Uploaded */}
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {formatDate(machine.created_at)}
                    </td>

                    {/* Warranty Pending & Days */}
                    <td className="py-3 px-4">
                      {getWarrantyBadge(machine.pending_days, machine.warranty_status)}
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        Exp: {formatDate(machine.warranty_expiry_date)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onView(machine)}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Full Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(machine)}
                          className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Machine Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(machine.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Machine"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Delete Machine?</h4>
                <p className="text-xs text-slate-400">This action will remove the asset and its stored label.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-950/40"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl p-2">
            <img
              src={previewImage}
              alt="Machine Label Full Resolution"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            <p className="text-center text-xs text-slate-400 py-2">Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
