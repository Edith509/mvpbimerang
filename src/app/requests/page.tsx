'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Users,
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
  ArrowRightLeft,
  AlertCircle,
  Bus,
  UserCheck,
  CreditCard,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { PassengerRequest, RequestStatus, RequestType, Trip } from '@/types';

export default function RequestsAndPassengersPage() {
  const {
    requests,
    trips,
    bookings,
    passengers,
    vehicles,
    users,
    createRequest,
    assignRequestToTrip,
    transferBookingToTrip,
    updateRequestStatus,
    deleteRequest,
  } = useApp();

  // Top level Tab: 'requests' (Входящие заявки) vs 'passengers' (Пассажиры в рейсах)
  const [activeTab, setActiveTab] = useState<'requests' | 'passengers'>('requests');

  // Tab 1 (Requests) Filters
  const [requestFilter, setRequestFilter] = useState<'all' | 'new' | 'in_progress' | 'parcel'>('all');
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);

  // Tab 2 (Passengers) Filters
  const [passengerSearchQuery, setPassengerSearchQuery] = useState('');
  const [selectedTripFilter, setSelectedTripFilter] = useState<string>('all');
  const [passengerStatusFilter, setPassengerStatusFilter] = useState<'all' | 'boarded' | 'waiting'>('all');

  const activeTrips = trips.filter((t) => !t.isArchived && t.status !== 'cancelled');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRequestForAssign, setSelectedRequestForAssign] = useState<PassengerRequest | null>(null);
  const [targetTripId, setTargetTripId] = useState(activeTrips[0]?.id || '');

  // Transfer modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedPassengerForTransfer, setSelectedPassengerForTransfer] = useState<ConfirmedPassengerItem | null>(null);
  const [transferTargetTripId, setTransferTargetTripId] = useState('');

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
  const [formAssignDirectlyTripId, setFormAssignDirectlyTripId] = useState('');

  // 1. FILTER ONLY UNASSIGNED REQUESTS (NOT in trips)
  const unassignedRequests = useMemo(() => {
    return requests.filter((r) => r.status !== 'assigned');
  }, [requests]);

  // Demand aggregation based purely on unassigned requests
  const demandByDirection = useMemo(() => {
    const map = new Map<string, { from: string; to: string; count: number; seats: number; unassigned: number }>();
    unassignedRequests.forEach((r) => {
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
      existing.unassigned += 1;
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [unassignedRequests]);

  // Filtered requests list for Tab 1
  const filteredRequests = useMemo(() => {
    return unassignedRequests.filter((r) => {
      if (selectedDirection && `${r.fromCity} — ${r.toCity}` !== selectedDirection) {
        return false;
      }

      if (requestFilter === 'new' && r.status !== 'new') return false;
      if (requestFilter === 'in_progress' && r.status !== 'in_progress') return false;
      if (requestFilter === 'parcel' && r.type !== 'parcel') return false;

      if (requestSearchQuery.trim()) {
        const q = requestSearchQuery.toLowerCase();
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
  }, [unassignedRequests, requestFilter, requestSearchQuery, selectedDirection]);

  // 2. COMPILE ALL CONFIRMED PASSENGERS IN TRIPS FOR TAB 2
  interface ConfirmedPassengerItem {
    id: string;
    sourceType: 'booking' | 'request';
    name: string;
    phone: string;
    documentNumber?: string;
    tripId: string;
    tripNumber: string;
    routeName: string;
    departureDate: string;
    departureTime: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    driverName?: string;
    seatNumber?: number;
    fromStop: string;
    toStop: string;
    price: number;
    currency: string;
    paymentStatus: 'paid' | 'waiting' | 'confirmed';
    boardingStatus: 'boarded' | 'waiting' | 'no_show';
    isParcel?: boolean;
    parcelDescription?: string;
    originalRequestId?: string;
  }

  const confirmedPassengers = useMemo(() => {
    const list: ConfirmedPassengerItem[] = [];

    // From official trip bookings
    bookings.forEach((b) => {
      const passenger = passengers.find((p) => p.id === b.passengerId);
      const trip = trips.find((t) => t.id === b.tripId);
      const vehicle = trip ? vehicles.find((v) => v.id === trip.vehicleId) : undefined;
      const driver = trip ? users.find((u) => u.id === trip.driverId) : undefined;

      list.push({
        id: b.id,
        sourceType: 'booking',
        name: passenger?.fullName || 'Пассажир',
        phone: passenger?.phone || '+7 900 000-00-00',
        documentNumber: passenger?.documentNumber,
        tripId: b.tripId,
        tripNumber: trip?.tripNumber || 'Рейс',
        routeName: trip?.routeName || 'Маршрут',
        departureDate: trip?.departureDate || 'Сегодня',
        departureTime: trip?.departureTime || '12:00',
        vehiclePlate: vehicle?.plateNumber,
        vehicleModel: vehicle?.brandModel,
        driverName: driver?.name,
        seatNumber: b.seatNumber,
        fromStop: b.fromStop,
        toStop: b.toStop,
        price: b.price,
        currency: b.currency,
        paymentStatus: b.status === 'paid' ? 'paid' : 'waiting',
        boardingStatus: b.boardingStatus || 'waiting',
        isParcel: false,
      });
    });

    // From assigned requests
    const assignedRequests = requests.filter((r) => r.status === 'assigned');
    assignedRequests.forEach((r) => {
      const trip = trips.find((t) => t.id === r.assignedTripId);
      const vehicle = trip ? vehicles.find((v) => v.id === trip.vehicleId) : undefined;
      const driver = trip ? users.find((u) => u.id === trip.driverId) : undefined;

      list.push({
        id: `req_pass_${r.id}`,
        sourceType: 'request',
        name: r.passengerName,
        phone: r.phone,
        tripId: r.assignedTripId || '',
        tripNumber: r.assignedTripNumber || trip?.tripNumber || 'Рейс',
        routeName: trip?.routeName || `${r.fromCity} — ${r.toCity}`,
        departureDate: trip?.departureDate || r.desiredDate,
        departureTime: trip?.departureTime || 'По расписанию',
        vehiclePlate: vehicle?.plateNumber,
        vehicleModel: vehicle?.brandModel,
        driverName: driver?.name,
        seatNumber: r.assignedSeatNumber,
        fromStop: r.fromCity,
        toStop: r.toCity,
        price: r.priceEstimate || 3800,
        currency: r.currency || 'RUB',
        paymentStatus: 'waiting',
        boardingStatus: 'waiting',
        isParcel: r.type === 'parcel',
        parcelDescription: r.parcelDescription,
        originalRequestId: r.id,
      });
    });

    return list;
  }, [bookings, passengers, trips, vehicles, users, requests]);

  // Filtered passengers list for Tab 2
  const filteredPassengers = useMemo(() => {
    return confirmedPassengers.filter((p) => {
      if (selectedTripFilter !== 'all' && p.tripId !== selectedTripFilter) {
        return false;
      }

      if (passengerStatusFilter === 'boarded' && p.boardingStatus !== 'boarded') return false;
      if (passengerStatusFilter === 'waiting' && p.boardingStatus === 'boarded') return false;

      if (passengerSearchQuery.trim()) {
        const q = passengerSearchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          (p.documentNumber && p.documentNumber.toLowerCase().includes(q)) ||
          p.tripNumber.toLowerCase().includes(q) ||
          p.routeName.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [confirmedPassengers, selectedTripFilter, passengerStatusFilter, passengerSearchQuery]);

  // Handle create request
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    const newReqId = createRequest({
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
      notes: formNotes.trim() || undefined,
      source: 'dispatcher',
    });

    if (formAssignDirectlyTripId) {
      assignRequestToTrip(newReqId, formAssignDirectlyTripId);
      setActiveTab('passengers');
    }

    setFormName('');
    setFormPhone('');
    setFormNotes('');
    setFormParcelDesc('');
    setFormAssignDirectlyTripId('');
    setCreateModalOpen(false);
  };

  // Open assign modal
  const handleOpenAssignModal = (req: PassengerRequest) => {
    setSelectedRequestForAssign(req);
    const match = activeTrips.find((t) => {
      const rName = t.routeName.toLowerCase();
      return rName.includes(req.fromCity.toLowerCase()) || rName.includes(req.toCity.toLowerCase());
    });
    setTargetTripId(match ? match.id : activeTrips[0]?.id || '');
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = () => {
    if (!selectedRequestForAssign || !targetTripId) return;
    assignRequestToTrip(selectedRequestForAssign.id, targetTripId);
    setAssignModalOpen(false);
    setSelectedRequestForAssign(null);
    // Switch to passengers tab so the dispatcher sees the confirmed passenger
    setActiveTab('passengers');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Заявки и пассажиры</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === 'requests'
              ? 'Входящие запросы на поездки и посылки до распределения по машинам и рейсам.'
              : 'Пассажиры, закреплённые за конкретными рейсами, с номерами мест и статусом посадки.'}
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

      {/* TOP TABS: ЗАЯВКИ vs ПАССАЖИРЫ */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all relative ${
            activeTab === 'requests'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Заявки</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'requests'
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {unassignedRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('passengers')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all relative ${
            activeTab === 'passengers'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Пассажиры в рейсах</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'passengers'
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {confirmedPassengers.length}
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 1: ТОЛЬКО ВХОДЯЩИЕ ЗАЯВКИ (НЕ В РЕЙСЕ)                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'requests' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Demand aggregation cards */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Спрос по направлениям
                </h2>
                <p className="text-[11px] text-slate-500">
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
              {demandByDirection.map((d) => {
                const isSelected = selectedDirection === `${d.from} — ${d.to}`;
                return (
                  <button
                    key={`${d.from}-${d.to}`}
                    type="button"
                    onClick={() =>
                      setSelectedDirection(isSelected ? null : `${d.from} — ${d.to}`)
                    }
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-50/40 ring-1 ring-red-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {d.from} → {d.to}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-slate-500">
                        {d.count} заявки ({d.seats} мест)
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        {d.unassigned} не распр.
                      </span>
                    </div>
                  </button>
                );
              })}

              {demandByDirection.length === 0 && (
                <div className="col-span-full py-4 text-center text-xs text-slate-400">
                  Нет активных нераспределённых заявок.
                </div>
              )}
            </div>
          </div>

          {/* Filter Pills and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setRequestFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  requestFilter === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Все ({unassignedRequests.length})
              </button>
              <button
                onClick={() => setRequestFilter('new')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  requestFilter === 'new'
                    ? 'bg-red-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Новые ({unassignedRequests.filter((r) => r.status === 'new').length})
              </button>
              <button
                onClick={() => setRequestFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  requestFilter === 'in_progress'
                    ? 'bg-red-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                В обработке ({unassignedRequests.filter((r) => r.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setRequestFilter('parcel')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  requestFilter === 'parcel'
                    ? 'bg-red-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Посылки ({unassignedRequests.filter((r) => r.type === 'parcel').length})
              </button>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={requestSearchQuery}
                onChange={(e) => setRequestSearchQuery(e.target.value)}
                placeholder="Поиск по имени, номеру, городу..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Requests Table (Only non-assigned requests) */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">№ Заявки</th>
                    <th className="px-4 py-3 font-semibold">Пассажир / Контакт</th>
                    <th className="px-4 py-3 font-semibold">Направление</th>
                    <th className="px-4 py-3 font-semibold">Дата / Время</th>
                    <th className="px-4 py-3 font-semibold">Тип / Мест</th>
                    <th className="px-4 py-3 font-semibold">Статус</th>
                    <th className="px-4 py-3 text-right font-semibold">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                          {r.requestNumber}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 capitalize">{r.source}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{r.passengerName}</div>
                        <div className="font-mono text-slate-500 text-[11px] mt-0.5">{r.phone}</div>
                        {r.notes && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5 max-w-xs truncate">
                            «{r.notes}»
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {r.fromCity} → {r.toCity}
                        </div>
                        {r.priceEstimate && (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            ~ {r.priceEstimate.toLocaleString('ru-RU')} ₽
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{r.desiredDate}</div>
                        {r.desiredTime && (
                          <div className="text-[11px] text-slate-500">{r.desiredTime}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {r.type === 'parcel' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
                            <Package className="w-3 h-3" />
                            Посылка
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <User className="w-3 h-3 text-slate-400" />
                            {r.seatsCount} мест
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {r.status === 'new' && (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Новая
                          </span>
                        )}
                        {r.status === 'in_progress' && (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            В обработке
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenAssignModal(r)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <span>В рейс</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Нераспределённых заявок нет</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Все поступившие заявки обработаны и переведены на вкладку «Пассажиры в рейсах».
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 2: ТОЛЬКО ПАССАЖИРЫ В РЕЙСАХ                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'passengers' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Passenger KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Всего в рейсах
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {confirmedPassengers.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Закреплено за машинами</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                Оплачено
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {confirmedPassengers.filter((p) => p.paymentStatus === 'paid').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">СБП, эквайринг, касса</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                Оплата на посадке
              </div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {confirmedPassengers.filter((p) => p.paymentStatus !== 'paid').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Наличные водителю</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                На борту
              </div>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {confirmedPassengers.filter((p) => p.boardingStatus === 'boarded').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Совершили посадку</div>
            </div>
          </div>

          {/* Filter Bar for Passengers */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Рейс:</span>
              <select
                value={selectedTripFilter}
                onChange={(e) => setSelectedTripFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Все рейсы ({trips.length})</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tripNumber} · {t.routeName}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                <button
                  onClick={() => setPassengerStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    passengerStatusFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setPassengerStatusFilter('boarded')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    passengerStatusFilter === 'boarded'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  На борту
                </button>
                <button
                  onClick={() => setPassengerStatusFilter('waiting')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    passengerStatusFilter === 'waiting'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Ожидают
                </button>
              </div>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={passengerSearchQuery}
                onChange={(e) => setPassengerSearchQuery(e.target.value)}
                placeholder="Поиск пассажира, телефона, рейса..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Confirmed Passengers Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Пассажир</th>
                    <th className="px-4 py-3 font-semibold">Назначенный рейс</th>
                    <th className="hidden md:table-cell px-4 py-3 font-semibold">Транспорт и экипаж</th>
                    <th className="px-4 py-3 font-semibold">Место</th>
                    <th className="hidden sm:table-cell px-4 py-3 font-semibold">Посадка / Высадка</th>
                    <th className="px-4 py-3 font-semibold">Оплата</th>
                    <th className="px-4 py-3 font-semibold">Посадка</th>
                    <th className="px-4 py-3 text-right font-semibold">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPassengers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="font-mono text-slate-500 text-[11px] mt-0.5">{p.phone}</div>
                            {p.documentNumber && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                Док: {p.documentNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                          {p.tripNumber}
                        </span>
                        <div className="font-semibold text-slate-800 mt-1 max-w-[180px] truncate">
                          {p.routeName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{p.departureDate} {p.departureTime}</span>
                        </div>
                      </td>

                      <td className="hidden md:table-cell px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{p.vehicleModel || 'Sprinter'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{p.vehiclePlate || 'А 102 МР 77'}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{p.driverName || 'Водитель назначен'}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {p.seatNumber ? (
                          <span className="inline-flex items-center font-bold px-2 py-1 rounded bg-slate-100 text-slate-800 font-mono text-xs border border-slate-200">
                            № {p.seatNumber}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">По факту посадки</span>
                        )}
                      </td>

                      <td className="hidden sm:table-cell px-4 py-3.5">
                        <div className="text-slate-800 font-medium">{p.fromStop}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">↓ {p.toStop}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {p.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Оплачено ({p.price.toLocaleString('ru-RU')} ₽)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Водителю ({p.price.toLocaleString('ru-RU')} ₽)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {p.boardingStatus === 'boarded' ? (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            На борту
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Ожидает
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedPassengerForTransfer(p);
                              const otherTrip = activeTrips.find((t) => t.id !== p.tripId);
                              setTransferTargetTripId(otherTrip?.id || activeTrips[0]?.id || '');
                              setTransferModalOpen(true);
                            }}
                            title="Сменить / перенести в другой рейс"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Перенести</span>
                          </button>

                          <Link
                            href={`/trips?tripId=${p.tripId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <span>Открыть рейс</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredPassengers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Пассажиры не найдены</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Попробуйте выбрать другой рейс или распределить заявки из первого таба.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE REQUEST                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
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

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ФИО пассажира *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Аслан Бакиров"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+7 701 444-22-11"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Откуда</label>
                  <input
                    type="text"
                    required
                    value={formFrom}
                    onChange={(e) => setFormFrom(e.target.value)}
                    placeholder="Новосибирск"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Куда</label>
                  <input
                    type="text"
                    required
                    value={formTo}
                    onChange={(e) => setFormTo(e.target.value)}
                    placeholder="Павлодар"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Тип</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="passenger">Пассажир</option>
                    <option value="parcel">Посылка</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {formType === 'passenger' ? 'Мест' : 'Габариты'}
                  </label>
                  {formType === 'passenger' ? (
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formSeats}
                      onChange={(e) => setFormSeats(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formParcelDesc}
                      onChange={(e) => setFormParcelDesc(e.target.value)}
                      placeholder="До 5 кг"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Дата</label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="23.11.2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Назначить сразу в рейс (необязательно)
                </label>
                <select
                  value={formAssignDirectlyTripId}
                  onChange={(e) => setFormAssignDirectlyTripId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Оставить во входящих заявках</option>
                  {activeTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tripNumber} · {t.routeName} ({t.departureDate} {t.departureTime})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Если выбрать рейс, заявка сразу перейдёт на вкладку «Пассажиры в рейсах».
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Примечание к поездке
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="2 чемодана в багажник, место у окна..."
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
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: ASSIGN REQUEST TO TRIP                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {assignModalOpen && selectedRequestForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Распределение заявки в рейс</h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">
                  {selectedRequestForAssign.passengerName}
                </div>
                <div className="text-slate-500 font-mono">{selectedRequestForAssign.phone}</div>
                <div className="text-slate-700">
                  {selectedRequestForAssign.fromCity} → {selectedRequestForAssign.toCity} (
                  {selectedRequestForAssign.seatsCount} мест)
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Выберите рейс:
                </label>
                <select
                  value={targetTripId}
                  onChange={(e) => setTargetTripId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {activeTrips.map((t) => (
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
                  Назначить в рейс
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: TRANSFER PASSENGER TO ANOTHER TRIP                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {transferModalOpen && selectedPassengerForTransfer && (
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
                <div className="font-bold text-slate-900 text-sm">{selectedPassengerForTransfer.name}</div>
                <div className="text-slate-500 font-mono">{selectedPassengerForTransfer.phone}</div>
                <div className="text-slate-600 mt-1">
                  Текущий рейс: <b>{selectedPassengerForTransfer.tripNumber} ({selectedPassengerForTransfer.routeName})</b>
                </div>
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
                    .filter((t) => t.id !== selectedPassengerForTransfer.tripId)
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
                    if (selectedPassengerForTransfer.sourceType === 'request' && selectedPassengerForTransfer.originalRequestId) {
                      assignRequestToTrip(selectedPassengerForTransfer.originalRequestId, transferTargetTripId);
                    } else {
                      transferBookingToTrip(selectedPassengerForTransfer.id, transferTargetTripId);
                    }
                    setTransferModalOpen(false);
                    setSelectedPassengerForTransfer(null);
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
