import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Check, Plus, ChevronDown, X, Sparkles } from 'lucide-react';

export default function PlantAutocomplete({
  value,
  onChange,
  plants = [],
  placeholder = 'State -- Destination (e.g. Delhi -- Delhi NCR)'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const trimmed = query.trim().toLowerCase();
  const plantNames = (plants || []).map(p => (typeof p === 'string' ? p : p?.name || '')).filter(Boolean);
  const filteredPlants = plantNames.filter(name => 
    name.toLowerCase().includes(trimmed)
  );

  const exactMatch = plantNames.some(name => name.toLowerCase() === trimmed);
  const showAddNew = trimmed.length > 0 && !exactMatch;

  // Format helper: if user typed something like "Delhi", offer "Delhi -- Delhi NCR" or "State -- Destination"
  const formattedSuggestion = (() => {
    if (!showAddNew) return null;
    const raw = query.trim();
    if (raw.includes('--')) return raw;
    return `${raw} -- ${raw} Facility`;
  })();

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (plantName) => {
    setQuery(plantName);
    onChange(plantName);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    setQuery(newVal);
    onChange(newVal);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    const totalItems = filteredPlants.length + (showAddNew ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0) {
        e.preventDefault();
        if (highlightedIndex < filteredPlants.length) {
          handleSelect(filteredPlants[highlightedIndex]);
        } else if (showAddNew) {
          handleSelect(formattedSuggestion || query.trim());
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-16 py-2.5 bg-slate-900/90 border border-slate-700 focus:border-emerald-500 rounded-xl text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner font-medium"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onChange('');
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl shadow-black/80 max-h-60 overflow-y-auto backdrop-blur-md">
          {filteredPlants.length === 0 && !showAddNew ? (
            <div className="p-3 text-xs text-slate-400 text-center">
              No matching plants found. Format: State -- Destination (e.g. Delhi -- Delhi NCR)
            </div>
          ) : (
            <div className="p-1">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Suggested Plants (State -- Destination)</span>
                <span className="text-emerald-400 font-normal lowercase">e.g. Delhi -- Delhi NCR</span>
              </div>
              {filteredPlants.map((plant, idx) => {
                const isSelected = plant.toLowerCase() === query.trim().toLowerCase();
                const isHighlighted = idx === highlightedIndex;
                const parts = plant.split('--');
                const statePart = parts[0]?.trim();
                const destPart = parts[1]?.trim();

                return (
                  <button
                    key={plant}
                    type="button"
                    onClick={() => handleSelect(plant)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      isHighlighted
                        ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                        : isSelected
                        ? 'bg-slate-800/90 text-emerald-400 font-medium'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
                      {parts.length === 2 ? (
                        <span>
                          <strong className="text-white">{statePart}</strong>
                          <span className="text-emerald-400 font-bold mx-1.5">--</span>
                          <span className="text-slate-300">{destPart}</span>
                        </span>
                      ) : (
                        <span>{plant}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}

              {showAddNew && (
                <div className="border-t border-slate-800/80 mt-1 pt-1 space-y-1">
                  {formattedSuggestion && formattedSuggestion !== query.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSelect(formattedSuggestion)}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors text-emerald-400 hover:bg-emerald-950/40"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        Format as: <strong className="text-white underline">{formattedSuggestion}</strong>
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelect(query.trim())}
                    className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors text-slate-300 hover:bg-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      Add exact: <strong className="text-white underline">{query.trim()}</strong>
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
