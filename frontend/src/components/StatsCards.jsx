import React from 'react';
import { Cpu, ShieldCheck, AlertCircle, AlertTriangle, MapPin, TrendingUp } from 'lucide-react';

export default function StatsCards({ stats = {} }) {
  const {
    total = 0,
    active = 0,
    expiringSoon = 0,
    expired = 0,
    plantCount = 0
  } = stats;

  const cards = [
    {
      title: 'Total Assets',
      value: total,
      subtitle: 'Registered hardware machines',
      icon: Cpu,
      color: 'emerald',
      gradient: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400'
    },
    {
      title: 'Active Warranty',
      value: active,
      subtitle: 'Covered under valid warranty',
      icon: ShieldCheck,
      color: 'teal',
      gradient: 'from-teal-500/10 to-cyan-500/10',
      border: 'border-teal-500/20',
      text: 'text-teal-400'
    },
    {
      title: 'Expiring Soon',
      value: expiringSoon,
      subtitle: 'Pending days < 30 days',
      icon: AlertTriangle,
      color: 'amber',
      gradient: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400'
    },
    {
      title: 'Expired Warranty',
      value: expired,
      subtitle: 'Requires renewal / service',
      icon: AlertCircle,
      color: 'rose',
      gradient: 'from-rose-500/10 to-pink-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400'
    },
    {
      title: 'Active Plants',
      value: plantCount,
      subtitle: 'Commissioned site locations',
      icon: MapPin,
      color: 'indigo',
      gradient: 'from-indigo-500/10 to-blue-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-2xl bg-gradient-to-br ${c.gradient} bg-slate-900/90 border ${c.border} shadow-lg backdrop-blur-sm transition-all hover:translate-y-[-2px] hover:shadow-xl`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-lg bg-slate-950/60 ${c.text}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-bold font-mono ${c.text}`}>
              {c.value}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              {c.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
