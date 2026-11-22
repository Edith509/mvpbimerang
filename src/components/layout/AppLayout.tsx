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
  Inbox,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Role } from '@/types';
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget';

/* ── Nav items per role ────────────────────────────────────── */
function getNavItems(role: Role, pendingCount: number, unassignedRequestsCount: number = 0) {
  switch (role) {
    case 'driver':
      return [
        { href: '/trips', label: 'Мой рейс (посадка)',  icon: Navigation, highlight: true },
        { href: '/fleet', label: 'Моя машина и ТО',     icon: Bus },
      ];
    case 'mechanic':
      return [
        { href: '/fleet',    label: 'Автопарк и дефекты', icon: Bus,         highlight: true },
        { href: '/finances', label: 'Расходы на ремонт',  icon: Wallet },
        { href: '/team',     label: 'Команда и права',    icon: ShieldCheck },
      ];
    case 'accountant':
      return [
        { href: '/finances', label: 'Финансы и кассы',  icon: Wallet,      highlight: true,
          badge: pendingCount > 0 ? `${pendingCount}` : undefined },
        { href: '/reports',  label: 'Отчётность',        icon: FileBarChart },
        { href: '/trips',    label: 'Рейсы и касса',    icon: Navigation },
        { href: '/team',     label: 'Команда и права',  icon: ShieldCheck },
      ];
    default:
      return [
        { href: '/',          label: 'Главная панель',      icon: LayoutDashboard },
        { href: '/requests',  label: 'Заявки и пассажиры',  icon: Inbox,
          badge: unassignedRequestsCount > 0 ? `${unassignedRequestsCount}` : undefined },
        { href: '/trips',     label: 'Рейсы и маршруты',    icon: Navigation,  highlight: true },
        { href: '/fleet',     label: 'Автопарк',            icon: Bus },
        { href: '/finances',  label: 'Финансы',             icon: Wallet,
          badge: pendingCount > 0 ? `${pendingCount}` : undefined },
        { href: '/reports',   label: 'Отчётность',          icon: FileBarChart },
        { href: '/customers', label: 'База клиентов',       icon: Users },
        { href: '/team',      label: 'Команда и права',     icon: ShieldCheck },
        { href: '/settings',  label: 'Настройки компании',  icon: Settings },
      ];
  }
}

function getLandingPath(role: Role) {
  return getNavItems(role, 0, 0)[0]?.href || '/';
}

/* ═══════════════════════════════════════════════════════════ */
export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { company, currentUser, users, switchUserRole, resetToDemo, transactions, requests } = useApp();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const pendingCount = transactions.filter((t) => t.status === 'pending_approval').length;
  const unassignedRequestsCount = (requests || []).filter((r) => r.status === 'new').length;
  const navItems = getNavItems(currentUser.role, pendingCount, unassignedRequestsCount);
  const landingPath = getLandingPath(currentUser.role);
  const canAccessPage = navItems.some((item) => {
    if (item.href === pathname) return true;
    if (item.href !== '/' && pathname.startsWith(item.href + '/')) return true;
    return false;
  });
  const mobileNavLabels: Record<string, string> = {
    '/': 'Обзор',
    '/requests': 'Заявки',
    '/trips': 'Рейсы',
    '/fleet': 'Автопарк',
    '/finances': 'Финансы',
    '/reports': 'Отчёты',
    '/customers': 'Клиенты',
    '/team': 'Команда',
    '/settings': 'Настройки',
  };

  useEffect(() => {
    if (!canAccessPage) {
      router.replace(landingPath);
    }
  }, [canAccessPage, landingPath, router]);

  const handleReset = () => {
    if (confirm('Сбросить все данные к исходному демо-состоянию?')) {
      resetToDemo();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  /* ── Sidebar inner content (desktop + mobile drawer) ─────── */
  const SidebarContent = ({
    onClose,
    onOpenAssistant,
  }: {
    onClose?: () => void;
    onOpenAssistant?: () => void;
  }) => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Brand */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <Link href={landingPath} onClick={onClose} className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shadow-md shadow-red-500/20 shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4c0 8.837 7.163 16 16 16v-4a12 12 0 0 0-12-12H4z" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="font-bold text-lg text-slate-900 tracking-tight">Бумеранг</span>
            <p className="text-xs text-slate-500 truncate">{company.name}</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 ml-2">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {currentUser.role === 'driver' ? 'Интерфейс водителя' : 'Разделы системы'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-red-50 text-red-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse shrink-0 ml-2">
                  {item.badge}
                </span>
              )}
              {item.highlight && !item.badge && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 ml-2" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="p-3 border-t border-slate-100 space-y-2 shrink-0">
        {onClose && onOpenAssistant && (
          <button
            onClick={() => {
              onOpenAssistant();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Бумеранг AI</span>
          </button>
        )}
        <button onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>{resetSuccess ? '✓ Данные сброшены!' : 'Сброс демо-данных'}</span>
        </button>

        {/* User card + role dropdown */}
        <div className="relative">
          <button onClick={() => setRoleMenuOpen((v) => !v)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{currentUser.name}</p>
                <p className="text-[11px] text-red-600 font-medium truncate">{currentUser.roleLabel}</p>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {roleMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-2xl p-1 z-50">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Переключить роль:
              </div>
              {users.map((u) => (
                <button key={u.id}
                  onClick={() => { switchUserRole(u.role); setRoleMenuOpen(false); onClose?.(); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    currentUser.role === u.role ? 'bg-red-50 text-red-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{u.name}</span>
                  <span className="text-[10px] text-slate-500">{u.roleLabel}</span>
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
    <div className="app-shell flex h-[100dvh] w-full overflow-hidden bg-slate-100 text-slate-900">

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────── */}
      <aside className="desktop-sidebar hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-slate-200 flex-col z-20">
        <SidebarContent />
      </aside>

      {/* ── MOBILE DRAWER (z-[90] — above everything) ───────── */}
      {mobileMenuOpen && (
        <div className="mobile-drawer fixed inset-0 z-[90] lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col z-[91] h-full">
            <SidebarContent
              onClose={() => setMobileMenuOpen(false)}
              onOpenAssistant={() => setAssistantOpen(true)}
            />
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ───────────────────────────────── */}
      <div className="app-content flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100">

        {/* ── PAGE CONTENT ─────────────────────────────────── */}
        {/* pb-16 leaves room for the fixed bottom nav on mobile */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 p-3 sm:p-5 lg:p-8 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="max-w-7xl mx-auto w-full">
            {canAccessPage ? children : (
              <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600" role="status">
                Этот раздел недоступен для текущей роли. Открываем ваш рабочий раздел…
              </p>
            )}
          </div>
        </main>

        {/* ── MOBILE BOTTOM NAV BAR ───────────────────────────
            4 quick links + "Меню" button that opens the drawer
            Height: h-16 (64px). AI button sits at bottom-[80px].
        ─────────────────────────────────────────────────────── */}
        <nav
          className="bottom-navigation lg:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-white border-t border-slate-200 flex items-stretch z-[60] shadow-[0_-1px_4px_rgba(15,23,42,0.05)]"
        >

          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const mobileLabel =
              currentUser.role === 'driver' && item.href === '/trips'
                ? 'Мой рейс'
                : mobileNavLabels[item.href] || item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${isActive ? 'text-red-600' : 'text-slate-400'}`}
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

          {/* Меню — opens drawer */}
          <button onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors ${mobileMenuOpen ? 'text-red-600' : 'text-slate-400'}`}>
            <Menu className="w-5 h-5" />
            <span>Меню</span>
          </button>
        </nav>
      </div>

      <AIAssistantWidget isOpen={assistantOpen} onOpenChange={setAssistantOpen} />
    </div>
  );
};
