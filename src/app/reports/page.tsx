'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/lib/store';
import type { Transaction, Trip, Vehicle } from '@/types';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Printer,
  Navigation,
  Users,
  Wallet,
  Bus,
  Clock,
  AlertTriangle,
  Receipt,
  ChevronRight,
  Wrench,
} from 'lucide-react';

/* ── currency formatter ─────────────────────────── */
const fmt = (n: number, cur = 'RUB') =>
  n.toLocaleString('ru-RU', { style: 'currency', currency: cur, maximumFractionDigits: 0 });

type ReportPeriod = 'day' | 'week' | 'month';

function parseTransactionDate(value: string, now: Date) {
  const time = value.match(/(\d{1,2}):(\d{2})/);
  const hours = time ? Number(time[1]) : 0;
  const minutes = time ? Number(time[2]) : 0;

  if (/^сегодня/i.test(value)) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  }
  if (/^вчера/i.test(value)) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, hours, minutes);
  }

  const date = value.match(/(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/);
  if (!date) return null;

  const yearValue = date[3] ? Number(date[3]) : now.getFullYear();
  const year = yearValue < 100 ? 2000 + yearValue : yearValue;
  return new Date(year, Number(date[2]) - 1, Number(date[1]), hours, minutes);
}

function isInReportPeriod(transaction: Transaction, period: ReportPeriod, now: Date) {
  const transactionDate = parseTransactionDate(transaction.date, now);
  if (!transactionDate) return false;

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') start.setDate(start.getDate() - 6);
  if (period === 'month') start.setDate(1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return transactionDate >= start && transactionDate < end;
}

function getTripStatusLabel(trip: Trip) {
  if (trip.status === 'cancelled') return 'Отменён';
  if (trip.status === 'completed') return 'Завершён';

  const passedCount = trip.checkpoints.filter((checkpoint) => checkpoint.isPassed).length;
  if (trip.checkpoints.length > 0 && passedCount === trip.checkpoints.length) return 'Завершён';
  if (trip.status === 'boarding' && passedCount === 0) return 'Идёт посадка';
  if (trip.status === 'in_progress' || passedCount > 0) return 'В пути';
  return 'Запланирован';
}

function getReportVehicleStatus(vehicle: Vehicle, vehiclesInActiveTrips: Set<string>) {
  return vehiclesInActiveTrips.has(vehicle.id) ? 'in_trip' : vehicle.status;
}

/* ── Stat card ──────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="min-w-0 border-l border-slate-200 pl-4 first:border-l-2 first:border-l-red-600">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-600">{label}</p>
        <Icon className="w-4 h-4 shrink-0 text-slate-400" />
      </div>
      <p className="mt-1 text-xl font-bold leading-tight tracking-tight tabular-nums text-slate-900 truncate">{value}</p>
      {sub && (
        <p className={`mt-1 text-[11px] ${
          trend === 'down' ? 'text-red-600' : 'text-slate-500'
        }`}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
export default function ReportsPage() {
  const {
    company,
    transactions,
    trips,
    bookings,
    passengers,
    vehicles,
    users,
    accounts,
    currentUser,
    getAccountBalance,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'finance' | 'trip' | 'fleet'>('finance');
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || '');
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [reportCurrency, setReportCurrency] = useState('RUB');
  const [reportNow, setReportNow] = useState<Date | null>(null);
  const availableCurrencies = [...new Set(accounts.map((account) => account.currency))];
  const activeCurrency = availableCurrencies.includes(reportCurrency)
    ? reportCurrency
    : availableCurrencies[0] || 'RUB';
  const periodLabels: Record<ReportPeriod, string> = {
    day: 'Сегодня',
    week: 'Последние 7 дней',
    month: 'Текущий месяц',
  };

  useEffect(() => {
    setReportNow(new Date());
  }, []);

  /* ── Finance calculations ───────────────────── */
  const periodTransactions = useMemo(
    () => reportNow
      ? transactions.filter((transaction) => isInReportPeriod(transaction, period, reportNow))
      : [],
    [transactions, period, reportNow]
  );
  const currencyTransactions = useMemo(
    () => periodTransactions.filter((transaction) => transaction.currency === activeCurrency),
    [periodTransactions, activeCurrency]
  );
  const confirmedTx = useMemo(
    () => currencyTransactions.filter((transaction) => transaction.status === 'confirmed'),
    [currencyTransactions]
  );
  const pendingTx = useMemo(
    () => currencyTransactions.filter((transaction) => transaction.status === 'pending_approval'),
    [currencyTransactions]
  );

  const totalIncome = confirmedTx
    .filter((t) => t.type === 'income' && !t.isOpeningBalance)
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = confirmedTx
    .filter((t) => t.type === 'expense' && !t.isOpeningBalance)
    .reduce((s, t) => s + t.amount, 0);

  const profit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? Math.round((profit / totalIncome) * 100) : 0;

  const expenseByCategory = useMemo(() => {
    const cats: Record<string, { label: string; amount: number }> = {
      fuel:        { label: 'Топливо',      amount: 0 },
      repair:      { label: 'Ремонт',       amount: 0 },
      salary:      { label: 'Зарплата',     amount: 0 },
      fine:        { label: 'Штрафы',       amount: 0 },
      other:       { label: 'Прочее',       amount: 0 },
    };
    confirmedTx
      .filter((t) => t.type === 'expense' && !t.isOpeningBalance)
      .forEach((t) => {
        if (cats[t.category]) cats[t.category].amount += t.amount;
        else cats.other.amount += t.amount;
      });
    return Object.entries(cats).filter(([, v]) => v.amount > 0);
  }, [confirmedTx]);

  const incomeByCategory = useMemo(() => {
    return confirmedTx
      .filter((t) => t.type === 'income' && !t.isOpeningBalance)
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.categoryLabel] = (acc[t.categoryLabel] || 0) + t.amount;
        return acc;
      }, {});
  }, [confirmedTx]);

  /* ── Trip report calculations ───────────────── */
  const selectedTrip = useMemo(
    () => trips.find((t) => t.id === selectedTripId),
    [trips, selectedTripId]
  );
  const tripStatusLabel = selectedTrip ? getTripStatusLabel(selectedTrip) : '';

  const tripBookings = useMemo(
    () => bookings.filter((b) => b.tripId === selectedTripId && b.status !== 'cancelled'),
    [bookings, selectedTripId]
  );

  const tripPassengers = useMemo(
    () =>
      tripBookings.map((b) => ({
        booking: b,
        passenger: passengers.find((p) => p.id === b.passengerId),
      })),
    [tripBookings, passengers]
  );

  const tripIncome = tripBookings
    .filter((b) => b.status === 'paid' && b.currency === selectedTrip?.currency)
    .reduce((s, b) => s + b.price, 0);

  const tripExpenseTransactions = transactions.filter(
    (transaction) =>
      transaction.tripId === selectedTripId &&
      transaction.type === 'expense' &&
      transaction.currency === selectedTrip?.currency,
  );
  const tripExpenses = tripExpenseTransactions
    .filter((transaction) => transaction.status === 'confirmed' && !transaction.isOpeningBalance)
    .reduce((s, t) => s + t.amount, 0);

  const tripPendingExpenses = tripExpenseTransactions
    .filter((transaction) => transaction.status === 'pending_approval' && !transaction.isOpeningBalance)
    .reduce((s, t) => s + t.amount, 0);

  const tripProfit = tripIncome - tripExpenses;
  const tripVehicle = vehicles.find((v) => v.id === selectedTrip?.vehicleId);
  const tripDriver = users.find((user) => user.id === selectedTrip?.driverId);

  const boardedCount = tripBookings.filter((b) => b.boardingStatus === 'boarded').length;
  const paidCount = tripBookings.filter((b) => b.status === 'paid' && b.currency === selectedTrip?.currency).length;
  const totalSeats = tripVehicle?.seatsCount || 19;
  const occupancy = totalSeats > 0 ? Math.round((tripBookings.length / totalSeats) * 100) : 0;

  /* ── Fleet report ───────────────────────────── */
  const totalVehicles = vehicles.length;
  const vehiclesInActiveTrips = new Set(
    trips.flatMap((trip) =>
      getTripStatusLabel(trip) === 'В пути' && trip.vehicleId ? [trip.vehicleId] : [],
    ),
  );
  const inTripVehicles = vehicles.filter(
    (vehicle) => getReportVehicleStatus(vehicle, vehiclesInActiveTrips) === 'in_trip',
  ).length;
  const repairVehicles = vehicles.filter((v) => v.status === 'repair' || v.status === 'inspection').length;
  const openIncidents = vehicles.flatMap((v) => v.incidents || []).filter((i) => i.status !== 'resolved');

  /* ── Tabs ───────────────────────────────────── */
  const TABS = [
    { id: 'finance' as const, label: 'Финансы' },
    { id: 'trip' as const,    label: 'Рейс' },
    { id: 'fleet' as const,   label: 'Автопарк' },
  ];

  const printPage = () => window.print();
  const reportJournal = currencyTransactions.filter((transaction) => !transaction.isOpeningBalance);

  return (
    <>
    <div className="report-screen space-y-6">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Отчётность</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Финансовые и операционные отчёты · Бумеранг Транс Лайн
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            onClick={printPage}
            className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors sm:w-auto"
          >
            <Printer className="w-3.5 h-3.5" />
            Печать / PDF
          </button>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="flex gap-5 overflow-x-auto border-b border-slate-200 print:hidden">
        {TABS.map((tab) => {
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px whitespace-nowrap border-b-2 px-1 py-3 text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1 — ФИНАНСОВЫЙ ОТЧЁТ
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'finance' && (
        <div className="space-y-5">

          {/* Period selector */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <span className="text-xs font-semibold text-slate-500">Период:</span>
            {(['day', 'week', 'month'] as const).map((p) => {
              const labels = { day: 'Сегодня', week: '7 дней', month: 'Месяц' };
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-1 py-1.5 border-b-2 text-xs font-semibold transition-colors ${
                    period === p
                      ? 'border-red-600 text-red-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
            <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-slate-500">
              Валюта
              <select
                value={activeCurrency}
                onChange={(event) => setReportCurrency(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
              >
                {availableCurrencies.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </label>
          </div>

          {/* P&L KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={TrendingUp}
              label={`Доходы (${activeCurrency}, подтверждённые)`}
              value={fmt(totalIncome, activeCurrency)}
              sub={`${confirmedTx.filter((transaction) => transaction.type === 'income' && !transaction.isOpeningBalance).length} операций`}
              trend="up"
            />
            <StatCard
              icon={TrendingDown}
              label={`Расходы (${activeCurrency}, подтверждённые)`}
              value={fmt(totalExpense, activeCurrency)}
              sub={`${confirmedTx.filter((transaction) => transaction.type === 'expense' && !transaction.isOpeningBalance).length} операций`}
              trend="down"
            />
            <StatCard
              icon={Wallet}
              label="Операционный результат"
              value={fmt(profit, activeCurrency)}
              sub={`Маржа ${margin}%`}
              trend={profit >= 0 ? 'up' : 'down'}
            />
            <StatCard
              icon={Clock}
              label="Ожидают подтверждения"
              value={fmt(pendingTx.reduce((sum, transaction) => sum + transaction.amount, 0), activeCurrency)}
              sub={`${pendingTx.length} заявок`}
              trend="neutral"
            />
          </div>

          {/* P&L + Category breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Income breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                Структура доходов
              </h2>
              <p className="text-xs text-slate-400 mb-4">Только подтверждённые</p>

              {Object.entries(incomeByCategory).length === 0 ? (
                <p className="text-xs text-slate-400">Нет данных за период</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(incomeByCategory).map(([label, amount]) => {
                    const pct = totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700 font-medium truncate max-w-[200px]">{label}</span>
                          <span className="font-bold text-slate-900 shrink-0 ml-2">{fmt(amount, activeCurrency)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full">
                          <div
                            className="h-2 bg-red-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Expense breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-slate-500" />
                Структура расходов
              </h2>
              <p className="text-xs text-slate-400 mb-4">По категориям</p>

              {expenseByCategory.length === 0 ? (
                <p className="text-xs text-slate-400">Нет данных за период</p>
              ) : (
                <div className="space-y-3">
                  {expenseByCategory.map(([key, { label, amount }]) => {
                    const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1 items-center">
                          <span className="text-slate-700 font-medium">
                            {label}
                          </span>
                          <span className="font-bold text-slate-900">{fmt(amount, activeCurrency)} · {pct}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full">
                          <div
                            className="h-2 rounded-full bg-slate-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

          {/* Account balances summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-500" />
              Остатки по счетам
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left pb-2 font-semibold text-slate-500">Счёт</th>
                    <th className="text-center pb-2 font-semibold text-slate-500">Валюта</th>
                    <th className="text-right pb-2 font-semibold text-slate-500">Остаток</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 font-medium text-slate-800">{acc.name}</td>
                      <td className="py-2.5 text-center text-slate-500">{acc.currency}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        {fmt(getAccountBalance(acc.id), acc.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full transaction log */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Журнал операций · {activeCurrency} ({reportJournal.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left pb-2 font-semibold text-slate-500">Дата</th>
                    <th className="text-left pb-2 font-semibold text-slate-500">Описание</th>
                    <th className="text-center pb-2 font-semibold text-slate-500">Статус</th>
                    <th className="text-right pb-2 font-semibold text-slate-500">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {reportJournal.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        За выбранный период операций нет
                      </td>
                    </tr>
                  ) : reportJournal.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 text-slate-400 whitespace-nowrap">{tx.date}</td>
                      <td className="py-2 text-slate-700 max-w-[260px]">
                        <div className="font-medium truncate">{tx.description}</div>
                        <div className="text-slate-400 text-[10px]">{tx.createdBy}</div>
                      </td>
                      <td className="py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                          tx.status === 'confirmed'        ? 'bg-emerald-50 text-emerald-700' :
                          tx.status === 'pending_approval' ? 'bg-amber-50 text-amber-700'    :
                                                             'bg-red-50 text-red-600'
                        }`}>
                          {tx.status === 'confirmed' ? 'Подтверждено' :
                           tx.status === 'pending_approval' ? 'На согласовании' : 'Отклонено'}
                        </span>
                      </td>
                      <td className="py-2 text-right font-bold whitespace-nowrap text-slate-800">
                        {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount, tx.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2 — ОТЧЁТ ПО РЕЙСУ
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'trip' && (
        <div className="space-y-5">

          {/* Trip selector */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
            <label className="text-xs font-semibold text-slate-500 block mb-2">Выберите рейс:</label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tripNumber} · {t.routeName} · {t.departureDate} {t.departureTime}
                </option>
              ))}
            </select>
          </div>

          {selectedTrip && (
            <>
              {/* Trip header */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-red-700">
                        {selectedTrip.tripNumber}
                      </span>
                      <span className={`text-xs font-semibold ${
                        tripStatusLabel === 'В пути' ? 'text-emerald-700' :
                        tripStatusLabel === 'Идёт посадка' ? 'text-amber-700' :
                        'text-slate-500'
                      }`}>
                        {tripStatusLabel}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedTrip.routeName}</h2>
                    <p className="text-slate-500 text-sm mt-0.5">
                      {selectedTrip.departureDate} · отправление {selectedTrip.departureTime}
                    </p>
                    {tripVehicle && (
                      <p className="text-slate-500 text-xs mt-1">
                        {tripVehicle.brandModel} · {tripVehicle.plateNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Выручка рейса</p>
                    <p className="text-2xl font-bold text-slate-900">{fmt(tripIncome, selectedTrip.currency)}</p>
                    <p className={`text-sm font-bold mt-1 ${tripProfit < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                      {tripProfit >= 0 ? '▲ Прибыль' : '▼ Убыток'}: {fmt(Math.abs(tripProfit), selectedTrip.currency)}
                    </p>
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
                  {[
                    { label: 'Пассажиров', value: tripBookings.length },
                    { label: 'Посадилось', value: boardedCount },
                    { label: 'Оплачено', value: paidCount },
                    { label: 'Загрузка', value: `${occupancy}%` },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-lg font-bold text-slate-900 tabular-nums">{stat.value}</p>
                      <p className="text-[11px] text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* P&L of the trip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  icon={TrendingUp}
                  label="Доходы по рейсу"
                  value={fmt(tripIncome, selectedTrip.currency)}
                  sub={`${paidCount} оплаченных билетов`}
                  trend="up"
                />
                <StatCard
                  icon={TrendingDown}
                  label="Расходы по рейсу"
                  value={fmt(tripExpenses, selectedTrip.currency)}
                  sub={tripPendingExpenses > 0 ? `+ ${fmt(tripPendingExpenses, selectedTrip.currency)} ожидают` : 'Все подтверждены'}
                  trend="down"
                />
                <StatCard
                  icon={Wallet}
                  label="Финансовый результат рейса"
                  value={fmt(tripProfit, selectedTrip.currency)}
                  sub={tripIncome > 0 ? `Маржа ${Math.round((tripProfit / tripIncome) * 100)}%` : '—'}
                  trend={tripProfit >= 0 ? 'up' : 'down'}
                />
              </div>

              {/* Checkpoint progress */}
              {selectedTrip.checkpoints.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                  <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-slate-500" />
                    Контрольные точки маршрута
                  </h2>
                  <div className="divide-y divide-slate-100">
                    {selectedTrip.checkpoints.map((cp, idx) => (
                      <div
                        key={cp.stopId}
                        className="flex items-center gap-3 py-2.5 text-xs"
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${
                          cp.isPassed ? 'bg-emerald-600' : 'bg-slate-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{idx + 1}. {cp.stopName}</p>
                          <p className="text-slate-400">По расписанию: {cp.scheduledTime}</p>
                        </div>
                        <div className="shrink-0">
                          {cp.isPassed ? (
                            <span className="font-semibold text-emerald-700">Пройдено</span>
                          ) : (
                            <span className="text-slate-500">Ожидается</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Passenger manifest */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    Посадочный лист / Список пассажиров
                  </h2>
                  <button
                    onClick={printPage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 print:hidden"
                  >
                    <Printer className="w-3 h-3" />
                    Печать ведомости
                  </button>
                </div>

                {tripPassengers.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">Пассажиров на рейс не найдено</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left pb-2 font-semibold text-slate-500">№ мест.</th>
                          <th className="text-left pb-2 font-semibold text-slate-500">Пассажир</th>
                          <th className="text-left pb-2 font-semibold text-slate-500 hidden sm:table-cell">Маршрут</th>
                          <th className="text-center pb-2 font-semibold text-slate-500">Посадка</th>
                          <th className="text-center pb-2 font-semibold text-slate-500">Оплата</th>
                          <th className="text-right pb-2 font-semibold text-slate-500">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tripPassengers.map(({ booking, passenger }) => (
                          <tr key={booking.id} className="border-b border-slate-50 last:border-0">
                            <td className="py-2.5">
                              <span className="w-7 h-7 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center justify-center">
                                {booking.seatNumber}
                              </span>
                            </td>
                            <td className="py-2.5">
                              <p className="font-semibold text-slate-800">
                                {passenger?.fullName || '—'}
                              </p>
                              <p className="text-slate-400 text-[10px]">{passenger?.phone}</p>
                            </td>
                            <td className="py-2.5 hidden sm:table-cell text-slate-500">
                              {booking.fromStop} → {booking.toStop}
                            </td>
                            <td className="py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                booking.boardingStatus === 'boarded'  ? 'bg-emerald-50 text-emerald-700' :
                                booking.boardingStatus === 'no_show'  ? 'bg-red-50 text-red-600'         :
                                'bg-amber-50 text-amber-700'
                              }`}>
                                {booking.boardingStatus === 'boarded'  ? '✓ Сел'    :
                                 booking.boardingStatus === 'no_show'  ? '✗ Неявка' : '◔ Ждёт'}
                              </span>
                            </td>
                            <td className="py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                booking.status === 'paid'      ? 'bg-emerald-50 text-emerald-700' :
                                booking.status === 'confirmed' ? 'bg-slate-100 text-slate-700'    :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {booking.status === 'paid'      ? 'Оплачен'    :
                                 booking.status === 'confirmed' ? 'Подтверждён' : 'Новый'}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-bold text-slate-900">
                              {fmt(booking.price, booking.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t-2 border-slate-200">
                        <tr>
                          <td colSpan={4} className="pt-3 text-xs text-slate-500 font-semibold">
                            Итого за рейс:
                          </td>
                          <td colSpan={2} className="pt-3 text-right text-sm font-bold text-slate-900">
                            {fmt(tripIncome, selectedTrip.currency)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Trip expenses detail */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  Расходы по рейсу
                </h2>
                {tripExpenseTransactions.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Расходов по рейсу не найдено</p>
                ) : (
                  <div className="space-y-2">
                    {tripExpenseTransactions.map((tx) => (
                        <div key={tx.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                          tx.status === 'confirmed'        ? 'bg-slate-50 border-slate-200'  :
                          tx.status === 'pending_approval' ? 'bg-amber-50 border-amber-200'  :
                          'bg-red-50 border-red-200'
                        }`}>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{tx.description}</p>
                            <p className="text-slate-400 text-[10px]">{tx.createdBy} · {tx.date}</p>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="font-bold text-slate-900">{fmt(tx.amount, tx.currency)}</p>
                            <span className={`text-[10px] font-bold ${
                              tx.status === 'confirmed' ? 'text-emerald-600' :
                              tx.status === 'pending_approval' ? 'text-amber-600' : 'text-red-500'
                            }`}>
                              {tx.status === 'confirmed' ? '✓ Подтверждено' :
                               tx.status === 'pending_approval' ? '⏳ На согласовании' : '✗ Отклонено'}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3 — ОТЧЁТ ПО ПАРКУ
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'fleet' && (
        <div className="space-y-5">

          {/* Fleet KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Bus} label="Всего ТС в парке" value={`${totalVehicles} ед.`} />
            <StatCard icon={Navigation} label="В рейсе сейчас" value={`${inTripVehicles} ед.`} />
            <StatCard icon={Wrench} label="На ремонте / ТО" value={`${repairVehicles} ед.`} />
            <StatCard icon={AlertTriangle} label="Открытых дефектов" value={`${openIncidents.length} шт.`} trend={openIncidents.length > 0 ? 'down' : 'neutral'} />
          </div>

          {/* Vehicles table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Bus className="w-4 h-4 text-slate-500" />
              Состояние автопарка
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left pb-2 font-semibold text-slate-500">Машина</th>
                    <th className="text-center pb-2 font-semibold text-slate-500">Статус</th>
                    <th className="text-center pb-2 font-semibold text-slate-500 hidden sm:table-cell">Пробег</th>
                    <th className="text-center pb-2 font-semibold text-slate-500 hidden md:table-cell">До ТО</th>
                    <th className="text-center pb-2 font-semibold text-slate-500">Дефекты</th>
                    <th className="text-center pb-2 font-semibold text-slate-500 hidden sm:table-cell">Доков</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => {
                    const openDef = (v.incidents || []).filter((i) => i.status !== 'resolved').length;
                    const kmToService = v.nextServiceKm - v.mileageKm;
                    const vehicleStatus = getReportVehicleStatus(v, vehiclesInActiveTrips);
                    return (
                      <tr key={v.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2.5">
                          <p className="font-semibold text-slate-800">{v.brandModel}</p>
                          <p className="text-slate-400 text-[10px]">{v.plateNumber} · {v.seatsCount} мест</p>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                            vehicleStatus === 'in_trip' ? 'bg-slate-100 text-slate-700' :
                            vehicleStatus === 'ready' ? 'bg-emerald-50 text-emerald-700' :
                            vehicleStatus === 'repair' ? 'bg-amber-50 text-amber-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {vehicleStatus === 'in_trip' ? 'В рейсе' :
                             vehicleStatus === 'ready' ? 'Готов' :
                             vehicleStatus === 'repair' ? 'Ремонт' :
                             'Осмотр'}
                          </span>
                        </td>
                        <td className="py-2.5 text-center hidden sm:table-cell text-slate-600">
                          {v.mileageKm.toLocaleString('ru-RU')} км
                        </td>
                        <td className="py-2.5 text-center hidden md:table-cell">
                          <span className={`font-semibold ${kmToService < 5000 ? 'text-amber-700' : 'text-slate-600'}`}>
                            {kmToService.toLocaleString('ru-RU')} км
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          {openDef > 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                              <AlertTriangle className="w-3 h-3" /> {openDef}
                            </span>
                          ) : (
                            <span className="text-emerald-700">✓</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center hidden sm:table-cell text-slate-600">
                          {(v.documents || []).length}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Open defects */}
          {openIncidents.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Открытые дефекты и неисправности
              </h2>
              <div className="space-y-2">
                {openIncidents.map((inc) => {
                  const vehicle = vehicles.find((v) => v.id === inc.vehicleId);
                  return (
                    <div key={inc.id} className="flex items-start gap-3 border-t border-slate-100 py-3 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800">{inc.description}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">
                          {vehicle?.plateNumber} · {vehicle?.brandModel} · {inc.reportedAt}
                        </p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.status === 'open'        ? 'bg-amber-100 text-amber-800'    :
                        inc.status === 'in_progress' ? 'bg-amber-100 text-amber-700': ''
                      }`}>
                        {inc.status === 'open' ? 'Открыт' : 'В работе'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Service records */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-500" />
              История ТО и ремонтов
            </h2>
            {vehicles.flatMap((v) => (v.serviceRecords || []).map((sr) => ({ ...sr, vehicle: v }))).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Записей об обслуживании нет</p>
            ) : (
              <div className="space-y-2">
                {vehicles
                  .flatMap((v) => (v.serviceRecords || []).map((sr) => ({ ...sr, vehicle: v })))
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((sr) => (
                    <div key={sr.id} className="flex items-center gap-3 border-t border-slate-100 py-3 text-xs">
                    <Wrench className="w-4 h-4 shrink-0 text-slate-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{sr.description}</p>
                        <p className="text-slate-400 text-[10px]">
                          {sr.vehicle.plateNumber} · {sr.workshopName} · {sr.date}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900">{fmt(sr.cost)}</p>
                        <p className="text-[10px] text-slate-400">{sr.mileageKm.toLocaleString('ru-RU')} км</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>

    <section id="printable-report" className="hidden text-slate-900 print:block">
      <header className="mb-5 border-b-2 border-slate-900 pb-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">{company.name}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">Внутренний управленческий отчёт</p>
          </div>
          <div className="text-right text-[10px] leading-relaxed">
            <p>Сформирован: {reportNow?.toLocaleString('ru-RU') || '—'}</p>
            <p>Подготовил: {currentUser.name}, {currentUser.roleLabel}</p>
          </div>
        </div>
        <h1 className="mt-5 text-2xl font-bold">
          {activeTab === 'finance'
            ? 'Финансовый отчёт'
            : activeTab === 'trip'
              ? 'Отчёт по рейсу'
              : 'Отчёт по автопарку'}
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          {activeTab === 'finance'
            ? `${periodLabels[period]} · Валюта: ${activeCurrency}`
            : activeTab === 'trip' && selectedTrip
              ? `${selectedTrip.tripNumber} · ${selectedTrip.routeName} · ${selectedTrip.departureDate}`
              : `Состояние автопарка на ${reportNow?.toLocaleDateString('ru-RU') || '—'}`}
        </p>
      </header>

      {activeTab === 'finance' && (
        <div className="space-y-5">
          <table className="print-table">
            <thead>
              <tr><th>Показатель</th><th>Сумма</th><th>Примечание</th></tr>
            </thead>
            <tbody>
              <tr><td>Подтверждённые доходы</td><td>{fmt(totalIncome, activeCurrency)}</td><td>{confirmedTx.filter((transaction) => transaction.type === 'income' && !transaction.isOpeningBalance).length} операций</td></tr>
              <tr><td>Подтверждённые расходы</td><td>{fmt(totalExpense, activeCurrency)}</td><td>{confirmedTx.filter((transaction) => transaction.type === 'expense' && !transaction.isOpeningBalance).length} операций</td></tr>
              <tr><td><strong>Финансовый результат</strong></td><td><strong>{fmt(profit, activeCurrency)}</strong></td><td>Маржа: {margin}%</td></tr>
              <tr><td>Ожидают подтверждения</td><td>{fmt(pendingTx.reduce((sum, transaction) => sum + transaction.amount, 0), activeCurrency)}</td><td>{pendingTx.length} заявок</td></tr>
            </tbody>
          </table>

          <div>
            <h2 className="mb-2 text-sm font-bold">Остатки по счетам</h2>
            <table className="print-table">
              <thead><tr><th>Счёт</th><th>Валюта</th><th>Остаток</th></tr></thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.name}</td>
                    <td>{account.currency}</td>
                    <td className="text-right">{fmt(getAccountBalance(account.id), account.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-bold">Журнал операций · {activeCurrency}</h2>
            {reportJournal.length === 0 ? (
              <p className="text-xs text-slate-500">За выбранный период операций нет.</p>
            ) : (
              <table className="print-table">
                <thead><tr><th>Дата</th><th>Операция</th><th>Описание</th><th>Статус</th><th>Сумма</th></tr></thead>
                <tbody>
                  {reportJournal.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.date}</td>
                      <td>{transaction.type === 'income' ? 'Доход' : 'Расход'} · {transaction.categoryLabel}</td>
                      <td>{transaction.description}<br /><span className="text-slate-500">{transaction.createdBy}</span></td>
                      <td>{transaction.status === 'confirmed' ? 'Проведено' : transaction.status === 'pending_approval' ? 'На согласовании' : 'Отклонено'}</td>
                      <td className="text-right">{transaction.type === 'income' ? '+' : '−'} {fmt(transaction.amount, transaction.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'trip' && selectedTrip && (
        <div className="space-y-5">
          <table className="print-table">
            <tbody>
              <tr><th>Маршрут</th><td>{selectedTrip.routeName}</td><th>Статус</th><td>{tripStatusLabel}</td></tr>
              <tr><th>Отправление</th><td>{selectedTrip.departureDate}, {selectedTrip.departureTime}</td><th>Рейс</th><td>{selectedTrip.tripNumber}</td></tr>
              <tr><th>Транспорт</th><td>{tripVehicle ? `${tripVehicle.brandModel} · ${tripVehicle.plateNumber}` : 'Не назначен'}</td><th>Водитель</th><td>{tripDriver?.name || 'Не назначен'}</td></tr>
              <tr><th>Пассажиры</th><td>{tripBookings.length} из {totalSeats} мест · загрузка {occupancy}%</td><th>Посадились</th><td>{boardedCount}</td></tr>
            </tbody>
          </table>

          <table className="print-table">
            <thead><tr><th>Показатель</th><th>Сумма</th><th>Примечание</th></tr></thead>
            <tbody>
              <tr><td>Выручка по оплаченным билетам</td><td>{fmt(tripIncome, selectedTrip.currency)}</td><td>{paidCount} билетов</td></tr>
              <tr><td>Подтверждённые расходы</td><td>{fmt(tripExpenses, selectedTrip.currency)}</td><td>Без ожидающих подтверждения</td></tr>
              <tr><td>Ожидают подтверждения</td><td>{fmt(tripPendingExpenses, selectedTrip.currency)}</td><td>{tripExpenseTransactions.filter((transaction) => transaction.status === 'pending_approval').length} заявок</td></tr>
              <tr><td><strong>Финансовый результат</strong></td><td><strong>{fmt(tripProfit, selectedTrip.currency)}</strong></td><td>Доходы минус подтверждённые расходы</td></tr>
            </tbody>
          </table>

          <div>
            <h2 className="mb-2 text-sm font-bold">Список пассажиров</h2>
            <table className="print-table">
              <thead><tr><th>Место</th><th>Пассажир</th><th>Телефон</th><th>Маршрут</th><th>Посадка</th><th>Оплата</th><th>Стоимость</th></tr></thead>
              <tbody>
                {tripPassengers.map(({ booking, passenger }) => (
                  <tr key={booking.id}>
                    <td>{booking.seatNumber}</td>
                    <td>{passenger?.fullName || '—'}</td>
                    <td>{passenger?.phone || '—'}</td>
                    <td>{booking.fromStop} → {booking.toStop}</td>
                    <td>{booking.boardingStatus === 'boarded' ? 'Сел' : booking.boardingStatus === 'no_show' ? 'Неявка' : 'Ожидает'}</td>
                    <td>{booking.status === 'paid' ? 'Оплачен' : booking.status === 'confirmed' ? 'Подтверждён' : 'Новый'}</td>
                    <td>{fmt(booking.price, booking.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedTrip.checkpoints.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-bold">Контрольные точки</h2>
              <table className="print-table">
                <thead><tr><th>№</th><th>Точка</th><th>По расписанию</th><th>Статус</th><th>Время прохождения</th></tr></thead>
                <tbody>
                  {selectedTrip.checkpoints.map((checkpoint, index) => (
                    <tr key={checkpoint.stopId}>
                      <td>{index + 1}</td>
                      <td>{checkpoint.stopName}</td>
                      <td>{checkpoint.scheduledTime}</td>
                      <td>{checkpoint.isPassed ? 'Пройдена' : 'Ожидается'}</td>
                      <td>{checkpoint.passedTime || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <h2 className="mb-2 text-sm font-bold">Расходы по рейсу</h2>
            {tripExpenseTransactions.length === 0 ? (
              <p className="text-xs text-slate-500">Расходов по рейсу нет.</p>
            ) : (
              <table className="print-table">
                <thead><tr><th>Дата</th><th>Описание</th><th>Создал</th><th>Статус</th><th>Сумма</th></tr></thead>
                <tbody>
                  {tripExpenseTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.date}</td>
                      <td>{transaction.description}</td>
                      <td>{transaction.createdBy}</td>
                      <td>{transaction.status === 'confirmed' ? 'Проведено' : transaction.status === 'pending_approval' ? 'На согласовании' : 'Отклонено'}</td>
                      <td>{fmt(transaction.amount, transaction.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'fleet' && (
        <div className="space-y-5">
          <table className="print-table">
            <thead><tr><th>Показатель парка</th><th>Количество</th></tr></thead>
            <tbody>
              <tr><td>Всего транспортных средств</td><td>{totalVehicles}</td></tr>
              <tr><td>В рейсе</td><td>{inTripVehicles}</td></tr>
              <tr><td>На ремонте или осмотре</td><td>{repairVehicles}</td></tr>
              <tr><td>Открытые дефекты</td><td>{openIncidents.length}</td></tr>
            </tbody>
          </table>

          <div>
            <h2 className="mb-2 text-sm font-bold">Транспортные средства</h2>
            <table className="print-table">
              <thead><tr><th>Модель / номер</th><th>Статус</th><th>Пробег</th><th>До ТО</th><th>Дефекты</th><th>Документы</th></tr></thead>
              <tbody>
                {vehicles.map((vehicle) => {
                  const status = getReportVehicleStatus(vehicle, vehiclesInActiveTrips);
                  return (
                    <tr key={vehicle.id}>
                      <td>{vehicle.brandModel} · {vehicle.plateNumber}</td>
                      <td>{status === 'in_trip' ? 'В рейсе' : status === 'ready' ? 'Готов' : status === 'repair' ? 'Ремонт' : 'Осмотр'}</td>
                      <td>{vehicle.mileageKm.toLocaleString('ru-RU')} км</td>
                      <td>{(vehicle.nextServiceKm - vehicle.mileageKm).toLocaleString('ru-RU')} км</td>
                      <td>{(vehicle.incidents || []).filter((incident) => incident.status !== 'resolved').length}</td>
                      <td>{(vehicle.documents || []).length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {openIncidents.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-bold">Открытые дефекты</h2>
              <table className="print-table">
                <thead><tr><th>ТС</th><th>Описание</th><th>Статус</th><th>Создан</th><th>Сообщил</th></tr></thead>
                <tbody>
                  {openIncidents.map((incident) => {
                    const vehicle = vehicles.find((item) => item.id === incident.vehicleId);
                    return (
                      <tr key={incident.id}>
                        <td>{vehicle?.plateNumber || '—'}</td>
                        <td>{incident.description}</td>
                        <td>{incident.status === 'open' ? 'Открыт' : 'В работе'}</td>
                        <td>{incident.reportedAt}</td>
                        <td>{incident.reportedBy}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <h2 className="mb-2 text-sm font-bold">История ТО и ремонтов</h2>
            <table className="print-table">
              <thead><tr><th>Дата</th><th>ТС</th><th>Работы</th><th>Пробег</th><th>Стоимость</th><th>Исполнитель</th></tr></thead>
              <tbody>
                {vehicles.flatMap((vehicle) => (vehicle.serviceRecords || []).map((record) => ({ vehicle, record }))).map(({ vehicle, record }) => (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td>{vehicle.plateNumber} · {vehicle.brandModel}</td>
                    <td>{record.description}</td>
                    <td>{record.mileageKm.toLocaleString('ru-RU')} км</td>
                    <td>{fmt(record.cost)}</td>
                    <td>{record.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer className="mt-8 border-t border-slate-300 pt-3 text-[10px] text-slate-600">
        <p>Сформировано автоматически из системы «{company.name}». Внутренний отчёт, не заменяет первичные бухгалтерские документы.</p>
        <div className="mt-8 grid grid-cols-2 gap-10">
          <div><div className="mb-1 border-b border-slate-500" /><p>Подготовил: {currentUser.name} / подпись</p></div>
          <div><div className="mb-1 border-b border-slate-500" /><p>Проверил / подпись</p></div>
        </div>
      </footer>
    </section>
    </>
  );
}
