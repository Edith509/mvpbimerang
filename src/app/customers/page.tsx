'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import { useApp } from '@/lib/store';

export default function CustomersPage() {
  const { passengers, bookings, trips } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPassengerId, setSelectedPassengerId] = useState<string>(passengers[0]?.id || '');

  const filteredPassengers = passengers.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.telegram && p.telegram.toLowerCase().includes(q)) ||
      (p.documentNumber && p.documentNumber.includes(q))
    );
  });

  const selectedPassenger =
    passengers.find((p) => p.id === selectedPassengerId) || filteredPassengers[0] || passengers[0];

  const passengerBookings = bookings.filter((b) => b.passengerId === selectedPassenger?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
            <Users className="w-4 h-4" />
            <span>База пассажиров</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Клиенты</h1>
          <p className="text-sm text-slate-500">
            Контакты, бронирования и история поездок каждого пассажира в одном месте.
          </p>
        </div>

        {/* Quick Pitch note */}
        <div className="text-xs bg-red-50 text-red-700 border border-red-100 px-3.5 py-2 rounded-xl">
          Сквозной демо-сценарий: созданный в рейсах пассажир сразу появляется здесь!
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск пассажира по имени, номеру телефона, Telegram или паспорту..."
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
          >
            Сброс
          </button>
        )}
      </div>

      {/* TWO COLUMNS: PASSENGERS LIST + PASSENGER PROFILE CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PASSENGERS LIST (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Список клиентов ({filteredPassengers.length})
            </h3>
            <span className="text-[11px] text-slate-400">Кликните для деталей</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredPassengers.map((p) => {
              const isSelected = p.id === selectedPassenger?.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPassengerId(p.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-red-50 border border-red-200 shadow-sm'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {p.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900">{p.fullName}</h4>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span>{p.phone}</span>
                        {p.telegram && (
                          <span className="break-all text-blue-600 font-medium">{p.telegram}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-xs font-bold text-slate-900 block">
                      {p.totalTrips} {p.totalTrips === 1 ? 'поездка' : 'поездок'}
                    </span>
                    <span className="text-[10px] text-slate-400">в базе</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PASSENGER PROFILE CARD & TRIP HISTORY (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-6">
          {selectedPassenger ? (
            <>
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-red-500/20">
                    {selectedPassenger.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-lg font-bold text-slate-900">
                        {selectedPassenger.fullName}
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Постоянный клиент
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedPassenger.phone}
                      </span>
                      {selectedPassenger.telegram && (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {selectedPassenger.telegram}
                        </span>
                      )}
                      {selectedPassenger.documentNumber && (
                        <span className="flex items-center gap-1 font-mono">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          Паспорт: {selectedPassenger.documentNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Passenger notes */}
              <div className="grid grid-cols-1 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="font-semibold text-slate-700 block mb-1">
                    Заметки и предпочтения:
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedPassenger.notes || 'Особых примечаний нет. Стандартные условия посадки.'}
                  </p>
                </div>
              </div>

              {/* Trips History Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  История бронирований и поездок ({passengerBookings.length})
                </h3>

                {passengerBookings.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl text-xs text-slate-500">
                    На текущий момент активных бронирований нет.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200/80 text-slate-400 font-semibold uppercase text-[10px]">
                          <th className="py-2.5 px-2">Дата оформления</th>
                          <th className="py-2.5 px-2">Рейс / Маршрут</th>
                          <th className="py-2.5 px-2">Место</th>
                          <th className="py-2.5 px-2">Стоимость</th>
                          <th className="py-2.5 px-2">Статус оплаты</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {passengerBookings.map((b) => {
                          const trip = trips.find((t) => t.id === b.tripId);
                          const isPaid = b.status === 'paid';
                          return (
                            <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                                {b.createdAt}
                              </td>
                              <td className="py-3 px-2">
                                <div className="font-semibold text-slate-900">
                                  {trip?.tripNumber || b.tripId}: {trip?.routeName || 'Рейс'}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {b.fromStop} → {b.toStop}
                                </div>
                              </td>
                              <td className="py-3 px-2 font-bold text-slate-900">
                                № {b.seatNumber}
                              </td>
                              <td className="py-3 px-2 font-bold text-slate-900">
                                {b.price.toLocaleString('ru-RU')} ₽
                              </td>
                              <td className="py-3 px-2">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" /> Оплачено
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    <Clock className="w-3 h-3" /> Не оплачено
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Выберите пассажира из списка слева.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
