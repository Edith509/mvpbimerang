'use client';

import React, { useState } from 'react';
import {
  Bus,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Plus,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  Fuel,
  FileCheck,
  FileText,
  UserCheck,
  Paperclip,
  Eye,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { DocumentAttachment, ServiceRecord } from '@/types';

const STATUS_LABELS = {
  ready: { label: 'Готов к рейсу', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_trip: { label: 'В рейсе', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  repair: { label: 'В ремонте / ТО', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  inspection: { label: 'Осмотр', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
};

export default function FleetPage() {
  const {
    vehicles,
    addIncident,
    resolveIncident,
    currentUser,
    addExpenseRequest,
    accounts,
    toggleEquipmentItem,
    addVehicleDocument,
    addVehicleServiceRecord,
    users,
  } = useApp();

  const isDriver = currentUser.role === 'driver';

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    isDriver ? 'veh_12' : vehicles[0]?.id || 'veh_12'
  );

  const [activeTab, setActiveTab] = useState<'equipment' | 'documents' | 'service' | 'defects'>(
    'equipment'
  );

  // Modals
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [incidentDesc, setIncidentDesc] = useState('');

  // Fuel expense modal
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [fuelAmount, setFuelAmount] = useState('4500');
  const [fuelLiters, setFuelLiters] = useState('70');
  const [fuelStation, setFuelStation] = useState('АЗС Татнефть (Вязьма)');

  // Mechanic parts expense modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [supplierName, setSupplierName] = useState('ООО «Автодок» / ИП Герин');

  // Add document modal
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<'insurance' | 'inspection' | 'service_act' | 'other'>('insurance');
  const [docExpiry, setDocExpiry] = useState('');

  // Service Record modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceTypeLabel, setServiceTypeLabel] = useState('Плановое ТО-150');
  const [serviceMileage, setServiceMileage] = useState('150000');
  const [serviceCost, setServiceCost] = useState('22000');
  const [serviceWorkshop, setServiceWorkshop] = useState('СТО «Магистраль Дизель Сервис»');
  const [serviceDesc, setServiceDesc] = useState('Замена масла ДВС, замена воздушного и топливного фильтров, осмотр подвески');

  // Preview Document Modal
  const [previewDoc, setPreviewDoc] = useState<DocumentAttachment | null>(null);

  const currentVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const assignedDriver = users.find((u) => u.role === 'driver');

  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDesc.trim() || !currentVehicle) return;
    addIncident(currentVehicle.id, incidentDesc.trim());
    setIncidentDesc('');
    setIncidentModalOpen(false);
  };

  const handleAddFuelExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelAmount || !currentVehicle) return;
    const driverAccount = accounts.find((a) => a.id === 'acc_cash_driver') || accounts[0];

    const receiptAttachment: DocumentAttachment = {
      id: `rec_${Date.now()}`,
      title: `Фискальный чек АЗС (${fuelStation})`,
      type: 'receipt',
      typeLabel: 'Кассовый чек с QR',
      fileName: 'check_azs_tatneft_dt70.jpg',
      fileSize: '1.4 MB',
      uploadedBy: `${currentUser.name} (Водитель)`,
      uploadedAt: 'Сегодня, ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      notes: `Заправка ДТ Евро-5: ${fuelLiters} л на ${fuelStation}. Чек с фискальным QR-кодом проверен.`,
    };

    addExpenseRequest({
      accountId: driverAccount.id,
      category: 'fuel',
      categoryLabel: 'Заправка топливом (ДТ)',
      amount: parseFloat(fuelAmount),
      currency: 'RUB',
      description: `ГСМ: ${fuelLiters} л на ${fuelStation} (${currentVehicle.plateNumber})`,
      vehicleId: currentVehicle.id,
      supplierName: fuelStation,
      liters: parseFloat(fuelLiters),
      receiptAttachment,
    });

    setFuelAmount('');
    setFuelModalOpen(false);
    alert('Чек за топливо с фискальным QR-кодом внесен в систему и отправлен бухгалтеру на проверку!');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseDesc.trim()) return;

    const invoiceAttachment: DocumentAttachment = {
      id: `inv_${Date.now()}`,
      title: `Счет-накладная от ${supplierName}`,
      type: 'invoice',
      typeLabel: 'Счет-фактура с печатью',
      fileName: 'schet_nakladnaya_zapchasti.pdf',
      fileSize: '2.5 MB',
      uploadedBy: `${currentUser.name} (Механик)`,
      uploadedAt: 'Сегодня, ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      notes: `Счет от поставщика ${supplierName}. Гарантия на запчасти 12 месяцев.`,
    };

    addExpenseRequest({
      accountId: accounts[0].id,
      category: 'repair',
      categoryLabel: 'Заказ запчастей (Механик)',
      amount: parseFloat(expenseAmount),
      currency: 'RUB',
      description: `${expenseDesc} (${currentVehicle.plateNumber})`,
      vehicleId: currentVehicle.id,
      supplierName,
      receiptAttachment: invoiceAttachment,
    });
    setExpenseAmount('');
    setExpenseDesc('');
    setExpenseModalOpen(false);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !currentVehicle) return;

    const newDoc: DocumentAttachment = {
      id: `vdoc_${Date.now()}`,
      title: docTitle.trim(),
      type: docType as any,
      typeLabel: docType === 'insurance' ? 'Страховка' : docType === 'inspection' ? 'Техосмотр' : 'Документ ТС',
      fileName: `doc_${currentVehicle.plateNumber.replace(/\s/g, '')}.pdf`,
      fileSize: '1.9 MB',
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toLocaleDateString('ru-RU'),
      expiryDate: docExpiry || undefined,
      notes: 'Скан документа проверен и заверен диспетчером',
    };

    addVehicleDocument(currentVehicle.id, newDoc);
    setDocTitle('');
    setDocExpiry('');
    setDocModalOpen(false);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceDesc.trim() || !currentVehicle) return;

    const newRecord: ServiceRecord = {
      id: `srv_${Date.now()}`,
      vehicleId: currentVehicle.id,
      serviceType: 'TO_planned',
      serviceTypeLabel: serviceTypeLabel,
      date: new Date().toLocaleDateString('ru-RU'),
      mileageKm: parseInt(serviceMileage) || currentVehicle.mileageKm,
      workshopName: serviceWorkshop,
      description: serviceDesc,
      cost: parseFloat(serviceCost) || 0,
      performedBy: currentUser.name,
      attachment: {
        id: `srvdoc_${Date.now()}`,
        title: `Заказ-наряд СТО (${serviceWorkshop})`,
        type: 'service_act',
        typeLabel: 'Акт выполненных работ',
        fileName: 'zakaz_naryad_sto_to.pdf',
        fileSize: '2.4 MB',
        uploadedBy: currentUser.name,
        uploadedAt: 'Сегодня',
        notes: `Сумма по заказ-наряду: ${serviceCost} ₽. Работы приняты без замечаний.`,
      },
    };

    addVehicleServiceRecord(currentVehicle.id, newRecord);
    setServiceModalOpen(false);
  };

  const visibleVehicles = isDriver
    ? vehicles.filter((v) => v.id === 'veh_12')
    : vehicles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isDriver ? 'Моя машина' : 'Автопарк'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isDriver
              ? 'Состояние, документы и подготовка к рейсу.'
              : 'Состояние машин, пробег и ближайшее техническое обслуживание.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
          {isDriver && (
            <button
              onClick={() => setFuelModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
            >
              <Fuel className="w-3.5 h-3.5 shrink-0" />
              <span>Чек за заправку</span>
            </button>
          )}

          <button
            onClick={() => setIncidentModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              isDriver
                ? 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Зафиксировать неисправность</span>
          </button>

          {!isDriver && (
            <>
              <button
                onClick={() => setDocModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span>Загрузить документ</span>
              </button>

              <button
                onClick={() => setExpenseModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                <Wrench className="w-3.5 h-3.5 shrink-0" />
                <span>Запрос запчастей</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs sm:min-w-[680px]">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-2 py-3 font-semibold sm:px-4">Транспорт</th>
              <th className="px-2 py-3 font-semibold sm:px-4">Статус</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Местоположение</th>
              <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Пробег</th>
              <th className="hidden px-4 py-3 text-right font-semibold lg:table-cell">До ТО</th>
              <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Комплектация</th>
              <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Неисправности</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {visibleVehicles.map((vehicle) => {
              const statusInfo = STATUS_LABELS[vehicle.status] || STATUS_LABELS.ready;
              const isSelected = vehicle.id === currentVehicle.id;
              const openIncidentsCount = (vehicle.incidents || []).filter((incident) => incident.status !== 'resolved').length;
              const equipment = vehicle.equipment || [];
              const missingCount = equipment.filter((item) => item.status === 'missing').length;

              return (
                <tr
                  key={vehicle.id}
                  tabIndex={0}
                  aria-selected={isSelected}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedVehicleId(vehicle.id);
                    }
                  }}
                  className={`cursor-pointer outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500 ${
                    isSelected ? 'bg-red-50/40' : ''
                  }`}
                >
                  <td className={`border-l-2 px-2 py-3 sm:px-4 ${isSelected ? 'border-red-600' : 'border-transparent'}`}>
                    <span className="block font-semibold text-slate-900">{vehicle.brandModel}</span>
                    <span className="mt-0.5 block font-mono text-[11px] text-slate-500">
                      {vehicle.plateNumber} · {vehicle.seatsCount} мест · {vehicle.year} г.
                    </span>
                  </td>
                  <td className="px-2 py-3 sm:px-4">
                    <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold ${statusInfo.badge}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="hidden max-w-[240px] truncate px-4 py-3 text-slate-600 md:table-cell">
                    {vehicle.currentLocation}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-slate-700 sm:table-cell">
                    {vehicle.mileageKm.toLocaleString('ru-RU')} км
                  </td>
                  <td className={`hidden px-4 py-3 text-right tabular-nums lg:table-cell ${
                    vehicle.nextServiceKm - vehicle.mileageKm <= 5000 ? 'font-semibold text-amber-700' : 'text-slate-700'
                  }`}>
                    {(vehicle.nextServiceKm - vehicle.mileageKm).toLocaleString('ru-RU')} км
                  </td>
                  <td className={`hidden px-4 py-3 text-right tabular-nums sm:table-cell ${
                    missingCount ? 'font-semibold text-amber-700' : 'text-slate-600'
                  }`}>
                    {equipment.length - missingCount}/{equipment.length}
                  </td>
                  <td className={`hidden px-4 py-3 text-right tabular-nums sm:table-cell ${
                    openIncidentsCount ? 'font-semibold text-amber-700' : 'text-slate-500'
                  }`}>
                    {openIncidentsCount || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SELECTED VEHICLE DETAILED HUB WITH TABS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-6">
        {/* Hub Header & Driver Credentials */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded border border-red-100">
                {currentVehicle.plateNumber}
              </span>
              <h2 className="text-lg font-bold text-slate-900">{currentVehicle.brandModel}</h2>
              <span className="text-xs text-slate-500">({currentVehicle.year} г.в.)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              База приписки: <b>Москва, Север</b> • Пробег: <b>{currentVehicle.mileageKm.toLocaleString('ru-RU')} км</b>
            </p>
          </div>

          {/* Assigned Driver Passport & License Widget */}
          {assignedDriver && (
            <div className="flex items-center gap-2 text-xs">
              <UserCheck className="w-4 h-4 shrink-0 text-slate-500" />
              <div>
                <div className="font-bold text-slate-900 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>Экипаж: {assignedDriver.name}</span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Кат. {assignedDriver.driverCredentials?.categories.join(', ')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-2">
                  <span>В/У: <b>{assignedDriver.driverCredentials?.licenseNumber}</b></span>
                  <span>•</span>
                  <span>Действительно до: <b>{assignedDriver.driverCredentials?.licenseExpiry}</b></span>
                  <span>•</span>
                  <span>Медкомиссия до: <b>{assignedDriver.driverCredentials?.medCertExpiry}</b></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HUB NAVIGATION TABS */}
        <div className="grid grid-cols-2 items-center gap-1.5 border-b border-slate-200 pb-2 sm:flex sm:overflow-x-auto sm:scrollbar-none -mx-1 px-1">
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex w-full justify-center px-2.5 py-2 border-b-2 text-xs font-semibold transition-colors whitespace-nowrap sm:w-auto sm:shrink-0 ${
              activeTab === 'equipment'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Чек-лист ({(currentVehicle?.equipment || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex w-full justify-center px-2.5 py-2 border-b-2 text-xs font-semibold transition-colors whitespace-nowrap sm:w-auto sm:shrink-0 ${
              activeTab === 'documents'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Документы ({(currentVehicle?.documents || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('service')}
            className={`flex w-full justify-center px-2.5 py-2 border-b-2 text-xs font-semibold transition-colors whitespace-nowrap sm:w-auto sm:shrink-0 ${
              activeTab === 'service'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>История ТО ({(currentVehicle?.serviceRecords || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('defects')}
            className={`flex w-full justify-center px-2.5 py-2 border-b-2 text-xs font-semibold transition-colors whitespace-nowrap sm:w-auto sm:shrink-0 ${
              activeTab === 'defects'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Поломки ({(currentVehicle?.incidents || []).length})</span>
          </button>
        </div>

        {/* TAB 1: EQUIPMENT CHECKLIST */}
        {activeTab === 'equipment' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-500">
                Обязательное оснащение для рейсов РФ — РБ. Нажимайте на статус для отметки фактического наличия.
              </span>
              <span className="self-start whitespace-nowrap rounded bg-emerald-50 px-2 py-1 font-bold text-emerald-700 sm:self-auto">
                Проверено перед выездом
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {(currentVehicle?.equipment || []).map((eq) => {
                const isPresent = eq.status === 'present';
                return (
                  <div key={eq.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold leading-snug text-slate-800">{eq.name}</span>
                        {eq.required && (
                          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-normal text-slate-600">
                            Обязательно
                          </span>
                        )}
                      </div>
                      {eq.checkedAt && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Проверил: {eq.checkedBy} ({eq.checkedAt})
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => toggleEquipmentItem(currentVehicle.id, eq.id)}
                      className={`flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                        isPresent
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {isPresent ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>В наличии</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5 text-red-700" />
                          <span>Отсутствует</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: VEHICLE DOCUMENTS & INSURANCE */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-500">
                Официальные документы ТС. Система отслеживает сроки действия страховок и техосмотра.
              </span>
              {!isDriver && (
                <button
                  onClick={() => setDocModalOpen(true)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Загрузить новый документ</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {(currentVehicle?.documents || []).map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                        {doc.typeLabel}
                      </span>
                      {doc.expiryDate && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                          До {doc.expiryDate}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">{doc.title}</h4>
                    {doc.notes && (
                      <p className="text-[11px] text-slate-500 mt-1">{doc.notes}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{doc.fileName} ({doc.fileSize})</span>
                    <button
                      onClick={() => setPreviewDoc(doc)}
                    className="text-red-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Скан</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SERVICE HISTORY & MAINTENANCE ACTS */}
        {activeTab === 'service' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-500">
                Журнал прохождения регламентных ТО и ремонтов на сервисных станциях (СТО).
              </span>
              {!isDriver && (
                <button
                  onClick={() => setServiceModalOpen(true)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Внести запись ТО с заказ-нарядом</span>
                </button>
              )}
            </div>

            {(currentVehicle?.serviceRecords || []).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-xs text-slate-500">
                Записей ТО по данной машине пока нет.
              </div>
            ) : (
              <div className="space-y-3">
                {(currentVehicle?.serviceRecords || []).map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {srv.serviceTypeLabel}
                        </span>
                        <span className="font-mono text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded font-semibold text-slate-700">
                          {srv.mileageKm.toLocaleString('ru-RU')} км
                        </span>
                        <span className="text-[10px] text-slate-400">{srv.date}</span>
                      </div>
                      <p className="text-slate-700">{srv.description}</p>
                      <div className="text-[10px] text-slate-400">
                        Сервис: <b>{srv.workshopName}</b> • Принял: {srv.performedBy}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      {srv.attachment && (
                        <button
                          onClick={() => setPreviewDoc(srv.attachment!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 font-semibold"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                          <span>Заказ-наряд ({srv.attachment.fileSize})</span>
                        </button>
                      )}

                      <div className="text-right">
                        <span className="font-bold text-sm text-slate-900 block">
                          {srv.cost.toLocaleString('ru-RU')} ₽
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium">Оплачено</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DEFECTS & BREAKDOWNS */}
        {activeTab === 'defects' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-500">
                Все зафиксированные неисправности (треснувшие фары, ступичные подшипники, колеса).
              </span>
              <button
                onClick={() => setIncidentModalOpen(true)}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Зафиксировать дефект</span>
              </button>
            </div>

            {(currentVehicle?.incidents || []).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-xs text-slate-500">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Замечаний нет</p>
                <p className="text-slate-400 mt-0.5">Машина полностью проверена и исправна.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {(currentVehicle?.incidents || []).map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-slate-900 leading-snug">
                        {inc.description}
                      </span>
                      {inc.status === 'resolved' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Устранено
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                          Требует ремонта
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span>Зафиксировал: <b>{inc.reportedBy}</b></span>
                      <span>{inc.reportedAt}</span>
                    </div>

                    {inc.status !== 'resolved' && (
                      <button
                        onClick={() => resolveIncident(currentVehicle.id, inc.id)}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors"
                      >
                        Отметить устраненной (машина готова к рейсу)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-y-contain bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewDoc.title}</h3>
                  <p className="text-[11px] text-slate-500">
                    Файл: {previewDoc.fileName} • {previewDoc.fileSize}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* MOCK SCAN / DOCUMENT CANVAS */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-5 font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center border-b border-slate-300 pb-2">
                <div className="font-bold text-sm tracking-tight uppercase">
                  {previewDoc.title}
                </div>
                <div className="text-[10px] text-slate-500">
                  Транспортное средство: {currentVehicle.brandModel} ({currentVehicle.plateNumber})
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                {previewDoc.expiryDate && (
                  <div className="flex justify-between">
                    <span>СРОК ДЕЙСТВИЯ:</span>
                    <span className="font-bold text-emerald-700">ДО {previewDoc.expiryDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ЗАГРУЗИЛ:</span>
                  <span className="font-bold">{previewDoc.uploadedBy}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>ДАТА ЗАГРУЗКИ:</span>
                  <span>{previewDoc.uploadedAt}</span>
                </div>
              </div>

              {previewDoc.notes && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 font-sans">
                  <b>Служебная отметка:</b> {previewDoc.notes}
                </div>
              )}

              <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-sans">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-8 h-8 text-slate-700" />
                  <span>ЭЦП проверена • Скан в облаке</span>
                </div>
                <span className="text-emerald-700 font-bold uppercase tracking-wider text-[9px]">
                  ✓ ДОКУМЕНТ ВЕРИФИЦИРОВАН
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FUEL RECEIPT MODAL FOR DRIVER */}
      {fuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-y-contain bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 text-xs shadow-2xl sm:p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Внести чек за заправку (ГСМ) с фото
            </h3>
            <p className="text-slate-500 mb-4">
              Машина: {currentVehicle.plateNumber} ({currentVehicle.brandModel})
            </p>

            <form onSubmit={handleAddFuelExpense} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Сумма чека (RUB)</label>
                  <input
                    type="number"
                    required
                    value={fuelAmount}
                    onChange={(e) => setFuelAmount(e.target.value)}
                    placeholder="4500"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Литры ДТ</label>
                  <input
                    type="number"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    placeholder="70"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">АЗС / Местоположение</label>
                <input
                  type="text"
                  required
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  placeholder="АЗС Татнефть (Вязьма)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              {/* Photo proof simulation badge */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <Paperclip className="w-4 h-4 text-emerald-700" />
                  <span>Фото чека с QR-кодом прикреплено</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                  check_tatneft.jpg (1.4 MB)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFuelModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Отправить бухгалтеру с чеком
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD VEHICLE DOCUMENT MODAL */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-y-contain bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 text-xs shadow-2xl sm:p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Загрузить документ на машину
            </h3>
            <p className="text-slate-500 mb-4">
              Машина: {currentVehicle.plateNumber} ({currentVehicle.brandModel})
            </p>

            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Название документа
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Например: Полис КАСКО / Зеленая карта"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Тип документа</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  >
                    <option value="insurance">Страховка (ОСАГО / КАСКО)</option>
                    <option value="inspection">Диагностическая карта (ТО)</option>
                    <option value="service_act">Акт выполненных работ СТО</option>
                    <option value="other">Прочий документ ТС</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Срок действия (до)
                  </label>
                  <input
                    type="text"
                    value={docExpiry}
                    onChange={(e) => setDocExpiry(e.target.value)}
                    placeholder="15.11.2027"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                <Paperclip className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <span className="text-slate-600 font-semibold block">Файл скана прикреплен</span>
                <span className="text-[10px] text-slate-400">PDF / JPG до 20 МБ</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Сохранить в карточку ТС
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SERVICE RECORD MODAL */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-y-contain bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 text-xs shadow-2xl sm:p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Внести запись о ТО / СТО с заказ-нарядом
            </h3>
            <p className="text-slate-500 mb-4">
              Машина: {currentVehicle.plateNumber} ({currentVehicle.brandModel})
            </p>

            <form onSubmit={handleAddService} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Название ТО / Работ</label>
                  <input
                    type="text"
                    required
                    value={serviceTypeLabel}
                    onChange={(e) => setServiceTypeLabel(e.target.value)}
                    placeholder="Плановое ТО-150"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Пробег (км)</label>
                  <input
                    type="number"
                    required
                    value={serviceMileage}
                    onChange={(e) => setServiceMileage(e.target.value)}
                    placeholder="150000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">СТО / Сервис</label>
                  <input
                    type="text"
                    required
                    value={serviceWorkshop}
                    onChange={(e) => setServiceWorkshop(e.target.value)}
                    placeholder="СТО Магистраль"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Стоимость (RUB)</label>
                  <input
                    type="number"
                    required
                    value={serviceCost}
                    onChange={(e) => setServiceCost(e.target.value)}
                    placeholder="22000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Перечень работ</label>
                <textarea
                  required
                  rows={2}
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Замена масла, фильтров, колодок..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <Paperclip className="w-4 h-4 text-emerald-700" />
                  <span>Заказ-наряд с круглой печатью СТО прикреплен</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                  zakaz_naryad.pdf (2.4 MB)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Сохранить в историю ТО
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MECHANIC PARTS MODAL */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-y-contain bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 text-xs shadow-2xl sm:p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Запрос средств на запчасти со счетом от поставщика
            </h3>
            <p className="text-slate-500 mb-4">
              Заявка с прикрепленным счетом уйдет бухгалтеру на согласование.
            </p>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Сумма по счету (RUB)</label>
                  <input
                    type="number"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="18500"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Поставщик</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="ООО Автодок / ИП Герин"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Артикулы и наименование запчастей
                </label>
                <input
                  type="text"
                  required
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Диски Textar 92144303 + колодки Ferodo"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <Paperclip className="w-4 h-4 text-emerald-700" />
                  <span>Счет-фактура № АД-408/М прикреплена</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                  schet_autodoc.pdf (2.8 MB)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Отправить бухгалтеру со счетом
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INCIDENT MODAL */}
      {incidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-y-contain bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 text-xs shadow-2xl sm:p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Зафиксировать неисправность</h3>
            <p className="text-slate-500 mb-4">
              Транспорт: {currentVehicle.plateNumber} ({currentVehicle.brandModel})
            </p>

            <form onSubmit={handleAddIncident} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Что именно сломалось или повреждено?
                </label>
                <textarea
                  required
                  rows={3}
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Например: Треснула задняя правая фара при погрузке багажа"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIncidentModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Зафиксировать в системе
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
