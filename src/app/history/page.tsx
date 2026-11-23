'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  PlusCircle,
  Edit3,
  Archive,
  Trash2,
  RefreshCw,
  Bus,
  Truck,
  Navigation,
  MapPin,
  Wallet,
  Inbox,
  User,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { ActivityLogItem } from '@/types';

type EntityFilter = 'all' | 'vehicle' | 'trailer' | 'trip' | 'route' | 'finance' | 'request';
type ActionFilter = 'all' | 'create' | 'update' | 'archive' | 'status_change';

const ACTION_CONFIG = {
  create: {
    label: 'Создание',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    icon: PlusCircle,
  },
  update: {
    label: 'Изменение',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: Edit3,
  },
  status_change: {
    label: 'Смена статуса',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    icon: RefreshCw,
  },
  archive: {
    label: 'Удаление',
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
    icon: Trash2,
  },
};

const ENTITY_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  vehicle: { label: 'Машина', icon: Bus },
  trailer: { label: 'Прицеп', icon: Truck },
  trip: { label: 'Рейс', icon: Navigation },
  route: { label: 'Маршрут', icon: MapPin },
  booking: { label: 'Бронь / Пассажир', icon: User },
  request: { label: 'Заявка', icon: Inbox },
  finance: { label: 'Финансы', icon: Wallet },
};

export default function HistoryPage() {
  const { activities } = useApp();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeActivities: ActivityLogItem[] = activities || [];

  // KPI counters
  const totalCount = safeActivities.length;
  const createCount = safeActivities.filter((a) => a.action === 'create').length;
  const updateCount = safeActivities.filter(
    (a) => a.action === 'update' || a.action === 'status_change'
  ).length;
  const archiveCount = safeActivities.filter((a) => a.action === 'archive').length;

  // Filtered activities
  const filtered = safeActivities.filter((item) => {
    // Entity filter
    if (entityFilter !== 'all') {
      if (entityFilter === 'vehicle' && item.entityType !== 'vehicle') return false;
      if (entityFilter === 'trailer' && item.entityType !== 'trailer') return false;
      if (entityFilter === 'trip' && item.entityType !== 'trip') return false;
      if (entityFilter === 'route' && item.entityType !== 'route') return false;
      if (entityFilter === 'request' && item.entityType !== 'request' && item.entityType !== 'booking') return false;
    }

    // Action filter
    if (actionFilter !== 'all' && item.action !== actionFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.entityName.toLowerCase().includes(q);
      const matchDetails = item.details.toLowerCase().includes(q);
      const matchActor = item.actorName.toLowerCase().includes(q);
      const matchTime = item.timestamp.toLowerCase().includes(q);
      return matchName || matchDetails || matchActor || matchTime;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
            <History className="w-4 h-4" />
            <span>Аудит и безопасность</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">История действий</h1>
          <p className="text-sm text-slate-500 mt-1">
            Единый журнал всех операций: фиксация создания, редактирования, смены статусов и удаления объектов в CRM с указанием автора, точной даты и времени.
          </p>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Всего действий
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Полный журнал событий</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            Создано объектов
          </div>
          <div className="text-2xl font-semibold text-emerald-600 mt-1">{createCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Машины, прицепы, рейсы</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Изменений и правок
          </div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">{updateCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Редактирование параметров</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
            Удалено
          </div>
          <div className="text-2xl font-semibold text-rose-600 mt-1">{archiveCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Удалено из системы</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm space-y-3">
        {/* Entity Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setEntityFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                entityFilter === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Все действия
            </button>
            <button
              onClick={() => setEntityFilter('vehicle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                entityFilter === 'vehicle'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>Машины</span>
            </button>
            <button
              onClick={() => setEntityFilter('trailer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                entityFilter === 'trailer'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Прицепы</span>
            </button>
            <button
              onClick={() => setEntityFilter('trip')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                entityFilter === 'trip'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Рейсы</span>
            </button>
            <button
              onClick={() => setEntityFilter('route')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                entityFilter === 'route'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Маршруты</span>
            </button>
            <button
              onClick={() => setEntityFilter('request')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                entityFilter === 'request'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Заявки</span>
            </button>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по объекту, автору, действию..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        {/* Action Type Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Тип операции:
          </span>
          <button
            onClick={() => setActionFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              actionFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setActionFilter('create')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              actionFilter === 'create'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            + Создание
          </button>
          <button
            onClick={() => setActionFilter('update')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              actionFilter === 'update'
                ? 'bg-blue-600 text-white'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            ✎ Изменение
          </button>
          <button
            onClick={() => setActionFilter('archive')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              actionFilter === 'archive'
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            ✕ Удаление
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>События в хронологическом порядке ({filtered.length})</span>
          <span>Фиксация по времени сервера</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((item) => {
            const actConfig = ACTION_CONFIG[item.action] || ACTION_CONFIG.update;
            const ActIcon = actConfig.icon;
            const entConfig = ENTITY_CONFIG[item.entityType] || { label: 'Объект', icon: History };
            const EntIcon = entConfig.icon;

            return (
              <div
                key={item.id}
                className="p-4 sm:px-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-start gap-3.5"
              >
                {/* Left: Icon Badge */}
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${actConfig.badge}`}
                >
                  <ActIcon className="w-4 h-4" />
                </div>

                {/* Center: Details */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.entityName}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      <EntIcon className="w-3 h-3 text-slate-500" />
                      <span>{entConfig.label}</span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${actConfig.badge}`}
                    >
                      {actConfig.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{item.details}</p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                    <span className="font-medium text-slate-600">Автор: {item.actorName}</span>
                    <span>•</span>
                    <span className="font-mono">{item.timestamp}</span>
                  </div>
                </div>

                {/* Right: Timestamp on desktop */}
                <div className="hidden sm:block text-right shrink-0">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-lg">
                    {item.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-500">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">События не найдены</p>
              <p className="text-xs text-slate-400 mt-1">
                Попробуйте сбросить фильтры или изменить поисковый запрос
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
