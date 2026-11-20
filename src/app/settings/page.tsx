'use client';

import React, { useState } from 'react';
import {
  Settings,
  Building,
  MessageSquare,
  Bot,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  Link2,
} from 'lucide-react';
import { useApp } from '@/lib/store';

export default function SettingsPage() {
  const { company, resetToDemo } = useApp();
  const [name, setName] = useState(company.name);
  const [currency, setCurrency] = useState(company.currency);
  const [timezone, setTimezone] = useState(company.timezone);
  const [supportPhone, setSupportPhone] = useState(company.supportPhone);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    company.name = name;
    company.currency = currency as any;
    company.timezone = timezone;
    company.supportPhone = supportPhone;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
          <Settings className="w-4 h-4" />
          <span>Конфигурация платформы</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Настройки рабочего пространства
        </h1>
        <p className="text-sm text-slate-500">
          Параметры компании, валюты расчетов, подключение Telegram-ботов и рабочих чатов.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Настройки компании успешно сохранены!
        </div>
      )}

      {/* COMPANY GENERAL SETTINGS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Профиль перевозчика</h3>
            <p className="text-xs text-slate-500">
              Данные отображаются в маршрутных листах и билетах пассажиров
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Название компании (бренд)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Основная валюта отчетов
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
              >
                <option value="RUB">RUB (Российский рубль, ₽)</option>
                <option value="BYN">BYN (Белорусский рубль)</option>
                <option value="KZT">KZT (Казахстанский тенге, ₸)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Часовой пояс базы</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Телефон диспетчера</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm shadow-red-500/20 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить профиль</span>
            </button>
          </div>
        </form>
      </div>

      {/* TELEGRAM BOT & WORK GROUPS INTEGRATION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Интеграция с Telegram</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Активно
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Сотрудники работают через бот, не перенося данные в таблицы вручную
              </p>
            </div>
          </div>
          <span className="self-start break-all rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-semibold text-blue-600 sm:self-auto">
            @BumerangTransBot
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3">
            <div className="font-semibold text-slate-800 flex items-start gap-2">
              <Link2 className="w-4 h-4 text-slate-500" />
              Привязанные рабочие группы Telegram:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900">Группа «Автопарк и Механики»</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Привязана к разделу «Автопарк»</div>
                </div>
                <span className="self-start shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:self-auto">
                  Подключено
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900">Группа «Рейсы Москва — Минск»</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Привязана к рейсам и водителям</div>
                </div>
                <span className="self-start shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:self-auto">
                  Подключено
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-50/60 border border-red-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Sparkles className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900">AI-ассистент обработки запросов</h4>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Распознает голосовые и текстовые сообщения водителей и механиков (поломки, остановки, брони)
                </p>
              </div>
            </div>
            <span className="shrink-0 self-start text-xs font-bold text-red-700 sm:self-auto">Включен</span>
          </div>
        </div>
      </div>
    </div>
  );
}
