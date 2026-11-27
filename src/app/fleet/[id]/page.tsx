'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Bus,
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText,
  FileCheck,
  Wrench,
  Fuel,
  Plus,
  Shield,
  Clock,
  User,
  Check,
  X,
  Upload,
  Maximize2,
  ChevronRight,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { VehicleStatus } from '@/types';

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

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { vehicles, currentUser, toggleEquipmentItem, addIncident, resolveIncident, addVehicleDocument, addExpenseRequest } =
    useApp();

  const vehicleId = params?.id as string;
  const vehicle = vehicles.find((v) => v.id === vehicleId) || vehicles[0];

  const [activeTab, setActiveTab] = useState<'equipment' | 'documents' | 'service' | 'defects'>('equipment');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Modals
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [incidentText, setIncidentText] = useState('');
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [fuelLiters, setFuelLiters] = useState(65);
  const [fuelAmount, setFuelAmount] = useState(4200);
  const [fuelStation, setFuelStation] = useState('Татнефть АЗС № 214');

  // Preview Doc Modal
  const [selectedDocPreview, setSelectedDocPreview] = useState<any | null>(null);

  if (!vehicle) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm text-slate-600">Автомобиль не найден.</p>
        <Link href="/fleet" className="text-xs text-red-600 font-semibold mt-2 inline-block">
          ← Вернуться в автопарк
        </Link>
      </div>
    );
  }

  const isDriver = currentUser.role === 'driver';
  const statusInfo = STATUS_LABELS[vehicle.status] || STATUS_LABELS.ready;
  const photos = vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos : [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
  ];

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentText.trim()) return;
    addIncident(vehicle.id, incidentText.trim(), currentUser.name);
    setIncidentText('');
    setIncidentModalOpen(false);
  };

  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpenseRequest({
      accountId: 'acc_cash',
      category: 'fuel',
      categoryLabel: 'ГСМ / Заправка водителем',
      amount: fuelAmount,
      currency: 'RUB',
      description: `Дизель ${fuelLiters} л на ${fuelStation} (${vehicle.brandModel} ${vehicle.plateNumber})`,
      vehicleId: vehicle.id,
      supplierName: fuelStation,
      liters: fuelLiters,
    });
    setFuelModalOpen(false);
    alert('Чек заправки отправлен на согласование бухгалтеру!');
  };

  const missingEquipmentCount = (vehicle.equipment || []).filter((e) => e.status === 'missing').length;
  const openIncidentsCount = (vehicle.incidents || []).filter((i) => i.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      {/* ── BREADCRUMBS & TOP BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
          <Link href="/fleet" className="hover:text-red-600 transition-colors flex items-center gap-1 font-medium shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Автопарк</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-[340px]">
            {vehicle.brandModel} ({vehicle.plateNumber})
          </span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          {isDriver && (
            <button
              onClick={() => setFuelModalOpen(true)}
              className="btn-primary px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Чек заправки</span>
            </button>
          )}

          <button
            onClick={() => setIncidentModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 text-center cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="sm:hidden">Поломка</span>
            <span className="hidden sm:inline">Зафиксировать неисправность</span>
          </button>

          {!isDriver && (
            <button
              onClick={() => setDocModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 text-center cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="sm:hidden">Документ</span>
              <span className="hidden sm:inline">Загрузить документ</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3.2. ПРОФИЛЬ АВТОМОБИЛЯ: ФОТОГАЛЕРЕЯ + ХАРАКТЕРИСТИКИ ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* LEFT: ФОТОГАЛЕРЕЯ (5 cols) */}
          <div className="lg:col-span-5 p-5 space-y-3 bg-slate-50/50">
            {/* Main Photo Preview */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-inner group">
              <img
                src={photos[selectedPhotoIndex] || photos[0]}
                alt={vehicle.brandModel}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                <span className="text-xs font-bold drop-shadow-sm">
                  {vehicle.brandModel}
                </span>
                <span className="text-[10px] font-mono bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  {selectedPhotoIndex + 1} из {photos.length} фото
                </span>
              </div>
            </div>

            {/* Thumbnail selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {photos.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    selectedPhotoIndex === idx
                      ? 'border-red-600 ring-2 ring-red-200'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="Миниатюра" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: ОСНОВНЫЕ ДАННЫЕ И ПАСПОРТ (7 cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-4">
            <div>
              {/* Header: Title & Plate */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    {/* Russian Plate Badge */}
                    <div className="inline-flex items-center border-2 border-slate-800 rounded-md bg-white px-2.5 py-0.5 shadow-2xs">
                      <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                        {vehicle.plateNumber}
                      </span>
                      <span className="ml-1.5 pl-1.5 border-l border-slate-300 text-[9px] font-bold text-slate-600 flex items-center gap-0.5">
                        RUS
                        <span className="w-2.5 h-1.5 bg-red-600 inline-block rounded-2xs" />
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                      {statusInfo.label}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {vehicle.brandModel}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {vehicle.year} год выпуска · {vehicle.seatsCount} посадочных мест · {vehicle.type === 'minibus' ? 'Микроавтобус M2' : 'Автобус M3'}
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs">
                  <span className="text-slate-400 block text-[11px]">Гаражный номер</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {vehicle.garageNumber || 'ГАРАЖ-012'}
                  </span>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <span className="text-[11px] text-slate-400 block">База приписки</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                    {vehicle.baseCity || 'Москва (База Север)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <span className="text-[11px] text-slate-400 block">Текущая локация</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                    {vehicle.currentLocation}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <span className="text-[11px] text-slate-400 block">Закреплённый экипаж</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                    {vehicle.assignedDriverName || 'Сергей Васильев'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <span className="text-[11px] text-slate-400 block">Общий пробег</span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                    {vehicle.mileageKm.toLocaleString('ru-RU')} км
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <span className="text-[11px] text-slate-400 block">До планового ТО</span>
                  <span className={`font-mono font-bold mt-0.5 block ${
                    vehicle.nextServiceKm - vehicle.mileageKm <= 5000 ? 'text-amber-600' : 'text-slate-900'
                  }`}>
                    {(vehicle.nextServiceKm - vehicle.mileageKm).toLocaleString('ru-RU')} км
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <span className="text-[11px] text-slate-400 block">VIN номер</span>
                  <span className="font-mono text-[11px] text-slate-700 mt-0.5 block truncate">
                    {vehicle.vin || 'WDB9066571S123456'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick condition summary bar */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 min-w-0">
                <span className="flex items-center gap-1.5 font-medium text-slate-700 whitespace-nowrap">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  Комплектация: <b>{(vehicle.equipment || []).length - missingEquipmentCount}/{(vehicle.equipment || []).length}</b>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-700 whitespace-nowrap">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  Документы: <b>{(vehicle.documents || []).length} загружено</b>
                </span>
              </div>

              <div className="self-start sm:self-auto shrink-0 pt-0.5 sm:pt-0">
                {openIncidentsCount > 0 ? (
                  <span className="font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1 whitespace-nowrap">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Неисправностей: {openIncidentsCount}
                  </span>
                ) : (
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1 whitespace-nowrap">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    Без замечаний
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS: ЧЕК-ЛИСТ / ДОКУМЕНТЫ / ИСТОРИЯ ТО / ДЕФЕКТЫ ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 sm:p-6 space-y-4 sm:space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          {[
            { id: 'equipment', label: `Чек-лист (${(vehicle.equipment || []).length})`, fullLabel: `Чек-лист оснащения (${(vehicle.equipment || []).length})`, icon: FileCheck },
            { id: 'documents', label: `Документы (${(vehicle.documents || []).length})`, fullLabel: `Документы машины (${(vehicle.documents || []).length})`, icon: FileText },
            { id: 'service', label: `История ТО (${(vehicle.serviceRecords || []).length})`, fullLabel: `История ТО и СТО (${(vehicle.serviceRecords || []).length})`, icon: Wrench },
            { id: 'defects', label: `Поломки (${(vehicle.incidents || []).length})`, fullLabel: `Поломки и дефекты (${(vehicle.incidents || []).length})`, icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden">{tab.label}</span>
                <span className="hidden sm:inline">{tab.fullLabel}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: EQUIPMENT CHECKLIST ── */}
        {activeTab === 'equipment' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-slate-500 text-[11px] sm:text-xs">
                Обязательная комплектация перед выездом в рейс:
              </span>
              <span className={`font-bold whitespace-nowrap text-[11px] sm:text-xs ${missingEquipmentCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {missingEquipmentCount > 0 ? `Не хватает: ${missingEquipmentCount} предм.` : 'Всё в наличии (8/8)'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {(vehicle.equipment || []).map((eq) => {
                const isPresent = eq.status === 'present';
                return (
                  <div
                    key={eq.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs transition-colors ${
                      isPresent ? 'bg-slate-50/60 border-slate-200' : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {isPresent ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold text-xs leading-snug break-words ${isPresent ? 'text-slate-800' : 'text-amber-900'}`}>
                          {eq.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {eq.checkedAt} · {eq.checkedBy}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleEquipmentItem(vehicle.id, eq.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                        isPresent
                          ? 'text-slate-500 hover:text-red-600 hover:bg-red-50 active:bg-red-100'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                      }`}
                    >
                      <span className="sm:hidden">{isPresent ? 'Снять' : 'В наличии'}</span>
                      <span className="hidden sm:inline">{isPresent ? 'Отметить отсутствие' : 'Отметить наличие'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: VEHICLE DOCUMENTS ── */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
              <span className="text-slate-500">
                Паспорта ТС, страховки и диагностические карты:
              </span>
              <button
                onClick={() => setDocModalOpen(true)}
                className="btn-primary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить документ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {(vehicle.documents || []).map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {doc.typeLabel}
                      </span>
                      {doc.expiryDate && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                          до {doc.expiryDate}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                    {doc.notes && <p className="text-[11px] text-slate-500 mt-1">{doc.notes}</p>}
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{doc.fileName}</span>
                    <button
                      onClick={() => setSelectedDocPreview(doc)}
                      className="text-red-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Скан</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: SERVICE HISTORY (СТО) ── */}
        {activeTab === 'service' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="text-slate-500">
                Журнал регламентных ТО и выполненных ремонтов:
              </span>
              <span className="font-mono text-slate-600">
                ТО каждые 15 000 км
              </span>
            </div>

            {(vehicle.serviceRecords || []).length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Записей о ремонтах нет. Автомобиль обслуживается по регламенту.
              </div>
            ) : (
              <div className="space-y-2.5">
                {(vehicle.serviceRecords || []).map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">
                          {srv.serviceTypeLabel}
                        </span>
                        <span className="font-mono text-slate-500">{srv.date}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {srv.mileageKm.toLocaleString('ru-RU')} км
                        </span>
                      </div>
                      <p className="font-bold text-slate-900">{srv.workshopName}</p>
                      <p className="text-slate-600 mt-0.5">{srv.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-900 font-mono block">
                        {srv.cost.toLocaleString('ru-RU')} ₽
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Мастер: {srv.performedBy}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: DEFECTS & INCIDENTS ── */}
        {activeTab === 'defects' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
              <span className="text-slate-500">
                Зафиксированные дефекты и неисправности:
              </span>
              <button
                onClick={() => setIncidentModalOpen(true)}
                className="btn-primary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Зафиксировать поломку</span>
              </button>
            </div>

            {(vehicle.incidents || []).length === 0 ? (
              <div className="p-8 text-center text-emerald-700 bg-emerald-50/60 rounded-xl border border-emerald-200/60 text-xs">
                ✓ Открытых неисправностей и поломок не зафиксировано. Машина полностью исправна.
              </div>
            ) : (
              <div className="space-y-2.5">
                {(vehicle.incidents || []).map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-red-100 text-red-800">
                          {inc.status === 'resolved' ? 'Устранено' : 'Требует внимания'}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{inc.reportedAt}</span>
                      </div>
                      <p className="font-bold text-slate-900">{inc.description}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Сообщил: {inc.reportedBy}</p>
                    </div>

                    {inc.status !== 'resolved' && (
                      <button
                        onClick={() => resolveIncident(vehicle.id, inc.id)}
                        className="btn-primary px-3 py-1.5 text-xs font-semibold shrink-0"
                      >
                        Отметить устранённой
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL: ЗАФИКСИРОВАТЬ НЕИСПРАВНОСТЬ ── */}
      {incidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Зафиксировать неисправность ({vehicle.plateNumber})
              </h3>
              <button onClick={() => setIncidentModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIncidentSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Описание дефекта или неисправности:
                </label>
                <textarea
                  rows={3}
                  required
                  value={incidentText}
                  onChange={(e) => setIncidentText(e.target.value)}
                  placeholder="Например: Треснула задняя правая фара при маневрировании на стоянке..."
                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIncidentModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary px-5 py-2 font-semibold">
                  Зафиксировать в системе
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ЧЕК ЗА ЗАПРАВКУ ── */}
      {fuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Внести чек за заправку ({vehicle.plateNumber})
              </h3>
              <button onClick={() => setFuelModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFuelSubmit} className="space-y-3.5">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">АЗС / Поставщик:</label>
                <input
                  type="text"
                  required
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Литров дизеля:</label>
                  <input
                    type="number"
                    required
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Сумма (₽):</label>
                  <input
                    type="number"
                    required
                    value={fuelAmount}
                    onChange={(e) => setFuelAmount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px]">
                Чек с QR-кодом с АЗС прикрепляется и автоматически уходит в раздел «Финансы» на подтверждение бухгалтеру.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFuelModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary px-5 py-2 font-semibold">
                  Отправить в бухгалтерию
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ДОБАВИТЬ ДОКУМЕНТ ── */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Прикрепить документ к машине ({vehicle.plateNumber})
              </h3>
              <button onClick={() => setDocModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Тип документа:</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900">
                  <option>СТС (Свидетельство о регистрации)</option>
                  <option>Полис ОСАГО РФ</option>
                  <option>Зелёная карта (Беларусь)</option>
                  <option>Диагностическая карта (Техосмотр)</option>
                  <option>Калибровка тахографа (СКЗИ)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Файл скана или фото:</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center text-slate-500 hover:bg-slate-50 cursor-pointer">
                  <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                  <span>Нажмите для выбора файла (PDF, JPG, PNG)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addVehicleDocument(vehicle.id, {
                      id: `vdoc_${Date.now()}`,
                      title: 'Полис страхования ОСАГО (Новый)',
                      type: 'insurance',
                      typeLabel: 'Страховка',
                      fileName: 'osago_scan_new.pdf',
                      fileSize: '1.4 MB',
                      uploadedBy: currentUser.name,
                      uploadedAt: 'Сегодня',
                      expiryDate: '25.11.2027',
                    });
                    setDocModalOpen(false);
                  }}
                  className="btn-primary px-5 py-2 font-semibold"
                >
                  Загрузить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ПРОСМОТР СКАНА ДОКУМЕНТА ── */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedDocPreview.title}</h3>
                <p className="text-[11px] text-slate-500">{selectedDocPreview.fileName} · {selectedDocPreview.fileSize || '1.2 MB'}</p>
              </div>
              <button onClick={() => setSelectedDocPreview(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Stamp & Preview Simulation */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 text-slate-800 space-y-3 font-mono text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold">РОССИЙСКАЯ ФЕДЕРАЦИЯ</span>
                <span className="text-slate-500">ДОКУМЕНТ ВЕРИФИЦИРОВАН</span>
              </div>
              <p>ТРАНСПОРТНОЕ СРЕДСТВО: <b>{vehicle.brandModel}</b></p>
              <p>ГОСУДАРСТВЕННЫЙ РЕГИСТРАЦИОННЫЙ ЗНАК: <b>{vehicle.plateNumber}</b></p>
              <p>VIN: <b>{vehicle.vin || 'WDB9066571S123456'}</b></p>
              <p>СОБСТВЕННИК: <b>ООО «Бумеранг Транс Лайн»</b></p>
              {selectedDocPreview.expiryDate && (
                <p className="text-emerald-700 font-bold">СРОК ДЕЙСТВИЯ: ДО {selectedDocPreview.expiryDate}</p>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDocPreview(null)}
                className="btn-secondary px-5 py-2 text-xs font-semibold"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Eye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
