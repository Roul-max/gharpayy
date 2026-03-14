import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { BedDouble, MapPin, Search, SlidersHorizontal, Sparkles, Users } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { usePublicProperties } from '../../hooks/usePublicMarketplace';
import PremiumFooter from '../../components/PremiumFooter';
import PublicNavbar from '../../components/PublicNavbar';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

function formatInr(value?: number | null) {
  if (!value || Number.isNaN(value)) return 'Contact for pricing';
  return `\u20B9${new Intl.NumberFormat('en-IN').format(value)}`;
}

const PropertyMedia = memo(function PropertyMedia({ property }: { property: any }) {
  const image = property.photos?.[0];

  if (image) {
    return <img src={image} alt={property.name} className="h-44 w-full object-cover sm:h-full" loading="lazy" />;
  }

  return (
    <div className="flex h-44 w-full items-end bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.24),transparent_42%),linear-gradient(135deg,rgba(8,15,30,0.95),rgba(15,23,42,0.9))] p-4 sm:h-full">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">Verified Listing</p>
        <p className="mt-1 text-sm font-semibold text-white">{property.name}</p>
      </div>
    </div>
  );
});

const PropertyCard = memo(function PropertyCard({ property }: { property: any }) {
  const areaText = [property.area, property.city].filter(Boolean).join(', ') || 'Location unavailable';
  const genderText = property.gender_allowed === 'any' ? 'Any' : property.gender_allowed === 'male' ? 'Male' : 'Female';

  return (
    <Link to={`/property/${property.id}`} className="block">
      <article className="card-surface overflow-hidden transition hover:-translate-y-0.5">
        <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
          <PropertyMedia property={property} />
          <div className="flex flex-col justify-between p-5">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                  Live inventory
                </span>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                  {property.total_beds ?? 0} total beds
                </span>
              </div>

              <h3 className="text-xl font-semibold text-white">{property.name}</h3>
              <p className="mt-2 flex items-center text-sm text-slate-400">
                <MapPin className="mr-1.5 h-4 w-4 text-cyan-300" />
                {areaText}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {genderText}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BedDouble className="h-3.5 w-3.5" />
                  {property.vacant_beds ?? 0} beds available
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Starts from</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {formatInr(property.starts_from)}
                  <span className="text-sm font-normal text-slate-400"> / month</span>
                </p>
              </div>
              <span className="text-sm font-medium text-cyan-200">View details</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
});

const ExploreMap = memo(function ExploreMap({ properties, clusters, center }: { properties: any[]; clusters: any[]; center: [number, number] }) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="h-[68vh] w-full">
        <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {(clusters.length > 0 ? clusters : properties.filter((p: any) => p.latitude && p.longitude)).map((item: any) => {
            const isCluster = typeof item.count === 'number';
            const position: [number, number] = isCluster ? [item.lat, item.lng] : [item.latitude, item.longitude];
            const icon = isCluster
              ? L.divIcon({
                html: `<div class="map-cluster">${item.count}</div>`,
                className: 'map-cluster-wrapper',
                iconSize: [40, 40]
              })
              : undefined;
            return (
              <Marker key={isCluster ? `${item.lat}-${item.lng}-${item.count}` : item.id} position={position} icon={icon}>
                {!isCluster && (
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{item.name}</p>
                      <p>{[item.area, item.city].filter(Boolean).join(', ')}</p>
                      <p>{formatInr(item.starts_from)}</p>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
});

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'split' | 'map' | 'list'>('split');

  const city = params.get('city') || '';
  const gender = params.get('gender') || 'any';
  const budget = params.get('budget') || 'any';
  const area = params.get('area') || '';

  const filters = useMemo(() => ({ city, gender, budget, area }), [area, budget, city, gender]);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePublicProperties(filters);
  const pages = data?.pages ?? [];
  const properties = useMemo(() => pages.flatMap((page: any) => page?.data ?? []), [pages]);
  const clusters = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number; count: number }>();
    pages.forEach((page: any) => {
      (page?.clusters ?? []).forEach((cluster: any) => {
        const key = `${cluster.lat}:${cluster.lng}`;
        const existing = map.get(key);
        if (existing) {
          existing.count += Number(cluster.count ?? 0);
        } else {
          map.set(key, { lat: cluster.lat, lng: cluster.lng, count: Number(cluster.count ?? 0) });
        }
      });
    });
    return Array.from(map.values());
  }, [pages]);
  const avgPrice = useMemo(() => {
    const values = properties.map((property: any) => Number(property.starts_from ?? 0)).filter((val: number) => val > 0);
    if (values.length === 0) return null;
    const sum = values.reduce((acc: number, val: number) => acc + val, 0);
    return Math.round(sum / values.length);
  }, [properties]);

  const center = useMemo<[number, number]>(() => {
    const first = properties.find((property: any) => property.latitude && property.longitude);
    if (first) return [first.latitude, first.longitude];
    return [12.9352, 77.6245];
  }, [properties]);

  const areas = useMemo(
    () => [...new Set(properties.map((property: any) => property.area).filter(Boolean))] as string[],
    [properties]
  );

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'any') next.delete(key);
    else next.set(key, value);
    setParams(next);
  };

  const listContent = (
    <div className="space-y-4">
      {isLoading ? (
        <div className="card-surface p-5 text-sm text-slate-400">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="card-surface p-6 text-sm text-slate-400">
          No properties match the selected filters. Adjust city, area, gender, or budget to widen the search.
        </div>
      ) : (
        properties.map((property: any) => <PropertyCard key={property.id} property={property} />)
      )}
      {hasNextPage && (
        <div className="flex justify-center">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  return (
    <div className="marketplace-page app-shell pt-24">
      <PublicNavbar activePath="/explore" ctaLabel="Capture Lead" ctaTo="/capture" />

      <section className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="glass-surface rounded-3xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5" /> Explore marketplace
                </p>
                <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Search verified stays with live availability</h1>
                <p className="mt-2 text-sm text-slate-300">
                  Filter by city, area, gender, and budget, then switch between list and map to shortlist faster.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setView('split')} className={view === 'split' ? 'btn-primary' : 'btn-secondary'}>
                  Split
                </button>
                <button type="button" onClick={() => setView('list')} className={view === 'list' ? 'btn-primary' : 'btn-secondary'}>
                  List
                </button>
                <button type="button" onClick={() => setView('map')} className={view === 'map' ? 'btn-primary' : 'btn-secondary'}>
                  Map
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input className="input-modern pl-10" placeholder="Search city" value={city} onChange={(e) => updateFilter('city', e.target.value)} />
              </div>

              <select className="select-modern" value={area} onChange={(e) => updateFilter('area', e.target.value)}>
                <option value="">All Areas</option>
                {areas.map((areaName) => (
                  <option key={areaName} value={areaName}>
                    {areaName}
                  </option>
                ))}
              </select>

              <select className="select-modern" value={gender} onChange={(e) => updateFilter('gender', e.target.value)}>
                <option value="any">Any Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <select className="select-modern" value={budget} onChange={(e) => updateFilter('budget', e.target.value)}>
                <option value="any">Any Budget</option>
                <option value="under10k">Under {'\u20B9'}10,000</option>
                <option value="10k-15k">{'\u20B9'}10,000 - {'\u20B9'}15,000</option>
                <option value="above15k">Above {'\u20B9'}15,000</option>
              </select>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {properties.length} active listings
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <BedDouble className="h-3.5 w-3.5" />
                  {properties.reduce((sum: number, property: any) => sum + Number(property.vacant_beds ?? 0), 0)} beds visible
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Average price: {avgPrice ? formatInr(avgPrice) : 'N/A'}
                </span>
              </div>

              <Link to="/capture" className="btn-secondary">
                Need help? Capture lead
              </Link>
            </div>
          </div>

          {view === 'map' ? (
            <ExploreMap properties={properties} clusters={clusters} center={center} />
          ) : view === 'list' ? (
            <>
              {listContent}
              <div ref={sentinelRef} />
            </>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
              <div>
                {listContent}
                <div ref={sentinelRef} />
              </div>
              <div className="xl:sticky xl:top-28">
                <ExploreMap properties={properties} clusters={clusters} center={center} />
              </div>
            </div>
          )}
        </div>
      </section>

      <PremiumFooter />
    </div>
  );
}
