'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Edit,
  Archive,
  Trash2,
  ArrowRightLeft,
  History,
  Route as RouteIcon,
  ChevronRight,
  Search,
  Truck,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Booking, Trip, BoardingStatus, Route, RouteStop } from '@/types';

export default function TripsAndRoutesPage() {
  const {
    trips,
    routes,
    vehicles,
    trailers,
    users,
    bookings,
    passengers,
    accounts,
    activities,
    assignVehicleAndDriver,
    createBookingWithPayment,
    toggleCheckpoint,
    markBookingPaid,
    cancelBooking,
    transferBookingToTrip,
    requests,
    collectCashByDriver,
    setPassengerBoarding,
    currentUser,
    addIncident,
    getAccountBalance,
    createTrip,
    updateTrip,
    archiveTrip,
    createRoute,
    updateRoute,
    archiveRoute,
  } = useApp();

  const isDriver = currentUser.role === 'driver';

  // Active top tab: 'trips' vs 'routes'
  const [activeTab, setActiveTab] = useState<'trips' | 'routes'>('trips');

  // Selected trip detail view
  const [selectedTripId, setSelectedTripId] = useState<string | null>(
    isDriver ? trips[0]?.id ?? null : null
  );
  const activeTrip = trips.find((t) => t.id === selectedTripId && !t.isArchived) || (isDriver ? trips[0] : undefined);

  // Trips filtering
  const [tripStatusFilter, setTripStatusFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  const [tripSearchQuery, setTripSearchQuery] = useState('');

  // Routes filtering
  const [routeSearchQuery, setRouteSearchQuery] = useState('');

  // Activity Log modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Trip Modal (Create / Edit)
  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [formTripRouteId, setFormTripRouteId] = useState(routes[0]?.id || '');
  const [formTripNumber, setFormTripNumber] = useState('');
  const [formTripDate, setFormTripDate] = useState('Сегодня');
  const [formTripTime, setFormTripTime] = useState('19:30');
  const [formTripVehicleId, setFormTripVehicleId] = useState(vehicles[0]?.id || '');
  const [formTripTrailerId, setFormTripTrailerId] = useState('');
  const [formTripDriverId, setFormTripDriverId] = useState(users.find((u) => u.role === 'driver')?.id || '');
  const [formTripPrice, setFormTripPrice] = useState(3800);
  const [formTripCurrency, setFormTripCurrency] = useState<'RUB' | 'KZT' | 'BYN'>('RUB');
  const [formTripStatus, setFormTripStatus] = useState<any>('scheduled');

  // Route Modal (Create / Edit)
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [formRouteName, setFormRouteName] = useState('');
  const [formRouteFrom, setFormRouteFrom] = useState('');
  const [formRouteTo, setFormRouteTo] = useState('');
  const [formRouteDistance, setFormRouteDistance] = useState(500);
  const [formRouteDuration, setFormRouteDuration] = useState(7);
  const [formRouteStopsText, setFormRouteStopsText] = useState('');

  // Booking Modal State (inside trip)
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerDoc, setPassengerDoc] = useState('');
  const [fromStop, setFromStop] = useState('Москва (Северные Ворота)');
  const [toStop, setToStop] = useState('Минск (Центральный)');
  const [payNow, setPayNow] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'acc_cash');
  const [lastCreatedBooking, setLastCreatedBooking] = useState<{
    bookingId: string;
    passengerId: string;
    seatNumber: number;
    name: string;
  } | null>(null);

  // Edit Vehicle/Driver assignment in Trip
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignedVehicleId, setAssignedVehicleId] = useState(activeTrip?.vehicleId || vehicles[0]?.id);
  const [assignedDriverId, setAssignedDriverId] = useState(activeTrip?.driverId || users.find(u => u.role === 'driver')?.id);

  // Print Manifest Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Driver Incident Modal
  const [driverIncidentOpen, setDriverIncidentOpen] = useState(false);
  const [incidentText, setIncidentText] = useState('');

  useEffect(() => {
    const requestedTripId = new URLSearchParams(window.location.search).get('tripId');
    const requestedTrip = trips.find((trip) => trip.id === requestedTripId && !trip.isArchived);
    if (!requestedTrip) return;

    setSelectedTripId(requestedTrip.id);
    setAssignedVehicleId(requestedTrip.vehicleId || vehicles[0]?.id);
    setAssignedDriverId(requestedTrip.driverId || users.find((user) => user.role === 'driver')?.id);
  }, [trips, vehicles, users]);

  const selectTrip = (trip: Trip) => {
    setSelectedTripId(trip.id);
    setAssignedVehicleId(trip.vehicleId || vehicles[0]?.id);
    setAssignedDriverId(trip.driverId || users.find((u) => u.role === 'driver')?.id);
  };

  // Active (non-archived) trips and routes
  const activeTrips = trips.filter((t) => !t.isArchived);
  const activeRoutes = routes.filter((r) => !r.isArchived);

  // Filtered trips
  const filteredTrips = activeTrips.filter((t) => {
    if (tripStatusFilter !== 'all' && t.status !== tripStatusFilter) return false;
    if (tripSearchQuery.trim()) {
      const q = tripSearchQuery.toLowerCase();
      const matchNumber = t.tripNumber.toLowerCase().includes(q);
      const matchRoute = t.routeName.toLowerCase().includes(q);
      const veh = vehicles.find((v) => v.id === t.vehicleId);
      const matchVeh = veh ? (veh.brandModel + ' ' + veh.plateNumber).toLowerCase().includes(q) : false;
      return matchNumber || matchRoute || matchVeh;
    }
    return true;
  });

  // Filtered routes
  const filteredRoutes = activeRoutes.filter((r) => {
    if (routeSearchQuery.trim()) {
      const q = routeSearchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.departureCity.toLowerCase().includes(q) || r.arrivalCity.toLowerCase().includes(q);
    }
    return true;
  });

  // TRIP MODAL ACTIONS
  const openCreateTrip = () => {
    setEditingTripId(null);
    setFormTripRouteId(activeRoutes[0]?.id || '');
    setFormTripNumber(`БУМ-${activeTrips.length + 105}`);
    setFormTripDate('Сегодня');
    setFormTripTime('20:00');
    setFormTripVehicleId(vehicles[0]?.id || '');
    setFormTripTrailerId('');
    setFormTripDriverId(users.find((u) => u.role === 'driver')?.id || '');
    setFormTripPrice(3800);
    setFormTripCurrency('RUB');
    setFormTripStatus('scheduled');
    setTripModalOpen(true);
  };

  const openEditTrip = (trip: Trip, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTripId(trip.id);
    setFormTripRouteId(trip.routeId);
    setFormTripNumber(trip.tripNumber);
    setFormTripDate(trip.departureDate);
    setFormTripTime(trip.departureTime);
    setFormTripVehicleId(trip.vehicleId || '');
    setFormTripTrailerId(trip.trailerId || '');
    setFormTripDriverId(trip.driverId || '');
    setFormTripPrice(trip.basePrice);
    setFormTripCurrency(trip.currency);
    setFormTripStatus(trip.status);
    setTripModalOpen(true);
  };

  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selRoute = routes.find((r) => r.id === formTripRouteId);

    if (editingTripId) {
      updateTrip(editingTripId, {
        routeId: formTripRouteId,
        routeName: selRoute?.name,
        tripNumber: formTripNumber.trim(),
        departureDate: formTripDate,
        departureTime: formTripTime,
        vehicleId: formTripVehicleId || undefined,
        trailerId: formTripTrailerId || undefined,
        driverId: formTripDriverId || undefined,
        basePrice: Number(formTripPrice),
        currency: formTripCurrency,
        status: formTripStatus,
      });
    } else {
      createTrip({
        routeId: formTripRouteId,
        routeName: selRoute?.name || 'Новый маршрут',
        tripNumber: formTripNumber.trim() || `БУМ-${activeTrips.length + 106}`,
        departureDate: formTripDate,
        departureTime: formTripTime,
        vehicleId: formTripVehicleId || undefined,
        trailerId: formTripTrailerId || undefined,
        driverId: formTripDriverId || undefined,
        basePrice: Number(formTripPrice),
        currency: formTripCurrency,
        status: formTripStatus,
      });
    }
    setTripModalOpen(false);
  };

  const handleArchiveTrip = (trip: Trip, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Удалить рейс ${trip.tripNumber} (${trip.routeName})?`)) {
      archiveTrip(trip.id);
      if (selectedTripId === trip.id) {
        setSelectedTripId(null);
      }
    }
  };

  // ROUTE MODAL ACTIONS
  const openCreateRoute = () => {
    setEditingRouteId(null);
    setFormRouteName('Москва — Смоленск — Минск');
    setFormRouteFrom('Москва');
    setFormRouteTo('Минск');
    setFormRouteDistance(715);
    setFormRouteDuration(9.5);
    setFormRouteStopsText('Москва (Северные Ворота)\nВязьма (АЗС Роснефть)\nСмоленск (Автовокзал)\nОрша (Ж/Д Вокзал)\nМинск (Центральный)');
    setRouteModalOpen(true);
  };

  const openEditRoute = (route: Route, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRouteId(route.id);
    setFormRouteName(route.name);
    setFormRouteFrom(route.departureCity);
    setFormRouteTo(route.arrivalCity);
    setFormRouteDistance(route.totalDistanceKm);
    setFormRouteDuration(route.estimatedDurationHours);
    setFormRouteStopsText(route.stops.map((s) => s.name).join('\n'));
    setRouteModalOpen(true);
  };

  const handleRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRouteName.trim()) return;

    const parsedStops: RouteStop[] = formRouteStopsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name, idx) => ({
        id: `stop_${Date.now()}_${idx}`,
        name,
        stopOrder: idx + 1,
        arrivalTimeOffsetMin: idx * 90,
        priceFromStart: idx * 900,
      }));

    if (editingRouteId) {
      updateRoute(editingRouteId, {
        name: formRouteName.trim(),
        departureCity: formRouteFrom.trim(),
        arrivalCity: formRouteTo.trim(),
        totalDistanceKm: Number(formRouteDistance),
        estimatedDurationHours: Number(formRouteDuration),
        stops: parsedStops.length ? parsedStops : undefined,
      });
    } else {
      createRoute({
        name: formRouteName.trim(),
        departureCity: formRouteFrom.trim(),
        arrivalCity: formRouteTo.trim(),
        totalDistanceKm: Number(formRouteDistance),
        estimatedDurationHours: Number(formRouteDuration),
        stops: parsedStops,
      });
    }
    setRouteModalOpen(false);
  };

  const handleArchiveRoute = (route: Route, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Удалить маршрут «${route.name}»?`)) {
      archiveRoute(route.id);
    }
  };

  // ACTIVE TRIP DETAILED VIEW DATA
  const assignedVehicle = activeTrip ? vehicles.find((v) => v.id === activeTrip.vehicleId) : undefined;
  const assignedTrailer = activeTrip ? trailers.find((t) => t.id === activeTrip.trailerId) : undefined;
  const assignedDriver = activeTrip ? users.find((u) => u.id === activeTrip.driverId) : undefined;
  const totalCapacity = assignedVehicle?.seatsCount || 19;

  // Seamless merge of bookings and assigned requests for this trip
  const activeTripBookings = useMemo(() => {
    if (!activeTrip) return [];
    const direct = bookings.filter((b) => b.tripId === activeTrip.id);
    const bookedPassengerIds = new Set(direct.map((b) => b.passengerId));

    const extra: Booking[] = [];
    const assignedReqs = (requests || []).filter(
      (r) => r.status === 'assigned' && r.assignedTripId === activeTrip.id
    );

    assignedReqs.forEach((r) => {
      const existingP = passengers.find(
        (p) => p.phone === r.phone || p.fullName === r.passengerName
      );
      if (existingP && bookedPassengerIds.has(existingP.id)) return;

      const occupied = new Set([...direct, ...extra].map((b) => b.seatNumber));
      let seat = r.assignedSeatNumber;
      if (!seat || occupied.has(seat)) {
        for (let s = 1; s <= totalCapacity; s++) {
          if (!occupied.has(s)) {
            seat = s;
            break;
          }
        }
      }
      if (!seat) seat = direct.length + extra.length + 1;

      extra.push({
        id: `synth_book_${r.id}`,
        tripId: activeTrip.id,
        passengerId: existingP?.id || `synth_pass_${r.id}`,
        seatNumber: seat,
        fromStop: r.fromCity,
        toStop: r.toCity,
        price: r.priceEstimate || activeTrip.basePrice || 3800,
        currency: r.currency || activeTrip.currency || 'RUB',
        status: 'confirmed',
        paymentMethod: 'cash_driver',
        boardingStatus: 'waiting',
        createdAt: r.createdAt || 'Только что',
      });
    });

    return [...direct, ...extra];
  }, [activeTrip, bookings, requests, passengers, totalCapacity]);

  // Transfer Passenger Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedBookingForTransfer, setSelectedBookingForTransfer] = useState<{
    bookingId: string;
    passengerName: string;
    currentTripNumber: string;
  } | null>(null);
  const [transferTargetTripId, setTransferTargetTripId] = useState('');

  const openAddPassenger = () => {
    if (!activeTrip) return;
    const occupied = new Set(activeTripBookings.map((b) => b.seatNumber));
    let freeSeat = 1;
    for (let i = 1; i <= totalCapacity; i++) {
      if (!occupied.has(i)) {
        freeSeat = i;
        break;
      }
    }
    setSelectedSeat(freeSeat);
    setPassengerName('');
    setPassengerPhone('');
    setPassengerDoc('');
    setFromStop(activeTrip.checkpoints?.[0]?.stopName || 'Москва (Северные Ворота)');
    setToStop(activeTrip.checkpoints?.[activeTrip.checkpoints.length - 1]?.stopName || 'Минск (Центральный)');
    setBookingModalOpen(true);
  };

  const handleSeatClick = (seatNumber: number) => {
    if (isDriver || !activeTrip) return;
    const existing = activeTripBookings.find((b) => b.seatNumber === seatNumber);
    if (existing) return;

    setSelectedSeat(seatNumber);
    setPassengerName('');
    setPassengerPhone('');
    setPassengerDoc('');
    setFromStop(activeTrip.checkpoints?.[0]?.stopName || 'Москва (Северные Ворота)');
    setToStop(activeTrip.checkpoints?.[activeTrip.checkpoints.length - 1]?.stopName || 'Минск (Центральный)');
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip || !selectedSeat || !passengerName.trim() || !passengerPhone.trim()) return;

    const res = createBookingWithPayment({
      tripId: activeTrip.id,
      fullName: passengerName.trim(),
      phone: passengerPhone.trim(),
      documentNumber: passengerDoc.trim() || undefined,
      seatNumber: selectedSeat,
      fromStop: fromStop || activeTrip.checkpoints?.[0]?.stopName || 'Отправление',
      toStop: toStop || activeTrip.checkpoints?.[activeTrip.checkpoints.length - 1]?.stopName || 'Прибытие',
      price: activeTrip.basePrice,
      currency: activeTrip.currency,
      payNow,
      accountId: selectedAccountId,
    });

    setLastCreatedBooking({
      bookingId: res.bookingId,
      passengerId: res.passengerId,
      seatNumber: selectedSeat,
      name: passengerName.trim(),
    });

    setPassengerName('');
    setPassengerPhone('');
    setPassengerDoc('');
    setBookingModalOpen(false);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip || !assignedVehicleId || !assignedDriverId) return;
    assignVehicleAndDriver(activeTrip.id, assignedVehicleId, assignedDriverId);
    setAssignModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {activeTrip ? (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
        {/* Back Link */}
        <div>
          <button
            onClick={() => setSelectedTripId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Назад ко всем рейсам</span>
          </button>
        </div>

        {/* TRIP SUMMARY CARD (with Edit and Archive directly inside) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                  {activeTrip.tripNumber}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                    activeTrip.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : activeTrip.status === 'scheduled'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : activeTrip.status === 'in_progress'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : activeTrip.status === 'boarding'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {activeTrip.status === 'completed'
                    ? 'Завершён'
                    : activeTrip.status === 'scheduled'
                    ? 'Запланирован'
                    : activeTrip.status === 'in_progress'
                    ? 'В пути'
                    : activeTrip.status === 'boarding'
                    ? 'Идёт посадка'
                    : 'Запланирован'}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {activeTrip.departureDate} · {activeTrip.departureTime}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 truncate">
                {activeTrip.routeName}
              </h1>
            </div>

            {/* Actions directly inside the card */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => openEditTrip(activeTrip)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors shadow-xs"
              >
                <Edit className="w-3.5 h-3.5 text-slate-600" />
                <span>Редактировать рейс</span>
              </button>

              <button
                onClick={() => handleArchiveTrip(activeTrip)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors shadow-xs"
                title="Удалить рейс"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Удалить</span>
              </button>

              <button
                onClick={() => setPrintModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Печать</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3.5 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 block text-[10px]">Машина:</span>
              <span className="font-bold text-slate-900">
                {assignedVehicle ? `${assignedVehicle.brandModel} (${assignedVehicle.plateNumber})` : 'Не назначена'}
              </span>
            </div>
            {assignedTrailer && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[10px]">Прицеп:</span>
                <span className="font-bold text-slate-900">{assignedTrailer.model} ({assignedTrailer.plateNumber})</span>
              </div>
            )}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 block text-[10px]">Экипаж:</span>
              <span className="font-bold text-slate-900">{assignedDriver?.name || 'Водитель не назначен'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 block text-[10px]">Тариф:</span>
              <span className="font-bold text-slate-900">{activeTrip.basePrice} {activeTrip.currency === 'RUB' ? '₽' : activeTrip.currency}</span>
            </div>
          </div>
        </div>

        {/* CHECKPOINTS SECTION (Cascading logic) */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">Точки маршрута</h2>
            <p className="text-xs text-slate-500">
              {isDriver ? 'Нажмите на точку, чтобы отметить прохождение' : 'Отметки водителя (каскадное прохождение)'}
            </p>
          </div>

          {activeTrip.checkpoints.length > 0 ? (
            <div className="overflow-x-auto pb-2">
              <div className="relative grid gap-2 pt-1 md:min-w-[640px] md:grid-flow-col md:auto-cols-fr">
                {/* Gray baseline track (Mobile) */}
                <div aria-hidden="true" className="absolute bottom-3 left-[7px] top-3 w-0.5 bg-slate-200 md:hidden" />
                {/* Gray baseline track (Desktop) */}
                <div
                  aria-hidden="true"
                  className="absolute left-0 right-0 top-[11px] hidden h-0.5 bg-slate-200 md:block"
                  style={{
                    left: `${50 / activeTrip.checkpoints.length}%`,
                    right: `${50 / activeTrip.checkpoints.length}%`,
                  }}
                />

                {/* Dynamic emerald active track (Desktop) */}
                {(() => {
                  const lastPassedIdx = activeTrip.checkpoints.reduce((max, cp, i) => (cp.isPassed ? i : max), -1);
                  if (lastPassedIdx <= 0 || activeTrip.checkpoints.length <= 1) return null;
                  const totalSpan = 100 - (100 / activeTrip.checkpoints.length);
                  const filledRatio = lastPassedIdx / (activeTrip.checkpoints.length - 1);
                  return (
                    <div
                      aria-hidden="true"
                      className="absolute top-[11px] hidden h-0.5 bg-emerald-500 transition-all duration-300 md:block"
                      style={{
                        left: `${50 / activeTrip.checkpoints.length}%`,
                        width: `${totalSpan * filledRatio}%`,
                      }}
                    />
                  );
                })()}

                {/* Dynamic emerald active track (Mobile) */}
                {(() => {
                  const lastPassedIdx = activeTrip.checkpoints.reduce((max, cp, i) => (cp.isPassed ? i : max), -1);
                  if (lastPassedIdx <= 0 || activeTrip.checkpoints.length <= 1) return null;
                  const filledRatio = lastPassedIdx / (activeTrip.checkpoints.length - 1);
                  return (
                    <div
                      aria-hidden="true"
                      className="absolute left-[7px] top-3 w-0.5 bg-emerald-500 transition-all duration-300 md:hidden"
                      style={{
                        height: `calc(${filledRatio * 100}% - 12px)`,
                      }}
                    />
                  );
                })()}

                {activeTrip.checkpoints.map((checkpoint) => (
                  <button
                    key={checkpoint.stopId}
                    type="button"
                    aria-label={`${checkpoint.stopName}: ${checkpoint.isPassed ? 'пройдена' : 'не пройдена'}`}
                    aria-pressed={checkpoint.isPassed}
                    title={`${checkpoint.stopName} · ${checkpoint.isPassed ? `пройдена${checkpoint.passedTime ? ` в ${checkpoint.passedTime}` : ''} (нажмите, чтобы сбросить)` : `запланирована на ${checkpoint.scheduledTime} (нажмите, чтобы отметить прохождение)`}`}
                    onClick={() => toggleCheckpoint(activeTrip.id, checkpoint.stopId)}
                    className="group relative z-10 flex min-w-0 items-start gap-3 py-1 text-left md:flex-col md:items-center md:gap-2 md:px-2 md:text-center"
                  >
                    <span
                      className={`relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 md:mt-0 ${
                        checkpoint.isPassed
                          ? 'border-emerald-500 bg-emerald-500 shadow-xs shadow-emerald-500/20'
                          : 'border-slate-300 bg-white group-hover:border-emerald-400 group-hover:bg-emerald-50/40'
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

        {/* TWO-COLUMN LAYOUT: SEAT MAP & PASSENGER MANIFEST */}
        {(() => {
          const resolvePassenger = (b: Booking | undefined) => {
            if (!b) return null;
            const reqMatch = (requests || []).find(
              (r) =>
                `synth_book_${r.id}` === b.id ||
                `book_req_${r.id}` === b.id ||
                (r.status === 'assigned' && r.assignedTripId === activeTrip.id && r.assignedSeatNumber === b.seatNumber)
            );
            return (
              passengers.find((p) => p.id === b.passengerId) || {
                id: b.passengerId,
                fullName: reqMatch?.passengerName || 'Пассажир',
                phone: reqMatch?.phone || '',
                totalTrips: 1,
              }
            );
          };

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* SEAT MAP (5 COLS) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Схема рассадки</h2>
                  <span className="text-xs text-slate-500">
                    Занято {activeTripBookings.length} из {totalCapacity} мест
                  </span>
                </div>

                {/* BUS VEHICLE BODY CONTAINER */}
                <div className="relative mx-auto w-full max-w-[340px] rounded-3xl border-2 border-slate-300 bg-slate-100 p-3 shadow-inner sm:p-5">
                  <div className="w-full h-8 bg-slate-800 rounded-t-2xl mb-4 flex items-center justify-center text-[10px] text-slate-300 font-mono tracking-widest uppercase">
                    Лобовое стекло
                  </div>

                  <div className="flex items-center justify-between px-2 mb-6 text-xs pb-3 border-b border-slate-300">
                    <div className="flex h-10 min-w-14 items-center justify-center rounded-xl bg-slate-700 px-2 text-center text-[10px] font-bold leading-tight text-white">
                      Водитель
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Входная дверь ↗
                    </div>
                  </div>

                  {/* SEAT ROWS */}
                  <div className="space-y-3">
                    {[
                      { left: [1], right: [2, 3] },
                      { left: [4], right: [5, 6] },
                      { left: [7], right: [8, 9] },
                      { left: [10], right: [11, 12] },
                      { left: [13], right: [14, 15] },
                    ].map((row, rowIdx) => (
                      <div key={rowIdx} className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {row.left.map((seatNum) => {
                            const booking = activeTripBookings.find((b) => b.seatNumber === seatNum);
                            const passenger = resolvePassenger(booking);
                            const isBooked = !!booking;
                            const isBoarded = booking?.boardingStatus === 'boarded';

                            return (
                              <button
                                key={seatNum}
                                type="button"
                                onClick={() => handleSeatClick(seatNum)}
                                disabled={isDriver}
                                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all shadow-sm ${
                                  isBooked
                                    ? isBoarded
                                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                      : 'bg-emerald-600 text-white'
                                    : isDriver
                                    ? 'bg-slate-200 text-slate-400 cursor-default'
                                    : 'bg-white hover:bg-emerald-50 text-slate-800 border-2 border-slate-300 hover:border-emerald-500 cursor-pointer'
                                }`}
                                title={
                                  booking
                                    ? `№${seatNum}: ${passenger?.fullName || 'Пассажир'} (${isBoarded ? 'На борту' : 'Занято'})`
                                    : `Место №${seatNum} свободно`
                                }
                              >
                                <span>№ {seatNum}</span>
                                <span className="text-[8px] font-normal opacity-90 truncate max-w-[42px]">
                                  {isBooked ? (passenger?.fullName?.split(' ')[0] || (isBoarded ? 'В салоне' : 'Занято')) : 'Свободно'}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="text-[10px] text-slate-400 font-mono tracking-tighter">
                          | проход |
                        </div>

                        <div className="flex gap-2">
                          {row.right.map((seatNum) => {
                            const booking = activeTripBookings.find((b) => b.seatNumber === seatNum);
                            const passenger = resolvePassenger(booking);
                            const isBooked = !!booking;
                            const isBoarded = booking?.boardingStatus === 'boarded';

                            return (
                              <button
                                key={seatNum}
                                type="button"
                                onClick={() => handleSeatClick(seatNum)}
                                disabled={isDriver}
                                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all shadow-sm ${
                                  isBooked
                                    ? isBoarded
                                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                      : 'bg-emerald-600 text-white'
                                    : isDriver
                                    ? 'bg-slate-200 text-slate-400 cursor-default'
                                    : 'bg-white hover:bg-emerald-50 text-slate-800 border-2 border-slate-300 hover:border-emerald-500 cursor-pointer'
                                }`}
                                title={
                                  booking
                                    ? `№${seatNum}: ${passenger?.fullName || 'Пассажир'} (${isBoarded ? 'На борту' : 'Занято'})`
                                    : `Место №${seatNum} свободно`
                                }
                              >
                                <span>№ {seatNum}</span>
                                <span className="text-[8px] font-normal opacity-90 truncate max-w-[42px]">
                                  {isBooked ? (passenger?.fullName?.split(' ')[0] || (isBoarded ? 'В салоне' : 'Занято')) : 'Свободно'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Back Row (4 seats across) */}
                    <div className="pt-2.5 border-t border-slate-300 flex items-center justify-between gap-1.5">
                      {[16, 17, 18, 19].map((seatNum) => {
                        const booking = activeTripBookings.find((b) => b.seatNumber === seatNum);
                        const passenger = resolvePassenger(booking);
                        const isBooked = !!booking;
                        const isBoarded = booking?.boardingStatus === 'boarded';

                        return (
                          <button
                            key={seatNum}
                            type="button"
                            onClick={() => handleSeatClick(seatNum)}
                            disabled={isDriver}
                            className={`flex-1 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all shadow-sm ${
                              isBooked
                                ? isBoarded
                                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                  : 'bg-emerald-600 text-white'
                                : isDriver
                                ? 'bg-slate-200 text-slate-400 cursor-default'
                                : 'bg-white hover:bg-emerald-50 text-slate-800 border-2 border-slate-300 hover:border-emerald-500 cursor-pointer'
                            }`}
                            title={
                              booking
                                ? `№${seatNum}: ${passenger?.fullName || 'Пассажир'} (${isBoarded ? 'На борту' : 'Занято'})`
                                : `Место №${seatNum} свободно`
                            }
                          >
                            <span>№ {seatNum}</span>
                            <span className="text-[8px] font-normal opacity-90 truncate max-w-[42px]">
                              {isBooked ? (passenger?.fullName?.split(' ')[0] || (isBoarded ? 'В салоне' : 'Занято')) : 'Свободно'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="w-full h-3 bg-slate-300 rounded-b-2xl mt-4" />
                </div>

                {/* Seat Legend */}
                <div className="flex items-center justify-center gap-4 text-xs pt-2 border-t border-slate-100 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-white border-2 border-slate-300"></div>
                    <span className="text-slate-600">Свободно</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-emerald-600"></div>
                    <span className="text-slate-600">Занято (билет)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-blue-600"></div>
                    <span className="text-slate-600">На борту</span>
                  </div>
                </div>
              </div>

              {/* PASSENGERS BOARDING MANIFEST (7 COLS) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Посадочная ведомость</h2>
                    <p className="text-xs text-slate-500">Пассажиры рейса {activeTrip.tripNumber}</p>
                  </div>

                  {!isDriver && (
                    <button
                      onClick={openAddPassenger}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Добавить пассажира</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100">
                  {activeTripBookings.map((b) => {
                    const p = resolvePassenger(b);
                    const isPaid = b.status === 'paid';
                    const isBoarded = b.boardingStatus === 'boarded';

                    return (
                      <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                            {p?.fullName?.charAt(0) || 'П'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 truncate">{p?.fullName || 'Пассажир'}</span>
                              <span className="font-mono text-slate-400 text-[11px]">{p?.phone}</span>
                              <span className="font-mono font-bold px-1.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                Место {b.seatNumber}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {b.fromStop} → {b.toStop}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isPaid ? 'Оплачено' : 'Оплата водителю'}
                          </span>

                          <button
                            onClick={() => setPassengerBoarding(b.id, isBoarded ? 'waiting' : 'boarded')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                              isBoarded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isBoarded ? '✓ На борту' : 'Посадить'}
                          </button>

                          {!isDriver && (
                            <button
                              onClick={() => {
                                setSelectedBookingForTransfer({
                                  bookingId: b.id,
                                  passengerName: p?.fullName || 'Пассажир',
                                  currentTripNumber: activeTrip.tripNumber,
                                });
                                const otherTrip = activeTrips.find((t) => t.id !== activeTrip.id);
                                setTransferTargetTripId(otherTrip?.id || '');
                                setTransferModalOpen(true);
                              }}
                              title="Перенести в другой рейс"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!isDriver && (
                            <button
                              onClick={() => {
                                if (confirm(`Удалить пассажира ${p?.fullName || 'Пассажир'} из рейса?`)) {
                                  cancelBooking(b.id);
                                }
                              }}
                              title="Удалить из рейса"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {activeTripBookings.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Пассажиров в этом рейсе пока нет. Нажмите «Добавить пассажира» или выберите место на схеме.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* PRINT MANIFEST MODAL */}
        {printModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Печать посадочного листа</h3>
                <button onClick={() => setPrintModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-slate-600 space-y-2 font-mono bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">ООО «БУМЕРАНГ ТРАНС ЛАЙН»</div>
                <div>РЕЙС: {activeTrip.tripNumber} ({activeTrip.routeName})</div>
                <div>ДАТА: {activeTrip.departureDate} {activeTrip.departureTime}</div>
                <div>МАШИНА: {assignedVehicle?.brandModel} ({assignedVehicle?.plateNumber})</div>
                <div>ВОДИТЕЛЬ: {assignedDriver?.name}</div>
                <div className="border-t pt-2 mt-2">
                  ПАССАЖИРОВ: {activeTripBookings.length} чел.
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setPrintModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Закрыть
                </button>
                <button
                  onClick={() => {
                    alert('Ведомость отправлена на печать');
                    setPrintModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
                >
                  Распечатать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className="space-y-6">
        {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
            <Navigation className="w-4 h-4" />
            <span>Управление перевозками</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Рейсы и маршруты</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === 'trips'
              ? 'Формирование расписания, назначение транспорта, посадка пассажиров и контроль контрольных точек.'
              : 'Каталог маршрутов, промежуточные остановки, километраж и тарифная сетка.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'trips' ? (
            <button
              onClick={openCreateTrip}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Создать рейс</span>
            </button>
          ) : (
            <button
              onClick={openCreateRoute}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Создать маршрут</span>
            </button>
          )}
        </div>
      </div>

      {/* TOP TABS: РЕЙСЫ vs МАРШРУТЫ */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all relative ${
            activeTab === 'trips'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Рейсы</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'trips'
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {activeTrips.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all relative ${
            activeTab === 'routes'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RouteIcon className="w-4 h-4" />
          <span>Маршруты</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'routes'
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {activeRoutes.length}
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 1: РЕЙСЫ                                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'trips' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Filters Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setTripStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tripStatusFilter === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Все ({activeTrips.length})
              </button>
              <button
                onClick={() => setTripStatusFilter('scheduled')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tripStatusFilter === 'scheduled'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Запланирован ({activeTrips.filter((t) => t.status === 'scheduled').length})
              </button>
              <button
                onClick={() => setTripStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tripStatusFilter === 'in_progress'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                В пути ({activeTrips.filter((t) => t.status === 'in_progress' || t.status === 'boarding').length})
              </button>
              <button
                onClick={() => setTripStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tripStatusFilter === 'completed'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Завершён ({activeTrips.filter((t) => t.status === 'completed').length})
              </button>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tripSearchQuery}
                onChange={(e) => setTripSearchQuery(e.target.value)}
                placeholder="Поиск по номеру, маршруту, машине..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Trips Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredTrips.map((trip) => {
              const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
              const trailer = trailers.find((t) => t.id === trip.trailerId);
              const driver = users.find((u) => u.id === trip.driverId);
              const tripBookings = bookings.filter((b) => b.tripId === trip.id);
              const passedCheckpoints = trip.checkpoints.filter((cp) => cp.isPassed).length;

              const statusLabel =
                trip.status === 'in_progress' ? 'В пути' :
                trip.status === 'boarding' ? 'Идёт посадка' :
                trip.status === 'completed' ? 'Завершён' :
                trip.status === 'cancelled' ? 'Отменён' : 'Запланирован';

              const statusBadge =
                trip.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : trip.status === 'scheduled'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : trip.status === 'in_progress'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : trip.status === 'boarding'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';

              return (
                <div
                  key={trip.id}
                  onClick={() => selectTrip(trip)}
                  className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-red-200 hover:shadow-md cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                            {trip.tripNumber}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${statusBadge}`}>
                            {statusLabel}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {trip.basePrice.toLocaleString('ru-RU')} {trip.currency}
                          </span>
                        </div>
                        <h2 className="mt-2 text-base sm:text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                          {trip.routeName}
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          {trip.departureDate} · <b>{trip.departureTime}</b>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 self-start sm:shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => openEditTrip(trip, e)}
                          title="Редактировать рейс"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleArchiveTrip(trip, e)}
                          title="Удалить рейс"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 ml-1">
                          Открыть <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-t border-slate-100 pt-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Bus className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{vehicle ? `${vehicle.brandModel} (${vehicle.plateNumber})` : 'Транспорт не назначен'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <UserCheck className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{driver?.name || 'Водитель не назначен'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{tripBookings.length} пасс. · точки {passedCheckpoints}/{trip.checkpoints.length}</span>
                      </div>
                    </div>
                  </div>

                  {trailer && (
                    <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 border-t border-slate-50 pt-2">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Прицеп в сцепке: <b>{trailer.model}</b> ({trailer.plateNumber})</span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredTrips.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                <Navigation className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-sm">Рейсы не найдены</p>
                <p className="mt-1 text-xs text-slate-400">Создайте новый рейс или измените параметры фильтрации.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 2: МАРШРУТЫ                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'routes' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Routes Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-700">
              Всего активных маршрутов: <b>{activeRoutes.length}</b>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={routeSearchQuery}
                onChange={(e) => setRouteSearchQuery(e.target.value)}
                placeholder="Поиск маршрута, города..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Routes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                        {route.departureCity} → {route.arrivalCity}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">{route.name}</h3>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>Расстояние: <b>{route.totalDistanceKm} км</b></span>
                        <span>•</span>
                        <span>Время в пути: <b>~{route.estimatedDurationHours} ч</b></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => openEditRoute(route, e)}
                        title="Редактировать маршрут"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleArchiveRoute(route, e)}
                        title="Удалить маршрут"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Route Stops preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Остановки и контрольные точки ({route.stops.length})
                    </span>
                    <div className="space-y-1.5">
                      {route.stops.map((stop, idx) => (
                        <div key={stop.id} className="flex items-center justify-between text-xs text-slate-700">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="truncate">{stop.name}</span>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px] shrink-0">
                            {stop.priceFromStart > 0 ? `от ${stop.priceFromStart} ₽` : 'Старт'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    На маршруте: <b>{activeTrips.filter((t) => t.routeId === route.id).length} рейсов</b>
                  </span>
                  <button
                    onClick={() => {
                      setFormTripRouteId(route.id);
                      openCreateTrip();
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    <span>Сформировать рейс</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {filteredRoutes.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                <RouteIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-sm">Маршруты не найдены</p>
                <p className="mt-1 text-xs text-slate-400">Нажмите «Создать маршрут», чтобы добавить новое направление.</p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE / EDIT TRIP                                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {tripModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <Navigation className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900">
                  {editingTripId ? 'Редактировать рейс' : 'Создать новый рейс'}
                </h3>
              </div>
              <button
                onClick={() => setTripModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTripSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Маршрут *</label>
                <select
                  value={formTripRouteId}
                  onChange={(e) => setFormTripRouteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {activeRoutes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.totalDistanceKm} км)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Номер рейса *</label>
                  <input
                    type="text"
                    required
                    value={formTripNumber}
                    onChange={(e) => setFormTripNumber(e.target.value)}
                    placeholder="БУМ-106"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Дата выезда *</label>
                  <input
                    type="text"
                    required
                    value={formTripDate}
                    onChange={(e) => setFormTripDate(e.target.value)}
                    placeholder="Сегодня / 24.11"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Время выезда *</label>
                  <input
                    type="text"
                    required
                    value={formTripTime}
                    onChange={(e) => setFormTripTime(e.target.value)}
                    placeholder="19:30"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Транспорт (Автобус)</label>
                  <select
                    value={formTripVehicleId}
                    onChange={(e) => setFormTripVehicleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Не назначен (резерв)</option>
                    {vehicles.filter(v => !v.isArchived).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brandModel} ({v.plateNumber}) · {v.seatsCount} мест
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Прицеп (багаж/груз)</label>
                  <select
                    value={formTripTrailerId}
                    onChange={(e) => setFormTripTrailerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Без прицепа</option>
                    {trailers.filter(t => !t.isArchived).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.model} ({t.plateNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Водитель экипажа</label>
                  <select
                    value={formTripDriverId}
                    onChange={(e) => setFormTripDriverId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Не назначен</option>
                    {users.filter(u => u.role === 'driver' || u.role === 'admin' || u.role === 'logist').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.roleLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Статус рейса</label>
                  <select
                    value={formTripStatus}
                    onChange={(e) => setFormTripStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="scheduled">Запланирован</option>
                    <option value="boarding">Идёт посадка</option>
                    <option value="in_progress">В пути</option>
                    <option value="completed">Завершён</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Базовый тариф</label>
                  <input
                    type="number"
                    value={formTripPrice}
                    onChange={(e) => setFormTripPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Валюта</label>
                  <select
                    value={formTripCurrency}
                    onChange={(e) => setFormTripCurrency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="RUB">RUB (₽)</option>
                    <option value="BYN">BYN</option>
                    <option value="KZT">KZT (₸)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTripModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  {editingTripId ? 'Сохранить рейс' : 'Создать рейс'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE / EDIT ROUTE                                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {routeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <RouteIcon className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900">
                  {editingRouteId ? 'Редактировать маршрут' : 'Создать новый маршрут'}
                </h3>
              </div>
              <button
                onClick={() => setRouteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRouteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Название маршрута *
                </label>
                <input
                  type="text"
                  required
                  value={formRouteName}
                  onChange={(e) => setFormRouteName(e.target.value)}
                  placeholder="Москва — Смоленск — Минск"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Город отправления *</label>
                  <input
                    type="text"
                    required
                    value={formRouteFrom}
                    onChange={(e) => setFormRouteFrom(e.target.value)}
                    placeholder="Москва"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Город прибытия *</label>
                  <input
                    type="text"
                    required
                    value={formRouteTo}
                    onChange={(e) => setFormRouteTo(e.target.value)}
                    placeholder="Минск"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Расстояние (км)</label>
                  <input
                    type="number"
                    value={formRouteDistance}
                    onChange={(e) => setFormRouteDistance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Время в пути (часов)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formRouteDuration}
                    onChange={(e) => setFormRouteDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Остановки (по одной на строку)
                </label>
                <textarea
                  rows={4}
                  value={formRouteStopsText}
                  onChange={(e) => setFormRouteStopsText(e.target.value)}
                  placeholder="Москва (Северные Ворота)&#10;Вязьма (АЗС Роснефть)&#10;Смоленск (Автовокзал)&#10;Минск (Центральный)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRouteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  {editingRouteId ? 'Сохранить маршрут' : 'Создать маршрут'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: ADD PASSENGER / BOOK SEAT                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {bookingModalOpen && activeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <User className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900">
                  Добавить пассажира (Рейс {activeTrip.tripNumber})
                </h3>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ФИО пассажира *
                </label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Иван Кузнецов"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    required
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    placeholder="+7 (926) 777-11-22"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Место в салоне
                  </label>
                  <select
                    value={selectedSeat || 1}
                    onChange={(e) => setSelectedSeat(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                  >
                    {Array.from({ length: totalCapacity }, (_, i) => i + 1).map((s) => {
                      const occ = activeTripBookings.some((b) => b.seatNumber === s);
                      return (
                        <option key={s} value={s} disabled={occ && s !== selectedSeat}>
                          Место №{s} {occ ? '(Занято)' : '(Свободно)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Откуда (посадка)
                  </label>
                  <select
                    value={fromStop}
                    onChange={(e) => setFromStop(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {activeTrip.checkpoints && activeTrip.checkpoints.length > 0 ? (
                      activeTrip.checkpoints.map((cp) => (
                        <option key={cp.stopId} value={cp.stopName}>
                          {cp.stopName}
                        </option>
                      ))
                    ) : (
                      <option value="Москва">Москва</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Куда (высадка)
                  </label>
                  <select
                    value={toStop}
                    onChange={(e) => setToStop(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {activeTrip.checkpoints && activeTrip.checkpoints.length > 0 ? (
                      activeTrip.checkpoints.map((cp) => (
                        <option key={cp.stopId} value={cp.stopName}>
                          {cp.stopName}
                        </option>
                      ))
                    ) : (
                      <option value="Минск">Минск</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Тариф билета
                  </label>
                  <div className="px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold text-slate-900">
                    {activeTrip.basePrice} {activeTrip.currency === 'RUB' ? '₽' : activeTrip.currency}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Оплата
                  </label>
                  <select
                    value={payNow ? 'paid' : 'cash'}
                    onChange={(e) => setPayNow(e.target.value === 'paid')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="paid">Оплачено (касса)</option>
                    <option value="cash">Оплата водителю</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Записать пассажира
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER PASSENGER MODAL */}
      {transferModalOpen && selectedBookingForTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-600">
                <ArrowRightLeft className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900">Перенос пассажира в другой рейс</h3>
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Пассажир</span>
                <div className="font-bold text-slate-900 text-sm">{selectedBookingForTransfer.passengerName}</div>
                <div className="text-slate-600">Текущий рейс: <b>{selectedBookingForTransfer.currentTripNumber}</b></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Выберите новый рейс:
                </label>
                <select
                  value={transferTargetTripId}
                  onChange={(e) => setTransferTargetTripId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {activeTrips
                    .filter((t) => t.id !== activeTrip?.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tripNumber} · {t.routeName} ({t.departureDate} {t.departureTime})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!transferTargetTripId) return;
                    transferBookingToTrip(selectedBookingForTransfer.bookingId, transferTargetTripId);
                    setTransferModalOpen(false);
                    setSelectedBookingForTransfer(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  Перенести в рейс
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
