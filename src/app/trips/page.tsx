'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Navigation,
  Bus,
  Users,
  UserCheck,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  ShieldAlert,
  CreditCard,
  User,
  MapPin,
  Check,
  Sparkles,
  Printer,
  DollarSign,
  AlertTriangle,
  UserX,
  X,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Booking, Trip, BoardingStatus } from '@/types';

export default function TripsPage() {
  const {
    trips,
    vehicles,
    users,
    bookings,
    passengers,
    accounts,
    assignVehicleAndDriver,
    createBookingWithPayment,
    toggleCheckpoint,
    markBookingPaid,
    collectCashByDriver,
    setPassengerBoarding,
    currentUser,
    addIncident,
    getAccountBalance,
  } = useApp();

  const isDriver = currentUser.role === 'driver';

  const [selectedTripId, setSelectedTripId] = useState<string | null>(
    isDriver ? trips[0]?.id ?? null : null
  );
  const activeTrip = trips.find((t) => t.id === selectedTripId) || (isDriver ? trips[0] : undefined);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerDoc, setPassengerDoc] = useState('');
  const [fromStop, setFromStop] = useState('Москва (Северные Ворота)');
  const [toStop, setToStop] = useState('Минск (Центральный)');
  const [payNow, setPayNow] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'acc_cash_rub');
  const [lastCreatedBooking, setLastCreatedBooking] = useState<{
    bookingId: string;
    passengerId: string;
    seatNumber: number;
    name: string;
  } | null>(null);

  // Edit Vehicle/Driver assignment
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignedVehicleId, setAssignedVehicleId] = useState(activeTrip?.vehicleId || vehicles[0]?.id);
  const [assignedDriverId, setAssignedDriverId] = useState(activeTrip?.driverId || users.find(u => u.role === 'driver')?.id);

  useEffect(() => {
    const requestedTripId = new URLSearchParams(window.location.search).get('tripId');
    const requestedTrip = trips.find((trip) => trip.id === requestedTripId);
    if (!requestedTrip) return;

    setSelectedTripId(requestedTrip.id);
    setAssignedVehicleId(requestedTrip.vehicleId || vehicles[0]?.id);
    setAssignedDriverId(requestedTrip.driverId || users.find((user) => user.role === 'driver')?.id);
  }, [trips, vehicles, users]);

  // Print Manifest Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Driver Incident Modal
  const [driverIncidentOpen, setDriverIncidentOpen] = useState(false);
  const [incidentText, setIncidentText] = useState('');

  const selectTrip = (trip: Trip) => {
    setSelectedTripId(trip.id);
    setAssignedVehicleId(trip.vehicleId || vehicles[0]?.id);
    setAssignedDriverId(trip.driverId || users.find((u) => u.role === 'driver')?.id);
  };

  if (!activeTrip) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
            <Navigation className="w-4 h-4" />
            <span>Управление рейсами</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Список рейсов</h1>
          <p className="text-sm text-slate-500 mt-1">Выберите рейс, чтобы открыть рассадку, пассажиров и путевую информацию.</p>
        </div>

        {trips.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {trips.map((trip) => {
              const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
              const driver = users.find((u) => u.id === trip.driverId);
              const tripBookings = bookings.filter((booking) => booking.tripId === trip.id);
              const passedCheckpoints = trip.checkpoints.filter((checkpoint) => checkpoint.isPassed).length;
              const statusLabel =
                trip.status === 'in_progress' ? 'В пути' :
                trip.status === 'boarding' ? 'Идёт посадка' :
                trip.status === 'completed' ? 'Завершён' :
                trip.status === 'cancelled' ? 'Отменён' : 'Запланирован';

              return (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => selectTrip(trip)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-red-600">{trip.tripNumber}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{statusLabel}</span>
                      </div>
                      <h2 className="mt-2 text-lg font-bold text-slate-900">{trip.routeName}</h2>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <Clock className="h-4 w-4 shrink-0" />
                        {trip.departureDate} · {trip.departureTime}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 self-start rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 sm:shrink-0">
                      Открыть рейс <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 text-xs sm:grid-cols-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Bus className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{vehicle?.brandModel || 'Транспорт не назначен'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <UserCheck className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{driver?.name || 'Водитель не назначен'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>{tripBookings.length} пассажиров · точки {passedCheckpoints}/{trip.checkpoints.length}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold text-slate-800">Рейсов пока нет</p>
            <p className="mt-1 text-sm text-slate-500">Добавленные рейсы появятся здесь.</p>
          </div>
        )}
      </div>
    );
  }

  const activeTripBookings = bookings.filter((b) => b.tripId === activeTrip.id);
  const totalSeats = 19; // Standard Sprinter

  const assignedVehicle = vehicles.find((v) => v.id === activeTrip.vehicleId);
  const assignedDriver = users.find((u) => u.id === activeTrip.driverId);

  const handleSeatClick = (seatNumber: number) => {
    if (isDriver) return; // Driver doesn't configure seats, driver boards passengers
    const existing = activeTripBookings.find((b) => b.seatNumber === seatNumber);
    if (existing) return;

    setSelectedSeat(seatNumber);
    if (!passengerName) {
      setPassengerName('Артем Губарев');
      setPassengerPhone('+7 (999) 700-80-90');
      setPassengerDoc('4519 123456');
    }
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat || !passengerName.trim() || !passengerPhone.trim()) return;

    const result = createBookingWithPayment({
      tripId: activeTrip.id,
      fullName: passengerName,
      phone: passengerPhone,
      documentNumber: passengerDoc,
      seatNumber: selectedSeat,
      fromStop,
      toStop,
      price: activeTrip.basePrice,
      currency: activeTrip.currency,
      payNow,
      accountId: payNow ? selectedAccountId : undefined,
    });

    setLastCreatedBooking({
      bookingId: result.bookingId,
      passengerId: result.passengerId,
      seatNumber: selectedSeat,
      name: passengerName,
    });

    setBookingModalOpen(false);
  };

  const handleSaveAssignment = () => {
    if (activeTrip && assignedVehicleId && assignedDriverId) {
      assignVehicleAndDriver(activeTrip.id, assignedVehicleId, assignedDriverId);
      setAssignModalOpen(false);
    }
  };

  const handleReportIncidentFromDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentText.trim() || !assignedVehicle) return;
    addIncident(assignedVehicle.id, incidentText.trim(), `${currentUser.name} (Водитель в рейсе)`);
    setIncidentText('');
    setDriverIncidentOpen(false);
    alert('Неисправность зафиксирована в системе и передана механику!');
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>
              {isDriver
                ? 'Рабочее место водителя: посадочный лист и фиксация точек'
                : 'Главный сценарий показа: Рейс → Рассадка → Оплата → Клиенты'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isDriver ? `Рейс ${activeTrip.tripNumber}: ${activeTrip.routeName}` : 'Маршруты, рейсы и рассадка'}
          </h1>
          <p className="text-sm text-slate-500">
            {isDriver
              ? `Транспорт: ${assignedVehicle?.brandModel} (${assignedVehicle?.plateNumber}) • Выезд: ${activeTrip.departureTime}, ${activeTrip.departureDate}`
              : 'Назначайте транспорт и водителей, управляйте интерактивной схемой мест и печатайте путевые ведомости.'}
          </p>
        </div>

        {/* Action buttons (Print manifest, Switch trip) */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isDriver && (
            <button
              onClick={() => setPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Печать ведомости</span>
            </button>
          )}

          {isDriver && assignedVehicle && (
            <button
              onClick={() => setDriverIncidentOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Сообщить о поломке</span>
            </button>
          )}

          {!isDriver && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              {trips.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTrip(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedTripId === t.id
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{t.tripNumber}</span>
                </button>
              ))}
            </div>
          )}
          {!isDriver && (
            <button
              type="button"
              onClick={() => setSelectedTripId(null)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Все рейсы
            </button>
          )}
        </div>
      </div>

      {/* SUCCESS BANNER AFTER BOOKING */}
      {lastCreatedBooking && !isDriver && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Билет успешно оформлен! Пассажир: {lastCreatedBooking.name} (Место №{lastCreatedBooking.seatNumber})
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Оплата автоматически проведена в раздел «Финансы». Информация пассажира сохранена в базе клиентов.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/finances"
              className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              Проверить в Финансах
            </Link>
            <Link
              href="/customers"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>В карточку клиента</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ROUTE CHECKPOINTS */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">Точки маршрута</h2>
          <p className="text-xs text-slate-500">
            {isDriver ? 'Нажмите на точку, чтобы отметить прохождение' : 'Отметки водителя'}
          </p>
        </div>

        {activeTrip.checkpoints.length > 0 ? (
          <div className="overflow-x-auto pb-2">
            <div className="relative grid gap-2 pt-1 md:min-w-[640px] md:grid-flow-col md:auto-cols-fr">
              <div aria-hidden="true" className="absolute bottom-3 left-[7px] top-3 w-0.5 bg-slate-200 md:hidden" />
              <div
                aria-hidden="true"
                className="absolute left-0 right-0 top-[11px] hidden h-0.5 bg-slate-200 md:block"
                style={{
                  left: `${50 / activeTrip.checkpoints.length}%`,
                  right: `${50 / activeTrip.checkpoints.length}%`,
                }}
              />
              {activeTrip.checkpoints.map((checkpoint) => (
                <button
                  key={checkpoint.stopId}
                  type="button"
                  aria-label={`${checkpoint.stopName}: ${checkpoint.isPassed ? 'пройдена' : 'не пройдена'}`}
                  aria-pressed={checkpoint.isPassed}
                  title={`${checkpoint.stopName} · ${checkpoint.isPassed ? `пройдена${checkpoint.passedTime ? ` в ${checkpoint.passedTime}` : ''}` : `запланирована на ${checkpoint.scheduledTime}`}`}
                  onClick={() => toggleCheckpoint(activeTrip.id, checkpoint.stopId)}
                  className="group relative z-10 flex min-w-0 items-start gap-3 py-1 text-left md:flex-col md:items-center md:gap-2 md:px-2 md:text-center"
                >
                  <span
                    className={`relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors md:mt-0 ${
                      checkpoint.isPassed
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-400 bg-white group-hover:border-red-500'
                    }`}
                  >
                    {checkpoint.isPassed && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="min-w-0 flex-1 md:max-w-[150px] md:flex-none">
                    <span className="block text-xs font-semibold leading-snug text-slate-700 group-hover:text-red-700">
                      {checkpoint.stopName}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">
                      {checkpoint.isPassed
                        ? `Пройдена${checkpoint.passedTime ? ` · ${checkpoint.passedTime}` : ''}`
                        : `По расписанию · ${checkpoint.scheduledTime}`}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Для этого рейса точки маршрута не заданы.</p>
        )}
      </section>

      {/* MAIN TWO-COLUMN DISPLAY: SEAT MAP & PASSENGER BOARDING LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* BUS SEAT LAYOUT (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900">Схема салона микроавтобуса</h3>
              <p className="text-xs text-slate-500">
                {isDriver
                  ? 'Кресла пассажиров на вашем рейсе'
                  : 'Нажмите на свободное место для оформления билета'}
              </p>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-lg bg-slate-100 px-2 py-1 text-xs font-mono font-semibold text-slate-500">19 мест</span>
          </div>

          {/* BUS VEHICLE BODY CONTAINER */}
          <div className="relative mx-auto w-full max-w-[340px] rounded-3xl border-2 border-slate-300 bg-slate-100 p-3 shadow-inner sm:p-5">
            <div className="w-full h-8 bg-slate-800 rounded-t-2xl mb-4 flex items-center justify-center text-[10px] text-slate-300 font-mono tracking-widest uppercase">
              Лобовое стекло
            </div>

            <div className="flex items-center justify-between px-2 mb-6 text-xs pb-3 border-b border-slate-300">
              <div className="flex h-10 min-w-14 items-center justify-center rounded-xl bg-slate-700 px-1 text-center text-[9px] font-bold leading-tight text-white">
                Водитель
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Входная дверь ↗
              </div>
            </div>

            {/* SEAT GRID */}
            <div className="space-y-3">
              {[
                { left: [1], right: [2, 3] },
                { left: [4], right: [5, 6] },
                { left: [7], right: [8, 9] },
                { left: [10], right: [11, 12] },
                { left: [13], right: [14, 15] },
              ].map((row, rowIdx) => (
                <div key={rowIdx} className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {row.left.map((seatNum) => {
                      const booking = activeTripBookings.find((b) => b.seatNumber === seatNum);
                      const isBooked = !!booking;
                      const isPaid = booking?.status === 'paid';
                      const isBoarded = booking?.boardingStatus === 'boarded';
                      return (
                        <button
                          key={seatNum}
                          onClick={() => handleSeatClick(seatNum)}
                          disabled={isBooked || isDriver}
                          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all shadow-sm ${
                            isBooked
                              ? isBoarded
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                                : isPaid
                                ? 'bg-red-600 text-white'
                                : 'bg-amber-500 text-white'
                              : isDriver
                              ? 'bg-slate-200 text-slate-400 cursor-default'
                              : 'bg-white hover:bg-emerald-50 text-slate-800 border-2 border-slate-300 hover:border-emerald-500 cursor-pointer'
                          }`}
                        >
                          <span>{seatNum}</span>
                          <span className="text-[8px] font-normal opacity-90">
                            {isBooked ? (isBoarded ? 'В салоне' : isPaid ? 'Оплач.' : 'Бронь') : 'Свободно'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono tracking-tighter">
                    | проход |
                  </div>

                  <div className="flex gap-1.5">
                    {row.right.map((seatNum) => {
                      const booking = activeTripBookings.find((b) => b.seatNumber === seatNum);
                      const isBooked = !!booking;
                      const isPaid = booking?.status === 'paid';
                      const isBoarded = booking?.boardingStatus === 'boarded';
                      return (
                        <button
                          key={seatNum}
                          onClick={() => handleSeatClick(seatNum)}
                          disabled={isBooked || isDriver}
                          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all shadow-sm ${
                            isBooked
                              ? isBoarded
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                                : isPaid
                                ? 'bg-red-600 text-white'
                                : 'bg-amber-500 text-white'
                              : isDriver
                              ? 'bg-slate-200 text-slate-400 cursor-default'
                              : 'bg-white hover:bg-emerald-50 text-slate-800 border-2 border-slate-300 hover:border-emerald-500 cursor-pointer'
                          }`}
                        >
                          <span>{seatNum}</span>
                          <span className="text-[8px] font-normal opacity-90">
                            {isBooked ? (isBoarded ? 'В салоне' : isPaid ? 'Оплач.' : 'Бронь') : 'Свободно'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Back Row */}
              <div className="pt-2 border-t border-slate-300 flex items-center justify-between gap-1.5">
                {[16, 17, 18, 19].map((seatNum) => {
                  const booking = activeTripBookings.find((b) => b.seatNumber === seatNum);
                  const isBooked = !!booking;
                  const isPaid = booking?.status === 'paid';
                  const isBoarded = booking?.boardingStatus === 'boarded';
                  return (
                    <button
                      key={seatNum}
                      onClick={() => handleSeatClick(seatNum)}
                      disabled={isBooked || isDriver}
                      className={`flex-1 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all shadow-sm ${
                        isBooked
                          ? isBoarded
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                            : isPaid
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                          : isDriver
                          ? 'bg-slate-200 text-slate-400 cursor-default'
                          : 'bg-white hover:bg-emerald-50 text-slate-800 border-2 border-slate-300 hover:border-emerald-500 cursor-pointer'
                      }`}
                    >
                      <span>{seatNum}</span>
                      <span className="text-[8px] font-normal opacity-90">
                        {isBooked ? (isBoarded ? 'В салоне' : 'Занято') : 'Свободно'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full h-3 bg-slate-300 rounded-b-2xl mt-4" />
          </div>

          {/* Seat Legend */}
          <div className="flex items-center justify-center gap-3 text-xs mt-4 pt-3 border-t border-slate-100 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-white border-2 border-slate-300"></div>
              <span className="text-slate-600">Свободно</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-amber-500"></div>
              <span className="text-slate-600">Ожидает оплаты</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-red-600"></div>
              <span className="text-slate-600">Оплачено</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-emerald-600"></div>
              <span className="text-slate-600">В салоне</span>
            </div>
          </div>
        </div>

        {/* PASSENGER BOARDING & CASH COLLECTION LIST (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900">
                  {isDriver ? 'Посадочный лист водителя' : 'Пассажиры на рейсе'} ({activeTripBookings.length})
                </h3>
                <p className="text-xs text-slate-500">
                  {isDriver
                    ? 'Отмечайте посадку в салон и принимайте наличную оплату'
                    : 'Синхронизировано с кассой и карточками клиентов'}
                </p>
              </div>

              {!isDriver && (
                <button
                  onClick={() => handleSeatClick(4)}
                    className="flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-red-500/20 sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Оформить билет (Место 4)</span>
                </button>
              )}
            </div>

            {/* Bookings List Cards */}
            <div className="mt-3 divide-y divide-slate-100 space-y-2">
              {activeTripBookings.map((b) => {
                const passenger = passengers.find((p) => p.id === b.passengerId);
                const isPaid = b.status === 'paid';
                const isBoarded = b.boardingStatus === 'boarded';

                return (
                  <div
                    key={b.id}
                    className={`pt-2.5 p-3 rounded-xl border transition-all ${
                      isBoarded
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : !isPaid
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          №{b.seatNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">
                              {passenger?.fullName || 'Пассажир'}
                            </h4>
                            {isPaid ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                Оплачено ({b.paymentMethod || 'Онлайн'})
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                К оплате: {b.price.toLocaleString('ru-RU')} ₽
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                            <span>Тел: {passenger?.phone}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-700">
                              {b.fromStop} → {b.toStop}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Driver Actions: Boarding & Cash collection */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {!isPaid && (
                          <button
                            onClick={() => collectCashByDriver(b.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                            title="Взять наличные у пассажира и выдать чек"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Принять {b.price} ₽</span>
                          </button>
                        )}

                        <button
                          onClick={() => setPassengerBoarding(b.id, isBoarded ? 'waiting' : 'boarded')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            isBoarded
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isBoarded ? 'В салоне' : 'Отметить посадку'}</span>
                        </button>

                        {!isDriver && isPaid && (
                          <Link
                            href="/customers"
                            className="text-red-600 hover:text-red-700 font-semibold text-xs px-2"
                          >
                            Клиенты →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Посажено в салон:{' '}
              <b className="text-emerald-700">
                {activeTripBookings.filter((b) => b.boardingStatus === 'boarded').length} из {activeTripBookings.length}
              </b>
            </span>
            <span className="font-semibold text-slate-800">
              Собрано выручки с рейса:{' '}
              {activeTripBookings
                .reduce((sum, b) => sum + (b.status === 'paid' ? b.price : 0), 0)
                .toLocaleString('ru-RU')}{' '}
              ₽
            </span>
          </div>
        </div>
      </div>

      {/* PRINTABLE PASSENGER MANIFEST MODAL */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-y-contain bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 text-xs shadow-2xl sm:p-6">
            {/* Header of manifest */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">
                  ООО «Бумеранг Транс Лайн»
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  МАРШРУТНЫЙ ЛИСТ И ВЕДОМОСТЬ ПОСАДКИ ПАССАЖИРОВ
                </h3>
                <p className="text-slate-600">
                  Рейс: <b>{activeTrip.tripNumber}</b> ({activeTrip.routeName}) • Выезд:{' '}
                  <b>{activeTrip.departureDate}, {activeTrip.departureTime}</b>
                </p>
              </div>
              <button
                onClick={() => setPrintModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Vehicle & Driver Summary */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl mb-4 border border-slate-200">
              <div>
                <span className="text-slate-500 block">Автобус:</span>
                <span className="font-bold text-slate-900">
                  {assignedVehicle?.brandModel} (Госномер: {assignedVehicle?.plateNumber})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Водитель:</span>
                <span className="font-bold text-slate-900">
                  {assignedDriver?.name} ({assignedDriver?.phone})
                </span>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 w-12 text-center">Место</th>
                  <th className="p-2 border-r border-slate-300">ФИО пассажира</th>
                  <th className="p-2 border-r border-slate-300">Телефон</th>
                  <th className="p-2 border-r border-slate-300">Посадка → Высадка</th>
                  <th className="p-2 border-r border-slate-300">К оплате</th>
                  <th className="p-2 text-center">Отметка посадки</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeTripBookings.map((b) => {
                  const pass = passengers.find((p) => p.id === b.passengerId);
                  const isPaid = b.status === 'paid';
                  return (
                    <tr key={b.id}>
                      <td className="p-2 border-r border-slate-300 font-bold text-center">
                        {b.seatNumber}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-semibold">
                        {pass?.fullName}
                      </td>
                      <td className="p-2 border-r border-slate-300">{pass?.phone}</td>
                      <td className="p-2 border-r border-slate-300 text-[11px]">
                        {b.fromStop} → {b.toStop}
                      </td>
                      <td className="p-2 border-r border-slate-300 font-bold">
                        {isPaid ? 'ОПЛАЧЕНО' : `${b.price} ₽ (наличные)`}
                      </td>
                      <td className="p-2 text-center font-bold">
                        {b.boardingStatus === 'boarded' ? '✓ В салоне' : '[     ]'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-slate-500">
                Подпись диспетчера: _______________ &nbsp;&nbsp;&nbsp;&nbsp; Подпись водителя: _______________
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
                >
                  Распечатать на принтере
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRIVER REPORT INCIDENT MODAL */}
      {driverIncidentOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-y-contain bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 text-xs shadow-2xl sm:p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Сообщить о неисправности в рейсе
            </h3>
            <p className="text-slate-500 mb-4">
              Машина: {assignedVehicle?.plateNumber} ({assignedVehicle?.brandModel})
            </p>

            <form onSubmit={handleReportIncidentFromDriver} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Что произошло в дороге?
                </label>
                <textarea
                  required
                  rows={3}
                  value={incidentText}
                  onChange={(e) => setIncidentText(e.target.value)}
                  placeholder="Например: Треснула задняя правая фара при погрузке багажа в Смоленске"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDriverIncidentOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Отправить механику
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCHER BOOKING MODAL */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-y-contain bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  {selectedSeat}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Бронирование места №{selectedSeat}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Рейс {activeTrip.tripNumber}: {activeTrip.routeName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ФИО пассажира <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Например: Артем Губарев"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Телефон <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    placeholder="+7 999 123-45-67"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Серия / Номер паспорта
                  </label>
                  <input
                    type="text"
                    value={passengerDoc}
                    onChange={(e) => setPassengerDoc(e.target.value)}
                    placeholder="4519 123456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="payNowCheck"
                      checked={payNow}
                      onChange={(e) => setPayNow(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300"
                    />
                    <label htmlFor="payNowCheck" className="font-bold text-slate-900 cursor-pointer">
                      Оплатить сейчас (провести в Финансах)
                    </label>
                  </div>
                  <span className="text-sm font-bold text-red-700">{activeTrip.basePrice} ₽</span>
                </div>

                {payNow && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Зачислить на счёт:
                    </label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full bg-white border border-red-200 rounded-lg p-2 text-slate-900"
                    >
                      {accounts
                        .filter((acc) => acc.currency === activeTrip.currency)
                        .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.currency}) — баланс: {getAccountBalance(acc.id).toLocaleString('ru-RU')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Подтвердить и выдать билет
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
