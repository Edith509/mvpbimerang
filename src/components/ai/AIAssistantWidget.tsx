'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  Mic,
} from 'lucide-react';
import { useApp } from '@/lib/store';

type AIAssistantWidgetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({ isOpen, onOpenChange }) => {
  const [input, setInput] = useState('');
  const { executeAIPrompt, currentUser, company } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'assistant'; text: string; time: string; badge?: string }>
  >([
    {
      sender: 'assistant',
      text: `Здравствуйте! Я встроенный ИИ-помощник «Бумеранг» в рабочем пространстве «${company.name}». Готов помочь: зафиксировать поломку машины, оформить пассажира, проверить баланс кассы или статус рейса.`,
      time: '19:40',
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const timeStr = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setMessages((prev) => [
      ...prev,
      {
        sender: 'user' as const,
        text,
        time: timeStr,
        badge: `${currentUser.name} (${currentUser.roleLabel})`,
      },
    ]);
    setInput('');

    setTimeout(() => {
      const result = executeAIPrompt(text);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: result.message,
          time: new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    }, 350);
  };

  const QUICK_PROMPTS = [
    {
      label: '⚠️ Треснула фара (Машина №12)',
      text: 'У машины №12 треснула задняя правая фара',
    },
    {
      label: '🎟️ Место №4 на рейс 104',
      text: 'Забронируй место 4 на рейс БУМ-104 для Романа Белова с оплатой',
    },
    {
      label: '💰 Остаток кассы и счетов',
      text: 'Сколько сейчас денег в кассе и на расчетных счетах?',
    },
    {
      label: '📍 Статус рейса БУМ-104',
      text: 'Где сейчас рейс БУМ-104 и сколько точек пройдено?',
    },
  ];

  return (
    <>
      {/* ── FULLSCREEN CHAT MODAL (mobile: fixed inset, desktop: card) ── */}
      {isOpen && (
        <div
          className="
            fixed inset-0 z-[70]
            h-[100dvh] bg-white
            lg:inset-auto lg:bottom-6 lg:right-6
            lg:w-[400px] lg:h-[580px] lg:rounded-2xl shadow-2xl border border-slate-200
            flex flex-col overflow-hidden
          "
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold">Бумеранг ИИ-Ассистент</h3>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-medium">
                    Активен
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {currentUser.name} · {currentUser.roleLabel}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Закрыть ИИ-помощника"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="bg-slate-50 border-b border-slate-200 p-3 shrink-0">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Быстрые сценарии для показа</span>
              <span className="text-[9px] text-red-600 font-bold">1 клик</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qp.text)}
                  className="text-left text-[11px] leading-snug bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 px-2.5 py-2 rounded-lg transition-colors"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-white">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {m.badge && (
                  <span className="text-[9px] text-slate-400 mb-0.5 px-1">{m.badge}</span>
                )}
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-red-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.time}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                title="Пример голосовой команды"
                onClick={() => handleSend('У машины №12 треснула задняя правая фара')}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              >
                <Mic className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напишите команду ИИ..."
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[10px] text-slate-400 mt-1.5 px-1">
              <span>Синхронизировано с базой данных</span>
              <span>Модель: Gemini Pro</span>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP FLOATING TRIGGER BUTTON ── */}
      {!isOpen && (
        <button
          onClick={() => onOpenChange(true)}
          aria-label="Открыть ИИ-помощника Бумеранг"
          className="
            fixed z-[60] hidden lg:flex
            bottom-6 right-6
            items-center gap-2 px-3 py-2.5 lg:px-4 lg:py-3
            bg-slate-900 hover:bg-slate-800 text-white
            rounded-full shadow-2xl hover:scale-105 active:scale-95
            transition-all border border-slate-700
          "
          title="Открыть ИИ-помощника Бумеранг"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0 shadow-md shadow-red-500/30">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="hidden sm:block text-left pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight">Бумеранг AI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-slate-300 block">Помощник системы</span>
          </div>
        </button>
      )}
    </>
  );
};
