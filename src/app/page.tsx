'use client';

import React from 'react';
import Link from 'next/link';
import {
  Navigation,
  Bus,
  Wallet,
  Users,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  CreditCard,
  Fuel,
} from 'lucide-react';
import { useApp } from '@/lib/store';

export default function DashboardPage() {
  const { trips, vehicles, bookings, passengers, accounts, transactions, company, getAccountBalance } =
    useApp();

  const totalRubBalance = accounts
    .filter((a) => a.currency === 'RUB')
    .reduce((sum, account) => sum + getAccountBalance(account.id), 0);

  const activeTrip = trips[0];
  const passedCheckpoints = activeTrip?.checkpoints?.filter((cp) => cp.isPassed)?.length || 0;
  const totalCheckpoints = activeTrip?.checkpoints?.length || 0;

  const pendingApprovalsCount = transactions.filter(
    (t) => t.status === 'pending_approval'
  ).length;

  return (
    <div className="space-y-6">
      {/* ── HERO BANNER: Premium Clean Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Рабочее пространство активного перевозчика
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Сводка и операционный контроль
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Рейсы в реальном времени, загрузка машин и сквозное движение кассы.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <Link
            href="/trips"
            className="btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Схема рейса БУМ-104</span>
          </Link>
          <Link
            href="/reports"
            className="btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>P&L отчёт</span>
          </Link>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Trips */}
        <Link
          href="/trips"
          className="macos-card p-5 group transition-all block"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
              Рейсы на линии
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-slate-900">
            {trips.length}{' '}
            <span className="text-sm font-normal text-slate-400 font-sans">рейса</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>1 рейс в пути (пройдено {passedCheckpoints}/{totalCheckpoints} точек)</span>
          </div>
        </Link>

        {/* Metric 2: Bookings & Occupancy */}
        <Link
          href="/trips"
          className="macos-card p-5 group transition-all block"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
              Пассажиропоток
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-slate-900">
            {bookings.length}{' '}
            <span className="text-sm font-normal text-slate-400 font-sans">чел.</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-2 flex items-center justify-between">
            <span>Загрузка БУМ-104:</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
              75% (15/19 мест)
            </span>
          </div>
        </Link>

        {/* Metric 3: Financial Balance */}
        <Link
          href="/finances"
          className="macos-card p-5 group transition-all block"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
              Баланс касс и счетов
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-slate-900">
            {totalRubBalance.toLocaleString('ru-RU')}{' '}
            <span className="text-sm font-normal text-slate-400 font-sans">₽</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1.5">
            <span>Мультивалюта:</span>
            <span className="font-semibold text-slate-700">14 850 BYN</span>
            <span className="text-slate-300">·</span>
            <span className="font-semibold text-slate-700">1.94M ₸</span>
          </div>
        </Link>

        {/* Metric 4: Fleet & Readiness */}
        <Link
          href="/fleet"
          className="macos-card p-5 group transition-all block"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
              Автопарк ТС
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-slate-900">
            {vehicles.length}{' '}
            <span className="text-sm font-normal text-slate-400 font-sans">автобуса</span>
          </div>
          <div className="text-xs mt-2 flex items-center gap-1.5">
            {pendingApprovalsCount > 0 ? (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pendingApprovalsCount} заявки на согласовании</span>
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Все машины проверены</span>
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* ── CORE DEMO PITCH FLOW STEPPER ── */}
      <div className="macos-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Сквозной процесс управления пассажироперевозками
              </h2>
              <p className="text-xs text-slate-500">
                Данные вносятся один раз и автоматически связываются между рейсом, кассой и CRM.
              </p>
            </div>
          </div>
          <Link
            href="/trips"
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Запустить сценарий</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
          {[
            {
              num: '1',
              title: 'Рейс и маршрут',
              desc: 'Расписание Москва — Минск',
              active: false,
            },
            {
              num: '2',
              title: 'Назначение машины',
              desc: 'Mercedes Sprinter + Водитель',
              active: false,
            },
            {
              num: '3',
              title: 'Интерактивная рассадка',
              desc: 'Выбор места 4 на схеме автобуса',
              active: true,
            },
            {
              num: '4',
              title: 'Касса и фискализация',
              desc: 'Автоприход в кассу / чек с АЗС',
              active: false,
            },
            {
              num: '5',
              title: 'Пассажирская CRM',
              desc: 'История поездок и забытых вещей',
              active: false,
            },
          ].map((step) => (
            <div
              key={step.num}
              className={`p-3 rounded-xl border transition-all ${
                step.active
                  ? 'bg-red-50/70 border-red-200/80 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step.active
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {step.num}
                </span>
                <span
                  className={`font-semibold ${
                    step.active ? 'text-red-950 font-bold' : 'text-slate-800'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] leading-snug">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TWO COLUMN OPERATIONAL LAYOUT: ACTIVE TRIP & TRANSACTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Trip Tracker */}
        <div className="lg:col-span-2 macos-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  В пути сейчас
                </span>
                <span className="font-mono text-xs font-semibold text-slate-400">
                  #{activeTrip?.tripNumber}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {activeTrip?.routeName}
              </h3>
            </div>
            <Link
              href="/trips"
              className="btn-secondary px-3.5 py-2 text-xs font-semibold self-start sm:self-auto"
            >
              Схема 19 мест →
            </Link>
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/50">
              <span className="text-slate-400 block text-[11px]">Отправление</span>
              <span className="font-semibold text-slate-900 font-mono">
                {activeTrip?.departureTime}, {activeTrip?.departureDate}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/50">
              <span className="text-slate-400 block text-[11px]">Микроавтобус</span>
              <span className="font-semibold text-slate-900">
                А 112 ВМ 777{' '}
                <span className="text-[10px] text-slate-400 font-normal">(19 мест)</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/50">
              <span className="text-slate-400 block text-[11px]">Водитель</span>
              <span className="font-semibold text-slate-900">Сергей Васильев</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/50">
              <span className="text-slate-400 block text-[11px]">Тариф места</span>
              <span className="font-semibold text-slate-900 font-mono">
                {activeTrip?.basePrice.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>

          {/* Checkpoints Timeline */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold flex items-center gap-1.5 text-slate-200">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                Контрольные точки маршрута (GPS отметки):
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {passedCheckpoints} из {totalCheckpoints} остановок пройдено
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {(activeTrip?.checkpoints || []).map((cp, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border transition-all ${
                    cp.isPassed
                      ? 'bg-emerald-950/70 border-emerald-600/80 text-emerald-200'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-mono text-slate-400">Точка {idx + 1}</span>
                    {cp.isPassed && (
                      <span className="text-emerald-400 font-bold text-[9px]">✓ Пройдено</span>
                    )}
                  </div>
                  <p className="font-semibold truncate text-[11px]">{cp.stopName}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {cp.passedTime ? cp.passedTime : cp.scheduledTime}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions & Audit Stream */}
        <div className="macos-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Финансовые операции</h3>
                <p className="text-[11px] text-slate-500">Автоматический учёт билетов и чеков</p>
              </div>
              <Link
                href="/finances"
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Все счета →
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {transactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-start justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 truncate">{tx.categoryLabel}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                      {tx.description}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{tx.date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-bold block ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '−'}
                      {tx.amount.toLocaleString('ru-RU')} ₽
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-medium inline-block mt-0.5 ${
                        tx.status === 'confirmed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {tx.status === 'confirmed' ? 'Проведено' : 'На согласовании'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Link
              href="/finances"
              className="w-full btn-secondary py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Согласовать заявки ({pendingApprovalsCount})</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
