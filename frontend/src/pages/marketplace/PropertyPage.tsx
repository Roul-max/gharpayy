import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, CheckCircle2, BedDouble, Users, CalendarDays, ShieldCheck, ArrowLeft } from 'lucide-react';
import L from 'leaflet';
import { api } from '../../services/api';
import { usePublicProperty } from '../../hooks/usePublicMarketplace';
import PremiumFooter from '../../components/PremiumFooter';
import PublicNavbar from '../../components/PublicNavbar';
import { BED_STATUSES } from '../../constants/enums';
import TurnstileWidget from '../../components/TurnstileWidget';
import { useQueryClient } from '@tanstack/react-query';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value?: string | null) => !!value && UUID_RE.test(value);

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

function formatInr(value?: number | null) {
  if (!value || Number.isNaN(value)) return 'Price on request';
  return `\u20B9${new Intl.NumberFormat('en-IN').format(value)}`;
}

export default function PropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = usePublicProperty(id);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ name: '', phone: '', email: '' });
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [reservationCaptchaToken, setReservationCaptchaToken] = useState('');
  const [reservationCaptchaKey, setReservationCaptchaKey] = useState(0);
  const [visitCaptchaToken, setVisitCaptchaToken] = useState('');
  const [visitCaptchaKey, setVisitCaptchaKey] = useState(0);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const captchaBypass = import.meta.env.VITE_CAPTCHA_BYPASS === 'true';

  const property = data?.data;

  const rooms = useMemo(() => {
    return (property?.rooms ?? []).map((room: any) => {
      const beds = room.beds ?? [];
      const availableBeds = beds.filter((b: any) => b.status === BED_STATUSES[0]);
      const available = availableBeds.length;
      const price = Number(room.price ?? room.monthly_rent ?? 0);
      return {
        id: room.id,
        type: room.room_type,
        price,
        available,
        availableBedId: availableBeds[0]?.id ?? null
      };
    });
  }, [property]);

  const selectedRoom = useMemo(() => {
    return rooms.find((room: any) => room.id === selectedRoomId) ?? null;
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (!paymentOpen) return;
    if (selectedRoomId && rooms.some((room: any) => room.id === selectedRoomId)) return;
    if (!rooms.length) return;
    const firstWithAvailability = rooms.find((room: any) => room.available > 0) ?? rooms[0];
    if (firstWithAvailability) {
      setSelectedRoomId(firstWithAvailability.id);
    }
  }, [paymentOpen, rooms, selectedRoomId]);

  useEffect(() => {
    if (!rooms.length || selectedRoomId || !paymentOpen) return;
    const firstWithAvailability = rooms.find((room: any) => room.available > 0);
    if (firstWithAvailability) {
      setSelectedRoomId(firstWithAvailability.id);
    } else {
      setSelectedRoomId(rooms[0]?.id ?? null);
    }
  }, [rooms, selectedRoomId, paymentOpen]);

  const availableBedId = useMemo(() => {
    if (selectedRoom?.availableBedId) return selectedRoom.availableBedId;
    if (!selectedRoomId) return null;
    const roomFromProperty = (property?.rooms ?? []).find((room: any) => room.id === selectedRoomId);
    const bed = (roomFromProperty?.beds ?? []).find((b: any) => b.status === BED_STATUSES[0]);
    return bed?.id ?? null;
  }, [selectedRoom, selectedRoomId, property]);

  const images = (property?.photos?.length ? property.photos : [`https://picsum.photos/seed/${property?.id || 'pg'}/1200/900`, 'https://picsum.photos/seed/pg2/1200/900', 'https://picsum.photos/seed/pg3/1200/900']) as string[];

  if (isLoading) {
    return (
      <div className="property-page app-shell px-4 pb-14 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl card-surface p-8 text-slate-300">Loading property...</div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="property-page app-shell px-4 pb-14 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl card-surface p-8 text-slate-300">Property not found.</div>
      </div>
    );
  }

  return (
    <div className="property-page app-shell px-4 pb-14 pt-24 sm:px-6 lg:px-8">
      <PublicNavbar activePath="/explore" ctaLabel="Capture Lead" ctaTo="/capture" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Listing #{property.id}</p>
        </div>

        <div className="mb-8 rounded-3xl glass-surface p-6 shadow-[0_18px_48px_rgba(2,6,23,0.28)]">
          <h1 className="text-3xl font-bold text-white">{property.name}</h1>
          <p className="mt-2 flex items-center text-sm text-slate-300">
            <MapPin className="mr-1.5 h-4 w-4 text-cyan-300" /> {property.address || `${property.area || ''} ${property.city || ''}`}
          </p>
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-3">
          <div className="card-surface p-4">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
            <p className="mt-2 text-sm font-semibold text-white">Verified listing</p>
            <p className="mt-1 text-xs text-slate-400">Owner and inventory checks completed.</p>
          </div>
          <div className="card-surface p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <p className="mt-2 text-sm font-semibold text-white">Flexible visits</p>
            <p className="mt-1 text-xs text-slate-400">Schedule visits with agent coordination.</p>
          </div>
          <div className="card-surface p-4">
            <BedDouble className="h-5 w-5 text-amber-300" />
            <p className="mt-2 text-sm font-semibold text-white">Live availability</p>
            <p className="mt-1 text-xs text-slate-400">Inventory updates sync from owners.</p>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <img src={images[0]} alt="Main" className="h-full min-h-[19rem] w-full object-cover" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <img src={images[1]} alt="Room" className="h-full min-h-[9rem] w-full object-cover" />
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <img src={images[2]} alt="Common area" className="h-full min-h-[9rem] w-full object-cover" />
              <button
                type="button"
                onClick={() => window.open(images[0], '_blank', 'noopener,noreferrer')}
                className="absolute inset-0 flex items-center justify-center bg-black/45 transition hover:bg-black/55"
              >
                <span className="rounded-full border border-white/30 bg-black/30 px-4 py-2 text-sm font-semibold text-white">
                  View Gallery
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
          <div className="space-y-7 lg:col-span-2">
            <section className="card-surface p-6">
              <h2 className="text-xl font-bold text-white">Overview</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <Users className="mx-auto mb-2 h-5 w-5 text-cyan-300" />
                  <p className="text-xs text-slate-400">Gender</p>
                  <p className="mt-1 text-sm font-semibold text-white">{property.gender_allowed || 'Any'}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <BedDouble className="mx-auto mb-2 h-5 w-5 text-cyan-300" />
                  <p className="text-xs text-slate-400">Room Types</p>
                  <p className="mt-1 text-sm font-semibold text-white">{rooms.length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <CalendarDays className="mx-auto mb-2 h-5 w-5 text-cyan-300" />
                  <p className="text-xs text-slate-400">Notice</p>
                  <p className="mt-1 text-sm font-semibold text-white">30 days</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <ShieldCheck className="mx-auto mb-2 h-5 w-5 text-cyan-300" />
                  <p className="text-xs text-slate-400">Deposit</p>
                  <p className="mt-1 text-sm font-semibold text-white">1 month</p>
                </div>
              </div>
            </section>

            <section className="card-surface p-6">
              <h2 className="text-xl font-bold text-white">Amenities</h2>
              <div className="mt-4 grid grid-cols-2 gap-y-3 md:grid-cols-3">
                {(property.amenities ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400">No amenities added yet.</p>
                ) : (
                  (property.amenities ?? []).map((amenity: string) => (
                    <div key={amenity} className="flex items-center text-sm text-slate-200">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />
                      {amenity}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="card-surface p-6">
              <h2 className="text-xl font-bold text-white">Location</h2>
              <div className="relative z-0 mt-4 h-80 overflow-hidden rounded-2xl border border-white/15">
                <MapContainer center={[property.latitude ?? 12.9352, property.longitude ?? 77.6245]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[property.latitude ?? 12.9352, property.longitude ?? 77.6245]}>
                    <Popup>{property.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="card-surface sticky top-24 p-6">
              <h3 className="text-xl font-bold text-white">Select a Room</h3>
              <p className="mt-1 text-sm text-slate-400">Choose your preferred sharing option.</p>

              <div className="mt-5 space-y-3">
                {rooms.map((room) => (
                  <label
                    key={room.id}
                    className={`flex items-center justify-between rounded-xl border p-3 transition ${
                      room.available > 0
                        ? 'cursor-pointer border-white/20 bg-white/5 hover:border-cyan-300/40'
                        : 'cursor-not-allowed border-white/10 bg-white/5 opacity-55'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="room"
                        checked={selectedRoomId === room.id}
                        onChange={() => setSelectedRoomId(room.id)}
                        disabled={room.available === 0}
                        className="h-4 w-4 border-white/30 bg-transparent text-cyan-300 focus:ring-cyan-300"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-semibold text-white">{room.type}</p>
                        <p className="text-xs text-slate-400">{room.available > 0 ? `${room.available} beds left` : 'Sold out'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatInr(room.price)}</p>
                      <p className="text-xs text-slate-400">/ month</p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                className="btn-primary mt-6 w-full"
                onClick={() => {
                  const params = new URLSearchParams({
                    propertyId: property.id,
                    propertyName: property.name,
                    roomId: selectedRoomId ?? ''
                  });
                  navigate(`/capture?${params.toString()}`);
                }}
              >
                Reserve Bed
              </button>
              <button
                className="btn-secondary mt-3 w-full"
                onClick={() => {
                  const firstWithAvailability = rooms.find((room: any) => room.available > 0) ?? rooms[0];
                  if (firstWithAvailability) {
                    console.debug('[Payment Modal] auto-select room', firstWithAvailability);
                    setSelectedRoomId(firstWithAvailability.id);
                  } else {
                    console.debug('[Payment Modal] no rooms available', rooms);
                  }
                  setPaymentOpen(true);
                }}
                disabled={!availableBedId}
              >
                Pay with Razorpay
              </button>
              <button
                className="btn-secondary mt-3 w-full"
                onClick={async () => {
                  const name = window.prompt('Enter your name for visit request:');
                  if (!name) return;
                  const phone = window.prompt('Enter your phone number:');
                  if (!phone) return;
                  const time = window.prompt('Preferred visit date/time (YYYY-MM-DD HH:mm):');
                  if (!time) return;
                  if (!captchaBypass && !visitCaptchaToken) {
                    setActionStatus('Please complete the captcha before requesting a visit.');
                    return;
                  }
                  try {
                    setActionStatus('Submitting visit request...');
                    const iso = new Date(time).toISOString();
                    await api.public.requestVisit({
                      name,
                      phone,
                      property_id: property.id,
                      scheduled_at: iso,
                      captchaToken: captchaBypass ? 'bypass' : visitCaptchaToken
                    });
                    setActionStatus('Visit request submitted successfully.');
                    setVisitCaptchaToken('');
                    setVisitCaptchaKey((value) => value + 1);
                  } catch {
                    setActionStatus('Could not submit visit request. Please try again.');
                  }
                }}
              >
                Schedule Visit
              </button>
              {!paymentOpen && (
                <div className="mt-4">
                  <p className="text-xs text-slate-400">Complete captcha to request a visit.</p>
                  <TurnstileWidget
                    key={visitCaptchaKey}
                    siteKey={turnstileSiteKey}
                    onVerify={setVisitCaptchaToken}
                    onExpire={() => setVisitCaptchaToken('')}
                    onError={() => setVisitCaptchaToken('')}
                    className="mt-2 rounded-xl"
                  />
                </div>
              )}
              <p className="mt-3 text-center text-xs text-slate-400">Reserving a bed creates a 10-minute soft lock.</p>
              {actionStatus && <p className="mt-2 text-center text-xs text-cyan-300">{actionStatus}</p>}
            </div>
          </div>
        </div>
      </div>
      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="modal-surface w-full max-w-lg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Complete Payment</h3>
              <button className="text-slate-400 hover:text-slate-200" onClick={() => setPaymentOpen(false)}>Close</button>
            </div>
            <p className="text-sm text-slate-400">Provide your details to confirm the reservation and pay securely.</p>
            <form
              className="mt-5 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!availableBedId) return;
                try {
                  setPaymentStatus('loading');
                  setPaymentMessage('Creating reservation...');

                  if (!captchaBypass && !reservationCaptchaToken) {
                    setPaymentStatus('error');
                    setPaymentMessage('Please complete the captcha to continue.');
                    return;
                  }

                  console.debug('[Reservation] pre-submit', {
                    selectedRoomId,
                    availableBedId,
                    propertyId: property?.id,
                    rooms
                  });
                  if (!isUuid(availableBedId) || !isUuid(property?.id)) {
                    console.warn('[Reservation] invalid IDs', {
                      selectedRoomId,
                      availableBedId,
                      propertyId: property?.id
                    });
                    setPaymentStatus('error');
                    setPaymentMessage('No available bed selected. Please choose a room with availability.');
                    return;
                  }

                  const reservationPayload = {
                    name: paymentForm.name,
                    phone: paymentForm.phone,
                    email: paymentForm.email,
                    bed_id: availableBedId,
                    property_id: property.id,
                    captchaToken: captchaBypass ? 'bypass' : reservationCaptchaToken
                  };
                  console.debug('[Reservation] payload', reservationPayload);
                  const reservationResult = await api.public.createReservation(reservationPayload);
                  setReservationCaptchaToken('');
                  setReservationCaptchaKey((value) => value + 1);

                  const { reservation, amount, currency } = reservationResult;
                  setPaymentMessage('Creating payment order...');
                  const paymentIntent = await api.public.createPaymentIntent({
                    reservation_id: reservation.id,
                    amount,
                    currency
                  });

                  const checkout = paymentIntent?.checkout;
                  if (!checkout?.key_id || !checkout?.order_id) {
                    throw new Error('Payment checkout unavailable.');
                  }

                  const loadRazorpay = () =>
                    new Promise((resolve) => {
                      if ((window as any).Razorpay) return resolve(true);
                      const script = document.createElement('script');
                      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                      script.onload = () => resolve(true);
                      script.onerror = () => resolve(false);
                      document.body.appendChild(script);
                    });

                  const ready = await loadRazorpay();
                  if (!ready) throw new Error('Unable to load Razorpay SDK.');

                  const options = {
                    key: checkout.key_id,
                    amount: checkout.amount,
                    currency: checkout.currency,
                    name: property.name,
                    description: 'PG Reservation',
                    order_id: checkout.order_id,
                    prefill: {
                      name: paymentForm.name,
                      email: paymentForm.email,
                      contact: paymentForm.phone
                    },
                    handler: async (response: any) => {
                      try {
                        setPaymentMessage('Confirming payment...');
                        await api.public.confirmPayment({
                          reservation_id: reservation.id,
                          order_id: response.razorpay_order_id,
                          payment_id: response.razorpay_payment_id,
                          signature: response.razorpay_signature
                        });
                        setPaymentStatus('success');
                        setPaymentMessage('Payment successful. Reservation confirmed.');
                        await queryClient.invalidateQueries({ queryKey: ['public-property', id] });
                        await queryClient.invalidateQueries({ queryKey: ['public-properties'] });
                        setActionStatus('Reservation confirmed. Availability updated.');
                        setPaymentOpen(false);
                        setPaymentForm({ name: '', phone: '', email: '' });
                        setPaymentStatus('idle');
                        setPaymentMessage('');
                        setReservationCaptchaToken('');
                        setReservationCaptchaKey((value) => value + 1);
                      } catch (error) {
                        setPaymentStatus('error');
                        setPaymentMessage(error instanceof Error ? error.message : 'Payment confirmation failed.');
                      }
                    }
                  };

                  const rzp = new (window as any).Razorpay(options);
                  rzp.on('payment.failed', (err: any) => {
                    setPaymentStatus('error');
                    setPaymentMessage(err?.error?.description ?? 'Payment failed. Try again.');
                  });
                  rzp.open();
                } catch (error) {
                  setPaymentStatus('error');
                  setPaymentMessage(error instanceof Error ? error.message : 'Payment failed.');
                }
              }}
            >
              <input
                className="input-modern"
                placeholder="Full name"
                value={paymentForm.name}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <input
                className="input-modern"
                placeholder="Phone"
                value={paymentForm.phone}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
              <input
                className="input-modern"
                placeholder="Email (optional)"
                value={paymentForm.email}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <TurnstileWidget
                key={reservationCaptchaKey}
                siteKey={turnstileSiteKey}
                onVerify={setReservationCaptchaToken}
                onExpire={() => setReservationCaptchaToken('')}
                onError={() => setReservationCaptchaToken('')}
                className="rounded-xl"
              />
              <button className="btn-primary w-full" type="submit" disabled={paymentStatus === 'loading'}>
                {paymentStatus === 'loading' ? 'Processing...' : 'Pay & Reserve'}
              </button>
              {paymentMessage && (
                <p className={`text-sm ${paymentStatus === 'error' ? 'text-rose-300' : 'text-cyan-300'}`}>{paymentMessage}</p>
              )}
            </form>
          </div>
        </div>
      )}
      <PremiumFooter />
    </div>
  );
}
