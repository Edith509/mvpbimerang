'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bus,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Wrench,
  Fuel,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { VehicleStatus } from '@/types';

const STATUS_LABELS: Record<
  VehicleStatus,
  { label: string; badge: string; dot: string }
> = {
  ready: {
    label: 'Готов к рейсу',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  in_trip: {
    label: 'В рейсе',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500 animate-pulse',
  },
  repair: {
    label: 'На ТО / Ремонте',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  inspection: {
    label: 'На осмотре',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
};

export default function FleetPage() {
  const router = useRouter();
  const { vehicles, currentUser, addIncident } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VehicleStatus>('all');
  const [defectModalOpen, setDefectModalOpen] = useState(false);
  const [selectedVehicleForDefect, setSelectedVehicleForDefect] = useState<string>(
    vehicles[0]?.id || ''
  );
  const [defectDescription, setDefectDescription] = useState('');

  const isDriver = currentUser.role === 'driver';

  const filteredVehicles = vehicles.filter((v) => {
    if (isDriver && v.id !== 'veh_12') return false;
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPlate = v.plateNumber.toLowerCase().includes(q);
      const matchModel = v.brandModel.toLowerCase().includes(q);
      const matchLoc = (v.currentLocation || '').toLowerCase().includes(q);
      const matchBase = (v.baseCity || '').toLowerCase().includes(q);
      const matchGarage = (v.garageNumber || '').toLowerCase().includes(q);
      return matchPlate || matchModel || matchLoc || matchBase || matchGarage;
    }
    return true;
  });

  const totalCount = vehicles.length;
  const readyCount = vehicles.filter((v) => v.status === 'ready').length;
  const inTripCount = vehicles.filter((v) => v.status === 'in_trip').length;
  const repairCount = vehicles.filter((v) => v.status === 'repair' || v.status === 'inspection').length;

  const handleAddDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectDescription.trim() || !selectedVehicleForDefect) return;
    addIncident(selectedVehicleForDefect, defectDescription.trim());
    setDefectDescription('');
    setDefectModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Автопарк</h1>
          <p className="text-sm text-slate-500 mt-1">
            Учёт транспортных средств, техническое состояние, пробеги и готовность к выезду.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedVehicleForDefect(vehicles[0]?.id || '');
              setDefectModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Зафиксировать неисправность</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Всего машин
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">На балансе предприятия</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            Готовы к рейсу
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{readyCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Проверены и заправлены</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            В рейсе
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">{inTripCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">На маршрутах с пассажирами</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
            На ТО / Ремонте
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{repairCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Сервисное обслуживание</div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Все ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('ready')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'ready'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Готовы ({readyCount})
          </button>
          <button
            onClick={() => setStatusFilter('in_trip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'in_trip'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            В рейсе ({inTripCount})
          </button>
          <button
            onClick={() => setStatusFilter('repair')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'repair'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            На ТО ({repairCount})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по марке, номеру, городу..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* Fleet Vehicles Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Транспорт</th>
                <th className="px-4 py-3 font-semibold">Статус</th>
                <th className="hidden md:table-cell px-4 py-3 font-semibold">База / Локация</th>
                <th className="hidden lg:table-cell px-4 py-3 font-semibold">Закреплённый экипаж</th>
                <th className="hidden sm:table-cell px-4 py-3 text-right font-semibold">Пробег</th>
                <th className="hidden lg:table-cell px-4 py-3 text-right font-semibold">До ТО</th>
                <th className="hidden sm:table-cell px-4 py-3 text-right font-semibold">Замечания</th>
                <th className="px-4 py-3 text-right font-semibold">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.map((vehicle) => {
                const statusInfo = STATUS_LABELS[vehicle.status] || STATUS_LABELS.ready;
                const openIncidents = (vehicle.incidents || []).filter((i) => i.status !== 'resolved');
                const kmToService = vehicle.nextServiceKm - vehicle.mileageKm;
                const photoThumbnail = vehicle.photos?.[0] || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80';

                return (
                  <tr
                    key={vehicle.id}
                    onClick={() => router.push(`/fleet/${vehicle.id}`)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={photoThumbnail}
                          alt={vehicle.brandModel}
                          className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                              {vehicle.brandModel}
                            </span>
                            {vehicle.garageNumber && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                {vehicle.garageNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                            <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {vehicle.plateNumber}
                            </span>
                            <span>•</span>
                            <span>{vehicle.seatsCount} мест</span>
                            <span>•</span>
                            <span>{vehicle.year} г.</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${statusInfo.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                        {statusInfo.label}
                      </span>
                    </td>

                    <td className="hidden md:table-cell px-4 py-3.5">
                      <div className="text-slate-800 font-medium">{vehicle.currentLocation}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">База: {vehicle.baseCity || 'Москва'}</div>
                    </td>

                    <td className="hidden lg:table-cell px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{vehicle.assignedDriverName || 'Диспетчерский резерв'}</span>
                      </div>
                    </td>

                    <td className="hidden sm:table-cell px-4 py-3.5 text-right font-mono text-slate-700 font-medium">
                      {vehicle.mileageKm.toLocaleString('ru-RU')} км
                    </td>

                    <td className="hidden lg:table-cell px-4 py-3.5 text-right font-mono">
                      <span className={kmToService <= 3000 ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                        {kmToService.toLocaleString('ru-RU')} км
                      </span>
                    </td>

                    <td className="hidden sm:table-cell px-4 py-3.5 text-right">
                      {openIncidents.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          {openIncidents.length}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/fleet/${vehicle.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <span>Профиль</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <Bus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">Машины не найдены</p>
                    <p className="text-xs text-slate-400 mt-1">Попробуйте изменить параметры поиска или фильтрации</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Defect */}
      {defectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900">Зафиксировать неисправность</h3>
              </div>
              <button
                onClick={() => setDefectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDefect} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Транспортное средство
                </label>
                <select
                  value={selectedVehicleForDefect}
                  onChange={(e) => setSelectedVehicleForDefect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brandModel} ({v.plateNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Описание дефекта или неисправности
                </label>
                <textarea
                  value={defectDescription}
                  onChange={(e) => setDefectDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Например: Люфт в рулевом наконечнике справа, требуется осмотр на подъёмнике..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDefectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Сохранить замечание
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
