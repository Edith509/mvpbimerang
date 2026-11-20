'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Navigation,
  Bus,
  Wallet,
  Users,
  ShieldCheck,
  Settings,
  RotateCcw,
  ChevronDown,
  Menu,
  X,
  FileBarChart,
  Sparkles,
  Search,
  Command,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Role } from '@/types';
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget';
import { CommandMenu } from '@/components/layout/CommandMenu';

/* ── Role definitions with human labels & short tags ───────── */
const ROLE_CONFIG: Record<
  Role,
  { label: string; short: string; desc: string; badgeColor: string }
> = {
  logist: {
    label: 'Логист',
    short: 'Лог',
    desc: 'Управление рейсами, рассадкой и ведомостями',
    badgeColor: 'bg-blue-500',
  },
  driver: {
    label: 'Водитель',
    short: 'Вод',
    desc: 'Только посадочный лист, касса рейса и чек-лист машины',
    badgeColor: 'bg-emerald-500',
  },
  mechanic: {
    label: 'Механик',
    short: 'Мех',
    desc: 'Автопарк, поломки и заявки на запчасти',
    badgeColor: 'bg-amber-500',
  },
  accountant: {
    label: 'Бухгалтер',
    short: 'Бух',
    desc: 'Финансы, согласование счетов и отчёты P&L',
    badgeColor: 'bg-purple-500',
  },
  admin: {
    label: 'Руководитель',
    short: 'Адм',
    desc: 'Полный доступ ко всей компании',
    badgeColor: 'bg-red-500',
  },
};

/* ── Nav items per role ────────────────────────────────────── */
function getNavItems(role: Role, pendingCount: number) {
  switch (role) {
    case 'driver':
      return [
        { href: '/trips', label: 'Мой рейс (посадка)', icon: Navigation, highlight: true },
        { href: '/fleet', label: 'Моя машина и ТО', icon: Bus },
      ];
    case 'mechanic':
      return [
        { href: '/fleet', label: 'Автопарк и дефекты', icon: Bus, highlight: true },
        { href: '/finances', label: 'Заявки на запчасти', icon: Wallet },
        { href: '/team', label: 'Команда и права', icon: ShieldCheck },
      ];
    case 'accountant':
      return [
        {
          href: '/finances',
          label: 'Финансы и кассы',
          icon: Wallet,
          highlight: true,
          badge: pendingCount > 0 ? `${pendingCount}` : undefined,
        },
        { href: '/reports', label: 'Отчётность (P&L)', icon: FileBarChart },
        { href: '/trips', label: 'Рейсы и касса', icon: Navigation },
        { href: '/team', label: 'Команда и права', icon: ShieldCheck },
      ];
    default:
      return [
        { href: '/', label: 'Главная панель', icon: LayoutDashboard },
        { href: '/trips', label: 'Маршруты и рейсы', icon: Navigation, highlight: true },
        { href: '/fleet', label: 'Автопарк и паспорта', icon: Bus },
        {
          href: '/finances',
          label: 'Финансы и кассы',
          icon: Wallet,
          badge: pendingCount > 0 ? `${pendingCount}` : undefined,
        },
        { href: '/reports', label: 'Отчётность', icon: FileBarChart },
        { href: '/customers', label: 'База пассажиров', icon: Users },
        { href: '/team', label: 'Команда и права', icon: ShieldCheck },
        { href: '/settings', label: 'Настройки', icon: Settings },
      ];
  }
}

function getLandingPath(role: Role) {
  return getNavItems(role, 0)[0]?.href || '/';
}

/* ═══════════════════════════════════════════════════════════ */
export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { company, currentUser, users, switchUserRole, resetToDemo, transactions } = useApp();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const pendingCount = transactions.filter((t) => t.status === 'pending_approval').length;
  const navItems = getNavItems(currentUser.role, pendingCount);
  const landingPath = getLandingPath(currentUser.role);
  const canAccessPage = navItems.some((item) => item.href === pathname);

  useEffect(() => {
    if (!canAccessPage) {
      router.replace(landingPath);
    }
  }, [canAccessPage, landingPath, router]);

  // Global ⌘K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandMenuOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleReset = () => {
    if (confirm('Сбросить все данные к исходному демо-состоянию?')) {
      resetToDemo();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  /* ── Sidebar inner content (shared desktop + mobile drawer) */
  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-200/70 flex items-center justify-between shrink-0">
        <Link href={landingPath} onClick={onClose} className="flex items-center gap-3 min-w-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-red-600 to-red-700 flex items-center justify-center text-white font-bold shadow-sm shadow-red-500/25 shrink-0 group-hover:scale-105 transition-transform">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4c0 8.837 7.163 16 16 16v-4a12 12 0 0 0-12-12H4z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[17px] text-slate-900 tracking-tight">Бумеранг</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200/60">
                SaaS
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate leading-tight">{company.name}</p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Notice Card in Sidebar */}
      <div className="p-3">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
              Текущий доступ:
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Онлайн
            </span>
          </div>
          <p className="font-bold text-slate-900 text-xs">{currentUser.roleLabel}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            {ROLE_CONFIG[currentUser.role]?.desc}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="px-3 py-1 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {currentUser.role === 'driver' ? 'Интерфейс водителя' : 'Разделы системы'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-red-50/90 text-red-600 font-semibold border border-red-100 shadow-[0_1px_2px_rgba(220,38,38,0.05)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-white animate-pulse shrink-0 ml-2">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-200/70 space-y-2 shrink-0">
        {/* AI Assistant Button */}
        <button
          onClick={() => {
            setAssistantOpen(true);
            onClose?.();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-red-50 hover:text-red-600 border border-slate-200/80 hover:border-red-200 transition-all group"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-3 h-3" />
            </div>
            <span>ИИ-помощник</span>
          </div>
          <span className="text-[10px] text-slate-400 group-hover:text-red-500 font-mono">1 клик</span>
        </button>

        {/* Reset Demo Button */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>{resetSuccess ? '✓ Данные сброшены' : 'Сброс демо к началу'}</span>
        </button>

        {/* User Card with Role Popover */}
        <div className="relative pt-1">
          <button
            onClick={() => setRoleMenuOpen((v) => !v)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-slate-200/80 transition-all text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-medium truncate leading-tight">
                  {currentUser.roleLabel}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                roleMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Role selection dropdown */}
          {roleMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Переключить вид на показе:
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUserRole(u.role);
                    setRoleMenuOpen(false);
                    onClose?.();
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    currentUser.role === u.role
                      ? 'bg-red-50 text-red-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        ROLE_CONFIG[u.role]?.badgeColor || 'bg-slate-400'
                      }`}
                    />
                    <span>{u.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">{u.roleLabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className="app-shell flex h-[100dvh] w-full overflow-hidden bg-slate-50 text-slate-900">
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
      <aside className="desktop-sidebar hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-slate-200/80 flex-col z-20 shadow-[1px_0_3px_rgba(0,0,0,0.02)]">
        <SidebarContent />
      </aside>

      {/* ── MOBILE SLIDE-OVER DRAWER ────────────────────────── */}
      {mobileMenuOpen && (
        <div className="mobile-drawer fixed inset-0 z-[90] lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col z-[91] h-full animate-in slide-in-from-left duration-200">
            <SidebarContent onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ───────────────────────────────── */}
      <div className="app-content flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* ── ELEVATED MACOS TOP BAR ────────────────────────── */}
        <header className="app-header h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/70 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 gap-3">
          {/* Left: mobile brand + Command search */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile logo trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              aria-label="Открыть меню"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="lg:hidden flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4c0 8.837 7.163 16 16 16v-4a12 12 0 0 0-12-12H4z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 text-sm truncate">Бумеранг</span>
            </Link>

            {/* ⌘K Command Search Trigger */}
            <button
              onClick={() => setCommandMenuOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/60 text-slate-500 text-xs transition-all w-56 lg:w-72 justify-between"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Поиск по системе...</span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200/80 shadow-2xs">
                <Command className="w-3 h-3" />K
              </kbd>
            </button>
          </div>

          {/* Right: macOS Native-style Segmented Role Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick role pills */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 text-xs">
              <span className="hidden md:inline text-[11px] font-medium text-slate-400 px-2">
                Режим:
              </span>
              {(['logist', 'driver', 'mechanic', 'accountant'] as Role[]).map((r) => {
                const config = ROLE_CONFIG[r];
                const isCurrent = currentUser.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => switchUserRole(r)}
                    title={config.label}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isCurrent
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
                    }`}
                  >
                    <span className="sm:hidden">{config.short}</span>
                    <span className="hidden sm:inline">{config.label}</span>
                  </button>
                );
              })}
            </div>

            {/* AI Assistant button in header */}
            <button
              onClick={() => setAssistantOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs shadow-red-500/20 transition-all hover:brightness-105 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ИИ</span>
            </button>
          </div>
        </header>

        {/* ── ROLE CONTEXT NOTICE BANNER ─────────────────────── */}
        {currentUser.role === 'driver' && (
          <div className="bg-blue-600 text-white px-4 py-2 text-xs flex items-center justify-between shrink-0 shadow-inner">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
              <span className="truncate">
                <b>Экран водителя:</b> Посадочный лист, касса рейса и отметка контрольных точек.
              </span>
            </div>
            <button
              onClick={() => switchUserRole('logist')}
              className="text-[11px] font-bold underline hover:text-blue-100 whitespace-nowrap shrink-0 ml-3"
            >
              В режим логиста →
            </button>
          </div>
        )}

        {currentUser.role === 'mechanic' && (
          <div className="bg-amber-600 text-white px-4 py-2 text-xs flex items-center justify-between shrink-0 shadow-inner">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
              <span className="truncate">
                <b>Экран механика:</b> Состояние машин, фиксация дефектов и заявки на запчасти.
              </span>
            </div>
            <button
              onClick={() => switchUserRole('logist')}
              className="text-[11px] font-bold underline hover:text-amber-100 whitespace-nowrap shrink-0 ml-3"
            >
              В режим логиста →
            </button>
          </div>
        )}

        {/* ── MAIN SCROLLABLE CONTENT ────────────────────────── */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="max-w-7xl mx-auto w-full">
            {canAccessPage ? (
              children
            ) : (
              <div className="macos-card p-6 text-sm text-slate-600">
                Этот раздел недоступен для текущей роли. Открываем ваш рабочий раздел…
              </div>
            )}
          </div>
        </main>

        {/* ── MOBILE BOTTOM NAVIGATION DOCK ──────────────────── */}
        <nav className="bottom-navigation lg:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-stretch z-[60] shadow-[0_-1px_4px_rgba(15,23,42,0.04)]">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const mobileLabel =
              currentUser.role === 'driver' && item.href === '/trips'
                ? 'Мой рейс'
                : item.label.split(' ')[0];
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-red-600 font-bold' : 'text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate px-1">{mobileLabel}</span>
                {item.badge && (
                  <span className="absolute top-2.5 right-[calc(50%-16px)] min-w-2 rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Меню Drawer Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors ${
              mobileMenuOpen ? 'text-red-600' : 'text-slate-400'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span>Меню</span>
          </button>
        </nav>
      </div>

      {/* Built-in AI Assistant Widget */}
      <AIAssistantWidget isOpen={assistantOpen} onOpenChange={setAssistantOpen} />

      {/* ⌘K Command Palette */}
      <CommandMenu
        isOpen={commandMenuOpen}
        onClose={() => setCommandMenuOpen(false)}
        onOpenAssistant={() => setAssistantOpen(true)}
      />
    </div>
  );
};
