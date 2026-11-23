'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bus,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Wrench,
  Fuel,
  X,
  Check,
  Edit,
  Archive,
  Trash2,
  History,
  Truck,
  Box,
  Eye,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { VehicleStatus, Vehicle, Trailer } from '@/types';

const STATUS_LABELS: Record<
  VehicleStatus,
  { label: string; badge: string; dot: string }
> = {
  ready: {
    label: 'Готов к рейсу',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  in_trip: {
    label: 'В рейсе',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500 animate-pulse',
  },
  repair: {
    label: 'На ТО / Ремонте',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  inspection: {
    label: 'На осмотре',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
};

export default function FleetPage() {
  const router = useRouter();
  const {
    vehicles,
    trailers,
    activities,
    currentUser,
    users,
    addIncident,
    createVehicle,
    updateVehicle,
    archiveVehicle,
    createTrailer,
    updateTrailer,
    archiveTrailer,
  } = useApp();

  // Top Tabs: 'vehicles' vs 'trailers'
  const [activeTab, setActiveTab] = useState<'vehicles' | 'trailers'>('vehicles');

  // Vehicles Filters
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<'all' | VehicleStatus>('all');

  // Trailers Filters
  const [trailerSearchQuery, setTrailerSearchQuery] = useState('');
  const [trailerStatusFilter, setTrailerStatusFilter] = useState<'all' | VehicleStatus>('all');

  // Activity Log Drawer / Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Defect Modal
  const [defectModalOpen, setDefectModalOpen] = useState(false);
  const [selectedVehicleForDefect, setSelectedVehicleForDefect] = useState<string>(
    vehicles[0]?.id || ''
  );
  const [defectDescription, setDefectDescription] = useState('');

  // Vehicle Create / Edit Modal
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehBrandModel, setVehBrandModel] = useState('');
  const [vehPlateNumber, setVehPlateNumber] = useState('');
  const [vehGarageNumber, setVehGarageNumber] = useState('');
  const [vehSeatsCount, setVehSeatsCount] = useState(19);
  const [vehYear, setVehYear] = useState(2023);
  const [vehBaseCity, setVehBaseCity] = useState('Москва, База Север');
  const [vehCurrentLocation, setVehCurrentLocation] = useState('Москва, База Север');
  const [vehMileage, setVehMileage] = useState(120000);
  const [vehStatus, setVehStatus] = useState<VehicleStatus>('ready');
  const [vehDriverName, setVehDriverName] = useState('');

  // Trailer Create / Edit Modal
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [editingTrailerId, setEditingTrailerId] = useState<string | null>(null);
  const [trlModel, setTrlModel] = useState('');
  const [trlPlateNumber, setTrlPlateNumber] = useState('');
  const [trlGarageNumber, setTrlGarageNumber] = useState('');
  const [trlCapacityKg, setTrlCapacityKg] = useState(750);
  const [trlVolumeM3, setTrlVolumeM3] = useState(8.5);
  const [trlYear, setTrlYear] = useState(2023);
  const [trlBaseCity, setTrlBaseCity] = useState('Москва, Север');
  const [trlLocation, setTrlLocation] = useState('Москва, Север');
  const [trlStatus, setTrlStatus] = useState<VehicleStatus>('ready');
  const [trlAssignedVehicleId, setTrlAssignedVehicleId] = useState('');

  const isDriver = currentUser?.role === 'driver';

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const safeVehicles = vehicles || [];
  const safeTrailers = trailers || [];
  const safeActivities = activities || [];

  // 1. FILTERED VEHICLES (excluding archived)
  const activeVehicles = safeVehicles.filter((v) => !v.isArchived);
  const filteredVehicles = activeVehicles.filter((v) => {
    if (isDriver && v.id !== 'veh_12') return false;
    if (vehicleStatusFilter !== 'all' && v.status !== vehicleStatusFilter) return false;
    if (vehicleSearchQuery.trim()) {
      const q = vehicleSearchQuery.toLowerCase();
      const matchPlate = v.plateNumber?.toLowerCase().includes(q);
      const matchModel = v.brandModel?.toLowerCase().includes(q);
      const matchLoc = (v.currentLocation || '').toLowerCase().includes(q);
      const matchBase = (v.baseCity || '').toLowerCase().includes(q);
      const matchGarage = (v.garageNumber || '').toLowerCase().includes(q);
      return matchPlate || matchModel || matchLoc || matchBase || matchGarage;
    }
    return true;
  });

  // 2. FILTERED TRAILERS (excluding archived)
  const activeTrailers = safeTrailers.filter((t) => !t.isArchived);
  const filteredTrailers = activeTrailers.filter((t) => {
    if (trailerStatusFilter !== 'all' && t.status !== trailerStatusFilter) return false;
    if (trailerSearchQuery.trim()) {
      const q = trailerSearchQuery.toLowerCase();
      const matchPlate = t.plateNumber?.toLowerCase().includes(q);
      const matchModel = t.model?.toLowerCase().includes(q);
      const matchLoc = (t.currentLocation || '').toLowerCase().includes(q);
      const matchBase = (t.baseCity || '').toLowerCase().includes(q);
      const matchGarage = (t.garageNumber || '').toLowerCase().includes(q);
      return matchPlate || matchModel || matchLoc || matchBase || matchGarage;
    }
    return true;
  });

  // Vehicles KPIs
  const totalVehCount = activeVehicles.length;
  const readyVehCount = activeVehicles.filter((v) => v.status === 'ready').length;
  const inTripVehCount = activeVehicles.filter((v) => v.status === 'in_trip').length;
  const repairVehCount = activeVehicles.filter((v) => v.status === 'repair' || v.status === 'inspection').length;

  // Trailers KPIs
  const totalTrlCount = activeTrailers.length;
  const readyTrlCount = activeTrailers.filter((t) => t.status === 'ready').length;
  const inTripTrlCount = activeTrailers.filter((t) => t.status === 'in_trip').length;
  const repairTrlCount = activeTrailers.filter((t) => t.status === 'repair' || t.status === 'inspection').length;

  // Handlers
  const handleAddDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectDescription.trim() || !selectedVehicleForDefect) return;
    addIncident(selectedVehicleForDefect, defectDescription.trim());
    setDefectDescription('');
    setDefectModalOpen(false);
  };

  // Open Vehicle Modal for Create / Edit
  const openVehicleCreate = () => {
    setEditingVehicleId(null);
    setVehBrandModel('Mercedes-Benz Sprinter 516');
    setVehPlateNumber('А 112 ВМ 77');
    setVehGarageNumber(`ГАРАЖ-0${activeVehicles.length + 1}`);
    setVehSeatsCount(19);
    setVehYear(2023);
    setVehBaseCity('Москва, База Север');
    setVehCurrentLocation('Москва, База Север');
    setVehMileage(120000);
    setVehStatus('ready');
    setVehDriverName(users.find((u) => u.role === 'driver')?.name || 'Сергей Васильев');
    setVehicleModalOpen(true);
  };

  const openVehicleEdit = (v: Vehicle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingVehicleId(v.id);
    setVehBrandModel(v.brandModel);
    setVehPlateNumber(v.plateNumber);
    setVehGarageNumber(v.garageNumber || '');
    setVehSeatsCount(v.seatsCount);
    setVehYear(v.year);
    setVehBaseCity(v.baseCity || 'Москва');
    setVehCurrentLocation(v.currentLocation);
    setVehMileage(v.mileageKm);
    setVehStatus(v.status);
    setVehDriverName(v.assignedDriverName || '');
    setVehicleModalOpen(true);
  };

  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehBrandModel.trim() || !vehPlateNumber.trim()) return;

    if (editingVehicleId) {
      updateVehicle(editingVehicleId, {
        brandModel: vehBrandModel.trim(),
        plateNumber: vehPlateNumber.trim(),
        garageNumber: vehGarageNumber.trim() || undefined,
        seatsCount: Number(vehSeatsCount),
        year: Number(vehYear),
        baseCity: vehBaseCity.trim(),
        currentLocation: vehCurrentLocation.trim(),
        mileageKm: Number(vehMileage),
        status: vehStatus,
        assignedDriverName: vehDriverName.trim() || undefined,
      });
    } else {
      createVehicle({
        brandModel: vehBrandModel.trim(),
        plateNumber: vehPlateNumber.trim(),
        garageNumber: vehGarageNumber.trim() || undefined,
        seatsCount: Number(vehSeatsCount),
        year: Number(vehYear),
        baseCity: vehBaseCity.trim(),
        currentLocation: vehCurrentLocation.trim(),
        mileageKm: Number(vehMileage),
        nextServiceKm: Number(vehMileage) + 10000,
        status: vehStatus,
        assignedDriverName: vehDriverName.trim() || undefined,
      });
    }
    setVehicleModalOpen(false);
  };

  const handleArchiveVehicle = (v: Vehicle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Удалить машину ${v.brandModel} (${v.plateNumber})?`)) {
      archiveVehicle(v.id);
    }
  };

  // Open Trailer Modal for Create / Edit
  const openTrailerCreate = () => {
    setEditingTrailerId(null);
    setTrlModel('МЗСА 817717 (Тент 3.5м)');
    setTrlPlateNumber('АЕ 4412 77');
    setTrlGarageNumber(`ПР-0${activeTrailers.length + 1}`);
    setTrlCapacityKg(750);
    setTrlVolumeM3(8.5);
    setTrlYear(2023);
    setTrlBaseCity('Москва, Север');
    setTrlLocation('Москва, Север');
    setTrlStatus('ready');
    setTrlAssignedVehicleId('');
    setTrailerModalOpen(true);
  };

  const openTrailerEdit = (t: Trailer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTrailerId(t.id);
    setTrlModel(t.model);
    setTrlPlateNumber(t.plateNumber);
    setTrlGarageNumber(t.garageNumber || '');
    setTrlCapacityKg(t.capacityKg);
    setTrlVolumeM3(t.volumeM3);
    setTrlYear(t.year);
    setTrlBaseCity(t.baseCity);
    setTrlLocation(t.currentLocation);
    setTrlStatus(t.status);
    setTrlAssignedVehicleId(t.assignedVehicleId || '');
    setTrailerModalOpen(true);
  };

  const handleTrailerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trlModel.trim() || !trlPlateNumber.trim()) return;

    const assignedVeh = vehicles.find((v) => v.id === trlAssignedVehicleId);

    if (editingTrailerId) {
      updateTrailer(editingTrailerId, {
        model: trlModel.trim(),
        plateNumber: trlPlateNumber.trim(),
        garageNumber: trlGarageNumber.trim() || undefined,
        capacityKg: Number(trlCapacityKg),
        volumeM3: Number(trlVolumeM3),
        year: Number(trlYear),
        baseCity: trlBaseCity.trim(),
        currentLocation: trlLocation.trim(),
        status: trlStatus,
        assignedVehicleId: trlAssignedVehicleId || undefined,
        assignedVehiclePlate: assignedVeh?.plateNumber,
      });
    } else {
      createTrailer({
        model: trlModel.trim(),
        plateNumber: trlPlateNumber.trim(),
        garageNumber: trlGarageNumber.trim() || undefined,
        capacityKg: Number(trlCapacityKg),
        volumeM3: Number(trlVolumeM3),
        year: Number(trlYear),
        baseCity: trlBaseCity.trim(),
        currentLocation: trlLocation.trim(),
        status: trlStatus,
        assignedVehicleId: trlAssignedVehicleId || undefined,
        assignedVehiclePlate: assignedVeh?.plateNumber,
      });
    }
    setTrailerModalOpen(false);
  };

  const handleArchiveTrailer = (t: Trailer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Удалить прицеп ${t.model} (${t.plateNumber})?`)) {
      archiveTrailer(t.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Автопарк</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === 'vehicles'
              ? 'Учёт автобусов и микроавтобусов, техническое состояние, пробеги и закрепление экипажей.'
              : 'Учёт легковых и грузовых прицепов для багажа, сцепка с тягачами и техническое состояние.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedVehicleForDefect(vehicles[0]?.id || '');
              setDefectModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>Неисправность</span>
          </button>

          {activeTab === 'vehicles' ? (
            <button
              onClick={openVehicleCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Добавить машину</span>
            </button>
          ) : (
            <button
              onClick={openTrailerCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Добавить прицеп</span>
            </button>
          )}
        </div>
      </div>

      {/* TOP TABS: МАШИНЫ vs ПРИЦЕПЫ */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all relative ${
            activeTab === 'vehicles'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>Машины</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'vehicles'
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {totalVehCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('trailers')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all relative ${
            activeTab === 'trailers'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Прицепы</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'trailers'
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {totalTrlCount}
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB 1: МАШИНЫ                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* KPI Stats Overview for Vehicles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Всего машин
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalVehCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">На балансе предприятия</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                Готовы к рейсу
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{readyVehCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Проверены и заправлены</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                В рейсе
              </div>
              <div className="text-2xl font-black text-blue-600 mt-1">{inTripVehCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">На маршрутах с пассажирами</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                На ТО / Ремонте
              </div>
              <div className="text-2xl font-black text-amber-600 mt-1">{repairVehCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Сервисное обслуживание</div>
            </div>
          </div>

          {/* Filters & Search Toolbar for Vehicles */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setVehicleStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  vehicleStatusFilter === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Все ({totalVehCount})
              </button>
              <button
                onClick={() => setVehicleStatusFilter('ready')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  vehicleStatusFilter === 'ready'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Готовы ({readyVehCount})
              </button>
              <button
                onClick={() => setVehicleStatusFilter('in_trip')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  vehicleStatusFilter === 'in_trip'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                В рейсе ({inTripVehCount})
              </button>
              <button
                onClick={() => setVehicleStatusFilter('repair')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  vehicleStatusFilter === 'repair'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                На ТО ({repairVehCount})
              </button>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vehicleSearchQuery}
                onChange={(e) => setVehicleSearchQuery(e.target.value)}
                placeholder="Поиск по марке, номеру, городу..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Vehicles Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Транспорт</th>
                    <th className="px-4 py-3 font-semibold">Статус</th>
                    <th className="hidden md:table-cell px-4 py-3 font-semibold">База / Локация</th>
                    <th className="hidden lg:table-cell px-4 py-3 font-semibold">Закреплённый экипаж</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right font-semibold">Пробег</th>
                    <th className="hidden lg:table-cell px-4 py-3 text-right font-semibold">До ТО</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right font-semibold">Замечания</th>
                    <th className="px-4 py-3 text-right font-semibold">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVehicles.map((vehicle) => {
                    const statusInfo = STATUS_LABELS[vehicle.status] || STATUS_LABELS.ready;
                    const openIncidents = (vehicle.incidents || []).filter((i) => i.status !== 'resolved');
                    const kmToService = vehicle.nextServiceKm - vehicle.mileageKm;
                    const photoThumbnail =
                      vehicle.photos?.[0] ||
                      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80';

                    return (
                      <tr
                        key={vehicle.id}
                        onClick={() => router.push(`/fleet/${vehicle.id}`)}
                        className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={photoThumbnail}
                              alt={vehicle.brandModel}
                              className="w-12 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                                  {vehicle.brandModel}
                                </span>
                                {vehicle.garageNumber && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                    {vehicle.garageNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                                <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  {vehicle.plateNumber}
                                </span>
                                <span>•</span>
                                <span>{vehicle.seatsCount} мест</span>
                                <span>•</span>
                                <span>{vehicle.year} г.</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${statusInfo.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                            {statusInfo.label}
                          </span>
                        </td>

                        <td className="hidden md:table-cell px-4 py-3.5">
                          <div className="text-slate-800 font-medium">{vehicle.currentLocation}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">База: {vehicle.baseCity || 'Москва'}</div>
                        </td>

                        <td className="hidden lg:table-cell px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{vehicle.assignedDriverName || 'Диспетчерский резерв'}</span>
                          </div>
                        </td>

                        <td className="hidden sm:table-cell px-4 py-3.5 text-right font-mono text-slate-700 font-medium">
                          {vehicle.mileageKm.toLocaleString('ru-RU')} км
                        </td>

                        <td className="hidden lg:table-cell px-4 py-3.5 text-right font-mono">
                          <span className={kmToService <= 3000 ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                            {kmToService.toLocaleString('ru-RU')} км
                          </span>
                        </td>

                        <td className="hidden sm:table-cell px-4 py-3.5 text-right">
                          {openIncidents.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200">
                              <AlertTriangle className="w-3 h-3" />
                              {openIncidents.length}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => openVehicleEdit(vehicle, e)}
                              title="Редактировать параметры машины"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleArchiveVehicle(vehicle, e)}
                              title="Удалить"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              href={`/fleet/${vehicle.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors ml-1"
                            >
                              <span>Профиль</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredVehicles.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                        <Bus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Машины не найдены</p>
                        <p className="text-xs text-slate-400 mt-1">Попробуйте изменить параметры поиска или фильтрации</p>
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
      {/* TAB 2: ПРИЦЕПЫ                                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'trailers' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* KPI Stats Overview for Trailers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Всего прицепов
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalTrlCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">На балансе предприятия</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                Готовы к рейсу
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{readyTrlCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Осмотрены и исправны</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                В рейсе
              </div>
              <div className="text-2xl font-black text-blue-600 mt-1">{inTripTrlCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">В сцепке с тягачами</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                На ТО / Ремонте
              </div>
              <div className="text-2xl font-black text-amber-600 mt-1">{repairTrlCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Ступицы, электрика, сцепка</div>
            </div>
          </div>

          {/* Filters & Search Toolbar for Trailers */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setTrailerStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  trailerStatusFilter === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Все ({totalTrlCount})
              </button>
              <button
                onClick={() => setTrailerStatusFilter('ready')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  trailerStatusFilter === 'ready'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Готовы ({readyTrlCount})
              </button>
              <button
                onClick={() => setTrailerStatusFilter('in_trip')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  trailerStatusFilter === 'in_trip'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                В рейсе ({inTripTrlCount})
              </button>
              <button
                onClick={() => setTrailerStatusFilter('repair')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  trailerStatusFilter === 'repair'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                На ТО ({repairTrlCount})
              </button>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trailerSearchQuery}
                onChange={(e) => setTrailerSearchQuery(e.target.value)}
                placeholder="Поиск прицепа по марке, номеру..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Trailers Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Модель прицепа</th>
                    <th className="px-4 py-3 font-semibold">Статус</th>
                    <th className="hidden md:table-cell px-4 py-3 font-semibold">База / Местонахождение</th>
                    <th className="hidden lg:table-cell px-4 py-3 font-semibold">Сцепка с машиной</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right font-semibold">Грузоподъёмность</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right font-semibold">Объём кузова</th>
                    <th className="px-4 py-3 text-right font-semibold">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrailers.map((trailer) => {
                    const statusInfo = STATUS_LABELS[trailer.status] || STATUS_LABELS.ready;
                    const assignedVehicle = vehicles.find((v) => v.id === trailer.assignedVehicleId);

                    return (
                      <tr key={trailer.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                              <Truck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{trailer.model}</span>
                                {trailer.garageNumber && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                    {trailer.garageNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                                <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  {trailer.plateNumber}
                                </span>
                                <span>•</span>
                                <span>{trailer.year} г.</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${statusInfo.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                            {statusInfo.label}
                          </span>
                        </td>

                        <td className="hidden md:table-cell px-4 py-3.5">
                          <div className="text-slate-800 font-medium">{trailer.currentLocation}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">База: {trailer.baseCity}</div>
                        </td>

                        <td className="hidden lg:table-cell px-4 py-3.5">
                          {assignedVehicle ? (
                            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                              <Bus className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>{assignedVehicle.brandModel}</span>
                              <span className="font-mono text-[11px] text-slate-500 font-bold">
                                ({assignedVehicle.plateNumber})
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Автономно на базе</span>
                          )}
                        </td>

                        <td className="hidden sm:table-cell px-4 py-3.5 text-right font-mono text-slate-700 font-medium">
                          {trailer.capacityKg.toLocaleString('ru-RU')} кг
                        </td>

                        <td className="hidden sm:table-cell px-4 py-3.5 text-right font-mono text-slate-700 font-medium">
                          {trailer.volumeM3} м³
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => openTrailerEdit(trailer, e)}
                              title="Редактировать параметры прицепа"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleArchiveTrailer(trailer, e)}
                              title="Удалить прицеп"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTrailers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold">Прицепы не найдены</p>
                        <p className="text-xs text-slate-400 mt-1">Попробуйте изменить параметры поиска или добавить новый прицеп</p>
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
      {/* MODAL: CREATE / EDIT VEHICLE                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {vehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <Bus className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900">
                  {editingVehicleId ? 'Редактировать машину' : 'Добавить машину в автопарк'}
                </h3>
              </div>
              <button
                onClick={() => setVehicleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVehicleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Марка и модель *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehBrandModel}
                    onChange={(e) => setVehBrandModel(e.target.value)}
                    placeholder="Mercedes-Benz Sprinter 516"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Госномер *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehPlateNumber}
                    onChange={(e) => setVehPlateNumber(e.target.value)}
                    placeholder="А 112 ВМ 77"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Гаражный №</label>
                  <input
                    type="text"
                    value={vehGarageNumber}
                    onChange={(e) => setVehGarageNumber(e.target.value)}
                    placeholder="ГАРАЖ-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Мест</label>
                  <input
                    type="number"
                    min={4}
                    max={80}
                    value={vehSeatsCount}
                    onChange={(e) => setVehSeatsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Год выпуска</label>
                  <input
                    type="number"
                    min={2000}
                    max={2026}
                    value={vehYear}
                    onChange={(e) => setVehYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">База приписки</label>
                  <input
                    type="text"
                    value={vehBaseCity}
                    onChange={(e) => setVehBaseCity(e.target.value)}
                    placeholder="Москва, База Север"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Текущий статус</label>
                  <select
                    value={vehStatus}
                    onChange={(e) => setVehStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="ready">Готов к рейсу</option>
                    <option value="in_trip">В рейсе</option>
                    <option value="repair">На ТО / Ремонте</option>
                    <option value="inspection">На осмотре</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Пробег (км)</label>
                  <input
                    type="number"
                    value={vehMileage}
                    onChange={(e) => setVehMileage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Закреплённый водитель</label>
                  <input
                    type="text"
                    value={vehDriverName}
                    onChange={(e) => setVehDriverName(e.target.value)}
                    placeholder="Сергей Васильев"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVehicleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  {editingVehicleId ? 'Сохранить изменения' : 'Добавить машину'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE / EDIT TRAILER                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {trailerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <Truck className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900">
                  {editingTrailerId ? 'Редактировать прицеп' : 'Добавить прицеп в автопарк'}
                </h3>
              </div>
              <button
                onClick={() => setTrailerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTrailerSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Модель прицепа *
                  </label>
                  <input
                    type="text"
                    required
                    value={trlModel}
                    onChange={(e) => setTrlModel(e.target.value)}
                    placeholder="МЗСА 817717 (Тент 3.5м)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Госномер *
                  </label>
                  <input
                    type="text"
                    required
                    value={trlPlateNumber}
                    onChange={(e) => setTrlPlateNumber(e.target.value)}
                    placeholder="АЕ 4412 77"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Гаражный №</label>
                  <input
                    type="text"
                    value={trlGarageNumber}
                    onChange={(e) => setTrlGarageNumber(e.target.value)}
                    placeholder="ПР-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Грузоподъёмность (кг)</label>
                  <input
                    type="number"
                    value={trlCapacityKg}
                    onChange={(e) => setTrlCapacityKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Объём (м³)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={trlVolumeM3}
                    onChange={(e) => setTrlVolumeM3(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">База приписки</label>
                  <input
                    type="text"
                    value={trlBaseCity}
                    onChange={(e) => setTrlBaseCity(e.target.value)}
                    placeholder="Москва, База Север"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Статус прицепа</label>
                  <select
                    value={trlStatus}
                    onChange={(e) => setTrlStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="ready">Готов к рейсу</option>
                    <option value="in_trip">В рейсе</option>
                    <option value="repair">На ТО / Ремонте</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Сцепка с машиной (тягач)
                </label>
                <select
                  value={trlAssignedVehicleId}
                  onChange={(e) => setTrlAssignedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Не прицеплен (автономно на базе)</option>
                  {safeVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brandModel} ({v.plateNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTrailerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  {editingTrailerId ? 'Сохранить изменения' : 'Добавить прицеп'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: DEFECT / НЕИСПРАВНОСТЬ                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {defectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-slate-900">Зафиксировать неисправность</h3>
              </div>
              <button
                onClick={() => setDefectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDefect} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Транспортное средство
                </label>
                <select
                  value={selectedVehicleForDefect}
                  onChange={(e) => setSelectedVehicleForDefect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {safeVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brandModel} ({v.plateNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Описание дефекта или неисправности
                </label>
                <textarea
                  value={defectDescription}
                  onChange={(e) => setDefectDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Люфт в рулевом наконечнике справа, требуется осмотр на подъёмнике..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDefectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
                >
                  Сохранить замечание
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
