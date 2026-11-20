'use client';

import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Role } from '@/types';

export default function TeamPage() {
  const { users, currentUser, switchUserRole } = useApp();

  const PERMISSIONS_MATRIX = [
    {
      feature: 'Создание и редактирование рейсов',
      admin: true,
      logist: true,
      driver: false,
      mechanic: false,
      accountant: false,
    },
    {
      feature: 'Бронирование мест и оформление билетов',
      admin: true,
      logist: true,
      driver: false,
      mechanic: false,
      accountant: false,
    },
    {
      feature: 'Отметка прохождения контрольных точек',
      admin: true,
      logist: true,
      driver: true,
      mechanic: false,
      accountant: false,
    },
    {
      feature: 'Фиксация поломок и неисправностей автопарка',
      admin: true,
      logist: true,
      driver: true,
      mechanic: true,
      accountant: false,
    },
    {
      feature: 'Запрос средств на ремонт / запчасти',
      admin: true,
      logist: false,
      driver: true,
      mechanic: true,
      accountant: false,
    },
    {
      feature: 'Подтверждение финансовых операций и расходов',
      admin: true,
      logist: false,
      driver: false,
      mechanic: false,
      accountant: true,
    },
    {
      feature: 'Управление сотрудниками и правами доступа',
      admin: true,
      logist: false,
      driver: false,
      mechanic: false,
      accountant: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Разграничение прав и роли</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Команда и матрица доступа
          </h1>
          <p className="text-sm text-slate-500">
            Механик не может менять финансовые отчеты напрямую, но может запросить согласование. Логист управляет рассадкой, а водитель — точками маршрута.
          </p>
        </div>

        {/* Current user badge */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-sm text-xs">
          <span className="text-slate-400">Активная роль:</span>
          <span className="font-bold text-red-600">{currentUser.roleLabel}</span>
          <span className="text-slate-500">({currentUser.name})</span>
        </div>
      </div>

      {/* TEAM MEMBERS GRID */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Сотрудники компании ({users.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => {
            const isCurrent = u.id === currentUser.id;
            return (
              <div
                key={u.id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  isCurrent
                    ? 'border-red-500 ring-2 ring-red-500/20 shadow-md'
                    : 'border-slate-200/80 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{u.name}</h4>
                      <span className="text-[11px] font-semibold text-red-600 block">
                        {u.roleLabel}
                      </span>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                      Вы
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1 text-slate-500">
                  <div>Телефон: <span className="text-slate-800 font-medium">{u.phone}</span></div>
                  <div>Email: <span className="text-slate-800 font-medium">{u.email}</span></div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[10px] text-slate-400">Для показа клиенту:</span>
                  <button
                    onClick={() => switchUserRole(u.role)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-red-50 hover:bg-red-100 text-red-700'
                    }`}
                  >
                    {isCurrent ? 'Активен' : 'Войти под ролью'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PERMISSIONS MATRIX TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
      <div className="flex flex-col gap-2 pb-4 border-b border-slate-100 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Матрица прав доступа по ролям (RBAC)
            </h3>
            <p className="text-xs text-slate-500">
              Строгое разграничение действий гарантирует целостность кассы и безопасности данных
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            Безопасность настроена
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-3">Операция / Действие</th>
                <th className="py-3 px-3 text-center">Руководитель</th>
                <th className="py-3 px-3 text-center">Логист</th>
                <th className="py-3 px-3 text-center">Водитель</th>
                <th className="py-3 px-3 text-center">Механик</th>
                <th className="py-3 px-3 text-center">Бухгалтер</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSIONS_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800">{row.feature}</td>
                  <td className="py-3 px-3 text-center">
                    {row.admin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.logist ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.driver ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.mechanic ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.accountant ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
