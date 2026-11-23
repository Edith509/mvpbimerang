'use client';

import React from 'react';
import Link from 'next/link';
import {
  Navigation,
  Bus,
  Wallet,
  Inbox,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '@/lib/store';

export default function DashboardPage() {
  const { trips, vehicles, requests, accounts, getAccountBalance } = useApp();

  // Multi-currency balances
  const totalRubBalance = accounts
    .filter((a) => a.currency === 'RUB')
    .reduce((sum, account) => sum + getAccountBalance(account.id), 0);

  const totalKztBalance = accounts
    .filter((a) => a.currency === 'KZT')
    .reduce((sum, account) => sum + getAccountBalance(account.id), 0);

  const totalBynBalance = accounts
    .filter((a) => a.currency === 'BYN')
    .reduce((sum, account) => sum + getAccountBalance(account.id), 0);

  // New unassigned requests count
  const newRequestsCount = requests.filter((r) => r.status === 'new').length;

  // Active trips (scheduled, boarding, in_progress)
  const activeTrips = trips.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');

  return (
    <div className="space-y-6">
      {/* ── HEADER (Minimalist, without "Open trip" button) ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Обзор
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Ключевые показатели работы перевозчика, активные рейсы и заявки пассажиров.
        </p>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1.3. Карточка «Рейсы» */}
        <Link
          href="/trips"
          className="block bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Рейсы
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Navigation className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono">
            105{' '}
            <span className="text-sm font-normal text-slate-500 font-sans">
              рейсов / мес
            </span>
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>3 рейса сегодня</span>
          </div>
        </Link>

        {/* 1.4. Карточка «Заявки» */}
        <Link
          href="/requests"
          className="block bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Заявки
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Inbox className="w-4 h-4 text-slate-700" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono">
            {requests.length}{' '}
            <span className="text-sm font-normal text-slate-500 font-sans">
              заявок
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-2 flex items-center justify-between">
            <span>Ожидают распределения:</span>
            <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
              {newRequestsCount} новых
            </span>
          </div>
        </Link>

        {/* 1.5. Карточка «Финансы» (Мультивалютная: RUB, KZT, BYN) */}
        <Link
          href="/finances"
          className="block bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Финансы
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4 text-slate-700" />
            </div>
          </div>
          <div className="space-y-1 mt-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400 font-semibold">RUB:</span>
              <span className="font-mono font-bold text-slate-900 text-base">
                {totalRubBalance.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400 font-semibold">KZT:</span>
              <span className="font-mono font-semibold text-slate-700">
                {totalKztBalance.toLocaleString('ru-RU')} ₸
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400 font-semibold">BYN:</span>
              <span className="font-mono font-semibold text-slate-700">
                {totalBynBalance.toLocaleString('ru-RU')} Br
              </span>
            </div>
          </div>
        </Link>

        {/* 1.6. Карточка «Автопарк» */}
        <Link
          href="/fleet"
          className="block bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Автопарк
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bus className="w-4 h-4 text-slate-700" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono">
            {vehicles.length}{' '}
            <span className="text-sm font-normal text-slate-500 font-sans">
              микроавтобуса
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-2">
            {vehicles.filter((v) => v.status === 'repair').length > 0 ? (
              <span className="text-amber-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> 1 авто на ТО / ремонте
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Все машины готовы к рейсу
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* ── 1.1. КОМПАКТНЫЙ СПИСОК АКТИВНЫХ РЕЙСОВ ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Активные рейсы
            </h2>
            <p className="text-xs text-slate-500">
              Нажмите на рейс для перехода к полной информации и управлению
            </p>
          </div>
          <Link
            href="/trips"
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <span>Все рейсы ({trips.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Compact List of Trips */}
        <div className="divide-y divide-slate-100">
          {activeTrips.map((trip) => {
            const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
            const passedPoints = trip.checkpoints?.filter((c) => c.isPassed)?.length || 0;
            const totalPoints = trip.checkpoints?.length || 0;

            return (
              <Link
                key={trip.id}
                href={`/trips?tripId=${encodeURIComponent(trip.id)}`}
                className="py-3.5 px-3 -mx-3 rounded-xl hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group block"
              >
                {/* Route & Number */}
                <div className="flex items-start gap-3 min-w-0">
                  <span className="font-mono font-bold text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-200/60 shrink-0">
                    {trip.tripNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">
                      {trip.routeName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                      <span className="font-medium text-slate-700 font-mono">
                        {trip.departureTime}, {trip.departureDate}
                      </span>
                      {vehicle && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-600">
                            {vehicle.brandModel} ({vehicle.plateNumber})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Progress */}
                <div className="flex items-center gap-4 self-start sm:self-auto shrink-0 text-xs">
                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${
                      trip.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                        : trip.status === 'scheduled'
                        ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                        : trip.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                        : trip.status === 'boarding'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
                        : 'bg-slate-100 text-slate-700 border-slate-200/60'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        trip.status === 'completed'
                          ? 'bg-emerald-500'
                          : trip.status === 'scheduled'
                          ? 'bg-amber-500'
                          : trip.status === 'in_progress'
                          ? 'bg-blue-500 animate-pulse'
                          : trip.status === 'boarding'
                          ? 'bg-indigo-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    {trip.status === 'completed'
                      ? 'Завершён'
                      : trip.status === 'scheduled'
                      ? 'Запланирован'
                      : trip.status === 'in_progress'
                      ? 'В пути'
                      : trip.status === 'boarding'
                      ? 'Посадка'
                      : 'Запланирован'}
                  </span>

                  {/* Progress of checkpoints */}
                  <div className="text-right hidden md:block">
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Точки: {passedPoints}/{totalPoints}
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {trip.basePrice.toLocaleString('ru-RU')} ₽ / место
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
