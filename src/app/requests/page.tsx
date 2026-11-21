'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  User,
  Phone,
  Calendar,
  MapPin,
  Send,
  X,
  ChevronRight,
  AlertCircle,
  Bus,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { PassengerRequest, RequestStatus, RequestType } from '@/types';

export default function RequestsPage() {
  const { requests, trips, createRequest, assignRequestToTrip, updateRequestStatus, deleteRequest } =
    useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'in_progress' | 'assigned' | 'parcel'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRequestForAssign, setSelectedRequestForAssign] = useState<PassengerRequest | null>(null);
  const [targetTripId, setTargetTripId] = useState(trips[0]?.id || '');

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formFrom, setFormFrom] = useState('Новосибирск');
  const [formTo, setFormTo] = useState('Павлодар');
  const [formDate, setFormDate] = useState('23.11.2026');
  const [formTime, setFormTime] = useState('Утро');
  const [formSeats, setFormSeats] = useState(1);
  const [formType, setFormType] = useState<RequestType>('passenger');
  const [formParcelDesc, setFormParcelDesc] = useState('');
  const [formPrice, setFormPrice] = useState(2400);
  const [formNotes, setFormNotes] = useState('');

  // Directions demand aggregation
  const demandByDirection = useMemo(() => {
    const map = new Map<string, { from: string; to: string; count: number; seats: number; unassigned: number }>();
    requests.forEach((r) => {
      const key = `${r.fromCity} — ${r.toCity}`;
      const existing = map.get(key) || {
        from: r.fromCity,
        to: r.toCity,
        count: 0,
        seats: 0,
        unassigned: 0,
      };
      existing.count += 1;
      existing.seats += r.seatsCount;
      if (r.status === 'new' || r.status === 'in_progress') {
        existing.unassigned += 1;
      }
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [requests]);

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Direction filter
      if (selectedDirection && `${r.fromCity} — ${r.toCity}` !== selectedDirection) {
        return false;
      }

      // Tab filter
      if (activeFilter === 'new' && r.status !== 'new') return false;
      if (activeFilter === 'in_progress' && r.status !== 'in_progress') return false;
      if (activeFilter === 'assigned' && r.status !== 'assigned') return false;
      if (activeFilter === 'parcel' && r.type !== 'parcel') return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.requestNumber.toLowerCase().includes(q) ||
          r.passengerName.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.fromCity.toLowerCase().includes(q) ||
          r.toCity.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, activeFilter, searchQuery, selectedDirection]);

  // Handle create
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    createRequest({
      passengerName: formName.trim(),
      phone: formPhone.trim(),
      fromCity: formFrom.trim(),
      toCity: formTo.trim(),
      desiredDate: formDate,
      desiredTime: formTime,
      seatsCount: formType === 'parcel' ? 0 : formSeats,
      type: formType,
      parcelDescription: formType === 'parcel' ? formParcelDesc : undefined,
      priceEstimate: formPrice,
      notes: formNotes,
      source: 'dispatcher',
    });

    setCreateModalOpen(false);
    // Reset form
    setFormName('');
    setFormPhone('');
    setFormNotes('');
    setFormParcelDesc('');
  };

  // Handle assign to trip
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForAssign || !targetTripId) return;

    assignRequestToTrip(selectedRequestForAssign.id, targetTripId);
    setAssignModalOpen(false);
    setSelectedRequestForAssign(null);
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Заявки пассажиров
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Входящие запросы на поездки и посылки до распределения по машинам и рейсам.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Принять заявку</span>
        </button>
      </div>

      {/* ── DEMAND BY DIRECTIONS (Спрос по направлениям) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Спрос по направлениям
            </h2>
            <p className="text-xs text-slate-500">
              Сбор заявок перед формированием рейса. Кликните, чтобы отфильтровать список.
            </p>
          </div>
          {selectedDirection && (
            <button
              onClick={() => setSelectedDirection(null)}
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Сбросить фильтр
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {demandByDirection.map((dir) => {
            const isSelected = selectedDirection === `${dir.from} — ${dir.to}`;
            return (
              <button
                key={`${dir.from}-${dir.to}`}
                onClick={() =>
                  setSelectedDirection(isSelected ? null : `${dir.from} — ${dir.to}`)
                }
                className={`p-3.5 rounded-xl border text-left transition-all block ${
                  isSelected
                    ? 'bg-red-50/80 border-red-300 ring-1 ring-red-400'
                    : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900 truncate">
                    {dir.from} → {dir.to}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xs text-slate-500">
                    {dir.count} {dir.count === 1 ? 'заявка' : 'заявки'} ({dir.seats} мест)
                  </span>
                  {dir.unassigned > 0 ? (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      {dir.unassigned} не распр.
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Распределены
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTROLS & FILTERS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: `Все (${requests.length})` },
            { id: 'new', label: `Новые (${requests.filter((r) => r.status === 'new').length})` },
            { id: 'in_progress', label: `В обработке (${requests.filter((r) => r.status === 'in_progress').length})` },
            { id: 'assigned', label: `В рейсе (${requests.filter((r) => r.status === 'assigned').length})` },
            { id: 'parcel', label: `Посылки (${requests.filter((r) => r.type === 'parcel').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, номеру, городу..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
      </div>

      {/* ── REQUESTS TABLE / CARDS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Заявок по выбранным фильтрам не найдено.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">№ Заявки</th>
                  <th className="py-3 px-4">Пассажир / Контакт</th>
                  <th className="py-3 px-4">Направление</th>
                  <th className="py-3 px-4">Дата / Время</th>
                  <th className="py-3 px-4">Тип / Мест</th>
                  <th className="py-3 px-4">Статус</th>
                  <th className="py-3 px-4">Рейс / Машина</th>
                  <th className="py-3 px-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Number & Source */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200/60">
                        {req.requestNumber}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1 capitalize">
                        {req.source === 'telegram'
                          ? 'Telegram-бот'
                          : req.source === 'website'
                          ? 'Сайт'
                          : req.source === 'phone'
                          ? 'Телефон'
                          : 'Диспетчер'}
                      </span>
                    </td>

                    {/* Passenger */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{req.passengerName}</p>
                      <p className="text-slate-500 font-mono text-[11px] mt-0.5">{req.phone}</p>
                      {req.notes && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5 max-w-[200px] truncate">
                          «{req.notes}»
                        </p>
                      )}
                    </td>

                    {/* Route */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">
                        {req.fromCity} → {req.toCity}
                      </span>
                      {req.priceEstimate && (
                        <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                          ~ {req.priceEstimate.toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      <span className="text-slate-800 font-medium">{req.desiredDate}</span>
                      {req.desiredTime && (
                        <span className="block text-[10px] text-slate-400">
                          {req.desiredTime}
                        </span>
                      )}
                    </td>

                    {/* Type & Seats */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {req.type === 'parcel' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold text-[11px] border border-purple-200/60">
                          <Package className="w-3 h-3" />
                          Посылка
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <User className="w-3 h-3 text-slate-400" />
                          {req.seatsCount} {req.seatsCount === 1 ? 'место' : 'места'}
                        </span>
                      )}
                      {req.parcelDescription && (
                        <p className="text-[10px] text-slate-500 mt-0.5 max-w-[150px] truncate">
                          {req.parcelDescription}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {req.status === 'new' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[11px] border border-amber-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Новая
                        </span>
                      )}
                      {req.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200/60">
                          В обработке
                        </span>
                      )}
                      {req.status === 'assigned' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3" />
                          В рейсе
                        </span>
                      )}
                      {req.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium text-[11px]">
                          Отменена
                        </span>
                      )}
                    </td>

                    {/* Assigned Trip */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {req.assignedTripNumber ? (
                        <Link
                          href={`/trips?tripId=${req.assignedTripId}`}
                          className="font-mono font-bold text-red-600 hover:underline flex items-center gap-1"
                        >
                          <span>{req.assignedTripNumber}</span>
                          {req.assignedSeatNumber && (
                            <span className="text-[11px] text-slate-500 font-sans">
                              (место {req.assignedSeatNumber})
                            </span>
                          )}
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">
                          Не назначен
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {req.status !== 'assigned' ? (
                        <button
                          onClick={() => {
                            setSelectedRequestForAssign(req);
                            setAssignModalOpen(true);
                          }}
                          className="btn-primary px-3 py-1 text-[11px] font-semibold"
                        >
                          В рейс →
                        </button>
                      ) : (
                        <button
                          onClick={() => updateRequestStatus(req.id, 'new')}
                          className="text-slate-400 hover:text-slate-700 text-[11px] underline"
                        >
                          Снять с рейса
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: СОЗДАТЬ ЗАЯВКУ ── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Принять новую заявку пассажира
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    ФИО пассажира *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Иван Петров"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Телефон *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+7 900 123-45-67"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Откуда
                  </label>
                  <input
                    type="text"
                    required
                    value={formFrom}
                    onChange={(e) => setFormFrom(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Куда
                  </label>
                  <input
                    type="text"
                    required
                    value={formTo}
                    onChange={(e) => setFormTo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Желаемая дата
                  </label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Время
                  </label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Кол-во мест
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formSeats}
                    onChange={(e) => setFormSeats(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Тип отправления
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as RequestType)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="passenger">Пассажир</option>
                    <option value="parcel">Посылка / Багаж</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Ориентировочная цена (₽)
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              {formType === 'parcel' && (
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Описание посылки (вес, габариты)
                  </label>
                  <input
                    type="text"
                    value={formParcelDesc}
                    onChange={(e) => setFormParcelDesc(e.target.value)}
                    placeholder="Коробка 5 кг, автозапчасть"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Примечания к заявке
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Дополнительные пожелания пассажира..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary px-5 py-2 font-semibold">
                  Сохранить заявку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: РАСПРЕДЕЛИТЬ ЗАЯВКУ В РЕЙС ── */}
      {assignModalOpen && selectedRequestForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Распределить заявку {selectedRequestForAssign.requestNumber} в рейс
              </h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl mb-4 space-y-1">
              <p className="font-bold text-slate-900">
                {selectedRequestForAssign.passengerName} ({selectedRequestForAssign.phone})
              </p>
              <p className="text-slate-600">
                Направление: <b>{selectedRequestForAssign.fromCity} → {selectedRequestForAssign.toCity}</b>
              </p>
              <p className="text-slate-500">
                Мест: {selectedRequestForAssign.seatsCount} · Дата: {selectedRequestForAssign.desiredDate}
              </p>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1.5">
                  Выберите рейс для привязки:
                </label>
                <select
                  value={targetTripId}
                  onChange={(e) => setTargetTripId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs font-medium"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tripNumber} ({t.routeName}) — {t.departureDate} {t.departureTime}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary px-5 py-2 font-semibold">
                  Привязать к рейсу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
