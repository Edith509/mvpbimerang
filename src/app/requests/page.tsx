'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Users,
  Navigation,
  Bus,
  Clock,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle2,
  AlertCircle,
  Package,
  Phone,
  ArrowRight,
  Search,
  Filter,
  X,
  Check,
  ExternalLink,
  Sparkles,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { PassengerRequest, Trip, Booking, Passenger } from '@/types';

export default function RequestsPage() {
  const {
    trips,
    vehicles,
    users,
    bookings,
    passengers,
    requests,
    createRequest,
    assignRequestToTrip,
    unassignRequestFromTrip,
    updateRequestStatus,
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'need_assign' | 'free_seats' | 'unassigned_queue'>('all');

  // Expanded trip accordions state: by default, expand trips that have pending requests or first trip
  const [expandedTripIds, setExpandedTripIds] = useState<Record<string, boolean>>({
    trip_204: true,
    trip_104: true,
  });

  // Modal: Create Request
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newPassengerName, setNewPassengerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newFromCity, setNewFromCity] = useState('Новосибирск');
  const [newToCity, setNewToCity] = useState('Павлодар');
  const [newDate, setNewDate] = useState('Сегодня');
  const [newSeatsCount, setNewSeatsCount] = useState(1);
  const [newType, setNewType] = useState<'passenger' | 'parcel'>('passenger');
  const [newParcelDesc, setNewParcelDesc] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newSource, setNewSource] = useState<'phone' | 'telegram' | 'website' | 'dispatcher'>('phone');
  const [assignDirectlyTripId, setAssignDirectlyTripId] = useState<string>('');

  // Modal: Assign unassigned request to any trip
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetRequest, setTargetRequest] = useState<PassengerRequest | null>(null);
  const [selectedTripForAssign, setSelectedTripForAssign] = useState<string>(trips[0]?.id || '');

  const toggleTripExpand = (tripId: string) => {
    setExpandedTripIds((prev) => ({
      ...prev,
      [tripId]: !prev[tripId],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    trips.forEach((t) => {
      allExpanded[t.id] = true;
    });
    setExpandedTripIds(allExpanded);
  };

  const collapseAll = () => {
    setExpandedTripIds({});
  };

  // Helper to match unassigned requests to a trip based on cities/route
  const getMatchingPendingRequests = (trip: Trip) => {
    const tripNameLower = trip.routeName.toLowerCase();
    const checkpointsNames = trip.checkpoints.map((c) => c.stopName.toLowerCase()).join(' ');

    return requests.filter((r) => {
      if (r.status === 'assigned') return false;
      const fromLower = r.fromCity.toLowerCase();
      const toLower = r.toCity.toLowerCase();
      const matchesRoute =
        (tripNameLower.includes(fromLower) && tripNameLower.includes(toLower)) ||
        (checkpointsNames.includes(fromLower) && checkpointsNames.includes(toLower));
      return matchesRoute;
    });
  };

  // Helper to get all confirmed passengers in a trip (from bookings + assigned requests)
  const getTripPassengerList = (trip: Trip) => {
    const tripBookings = bookings.filter((b) => b.tripId === trip.id);
    const assignedReqs = requests.filter((r) => r.assignedTripId === trip.id);

    const passengerItems: Array<{
      id: string;
      sourceType: 'booking' | 'request';
      name: string;
      phone: string;
      seats: number;
      seatNumber?: number;
      fromStop: string;
      toStop: string;
      isParcel?: boolean;
      paymentStatus: 'paid' | 'waiting' | 'office';
      requestId?: string;
    }> = [];

    tripBookings.forEach((b) => {
      const passenger = passengers.find((p) => p.id === b.passengerId);
      passengerItems.push({
        id: b.id,
        sourceType: 'booking',
        name: passenger?.fullName || 'Пассажир',
        phone: passenger?.phone || '+7 900 000-00-00',
        seats: 1,
        seatNumber: b.seatNumber,
        fromStop: b.fromStop,
        toStop: b.toStop,
        paymentStatus: b.status === 'paid' ? 'paid' : 'waiting',
      });
    });

    assignedReqs.forEach((r) => {
      passengerItems.push({
        id: r.id,
        sourceType: 'request',
        name: r.passengerName,
        phone: r.phone,
        seats: r.seatsCount,
        seatNumber: r.assignedSeatNumber,
        fromStop: r.fromCity,
        toStop: r.toCity,
        isParcel: r.type === 'parcel',
        paymentStatus: 'office',
        requestId: r.id,
      });
    });

    return passengerItems;
  };

  // All unassigned requests (queue)
  const unassignedRequests = requests.filter((r) => r.status !== 'assigned');

  // Filtered trips
  const filteredTrips = trips.filter((trip) => {
    if (activeFilter === 'unassigned_queue') return false;

    const pendingForTrip = getMatchingPendingRequests(trip);
    const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
    const totalCapacity = vehicle?.seatsCount || 19;
    const currentPassengers = getTripPassengerList(trip);
    const totalOccupiedSeats = currentPassengers.reduce((sum, item) => sum + (item.seats || 1), 0);
    const hasFreeSeats = totalOccupiedSeats < totalCapacity;

    if (activeFilter === 'need_assign' && pendingForTrip.length === 0) return false;
    if (activeFilter === 'free_seats' && !hasFreeSeats) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoute = trip.routeName.toLowerCase().includes(q);
      const matchTripNumber = trip.tripNumber.toLowerCase().includes(q);
      const matchPassenger = currentPassengers.some(
        (p) => p.name.toLowerCase().includes(q) || p.phone.toLowerCase().includes(q)
      );
      const matchPending = pendingForTrip.some(
        (pr) => pr.passengerName.toLowerCase().includes(q) || pr.phone.toLowerCase().includes(q)
      );
      return matchRoute || matchTripNumber || matchPassenger || matchPending;
    }

    return true;
  });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassengerName.trim() || !newPhone.trim()) return;

    const newId = createRequest({
      passengerName: newPassengerName.trim(),
      phone: newPhone.trim(),
      fromCity: newFromCity.trim(),
      toCity: newToCity.trim(),
      desiredDate: newDate,
      seatsCount: newType === 'parcel' ? 0 : Number(newSeatsCount),
      type: newType,
      parcelDescription: newType === 'parcel' ? newParcelDesc : undefined,
      notes: newNotes.trim() || undefined,
      source: newSource,
    });

    if (assignDirectlyTripId) {
      assignRequestToTrip(newId, assignDirectlyTripId);
    }

    // Reset form
    setNewPassengerName('');
    setNewPhone('');
    setNewNotes('');
    setNewParcelDesc('');
    setAssignDirectlyTripId('');
    setCreateModalOpen(false);
  };

  const handleOpenAssignModal = (req: PassengerRequest) => {
    setTargetRequest(req);
    // Find best match trip
    const match = trips.find((t) => {
      const rName = t.routeName.toLowerCase();
      return rName.includes(req.fromCity.toLowerCase()) || rName.includes(req.toCity.toLowerCase());
    });
    setSelectedTripForAssign(match ? match.id : trips[0]?.id || '');
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = () => {
    if (!targetRequest || !selectedTripForAssign) return;
    assignRequestToTrip(targetRequest.id, selectedTripForAssign);
    setExpandedTripIds((prev) => ({ ...prev, [selectedTripForAssign]: true }));
    setAssignModalOpen(false);
    setTargetRequest(null);
  };

  const totalUnassignedCount = unassignedRequests.length;
  const tripsWithPendingCount = trips.filter((t) => getMatchingPendingRequests(t).length > 0).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
            <Inbox className="w-4 h-4" />
            <span>Диспетчеризация и бронирования</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Заявки и распределение по рейсам
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Нажмите на рейс, чтобы просмотреть список пассажиров, посадить ожидающих или распределить заявки.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Принять заявку</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Все рейсы ({trips.length})
          </button>

          <button
            onClick={() => setActiveFilter('need_assign')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === 'need_assign'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ожидают досадки ({tripsWithPendingCount})
          </button>

          <button
            onClick={() => setActiveFilter('free_seats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === 'free_seats'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Есть свободные места
          </button>

          <button
            onClick={() => setActiveFilter('unassigned_queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === 'unassigned_queue'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Очередь без рейса ({totalUnassignedCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пассажир, телефон, город..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              onClick={expandAll}
              title="Развернуть все рейсы"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={collapseAll}
              title="Свернуть все рейсы"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* BLOCK 1: General Unassigned Queue (Shown when filter is queue OR when there are pending requests) */}
      {(activeFilter === 'unassigned_queue' || (activeFilter === 'all' && totalUnassignedCount > 0)) && (
        <div className="bg-white rounded-xl border border-amber-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-amber-50/60 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900">
                Очередь ожидания заявок ({totalUnassignedCount})
              </h2>
              <span className="text-xs text-slate-500">
                — входящие запросы от пассажиров до подтверждения в конкретный выезд
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md self-start sm:self-auto">
              Требуют распределения
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {unassignedRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {req.type === 'parcel' ? <Package className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                        {req.requestNumber}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{req.passengerName}</span>
                      <span className="text-xs text-slate-500 font-mono">{req.phone}</span>
                      {req.type === 'parcel' ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Посылка / Груз
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {req.seatsCount} мест
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {req.fromCity} → {req.toCity}
                      </span>
                      <span>•</span>
                      <span>Желаемая дата: <b>{req.desiredDate}</b></span>
                      {req.desiredTime && <span>({req.desiredTime})</span>}
                      {req.notes && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500 italic max-w-md truncate">«{req.notes}»</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenAssignModal(req)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <span>Назначить в рейс</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {unassignedRequests.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                Все поступившие заявки успешно распределены по рейсам.
              </div>
            )}
          </div>
        </div>
      )}

      {/* BLOCK 2: Accordion Trip Cards */}
      <div className="space-y-4">
        {filteredTrips.map((trip) => {
          const isExpanded = !!expandedTripIds[trip.id];
          const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
          const driver = users.find((u) => u.id === trip.driverId);
          const pendingForThisTrip = getMatchingPendingRequests(trip);
          const passengerList = getTripPassengerList(trip);
          const totalOccupiedSeats = passengerList.reduce((sum, item) => sum + (item.seats || 1), 0);
          const totalCapacity = vehicle?.seatsCount || 19;
          const freeSeats = Math.max(0, totalCapacity - totalOccupiedSeats);

          const statusBadge =
            trip.status === 'in_progress'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : trip.status === 'boarding'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-700 border-slate-200';

          const statusLabel =
            trip.status === 'in_progress'
              ? 'В пути'
              : trip.status === 'boarding'
              ? 'Идёт посадка'
              : 'Запланирован';

          return (
            <div
              key={trip.id}
              className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${
                isExpanded ? 'border-red-300 ring-1 ring-red-100 shadow-md' : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Trip Accordion Header (Clickable) */}
              <div
                onClick={() => toggleTripExpand(trip.id)}
                className="p-4 sm:p-5 cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Route & Trip info */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                        {trip.tripNumber}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                        {statusLabel}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {trip.departureDate} · <b>{trip.departureTime}</b>
                      </span>

                      {/* Demand alert badge */}
                      {pendingForThisTrip.length > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                          Ждут досадки: {pendingForThisTrip.length} чел.
                        </span>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5 tracking-tight">
                      {trip.routeName}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Bus className="w-3.5 h-3.5 text-slate-400" />
                        <b>{vehicle?.brandModel || 'Sprinter'}</b> ({vehicle?.plateNumber})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        Водитель: <b>{driver?.name || 'Назначается'}</b>
                      </span>
                    </div>
                  </div>

                  {/* Occupancy Bar & Toggle Button */}
                  <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Capacity Indicator */}
                    <div className="text-left lg:text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">
                          {totalOccupiedSeats} / {totalCapacity} мест
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            freeSeats > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {freeSeats > 0 ? `Свободно: ${freeSeats}` : 'Мест нет'}
                        </span>
                      </div>

                      {/* Visual mini bar */}
                      <div className="w-32 sm:w-40 h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            totalOccupiedSeats >= totalCapacity
                              ? 'bg-red-500'
                              : totalOccupiedSeats > totalCapacity * 0.7
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.round((totalOccupiedSeats / totalCapacity) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Chevron toggle button */}
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-block text-xs font-semibold text-slate-500">
                        {isExpanded ? 'Скрыть список' : 'Открыть заявки'}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isExpanded ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collapsed/Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-5">
                  {/* SUB-SECTION 1: Pending Requests for this trip direction (Candidates for quick boarding) */}
                  {pendingForThisTrip.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-amber-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                            Кандидаты на посадку ({pendingForThisTrip.length} заявки ожидают рейс)
                          </h3>
                        </div>
                        <span className="text-[11px] text-amber-800">
                          Нажмите «Посадить в рейс», чтобы закрепить пассажира
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pendingForThisTrip.map((req) => (
                          <div
                            key={req.id}
                            className="bg-white rounded-lg border border-amber-200 p-3 shadow-xs flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {req.passengerName}
                                </span>
                                <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1 rounded">
                                  {req.requestNumber}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">{req.phone}</div>
                              <div className="text-[11px] text-slate-600 mt-1">
                                {req.type === 'parcel' ? (
                                  <span className="text-blue-700 font-semibold">Посылка / груз</span>
                                ) : (
                                  <span>Мест: <b>{req.seatsCount}</b></span>
                                )}
                                {req.notes && <span className="text-slate-400"> • {req.notes}</span>}
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                assignRequestToTrip(req.id, trip.id);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shrink-0 shadow-xs transition-colors"
                            >
                              <span>Посадить в рейс</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUB-SECTION 2: Current Passengers in this trip */}
                  <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
                    <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Пассажиры рейса ({passengerList.length})
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500">
                        {freeSeats > 0 ? `Свободно мест: ${freeSeats}` : 'Салон полностью укомплектован'}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {passengerList.map((p, idx) => (
                        <div
                          key={p.id}
                          className="px-4 py-3 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {p.name.charAt(0)}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 truncate">{p.name}</span>
                                <span className="text-slate-400 font-mono text-[11px]">{p.phone}</span>
                                {p.isParcel && (
                                  <span className="text-[10px] font-bold px-1.5 rounded bg-blue-50 text-blue-700">
                                    Посылка
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>{p.fromStop} → {p.toStop}</span>
                                <span>•</span>
                                <span className="font-medium text-slate-700">
                                  {p.seatNumber ? `Место № ${p.seatNumber}` : 'Место по факту посадки'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                p.paymentStatus === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {p.paymentStatus === 'paid' ? 'Оплачено' : 'Оплата на посадке'}
                            </span>

                            {p.requestId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  unassignRequestFromTrip(p.requestId!);
                                }}
                                title="Снять с рейса и вернуть в очередь заявок"
                                className="text-[11px] font-medium text-slate-400 hover:text-red-600 transition-colors"
                              >
                                Снять с рейса
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {passengerList.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          В этом рейсе пока нет пассажиров. Посадите заявки из очереди выше.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trip Footer Navigation Link */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">
                      Рейс {trip.tripNumber} · Базовая стоимость: {trip.basePrice.toLocaleString('ru-RU')} ₽
                    </span>
                    <Link
                      href={`/trips?tripId=${trip.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                    >
                      <span>Открыть схему рассадки и посадочную ведомость</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredTrips.length === 0 && activeFilter !== 'unassigned_queue' && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <Bus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-sm">Рейсы по заданным фильтрам не найдены</p>
            <p className="text-xs text-slate-400 mt-1">Попробуйте сбросить поиск или выбрать фильтр «Все рейсы».</p>
          </div>
        )}
      </div>

      {/* MODAL: Create New Request */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <Inbox className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900">Принять новую заявку</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ФИО пассажира / Отправителя *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassengerName}
                    onChange={(e) => setNewPassengerName(e.target.value)}
                    placeholder="Аслан Бакиров"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Телефон для связи *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+7 701 444-22-11"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Откуда (город)</label>
                  <input
                    type="text"
                    required
                    value={newFromCity}
                    onChange={(e) => setNewFromCity(e.target.value)}
                    placeholder="Новосибирск"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Куда (город)</label>
                  <input
                    type="text"
                    required
                    value={newToCity}
                    onChange={(e) => setNewToCity(e.target.value)}
                    placeholder="Павлодар"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Тип заявки</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="passenger">Пассажир</option>
                    <option value="parcel">Посылка / груз</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {newType === 'passenger' ? 'Кол-во мест' : 'Вес / габариты'}
                  </label>
                  {newType === 'passenger' ? (
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newSeatsCount}
                      onChange={(e) => setNewSeatsCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={newParcelDesc}
                      onChange={(e) => setNewParcelDesc(e.target.value)}
                      placeholder="До 5 кг"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Дата поездки</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="Сегодня / 25.11"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Назначить сразу в рейс (необязательно)
                </label>
                <select
                  value={assignDirectlyTripId}
                  onChange={(e) => setAssignDirectlyTripId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Оставить в очереди ожидания (без рейса)</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tripNumber} · {t.routeName} ({t.departureDate} {t.departureTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Примечание / пожелания пассажира
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Багаж 2 чемодана, детское кресло..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Сохранить заявку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign to Trip */}
      {assignModalOpen && targetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Назначение заявки в рейс</h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs space-y-1">
                <div className="font-bold text-slate-900">{targetRequest.passengerName}</div>
                <div className="text-slate-500 font-mono">{targetRequest.phone}</div>
                <div className="text-slate-700">
                  {targetRequest.fromCity} → {targetRequest.toCity} ({targetRequest.seatsCount} мест)
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Выберите рейс для посадки:
                </label>
                <select
                  value={selectedTripForAssign}
                  onChange={(e) => setSelectedTripForAssign(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tripNumber} · {t.routeName} ({t.departureDate} {t.departureTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssign}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
                >
                  Подтвердить посадку
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
