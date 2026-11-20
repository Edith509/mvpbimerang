'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Navigation,
  Bus,
  Users,
  Wallet,
  FileBarChart,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Role } from '@/types';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAssistant: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose, onOpenAssistant }) => {
  const router = useRouter();
  const { trips, vehicles, passengers, switchUserRole, resetToDemo } = useApp();
  const [query, setQuery] = useState('');

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Filter sections
  const filteredTrips = trips.filter(
    (t) =>
      t.tripNumber.toLowerCase().includes(q) ||
      t.routeName.toLowerCase().includes(q)
  );

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plateNumber.toLowerCase().includes(q) ||
      v.brandModel.toLowerCase().includes(q)
  );

  const filteredPassengers = passengers.filter(
    (p) =>
      p.fullName.toLowerCase().includes(q) ||
      p.phone.includes(q)
  );

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
      />
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск рейса, машины, пассажира или действия..."
            className="flex-1 text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400 font-medium"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Actions */}
          {!q && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Быстрые переходы
              </div>
              <div className="space-y-0.5 mt-0.5">
                {[
                  { label: 'Маршруты и схема посадки', href: '/trips', icon: Navigation },
                  { label: 'Автопарк и паспорта машин', href: '/fleet', icon: Bus },
                  { label: 'Финансы и согласование', href: '/finances', icon: Wallet },
                  { label: 'Отчётность и P&L', href: '/reports', icon: FileBarChart },
                  { label: 'База пассажиров (CRM)', href: '/customers', icon: Users },
                  { label: 'Команда и права', href: '/team', icon: ShieldCheck },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigateTo(item.href)}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-slate-800">{item.label}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trips match */}
          {filteredTrips.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Рейсы
              </div>
              <div className="space-y-0.5 mt-0.5">
                {filteredTrips.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigateTo('/trips')}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px] shrink-0">
                        {t.tripNumber}
                      </span>
                      <span className="font-medium text-slate-800 truncate">{t.routeName}</span>
                    </div>
                    <span className="text-slate-400 text-[11px] shrink-0 ml-2 font-mono">
                      {t.departureTime}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vehicles match */}
          {filteredVehicles.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Автопарк
              </div>
              <div className="space-y-0.5 mt-0.5">
                {filteredVehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => navigateTo('/fleet')}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] shrink-0 border border-slate-200">
                        {v.plateNumber}
                      </span>
                      <span className="font-medium text-slate-800 truncate">{v.brandModel}</span>
                    </div>
                    <span className="text-emerald-600 font-semibold text-[11px] shrink-0 ml-2">
                      {v.status === 'in_trip' ? 'В рейсе' : 'Готов'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Passengers match */}
          {filteredPassengers.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Пассажиры
              </div>
              <div className="space-y-0.5 mt-0.5">
                {filteredPassengers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigateTo('/customers')}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-700 shrink-0">
                        {p.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{p.fullName}</p>
                        <p className="text-slate-400 text-[10px] font-mono">{p.phone}</p>
                      </div>
                    </div>
                    <span className="text-slate-400 text-[10px]">
                      {p.totalTrips} поездок
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions & Role Switches */}
          <div>
            <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Действия системы
            </div>
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => {
                  onClose();
                  onOpenAssistant();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-red-50 text-red-600 font-medium transition-colors text-left"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Открыть ИИ-помощника «Бумеранг»</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Сбросить все данные к исходному демо-состоянию?')) {
                    resetToDemo();
                    onClose();
                  }
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-50 text-slate-600 font-medium transition-colors text-left"
              >
                <RotateCcw className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Сбросить демо-данные к начальным</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Навигация</span>
            <span>↵ Выбор</span>
          </div>
          <span>Бумеранг SaaS · ⌘K</span>
        </div>
      </div>
    </div>
  );
};
