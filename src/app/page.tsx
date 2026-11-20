'use client';

import React from 'react';
import Link from 'next/link';
import {
  Navigation,
  Bus,
  Wallet,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/lib/store';

export default function DashboardPage() {
  const { trips, vehicles, bookings, passengers, accounts, transactions, company, getAccountBalance } = useApp();

  const totalRubBalance = accounts
    .filter((a) => a.currency === 'RUB')
    .reduce((sum, account) => sum + getAccountBalance(account.id), 0);

  const activeTrip = trips[0];
  const passedCheckpoints = activeTrip?.checkpoints?.filter((cp) => cp.isPassed)?.length || 0;
  const totalCheckpoints = activeTrip?.checkpoints?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Обзор</h1>
          <p className="text-sm text-slate-600 mt-1">
            Ключевые показатели рейсов, финансов и автопарка.
          </p>
        </div>
        <Link
          href="/trips"
          className="inline-flex items-center justify-center gap-2 self-start md:self-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          <span>Открыть рейсы</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Link href="/trips" className="block bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition hover:border-red-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
          <div className="flex items-center justify-between text-slate-600 mb-3">
            <span className="text-sm font-semibold">Рейсы сегодня</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight tabular-nums text-slate-900">{trips.length} рейса</div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>1 рейс в пути (прогресс {passedCheckpoints}/{totalCheckpoints})</span>
          </div>
        </Link>

        {/* Metric 2 */}
        <Link href="/trips" className="block bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition hover:border-red-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
          <div className="flex items-center justify-between text-slate-600 mb-3">
            <span className="text-sm font-semibold">Бронирования</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight tabular-nums text-slate-900">{bookings.length} пассажиров</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Загрузка рейса БУМ-104: <span className="font-semibold text-slate-800">75%</span>
          </div>
        </Link>

        {/* Metric 3 */}
        <Link href="/finances" className="block bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition hover:border-red-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
          <div className="flex items-center justify-between text-slate-600 mb-3">
            <span className="text-sm font-semibold">Баланс (RUB)</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight tabular-nums text-slate-900">
            {totalRubBalance.toLocaleString('ru-RU')} ₽
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            + также счета в <span className="font-semibold">BYN</span> и <span className="font-semibold">KZT</span>
          </div>
        </Link>

        {/* Metric 4 */}
        <Link href="/fleet" className="block bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition hover:border-red-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
          <div className="flex items-center justify-between text-slate-600 mb-3">
            <span className="text-sm font-semibold">Автопарк</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <Bus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight tabular-nums text-slate-900">{vehicles.length} микроавтобуса</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {vehicles.filter((v) => v.status === 'repair').length > 0 ? (
              <span className="text-amber-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> 1 авто на ТО / ремонте
              </span>
            ) : (
              <span className="text-emerald-600">Все машины готовы</span>
            )}
          </div>
        </Link>
      </div>

      {/* CORE DEMO FLOW STEPPER (FOR SALES PITCH) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Сквозной сценарий демонстрации</h2>
              <p className="text-xs text-slate-500">
                Покажите клиенту цепочку: данные вносятся один раз и связываются между собой автоматически.
              </p>
            </div>
          </div>
          <Link
            href="/trips"
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <span>Перейти к рейсу</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold mb-2">
              1
            </span>
            <div className="font-semibold text-slate-800">Рейс и маршрут</div>
            <div className="text-slate-500 text-[11px] mt-0.5">Выбираем рейс Москва — Минск</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold mb-2">
              2
            </span>
            <div className="font-semibold text-slate-800">Назначение ресурсов</div>
            <div className="text-slate-500 text-[11px] mt-0.5">Mercedes Sprinter + Водитель</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold mb-2">
              3
            </span>
            <div className="font-semibold text-slate-800">Заявка и место</div>
            <div className="text-slate-500 text-[11px] mt-0.5">Выбор места 4 на интерактивной схеме</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold mb-2">
              4
            </span>
            <div className="font-semibold text-slate-800">Оплата билета</div>
            <div className="text-slate-500 text-[11px] mt-0.5">Автоматический приход в кассу/банк</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold mb-2">
              5
            </span>
            <div className="font-semibold text-slate-800">История в базе клиентов</div>
            <div className="text-slate-500 text-[11px] mt-0.5">Карточка пассажира обновлена</div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: ACTIVE TRIP & RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Trip Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold uppercase">
                  Активный рейс
                </span>
                <span className="text-xs text-slate-400">#{activeTrip?.tripNumber}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">{activeTrip?.routeName}</h3>
            </div>
            <Link
              href={activeTrip ? `/trips?tripId=${encodeURIComponent(activeTrip.id)}` : '/trips'}
              className="inline-flex w-full items-center justify-center px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors sm:w-auto"
            >
              Схема рассадки мест
            </Link>
          </div>

          {/* Trip Details & Progress */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs">
            <div>
              <span className="text-slate-400 block">Отправление</span>
              <span className="font-semibold text-slate-800">{activeTrip?.departureTime}, {activeTrip?.departureDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Микроавтобус</span>
              <span className="font-semibold text-slate-800">А 112 ВМ 777 (19 мест)</span>
            </div>
            <div>
              <span className="text-slate-400 block">Водитель</span>
              <span className="font-semibold text-slate-800">Сергей Васильев</span>
            </div>
            <div>
              <span className="text-slate-400 block">Тариф за место</span>
              <span className="font-semibold text-slate-800">{activeTrip?.basePrice} ₽</span>
            </div>
          </div>

          {/* Checkpoints Tracker */}
          <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div className="text-xs font-semibold text-slate-700 mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Прогресс рейса водителем:</span>
              <span className="text-slate-500 font-normal">
                Пройдено остановок: {passedCheckpoints} из {totalCheckpoints}
              </span>
            </div>
            <div className="overflow-x-auto overscroll-x-contain pb-2">
              <div className="relative grid gap-3 pt-1 md:min-w-[560px] md:grid-flow-col md:auto-cols-fr">
                <div className="absolute bottom-3 left-[11px] top-3 w-0.5 bg-slate-200 md:hidden" />
                <div className="absolute left-12 right-12 top-[13px] hidden h-0.5 bg-slate-200 md:block" />
                {(activeTrip?.checkpoints || []).map((cp, idx) => (
                  <div key={idx} className="relative z-10 flex min-w-0 items-start gap-3 md:flex-col md:items-center md:gap-1 md:text-center">
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold md:mt-0 ${
                        cp.isPassed
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                          : 'border-2 border-slate-300 bg-white text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1 md:max-w-[100px] md:flex-none">
                      <span title={cp.stopName} className="block text-[10px] font-medium leading-4 text-slate-700">
                        {cp.stopName}
                      </span>
                      <span className="mt-0.5 block text-[9px] text-slate-400">
                        {cp.passedTime ? `Пройдена в ${cp.passedTime}` : `По расписанию ${cp.scheduledTime}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Finance Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Последние движения средств</h3>
              <Link
                href="/finances"
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Все счета
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2 space-y-2">
              {transactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="pt-2 flex items-start justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">{tx.categoryLabel}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                      {tx.description}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{tx.date}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-bold block ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString('ru-RU')}{' '}
                      {tx.currency === 'RUB' ? '₽' : tx.currency}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium inline-block mt-0.5 ${
                        tx.status === 'confirmed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {tx.status === 'confirmed' ? 'Подтверждено' : 'На согласовании'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              href="/finances"
              className="w-full block text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Открыть раздел «Финансы»
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
