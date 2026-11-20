'use client';

import React, { useEffect, useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  Clock,
  Plus,
  Check,
  X,
  Paperclip,
  FileText,
  Eye,
  QrCode,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { DocumentAttachment, Transaction } from '@/types';

export default function FinancesPage() {
  const {
    accounts,
    transactions,
    approveTransaction,
    rejectTransaction,
    currentUser,
    addExpenseRequest,
    getAccountBalance,
  } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'fuel' | 'repair' | 'salary' | 'fine' | 'other'>(
    currentUser.role === 'mechanic' ? 'repair' : 'fuel',
  );
  const [desc, setDesc] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [hasReceipt, setHasReceipt] = useState(true);

  // Receipt Preview Modal State
  const [previewAttachment, setPreviewAttachment] = useState<{
    doc: DocumentAttachment;
    tx: Transaction;
  } | null>(null);

  const canApprove = currentUser.role === 'accountant' || currentUser.role === 'admin';
  const isMechanic = currentUser.role === 'mechanic';

  useEffect(() => {
    setExpenseModalOpen(false);
    setPreviewAttachment(null);
    if (isMechanic) setCategory('repair');
  }, [currentUser.id, isMechanic]);

  const pendingTransactions = transactions.filter((t) => t.status === 'pending_approval');
  const ownExpenseRequests = transactions.filter(
    (t) => t.type === 'expense' && t.createdBy.startsWith(`${currentUser.name} (`),
  );
  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'income' && (t.type !== 'income' || t.isOpeningBalance)) return false;
    if (filterType === 'expense' && (t.type !== 'expense' || t.isOpeningBalance)) return false;
    if (filterAccount !== 'all' && t.accountId !== filterAccount) return false;
    return true;
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !desc.trim() || !accountId) return;

    const targetAcc = accounts.find((a) => a.id === accountId);
    if (!targetAcc) return;

    const categoryLabels: Record<string, string> = {
      fuel: 'ГСМ / Топливо',
      repair: 'Ремонт и запчасти',
      salary: 'Зарплата / Суточные',
      fine: 'Штраф ГИБДД',
      other: 'Прочие расходы',
    };

    let receiptAttachment: DocumentAttachment | undefined;
    if (hasReceipt) {
      receiptAttachment = {
        id: `rec_${Date.now()}`,
        title: `Подтверждающий документ (${supplierName || 'Поставщик'})`,
        type: category === 'fuel' ? 'receipt' : 'invoice',
        typeLabel: category === 'fuel' ? 'Кассовый чек' : 'Счет-накладная',
        fileName: category === 'fuel' ? 'chek_azs_oplata.jpg' : 'nakladnaya_postavshika.pdf',
        fileSize: '1.6 MB',
        uploadedBy: `${currentUser.name} (${currentUser.roleLabel})`,
        uploadedAt: 'Только что',
        notes: `Сумма: ${amount} ${targetAcc.currency}. Документ проверен.`,
      };
    }

    addExpenseRequest({
      accountId,
      category,
      categoryLabel: categoryLabels[category] || 'Расход',
      amount: parseFloat(amount),
      currency: targetAcc.currency,
      description: desc,
      supplierName: supplierName.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      receiptAttachment,
    });

    setAmount('');
    setDesc('');
    setSupplierName('');
    setInvoiceNumber('');
    setExpenseModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
            <Wallet className="w-4 h-4" />
            <span>{isMechanic ? 'Заявки на расходы' : 'Счета и финансовые операции'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isMechanic ? 'Мои заявки' : 'Финансы'}
          </h1>
          <p className="text-sm text-slate-500">
            {isMechanic
              ? 'Подавайте заявки на ремонт и запчасти и отслеживайте их статус.'
              : 'Доходы и расходы ведутся по счетам, а баланс рассчитывается автоматически по подтверждённым операциям.'}
          </p>
        </div>

        <button
          onClick={() => setExpenseModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-red-500/20 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isMechanic ? 'Подать заявку' : 'Подать заявку с чеком / счетом'}</span>
        </button>
      </div>

      {/* MULTI-CURRENCY ACCOUNTS CARDS */}
      {!isMechanic && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {accounts.map((acc) => {
          const currencySymbols: Record<string, string> = {
            RUB: '₽',
            BYN: 'BYN',
            KZT: '₸',
          };
          return (
            <div
              key={acc.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-700">{acc.name}</h3>
                <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{acc.currency}</span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {getAccountBalance(acc.id).toLocaleString('ru-RU')} {currencySymbols[acc.currency] || acc.currency}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Баланс по операциям</p>
            </div>
          );
        })}
        </div>
      )}

      {!isMechanic && pendingTransactions.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">Заявки на согласование</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              {pendingTransactions.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingTransactions.map((pt) => {
              const targetAcc = accounts.find((a) => a.id === pt.accountId);
              const isIncome = pt.type === 'income';
              return (
                <div
                  key={pt.id}
                  className="flex flex-col gap-2 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-bold ${isIncome ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {isIncome ? 'Доход' : 'Расход'} · {pt.categoryLabel}
                      </span>
                      {pt.supplierName && <span className="text-slate-500">{pt.supplierName}</span>}
                      {pt.invoiceNumber && <span className="font-mono text-slate-400">№ {pt.invoiceNumber}</span>}
                    </div>
                    <p className="mt-0.5 truncate text-slate-600">{pt.description}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {targetAcc?.name || 'Счёт'} · {pt.createdBy}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:shrink-0 sm:self-auto">
                    {pt.receiptAttachment && (
                      <button
                        onClick={() =>
                          setPreviewAttachment({ doc: pt.receiptAttachment!, tx: pt })
                        }
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                        title="Открыть скан чека / накладной"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>Документ</span>
                        <Eye className="ml-0.5 h-3.5 w-3.5" />
                      </button>
                    )}
                    <span className={`whitespace-nowrap font-bold ${isIncome ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {isIncome ? '+' : '−'} {pt.amount.toLocaleString('ru-RU')} {pt.currency === 'RUB' ? '₽' : pt.currency}
                    </span>
                    {canApprove ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => approveTransaction(pt.id)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 font-bold text-white transition-colors hover:bg-emerald-700"
                          title="Подтвердить операцию"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Подтвердить</span>
                        </button>
                        <button
                          onClick={() => rejectTransaction(pt.id)}
                          className="rounded-lg bg-red-50 p-1.5 text-red-700 transition-colors hover:bg-red-100"
                          title="Отклонить"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 sm:whitespace-nowrap">Ожидает подтверждения</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {isMechanic && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">Мои заявки</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {ownExpenseRequests.length}
            </span>
          </div>
          {ownExpenseRequests.length === 0 ? (
            <p className="py-3 text-xs text-slate-500">Заявок пока нет.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {ownExpenseRequests.map((request) => (
                <div key={request.id} className="flex flex-col gap-1 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">{request.categoryLabel}</p>
                    <p className="truncate text-slate-500">{request.description}</p>
                    <p className="text-[10px] text-slate-400">{request.date}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-bold text-slate-800">
                      − {request.amount.toLocaleString('ru-RU')} {request.currency === 'RUB' ? '₽' : request.currency}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      request.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : request.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      {request.status === 'confirmed' ? 'Проведено' : request.status === 'rejected' ? 'Отклонено' : 'На согласовании'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* FULL TRANSACTIONS AUDIT JOURNAL */}
      {!isMechanic && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Общий журнал операций и платежей ({transactions.length})
            </h3>
            <span className="text-xs text-slate-400">• Синхронизировано со всеми рейсами и счетами</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 sm:w-auto"
            >
              <option value="all">Все типы операций</option>
              <option value="income">Только доходы (билеты)</option>
              <option value="expense">Только расходы</option>
            </select>

            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 sm:w-auto"
            >
              <option value="all">Все счета</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full min-w-[960px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-2">Дата</th>
                <th className="py-2.5 px-2">Счёт</th>
                <th className="py-2.5 px-2">Категория</th>
                <th className="py-2.5 px-2">Описание / Контрагент</th>
                <th className="py-2.5 px-2">Чек / Документ</th>
                <th className="py-2.5 px-2">Кто создал</th>
                <th className="py-2.5 px-2">Кто согласовал</th>
                <th className="py-2.5 px-2">Сумма</th>
                <th className="py-2.5 px-2">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const targetAccount = accounts.find((a) => a.id === tx.accountId);

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{tx.date}</td>
                    <td className="py-3 px-2 font-medium text-slate-700">
                      {targetAccount?.name || 'Счет'}
                    </td>
                    <td className="py-3 px-2 font-semibold text-slate-900">{tx.categoryLabel}</td>
                    <td className="py-3 px-2 text-slate-600 max-w-xs">
                      <div>{tx.description}</div>
                      {tx.supplierName && (
                        <div className="text-[10px] text-slate-400">
                          {tx.supplierName} {tx.invoiceNumber ? `(${tx.invoiceNumber})` : ''}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {tx.receiptAttachment ? (
                        <button
                          onClick={() =>
                            setPreviewAttachment({ doc: tx.receiptAttachment!, tx })
                          }
                          className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>{tx.receiptAttachment.typeLabel}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-slate-500">{tx.createdBy}</td>
                    <td className="py-3 px-2 text-slate-500">
                      {tx.approvedBy ? (
                        <span className="text-emerald-700 font-medium">✓ {tx.approvedBy}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 font-bold whitespace-nowrap">
                      <span className={isIncome ? 'text-emerald-600' : 'text-slate-900'}>
                        {isIncome ? '+' : '-'} {tx.amount.toLocaleString('ru-RU')}{' '}
                        {tx.currency === 'RUB' ? '₽' : tx.currency}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {tx.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Проведено
                        </span>
                      ) : tx.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                          Отклонено
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> На согласовании
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* RECEIPT / INVOICE PREVIEW MODAL */}
      {previewAttachment && !isMechanic && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-y-contain bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {previewAttachment.doc.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Загрузил: {previewAttachment.doc.uploadedBy} ({previewAttachment.doc.uploadedAt})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewAttachment(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* MOCK SCAN / RECEIPT PREVIEW CANVAS */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-5 font-mono text-xs text-slate-800 space-y-3 relative overflow-hidden">
              <div className="text-center border-b border-slate-300 pb-2">
                <div className="font-bold text-sm tracking-tight">
                  {previewAttachment.tx.supplierName || 'ФИСКАЛЬНЫЙ ДОКУМЕНТ'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {previewAttachment.tx.invoiceNumber || 'ЧЕК ККТ № 000492194'}
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>ОПИСАНИЕ:</span>
                  <span className="font-bold">{previewAttachment.tx.description}</span>
                </div>
                <div className="flex justify-between">
                  <span>СУММА К ОПЛАТЕ:</span>
                  <span className="font-bold text-sm text-slate-900">
                    {previewAttachment.tx.amount.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>ДАТА ВРЕМЯ:</span>
                  <span>{previewAttachment.tx.date}</span>
                </div>
              </div>

              {previewAttachment.doc.notes && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-600 font-sans">
                  <b>Детализация поставщика:</b> {previewAttachment.doc.notes}
                </div>
              )}

              {/* Stamp or QR Code simulation */}
              <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-sans">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-8 h-8 text-slate-700" />
                  <span>ФН: 99604403 • ФД: 12480<br />ФПД: 3948102941</span>
                </div>
                <div className="px-2.5 py-1 rounded border-2 border-emerald-600 text-emerald-800 font-bold uppercase tracking-wider text-[9px] -rotate-6">
                  ✓ ПРОВЕРЕНО
                </div>
              </div>
            </div>

            {/* Approval Action if pending */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setPreviewAttachment(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Закрыть
              </button>

              {previewAttachment.tx.status === 'pending_approval' && canApprove && (
                <button
                  onClick={() => {
                    approveTransaction(previewAttachment.tx.id);
                    setPreviewAttachment(null);
                  }}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Подтвердить списание ({previewAttachment.tx.amount} ₽)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE EXPENSE MODAL */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-y-contain bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 text-xs shadow-2xl sm:p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Подать заявку на расход с чеком</h3>
            <p className="text-slate-500 mb-4">
              Топливо, запчасти или ремонт. Заявка с документом отправится бухгалтеру на проверку.
            </p>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Счёт</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Категория</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  >
                    <option value="repair">Ремонт / Запчасти</option>
                    {!isMechanic && (
                      <>
                        <option value="fuel">ГСМ / Заправка</option>
                        <option value="salary">Зарплата / Суточные</option>
                        <option value="fine">Штраф ГИБДД</option>
                        <option value="other">Прочие расходы</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Сумма ({accounts.find((account) => account.id === accountId)?.currency || 'RUB'})
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Например: 18500"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Поставщик / АЗС
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="ООО Автодок / АЗС Татнефть"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    № чека / накладной
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Счет № 408 от 19.11"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Назначение расхода</label>
                <input
                  type="text"
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Заказ комплекта передних дисков и колодок"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              {/* Attach receipt checkbox */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-2">
                  <input
                    type="checkbox"
                    id="hasReceiptCheck"
                    checked={hasReceipt}
                    onChange={(e) => setHasReceipt(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300"
                  />
                  <label htmlFor="hasReceiptCheck" className="font-semibold text-slate-800 cursor-pointer">
                    Прикрепить фото чека / скан накладной
                  </label>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                  {hasReceipt ? 'Файл прикреплен' : 'Без файла'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Отправить бухгалтеру
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
