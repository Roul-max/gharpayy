import { Suspense, lazy, useState } from 'react';
import { Link, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Trello,
  LogOut,
  Bell,
  Search,
  Settings,
  UserCircle2,
  BedDouble,
  BarChart3,
  MessageSquare,
  CalendarDays,
  Building2,
  Map,
  Sparkles,
  Gauge,
  Menu,
  X
} from 'lucide-react';
import clsx from 'clsx';
import { useMarkNotificationRead, useNotifications } from '../../hooks/useOperations';
import { api } from '../../services/api';
import ThemeToggle from '../../components/ThemeToggle';
import { useProfile, useSettings } from '../../hooks/useSettings';

const Dashboard = lazy(() => import('./Dashboard'));
const Pipeline = lazy(() => import('./Pipeline'));
const Leads = lazy(() => import('./Leads'));
const VisitsPage = lazy(() => import('./VisitsPage'));
const BookingsPage = lazy(() => import('./BookingsPage'));
const ConversationsPage = lazy(() => import('./ConversationsPage'));
const InventoryPage = lazy(() => import('./InventoryPage'));
const OwnersPage = lazy(() => import('./OwnersPage'));
const AnalyticsPage = lazy(() => import('./AnalyticsPage'));
const AvailabilityPage = lazy(() => import('./AvailabilityPage'));
const MatchingPage = lazy(() => import('./MatchingPage'));
const ZonesPage = lazy(() => import('./ZonesPage'));
const EffortPage = lazy(() => import('./EffortPage'));
const HistoricalModule = lazy(() => import('./AdvancedModules').then((module) => ({ default: module.HistoricalModule })));
const NotificationsModule = lazy(() => import('./AdvancedModules').then((module) => ({ default: module.NotificationsModule })));
const SettingsPage = lazy(() => import('./SettingsPage'));
const FollowUpsModule = lazy(() => import('./AdvancedModules').then((module) => ({ default: module.FollowUpsModule })));
const ProfilePage = lazy(() => import('./ProfilePage'));

export default function CRMHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const { data: notificationsResponse } = useNotifications();
  const { data: profileResponse } = useProfile();
  const { data: settingsResponse } = useSettings();
  const markRead = useMarkNotificationRead();
  const notifications = notificationsResponse?.data ?? [];
  const unreadCount = notificationsResponse?.unreadCount ?? 0;
  const profile = profileResponse?.profile;
  const unreadNotifications = notifications.filter((item: any) => !item.is_read);
  const userSettings = settingsResponse?.settings;
  const role = localStorage.getItem('app_role');
  const canManageOwners = role === 'admin' || role === 'manager';
  const userInitial = (profile?.full_name ?? 'G').charAt(0).toUpperCase();

  const navGroups = [
    {
      title: 'CRM',
      items: [
        { path: '/crm/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/crm/leads', label: 'Leads', icon: Users },
        { path: '/crm/pipeline', label: 'Pipeline', icon: Trello },
        { path: '/crm/visits', label: 'Visits', icon: CalendarDays },
        { path: '/crm/bookings', label: 'Bookings', icon: BedDouble },
        { path: '/crm/conversations', label: 'Conversations', icon: MessageSquare },
        { path: '/crm/analytics', label: 'Analytics', icon: BarChart3 }
      ]
    },
    {
      title: 'Operations',
      items: [
        { path: '/crm/inventory', label: 'Inventory', icon: BedDouble },
        { path: '/crm/availability', label: 'Availability', icon: Map },
        { path: '/crm/matching', label: 'Matching', icon: Sparkles },
        { path: '/crm/zones', label: 'Zones', icon: Map },
        { path: '/crm/effort', label: 'Effort', icon: Gauge }
      ]
    }
  ] as const;
  if (canManageOwners) {
    navGroups[1].items.splice(1, 0, { path: '/crm/owners', label: 'Owners', icon: Building2 });
  }

  const utilityItems = [
    { path: '/crm/profile', label: 'Profile', icon: UserCircle2 },
    { path: '/crm/settings', label: 'Settings', icon: Settings }
  ];

  const isCompact = !!userSettings?.compact_sidebar;

  const renderNavItem = (item: any) => {
    const isActive =
      (location.pathname === item.path ||
        (item.path === '/crm/dashboard' && location.pathname === '/crm') ||
        location.pathname.startsWith(`${item.path}/`)) &&
      item.action !== 'theme';
    const Icon = item.icon;
    const baseClass = clsx(
      'crm-sidebar__link flex items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition',
      isCompact ? 'justify-center gap-0 px-2.5' : 'gap-3',
      isActive ? 'crm-sidebar__link--active' : 'crm-sidebar__link--idle'
    );

    if (item.action === 'theme') {
      return (
        <button
          key={item.label}
          type="button"
          className={baseClass}
          title={isCompact ? item.label : undefined}
        >
          <Icon className={clsx('h-4.5 w-4.5', isActive ? 'text-white' : 'text-slate-400')} />
          {!isCompact && <span>{item.label}</span>}
          {!isCompact && <ThemeToggle className="crm-sidebar__theme-toggle h-10 px-2.5 sm:px-3" />}
        </button>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={baseClass}
        title={isCompact ? item.label : undefined}
      >
        <Icon className={clsx('h-4.5 w-4.5', isActive ? 'text-white' : 'text-slate-400')} />
        {!isCompact && item.label}
      </Link>
    );
  };

  return (
    <div className="crm-page app-shell flex min-h-screen">
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-label="Close menu"
        />
      )}

      <aside
        className={clsx(
          'crm-sidebar fixed left-0 top-0 z-40 flex h-full flex-col transition-transform lg:static lg:translate-x-0',
          isCompact ? 'w-24 lg:w-24' : 'w-72',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="crm-sidebar__brand mb-5 flex items-center justify-between px-4 py-4">
          <Link to="/crm/dashboard" className={clsx('inline-flex items-center', isCompact ? 'justify-center' : 'gap-3')}>
            {isCompact ? (
              <span className="crm-sidebar__brand-initial">G</span>
            ) : (
              <span className="crm-sidebar__brand-text">
                <span className="crm-sidebar__brand-title">Gharpayy CRM</span>
                <span className="crm-sidebar__brand-subtitle">Booking OS</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md border border-white/10 p-1.5 text-slate-200 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="crm-sidebar__groups flex-1 overflow-y-auto px-3">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-6">
              {!isCompact && (
                <p className="crm-sidebar__group-label mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em]">
                  {group.title}
                </p>
              )}
              <nav className="space-y-1.5">
                {group.items.map((item) => renderNavItem(item))}
              </nav>
            </div>
          ))}
        </div>

        <div className="crm-sidebar__footer mt-auto border-t border-white/5 px-3 pt-4">
          <div className="mb-3 space-y-1.5">
            {utilityItems.map((item) => renderNavItem(item))}
          </div>
          <div className="crm-sidebar__user-card mb-3 flex items-center gap-3 rounded-2xl px-3 py-3">
            <div className="crm-sidebar__user-avatar flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                userInitial
              )}
            </div>
            {!isCompact && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{profile?.full_name ?? 'Admin'}</p>
                <p className="truncate text-xs text-slate-500">{profile?.id ? 'Workspace member' : 'admin@gharpayy.com'}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            className={clsx('btn-secondary w-full cursor-pointer', isCompact ? 'px-2.5' : '')}
            onClick={async () => {
              try {
                await api.auth.logout();
              } catch {
                // Ignore logout API errors and clear local session anyway.
              }
              localStorage.removeItem('token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('app_role');
              localStorage.removeItem('app_roles');
              navigate('/');
            }}
            title={isCompact ? 'Log out' : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCompact && 'Log out'}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="crm-header sticky top-0 z-20 px-4 py-3 sm:px-6">
          <div className="app-navbar mx-auto w-full max-w-7xl rounded-2xl border border-white/20 bg-slate-900/65 px-4 shadow-[0_12px_50px_rgba(3,7,18,0.45)] backdrop-blur-2xl sm:px-5">
            <div className="flex h-16 items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-xl border border-white/20 bg-white/5 p-2 text-slate-200 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden items-center rounded-xl border border-white/15 bg-slate-900/80 px-3 py-2 sm:flex sm:min-w-[280px]">
                  <Search className="mr-2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search leads (name, phone, source)..."
                    className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    value={globalQuery}
                    onChange={(event) => setGlobalQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        const trimmed = globalQuery.trim();
                        if (trimmed) {
                          navigate(`/crm/leads?query=${encodeURIComponent(trimmed)}`);
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle className="h-10 px-2.5 sm:px-3" />
                <button
                  onClick={() => setNotificationOpen((open) => !open)}
                  className="relative rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 transition hover:text-white"
                  title="Open notifications"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />}
                </button>
                <button
                  onClick={() => navigate('/crm/settings')}
                  className="rounded-xl border border-white/15 bg-white/5 p-2 text-slate-300 transition hover:text-white"
                  title="Open settings"
                >
                  <Settings className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
          {notificationOpen && (
            <div className="relative mt-3">
              <div className="notification-popover absolute right-0 z-30 w-full max-w-md rounded-2xl p-3 shadow-2xl">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Notifications</p>
                    <p className="text-xs text-slate-400">{unreadCount} unread alerts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-slate-400 hover:text-white" onClick={() => navigate('/crm/notifications')}>
                      Open page
                    </button>
                    <button className="text-xs text-slate-400 hover:text-white" onClick={() => navigate('/crm/follow-ups')}>
                      Follow-ups
                    </button>
                  </div>
                </div>
                <div className="mb-3 grid grid-cols-3 gap-2">
                  <div className="notification-popover__stat rounded-xl p-3 text-center">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Total</p>
                    <p className="mt-1 text-lg font-bold text-white">{notifications.length}</p>
                  </div>
                  <div className="notification-popover__stat notification-popover__stat--unread rounded-xl p-3 text-center">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-cyan-200">Unread</p>
                    <p className="mt-1 text-lg font-bold text-white">{unreadCount}</p>
                  </div>
                  <div className="notification-popover__stat notification-popover__stat--read rounded-xl p-3 text-center">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-200">Read</p>
                    <p className="mt-1 text-lg font-bold text-white">{Math.max(0, notifications.length - unreadCount)}</p>
                  </div>
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-slate-400">No notifications yet.</p>
                  ) : (
                    notifications.slice(0, 10).map((item: any) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`notification-popover__item w-full rounded-xl p-3 text-left ${item.is_read ? 'notification-popover__item--read' : 'notification-popover__item--unread'}`}
                        onClick={() => {
                          if (!item.is_read) {
                            markRead.mutate(item.id);
                          }
                          setNotificationOpen(false);
                          navigate('/crm/notifications');
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">{item.title}</p>
                          {!item.is_read && <span className="h-2 w-2 rounded-full bg-cyan-300" />}
                        </div>
                        {item.body && <p className="mt-1 text-xs text-slate-400">{item.body}</p>}
                        <p className="mt-2 text-[11px] text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                      </button>
                    ))
                  )}
                </div>
                {unreadNotifications.length > 0 && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={async () => {
                        for (const item of unreadNotifications.slice(0, 10)) {
                          await markRead.mutateAsync(item.id);
                        }
                      }}
                    >
                      Mark Visible Read
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        <main className="crm-main flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mx-auto w-full max-w-7xl">
            <Suspense fallback={<div className="card-surface p-6 text-sm text-slate-300">Loading module...</div>}>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="pipeline" element={<Pipeline />} />
                <Route path="leads" element={<Leads />} />
                <Route path="visits" element={<VisitsPage />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="booking" element={<BookingsPage />} />
                <Route path="owners" element={canManageOwners ? <OwnersPage /> : <Navigate to="/crm/dashboard" replace />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="availability" element={<AvailabilityPage />} />
                <Route path="effort" element={<EffortPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="historical" element={<HistoricalModule />} />
                <Route path="notifications" element={<NotificationsModule />} />
                <Route path="norifications" element={<NotificationsModule />} />
                <Route path="follow-ups" element={<FollowUpsModule />} />
                <Route path="conversations" element={<ConversationsPage />} />
                <Route path="messages" element={<ConversationsPage />} />
                <Route path="matching" element={<MatchingPage />} />
                <Route path="zones" element={<ZonesPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="capture" element={<Navigate to="/capture" replace />} />
                <Route path="explore" element={<Navigate to="/explore" replace />} />
                <Route path="*" element={<Navigate to="/crm/dashboard" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
