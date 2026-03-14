import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Heart,
  Star,
  Users,
  BedDouble,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  Shield,
  Clock3,
  TrendingUp,
  CircleCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { usePublicProperties, usePublicStats } from '../../hooks/usePublicMarketplace';
import PremiumFooter from '../../components/PremiumFooter';
import PublicNavbar from '../../components/PublicNavbar';

function formatInr(value?: number | null) {
  if (!value || Number.isNaN(value)) return 'Price on request';
  return `\u20B9${new Intl.NumberFormat('en-IN').format(value)}`;
}

type PropertyRecord = {
  id: string;
  name: string;
  city?: string | null;
  area?: string | null;
  starts_from?: number | null;
  total_beds?: number | null;
  vacant_beds?: number | null;
  gender_allowed?: 'male' | 'female' | 'any' | string;
  photos?: string[] | null;
};

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const [city, setCity] = useState('');
  const [gender, setGender] = useState('any');
  const [budget, setBudget] = useState('any');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qCity = params.get('city');
    const qGender = params.get('gender');
    const qBudget = params.get('budget');
    if (qCity) setCity(qCity);
    if (qGender) setGender(qGender);
    if (qBudget) setBudget(qBudget);
  }, [location.search]);

  const filters = useMemo(
    () => ({
      city: city || '',
      gender,
      budget
    }),
    [city, gender, budget]
  );

  const { data: propertiesRes, isLoading: loadingProperties } = usePublicProperties(filters);
  const { data: statsRes } = usePublicStats();

  const properties: PropertyRecord[] = (propertiesRes?.pages ?? []).flatMap((page: any) => page?.data ?? []);
  const stats = statsRes?.data ?? {
    properties: 0,
    vacantBeds: 0,
    leads: 0
  };

  const cityPool = useMemo(() => {
    const unique = new Set<string>();
    properties.forEach((property) => {
      if (property.city) unique.add(property.city);
    });
    return Array.from(unique);
  }, [properties]);

  const suggestions = cityPool.filter((value) => value.toLowerCase().includes(city.toLowerCase()));

  const toggleFav = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (gender !== 'any') params.set('gender', gender);
    if (budget !== 'any') params.set('budget', budget);
    navigate(`/explore${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="home-page min-h-screen overflow-x-hidden bg-slate-950 text-slate-100 [font-family:Space_Grotesk,Manrope,ui-sans-serif,system-ui]">
      <PublicNavbar
        activePath="/"
        items={[
          { to: '/explore', label: 'Explore' },
          { to: '/owner-portal', label: 'For Owners' },
          { to: '/capture', label: 'Capture Lead' },
          { to: '/about', label: 'About' }
        ]}
        ctaLabel="Find PG"
        ctaTo="/explore"
        ctaOnClick={runSearch}
      />

      <section className="home-hero relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-28 lg:pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:56px_56px]" />
          <motion.div
            animate={{ x: [0, 90, 0], y: [0, -70, 0], scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
            className="absolute -left-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-cyan-500/30 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 20, ease: 'easeInOut' }}
            className="absolute -bottom-28 -right-20 h-[32rem] w-[32rem] rounded-full bg-amber-400/25 blur-3xl"
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              <Sparkles size={14} /> Shopify-grade PG commerce
            </div>

            <h1 className="home-hero-title text-4xl font-bold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Run your PG business
              <span className="home-hero-accent block bg-gradient-to-r from-cyan-200 via-white to-amber-200 bg-clip-text text-transparent">
                like a modern SaaS brand.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-slate-300 sm:text-lg">
              Gharpayy combines storefront discovery, verified inventory, and a CRM pipeline so you can acquire, convert, and
              retain residents from one dashboard.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={runSearch}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:from-cyan-300 hover:to-cyan-200"
              >
                Start exploring <ArrowRight size={16} />
              </button>
              <Link
                to="/owner-portal"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Launch owner portal
              </Link>
              <span className="text-xs text-slate-400">No credit card required</span>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                [`${stats.properties}+`, 'Verified homes'],
                [`${stats.vacantBeds}+`, 'Beds available'],
                [`${stats.leads}+`, 'Happy residents']
              ].map(([count, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Trust-ranked listings</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Instant visit scheduling</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Built-in CRM automations</span>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="rounded-3xl border border-white/12 bg-slate-900/70 p-5 shadow-2xl backdrop-blur-xl"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <img src="https://picsum.photos/seed/hero-modern/1200/700" alt="Modern co-living interior" className="h-52 w-full object-cover sm:h-60" />
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Conversion lift</p>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-3xl font-bold text-white">+32%</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-200">
                    <TrendingUp size={12} /> this month
                  </span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Clock3, title: '24h', text: 'Avg response' },
                  { icon: ShieldCheck, title: '100%', text: 'Verified listings' },
                  { icon: CircleCheck, title: 'One CRM', text: 'Sales + Ops' }
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <item.icon className="h-4 w-4 text-cyan-300" />
                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>

        <div className="relative mx-auto mt-10 max-w-7xl">
          <div className="home-search-panel grid gap-3 rounded-3xl border border-white/15 bg-slate-900/70 p-3 shadow-2xl backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-12">
            <div className="relative rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 sm:col-span-2">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Location</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Search city" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
              {city && suggestions.length > 0 && (
                <div className="absolute left-3 right-3 top-[4.4rem] z-20 rounded-xl border border-white/10 bg-slate-900 py-2 shadow-xl">
                  {suggestions.slice(0, 5).map((value) => (
                    <button key={value} onClick={() => setCity(value)} className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5">{value}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 lg:col-span-3">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full cursor-pointer appearance-none bg-transparent text-sm text-white outline-none">
                <option className="bg-slate-900" value="any">Any</option>
                <option className="bg-slate-900" value="male">Male</option>
                <option className="bg-slate-900" value="female">Female</option>
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 lg:col-span-3">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Budget</label>
              <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full cursor-pointer appearance-none bg-transparent text-sm text-white outline-none">
                <option className="bg-slate-900" value="any">Any budget</option>
                <option className="bg-slate-900" value="under10k">Under {'\u20B9'}10,000</option>
                <option className="bg-slate-900" value="10k-15k">{'\u20B9'}10,000 - {'\u20B9'}15,000</option>
                <option className="bg-slate-900" value="above15k">Above {'\u20B9'}15,000</option>
              </select>
            </div>

            <button onClick={runSearch} className="sm:col-span-2 lg:col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.35)] transition hover:-translate-y-0.5 hover:from-cyan-400 hover:to-cyan-300">
              <Search size={18} /> Search Properties
            </button>
          </div>
        </div>
      </section>

      <section className="home-featured border-y border-white/10 bg-slate-900/70 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Featured Properties</h2>
              <p className="mt-2 text-slate-400">Live inventory from your marketplace database.</p>
            </div>
            <Link to="/explore" className="hidden items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200 md:inline-flex">
              View all <ArrowRight size={16} />
            </Link>
          </div>

          {loadingProperties ? (
            <div className="card-surface p-6 text-sm text-slate-400">Loading properties...</div>
          ) : properties.length === 0 ? (
            <div className="card-surface p-6 text-sm text-slate-400">No properties match current filters.</div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {properties.slice(0, 12).map((property) => {
                const image = property.photos?.[0] ?? `https://picsum.photos/seed/${property.id}/800/600`;
                const areaText = [property.area, property.city].filter(Boolean).join(', ');
                const genderText = property.gender_allowed === 'any' ? 'Any' : property.gender_allowed === 'male' ? 'Male' : 'Female';
                return (
                  <motion.article key={property.id} whileHover={{ y: -6 }} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-[0_12px_34px_rgba(2,6,23,0.28)]">
                    <Link to={`/property/${property.id}`} className="block">
                      <div className="relative">
                        <img src={image} alt={property.name} className="h-52 w-full object-cover" loading="lazy" />
                        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-900">
                            <ShieldCheck className="mr-1 h-3 w-3 text-emerald-600" /> Verified
                          </span>
                        </div>
                        <button
                          onClick={(event) => {
                            event.preventDefault();
                            toggleFav(property.id);
                          }}
                          className="absolute right-3 top-3 rounded-full bg-black/45 p-2 text-white backdrop-blur transition hover:bg-black/65"
                          aria-label="Toggle favorite"
                        >
                          <Heart size={18} className={favorites.includes(property.id) ? 'fill-rose-500 text-rose-500' : 'text-white'} />
                        </button>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 text-base font-semibold text-white">{property.name}</h3>
                          <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-1 text-xs text-slate-100">
                            <Star size={12} className="mr-1 fill-amber-400 text-amber-400" /> 4.6
                          </span>
                        </div>

                        <p className="mt-2 flex items-center text-sm text-slate-400">
                          <MapPin size={14} className="mr-1.5" /> {areaText || 'Location unavailable'}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1.5"><Users size={13} /> {genderText}</span>
                          <span className="inline-flex items-center gap-1.5"><BedDouble size={13} /> {property.vacant_beds ?? 0} vacant</span>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                          <div>
                            <p className="text-xs text-slate-500">From</p>
                            <p className="text-lg font-bold text-white">{formatInr(property.starts_from)}<span className="text-sm text-slate-400"> /mo</span></p>
                          </div>
                          <p className="text-xs font-medium text-slate-400">{property.total_beds ?? 0} beds</p>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="home-trust px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Built for modern rental ops</h2>
              <p className="mt-2 text-slate-400">A tighter marketplace + CRM loop from first click to confirmed booking.</p>
            </div>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {[
            {
              icon: Building2,
              title: 'Verified Inventory',
              text: 'Every listing is synced from owner inventory and checked for bed status.'
            },
            {
              icon: CheckCircle2,
              title: 'Transparent Pricing',
              text: 'Pricing is pulled from property room data with clear monthly breakdowns.'
            },
            {
              icon: ShieldCheck,
              title: 'Safe Onboarding',
              text: 'Lead capture, visits, and conversations are logged in CRM workflows.'
            }
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-[0_10px_28px_rgba(2,6,23,0.25)]">
              <item.icon className="h-8 w-8 text-cyan-300" />
              <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-suite border-y border-white/10 bg-slate-900/80 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-100/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-[0_10px_24px_rgba(16,185,129,0.15)]">
                <CircleCheck size={14} /> SaaS-Grade Operations
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">One platform for marketplace, CRM, and owner ops</h2>
              <p className="mt-3 max-w-xl text-slate-300">
                Gharpayy combines acquisition, inventory, and booking execution into a single system so teams move faster without
                losing control over SLAs.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Shield, title: 'Role-based controls', text: 'Granular access for admins, agents, and owners.' },
                  { icon: TrendingUp, title: 'Revenue visibility', text: 'Track lead velocity, conversion, and occupancy.' },
                  { icon: Users, title: 'Team coordination', text: 'Follow-ups, reminders, and SLA coverage in one view.' },
                  { icon: Clock3, title: 'Response automation', text: 'Auto-assign leads and trigger reminders.' }
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <item.icon className="h-5 w-5 text-cyan-300" />
                    <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_50px_rgba(2,6,23,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Platform modules</p>
              <div className="mt-6 space-y-4">
                {[
                  { title: 'Marketplace', desc: 'Search, map view, and verified listing experience.' },
                  { title: 'CRM Workspace', desc: 'Lead stages, pipeline, visits, and conversations.' },
                  { title: 'Owner Portal', desc: 'Inventory updates, booking visibility, and effort reports.' },
                  { title: 'Automation', desc: 'Lead routing, notifications, and score refresh.' }
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-ai px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                <Sparkles size={14} /> AI Concierge
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">AI-assisted discovery and conversion</h2>
              <p className="mt-2 text-slate-400">Guide customers and agents with quick answers, visit suggestions, and intent signals.</p>
            </div>
            <Link to="/capture" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Capture a lead <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              {[
                { title: 'Instant property matching', text: 'Share top options based on budget, gender, and locality in seconds.' },
                { title: 'Visit orchestration', text: 'Capture visit requests and auto-create follow-ups for agents.' },
                { title: 'Conversation context', text: 'Persist chat history and align responses with availability.' }
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-[0_10px_30px_rgba(2,6,23,0.25)]">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-amber-300/10 p-6">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Sample AI Workflow</p>
                <div className="mt-4 space-y-4 text-sm">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-200">
                    <p className="text-xs text-slate-400">Customer asks</p>
                    Need a PG near Manyata Tech Park under \u20B914k.
                  </div>
                  <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-3 text-cyan-100">
                    <p className="text-xs text-cyan-200">AI Concierge</p>
                    Suggests 3 verified options and asks preferred move-in date.
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-200">
                    <p className="text-xs text-slate-400">CRM action</p>
                    Creates follow-up and schedules visit reminder for agent.
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-full border border-white/15 px-3 py-1">Smart prompts</span>
                  <span className="rounded-full border border-white/15 px-3 py-1">Auto follow-ups</span>
                  <span className="rounded-full border border-white/15 px-3 py-1">Conversation history</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-proof border-y border-white/10 bg-slate-900/80 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-2xl font-bold text-white">Why teams stick with Gharpayy</h3>
            <p className="mt-2 text-sm text-slate-400">Operational clarity across acquisition, inventory, and revenue pipelines.</p>
            <div className="mt-6 space-y-4">
              {[
                'Reduce lead response time below 15 minutes.',
                'Keep occupancy updates synced with owners.',
                'Track every visit and booking without spreadsheets.',
                'Measure agent performance in real time.'
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                  <p className="text-sm text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: 'Neha Kapoor', role: 'City Ops Lead', quote: 'We moved every lead into a clear stage with no follow-up leakage.' },
              { name: 'Arjun Mehta', role: 'Owner Partner', quote: 'Room availability now updates daily and bookings are visible in one place.' },
              { name: 'Ritika Shah', role: 'CRM Manager', quote: 'Pipeline metrics let us rebalance zones in minutes, not days.' },
              { name: 'Zain Ali', role: 'Sales Agent', quote: 'I can pick up new leads and schedule visits without switching tools.' }
            ].map((item) => (
              <div key={item.name} className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-sm text-slate-300">"{item.quote}"</p>
                <div className="mt-4 text-xs text-slate-400">{item.name} · {item.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-how px-4 pb-20 sm:px-6 lg:px-8">
        <div className="home-how-shell mx-auto max-w-7xl rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h3 className="text-2xl font-bold text-white sm:text-3xl">How Gharpayy works</h3>
            <Link to="/capture" className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 md:inline-flex">
              Capture new lead <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { step: '01', title: 'Discover inventory', text: 'Search by city, budget and occupancy rules in seconds.' },
              { step: '02', title: 'Shortlist and tour', text: 'Share verified listings, schedule visits and capture intent signals.' },
              { step: '03', title: 'Convert in CRM', text: 'Track follow-ups, pricing and booking stages in one workflow.' }
            ].map((item) => (
              <div key={item.step} className="home-how-card rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-cyan-300">{item.step}</p>
                <h4 className="mt-3 text-lg font-semibold text-white">{item.title}</h4>
                <p className="mt-2 text-sm text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-faq px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-white sm:text-3xl">Frequently asked questions</h3>
              <p className="mt-2 text-sm text-slate-400">Answers for teams adopting the Gharpayy CRM + marketplace stack.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { q: 'How do owners update inventory?', a: 'Owners use the portal to confirm room status and bed availability with audit logs.' },
              { q: 'Can we control lead assignment?', a: 'Yes, zoning + team queues auto-route leads and managers can override.' },
              { q: 'Does the system support visits and tours?', a: 'Visit requests are captured from the marketplace and tracked in CRM.' },
              { q: 'Is pricing visible to customers?', a: 'Room pricing is displayed transparently from inventory data.' }
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                <p className="text-sm font-semibold text-white">{item.q}</p>
                <p className="mt-2 text-sm text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-300/10 via-slate-900 to-cyan-400/10 p-8 text-center sm:p-12">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">List your PG. Fill your rooms faster.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">Reach high-intent tenants, manage leads in one place, and close bookings without messy coordination.</p>
          <button onClick={() => navigate('/owner-portal')} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200">
            Start Listing <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <PremiumFooter />
    </div>
  );
}
