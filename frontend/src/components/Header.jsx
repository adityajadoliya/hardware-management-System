import React, { useState, useEffect } from 'react';
import { Camera, Plus, Download, Cpu, RefreshCw, CloudDownload } from 'lucide-react';

export default function Header({
  onOpenScanner,
  onOpenAddModal,
  onExportCsv,
  onRefresh,
  onSyncCloud,
  isSyncingCloud,
  isLoading
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <Cpu className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              HARDWARE MANAGEMENT SYSTEM
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest hidden sm:inline-block">
                v2.1
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Automatic Label OCR</span>
              <span>&bull;</span>
              <span>State -- Destination Plants</span>
              <span>&bull;</span>
              <span>Warranty Tracker</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-800"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Cloud Sync (Pulls scans captured from phone) */}
          {onSyncCloud && (
            <button
              onClick={onSyncCloud}
              disabled={isSyncingCloud}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 rounded-xl text-xs font-semibold transition-colors border border-emerald-500/40 cursor-pointer shadow-sm"
              title="Sync scans captured from mobile phone into local database"
            >
              <CloudDownload className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-bounce text-emerald-200' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline">Sync Cloud</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-700/80 cursor-pointer"
            title="Download CSV Inventory Report"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          {/* Manual Add */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>

          {/* Camera Scanner Button (Fetches machine label data) */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-[1.02] cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Machine Label</span>
          </button>
        </div>
      </div>
    </header>
  );
}
