import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import MachineTable from './components/MachineTable';
import CameraScannerModal from './components/CameraScannerModal';
import MachineFormModal from './components/MachineFormModal';
import MachineDetailModal from './components/MachineDetailModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'hardware_management_machines_cache';

export default function App() {
  const [machines, setMachines] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch (e) {}
    return [];
  });
  const [plants, setPlants] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    plantCount: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('ALL');
  const [warrantyFilter, setWarrantyFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_at');

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPlants = async () => {
    try {
      const res = await fetch('/api/plants');
      if (res.ok) {
        const data = await res.json();
        setPlants(data);
      }
    } catch (e) {
      console.error('Failed to load plants', e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };

  const fetchMachines = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedPlant !== 'ALL') params.append('plant', selectedPlant);
      if (warrantyFilter !== 'ALL') params.append('warranty_status', warrantyFilter);
      if (sortBy) params.append('sort_by', sortBy);

      const res = await fetch(`/api/machines?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        
        // Check if localStorage has any extra scans (e.g. from mobile offline scans)
        try {
          const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
          const missingInApi = cached.filter(
            c => c && c.serial_no && !data.some(d => d.serial_no && d.serial_no.toLowerCase() === c.serial_no.toLowerCase())
          );
          if (missingInApi.length > 0) {
            // Re-sync missing scans to server automatically!
            fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ machines: missingInApi })
            }).catch(() => {});

            const merged = [...data, ...missingInApi];
            setMachines(merged);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            return;
          }
        } catch (e) {}

        setMachines(data);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
      } else {
        // Fallback to offline cache if network or container has a glitch
        try {
          const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
          if (cached.length > 0) setMachines(cached);
        } catch (e) {}
      }
    } catch (e) {
      console.error('Failed to load machines', e);
      showToast('Could not load machines from backend', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedPlant, warrantyFilter, sortBy]);

  useEffect(() => {
    fetchPlants();
    fetchStats();
    fetchMachines();

    // Auto-poll every 4 seconds so scans and updates appear in real-time
    const pollTimer = setInterval(() => {
      fetchMachines();
      fetchStats();
    }, 4000);

    return () => clearInterval(pollTimer);
  }, [fetchMachines]);

  // Handle Scanner Completion
  const handleScanComplete = (scanResult) => {
    setSelectedMachine(scanResult);
    setIsEditMode(false);
    setIsFormOpen(true);
    showToast(
      `Label Scanned! S/N: ${scanResult.serialNo || 'N/A'}, Company: ${scanResult.productCompany || 'Hikvision'}, Model: ${scanResult.model || 'N/A'}`
    );
  };

  // Handle Manual Add
  const handleOpenAddModal = () => {
    setSelectedMachine(null);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleEdit = (machine) => {
    setSelectedMachine(machine);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleView = (machine) => {
    setSelectedMachine(machine);
    setIsDetailOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Machine deleted successfully');
        fetchMachines();
        fetchStats();
        fetchPlants();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete machine', 'error');
      }
    } catch (e) {
      showToast('Network error deleting machine', 'error');
    }
  };

  const handleSaveSuccess = (savedMachine) => {
    try {
      const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const filtered = cached.filter(m => m.serial_no && m.serial_no.toLowerCase() !== savedMachine.serial_no.toLowerCase());
      const updated = [savedMachine, ...filtered];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setMachines(updated);
    } catch (e) {}

    showToast(
      isEditMode
        ? `Machine ${savedMachine.serial_no} updated successfully!`
        : `Machine ${savedMachine.serial_no} (${savedMachine.product_company}) stored at ${savedMachine.plant}!`
    );
    fetchMachines();
    fetchStats();
    fetchPlants();
  };

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handleSyncCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await fetch('/api/sync-cloud');
      if (res.ok) {
        const data = await res.json();
        if (data.count > 0) {
          showToast(`Successfully synced ${data.count} machine(s) from phone scans into local database!`);
        } else {
          showToast('Local database is already in sync with phone scans!');
        }
      }
    } catch (e) {
      console.warn('Sync cloud note:', e);
    } finally {
      setIsSyncingCloud(false);
      fetchMachines();
      fetchStats();
      fetchPlants();
    }
  };

  const handleExportCsv = () => {
    window.open('/api/export/csv', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <Header
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAddModal={handleOpenAddModal}
        onExportCsv={handleExportCsv}
        onSyncCloud={handleSyncCloud}
        isSyncingCloud={isSyncingCloud}
        onRefresh={() => {
          fetchMachines();
          fetchStats();
          fetchPlants();
        }}
        isLoading={isLoading}
      />

      {/* Main Workspace */}
      <main className="w-full px-4 sm:px-6 py-5 space-y-5 flex-1">
        {/* Dashboard Metrics */}
        <StatsCards stats={stats} />

        {/* Table & Filtering */}
        <MachineTable
          machines={machines}
          plants={plants}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onScanClick={() => setIsScannerOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedPlant={selectedPlant}
          setSelectedPlant={setSelectedPlant}
          warrantyFilter={warrantyFilter}
          setWarrantyFilter={setWarrantyFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-3 text-center text-xs text-slate-500">
        <p>Hardware Management System &bull; {new Date().getFullYear()}</p>
      </footer>

      {/* Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanComplete={handleScanComplete}
      />

      {/* Machine Details / Post-Scan Form Modal */}
      <MachineFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedMachine}
        plants={plants}
        onSaveSuccess={handleSaveSuccess}
        isEdit={isEditMode}
      />

      {/* Single Machine Inspector Modal */}
      <MachineDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        machine={selectedMachine}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
