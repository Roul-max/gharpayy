import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { api } from './services/api';
import PublicNavbar from './components/PublicNavbar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      cacheTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 2
    },
    mutations: {
      retry: 1
    }
  }
});
const Marketplace = lazy(() => import('./pages/marketplace'));
const CRMHome = lazy(() => import('./pages/crm'));
const OwnerPortal = lazy(() => import('./pages/owner/OwnerPortal'));
// CRM module pages render inside CRMHome to preserve the sidebar layout.

type AppRole = 'admin' | 'manager' | 'agent' | 'owner';

const CRM_ROLES: AppRole[] = ['admin', 'manager', 'agent'];
const OWNER_ROLES: AppRole[] = ['admin', 'manager', 'owner'];

function readStoredRole(): AppRole | null {
  const role = localStorage.getItem('app_role');
  if (role === 'admin' || role === 'manager' || role === 'agent' || role === 'owner') return role;
  return null;
}

function routeForRole(role: AppRole) {
  return role === 'owner' ? '/owner-portal' : '/dashboard';
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4">
      <div className="glass-surface w-full max-w-lg rounded-2xl p-6">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Something went wrong</h2>
        <pre className="mt-3 overflow-auto rounded-xl bg-black/20 p-3 text-xs text-rose-100">
          {error instanceof Error ? error.message : String(error)}
        </pre>
        <button onClick={resetErrorBoundary} className="btn-primary mt-5">
          Try again
        </button>
      </div>
    </div>
  );
}

const AuthPage = () => {
  const location = useLocation();
  const from = (location.state as any)?.from || '/dashboard';
  const [email, setEmail] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [authStatus, setAuthStatus] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-page app-shell relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <PublicNavbar
        activePath="/auth"
        items={[
          { to: '/', label: 'Home' },
          { to: '/explore', label: 'Explore' },
          { to: '/capture', label: 'Capture Lead' }
        ]}
        showAuth={false}
        ctaLabel="Explore"
        ctaTo="/explore"
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" />
      </div>

      <div className="auth-panel relative mt-20 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-slate-950/80 shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur-2xl lg:grid-cols-2">
        <div className="auth-feature hidden border-r border-white/10 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-amber-300/10 p-9 lg:block">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/20 text-cyan-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">Gharpayy CRM Workspace</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Keep every lead, visit, and booking in one place with real-time collaboration and audit-ready workflows.
          </p>

          <div className="mt-6 space-y-3 text-sm text-slate-200">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
              <span>Unified pipeline for leads, visits, bookings, and owner coordination.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
              <span>Live updates across teams with notifications and follow-ups.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
              <span>Role-based access to keep sensitive owner data protected.</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Leads Managed</p>
              <p className="mt-1 text-lg font-semibold text-white">10k+ / day</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Active Users</p>
              <p className="mt-1 text-lg font-semibold text-white">30+ CRM</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Owners</p>
              <p className="mt-1 text-lg font-semibold text-white">100+</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
            “We cut follow-up leaks by 40% after moving everything into Gharpayy CRM.”
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-cyan-200">Operations Lead</p>
          </div>
        </div>

        <form
          className="auth-form p-7 sm:p-10"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setAuthStatus('Signing in...');
              const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement | null)?.value ?? '';
              const result = await api.auth.login({ email, password });
              localStorage.setItem('token', result.session.access_token);
              if (result.session.refresh_token) {
                localStorage.setItem('refresh_token', result.session.refresh_token);
              }
              if (result.user?.id) {
                localStorage.setItem('user_id', result.user.id);
              }
              if (result.role) {
                localStorage.setItem('app_role', result.role);
              }
              localStorage.setItem('app_roles', JSON.stringify(result.roles ?? (result.role ? [result.role] : [])));
              window.location.href = from;
            } catch (error) {
              setAuthStatus(error instanceof Error ? error.message : 'Unable to sign in.');
            }
          }}
        >
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-200 lg:hidden">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to continue to your workspace.</p>

          <div className="mt-7 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Email</label>
                <input className="input-modern" placeholder="name@company.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Password</label>
                <div className="relative">
                  <input
                    className="input-modern pr-10"
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent" />
                Keep me signed in
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!email) {
                    setAuthStatus('Enter your email first, then click Forgot password.');
                    return;
                  }
                  setShowReset(true);
                  setAuthStatus('');
                }}
                className="text-cyan-300 hover:text-cyan-200"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {showReset && (
            <div className="mt-4 rounded-xl border border-cyan-300/35 bg-cyan-400/10 p-3 text-xs text-cyan-100">
              Reset link will be sent to <strong>{email}</strong>.
              <button
                type="button"
                className="btn-secondary ml-3 px-3 py-1.5 text-xs"
                onClick={async () => {
                  try {
                    await api.auth.resetPassword(email);
                    setShowReset(false);
                    setAuthStatus(`Password reset link sent to ${email}.`);
                  } catch (error) {
                    setAuthStatus(error instanceof Error ? error.message : 'Unable to send reset link.');
                  }
                }}
              >
                Send Reset Link
              </button>
            </div>
          )}

          <button className="btn-primary mt-6 w-full py-3 text-sm font-bold" type="submit">Sign in to CRM</button>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
            Need access? Ask your admin to enable your account and roles.
          </div>

          {authStatus && <p className="mt-4 text-center text-xs text-cyan-300">{authStatus}</p>}
        </form>
      </div>
    </div>
  );
};

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactElement; allowedRoles?: AppRole[] }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const [role, setRole] = useState<AppRole | null>(() => readStoredRole());
  const [loading, setLoading] = useState<boolean>(() => !!token && !readStoredRole());

  useEffect(() => {
    let active = true;
    if (!token) return;

    const storedRole = readStoredRole();
    if (storedRole) {
      setRole(storedRole);
      setLoading(false);
      return;
    }

    const loadRole = async () => {
      try {
        const me = await api.auth.me();
        const resolved = me?.role || me?.roles?.[0];
        if (!active) return;
        if (resolved === 'admin' || resolved === 'manager' || resolved === 'agent' || resolved === 'owner') {
          localStorage.setItem('app_role', resolved);
          localStorage.setItem('app_roles', JSON.stringify(me?.roles ?? [resolved]));
          setRole(resolved);
        }
      } catch {
        if (!active) return;
        setRole(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRole();
    return () => {
      active = false;
    };
  }, [token]);

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <div className="card-surface p-6 text-sm text-slate-300">Loading workspace...</div>
      </div>
    );
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    if (!role) {
      return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
    }
    return <Navigate to={routeForRole(role)} replace />;
  }

  return children;
}

export default function App() {
  const protectedRoutes: Array<{ path: string; roles: AppRole[]; element: React.ReactElement }> = [
    { path: '/crm/*', roles: CRM_ROLES, element: <CRMHome /> },
    { path: '/dashboard', roles: CRM_ROLES, element: <Navigate to="/crm/dashboard" replace /> },
    { path: '/leads', roles: CRM_ROLES, element: <Navigate to="/crm/leads" replace /> },
    { path: '/pipeline', roles: CRM_ROLES, element: <Navigate to="/crm/pipeline" replace /> },
    { path: '/visits', roles: CRM_ROLES, element: <Navigate to="/crm/visits" replace /> },
    { path: '/conversations', roles: CRM_ROLES, element: <Navigate to="/crm/conversations" replace /> },
    { path: '/messages', roles: CRM_ROLES, element: <Navigate to="/crm/messages" replace /> },
    { path: '/bookings', roles: CRM_ROLES, element: <Navigate to="/crm/bookings" replace /> },
    { path: '/booking', roles: CRM_ROLES, element: <Navigate to="/crm/bookings" replace /> },
    { path: '/analytics', roles: CRM_ROLES, element: <Navigate to="/crm/analytics" replace /> },
    { path: '/owners', roles: ['admin', 'manager'], element: <Navigate to="/crm/owners" replace /> },
    { path: '/inventory', roles: CRM_ROLES, element: <Navigate to="/crm/inventory" replace /> },
    { path: '/availability', roles: CRM_ROLES, element: <Navigate to="/crm/availability" replace /> },
    { path: '/effort', roles: CRM_ROLES, element: <Navigate to="/crm/effort" replace /> },
    { path: '/matching', roles: CRM_ROLES, element: <Navigate to="/crm/matching" replace /> },
    { path: '/zones', roles: CRM_ROLES, element: <Navigate to="/crm/zones" replace /> },
    { path: '/historical', roles: CRM_ROLES, element: <Navigate to="/crm/historical" replace /> },
    { path: '/notifications', roles: CRM_ROLES, element: <Navigate to="/crm/notifications" replace /> },
    { path: '/norifications', roles: CRM_ROLES, element: <Navigate to="/crm/notifications" replace /> },
    { path: '/follow-ups', roles: CRM_ROLES, element: <Navigate to="/crm/follow-ups" replace /> },
    { path: '/profile', roles: CRM_ROLES, element: <Navigate to="/crm/profile" replace /> },
    { path: '/settings', roles: CRM_ROLES, element: <Navigate to="/crm/settings" replace /> },
    { path: '/owner/*', roles: OWNER_ROLES, element: <OwnerPortal /> },
    { path: '/owner-portal', roles: OWNER_ROLES, element: <OwnerPortal /> }
  ];

  const basename = (import.meta.env.VITE_BASE as string | undefined) || '/';

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <Router basename={basename}>
          <Suspense
            fallback={
              <div className="app-shell flex min-h-screen items-center justify-center px-4">
                <div className="card-surface p-6 text-sm text-slate-300">Loading application...</div>
              </div>
            }
          >
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/*" element={<Marketplace />} />
              {protectedRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<ProtectedRoute allowedRoles={route.roles}>{route.element}</ProtectedRoute>}
                />
              ))}
            </Routes>
          </Suspense>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
