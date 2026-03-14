import { useState } from 'react';
import { api } from '../../services/api';
import PremiumFooter from '../../components/PremiumFooter';
import PublicNavbar from '../../components/PublicNavbar';
import TurnstileWidget from '../../components/TurnstileWidget';

export default function Capture() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    area: '',
    budget: '',
    gender: 'any',
    sharing_type: 'double'
  });
  const [status, setStatus] = useState<string>('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const captchaBypass = import.meta.env.VITE_CAPTCHA_BYPASS === 'true';

  return (
    <div className="capture-page app-shell px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <PublicNavbar
        activePath="/capture"
        items={[
          { to: '/', label: 'Home' },
          { to: '/explore', label: 'Explore' },
          { to: '/capture', label: 'Capture Lead' }
        ]}
        ctaLabel="Explore"
        ctaTo="/explore"
      />

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl glass-surface p-7">
          <h1 className="page-title text-white">Lead Capture</h1>
          <p className="page-subtitle">Capture inbound interest and route to the CRM in real time.</p>

          <form
            className="mt-6 grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setStatus('Submitting...');
              try {
                if (!captchaBypass && !captchaToken) {
                  setStatus('Please complete the captcha to continue.');
                  return;
                }
                const payload = {
                  ...form,
                  budget: form.budget ? Number(form.budget) : undefined,
                  source: 'landing_page',
                  captchaToken: captchaBypass ? 'bypass' : captchaToken
                };
                const result = await api.public.captureLead(payload);
                setStatus(result?.deduplicated ? 'Lead already existed, so the CRM record was updated instead of creating a duplicate.' : 'Lead submitted successfully.');
                setForm({ name: '', phone: '', email: '', city: '', area: '', budget: '', gender: 'any', sharing_type: 'double' });
                setCaptchaToken('');
                setCaptchaKey((value) => value + 1);
              } catch (error) {
                setStatus(error instanceof Error ? error.message : 'Failed to submit lead.');
              }
            }}
          >
            <input className="input-modern" placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <input className="input-modern" placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
            <input className="input-modern" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <input className="input-modern" placeholder="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            <input className="input-modern" placeholder="Area" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} />
            <input className="input-modern" placeholder="Budget" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} />
            <select className="select-modern" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
              <option value="any">Any gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <select className="select-modern" value={form.sharing_type} onChange={(e) => setForm((f) => ({ ...f, sharing_type: e.target.value }))}>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
            </select>
            <div className="sm:col-span-2">
              <TurnstileWidget
                key={captchaKey}
                siteKey={turnstileSiteKey}
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken('')}
                onError={() => setCaptchaToken('')}
                className="rounded-xl"
              />
            </div>
            <button className="btn-primary sm:col-span-2" type="submit">Submit Inquiry</button>
          </form>

          {status && <p className="mt-4 text-sm text-slate-300">{status}</p>}
        </div>

        <div className="card-surface p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">What happens next</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Your inquiry is routed instantly</h2>
          <p className="mt-2 text-sm text-slate-300">
            Every submission lands in the CRM queue, triggers lead routing, and alerts the assigned agent.
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">SLA monitoring</p>
              <p className="mt-1 text-xs text-slate-400">Agent response targets are tracked automatically.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Verified inventory</p>
              <p className="mt-1 text-xs text-slate-400">We match you only with properties that have live availability.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">Dedicated support</p>
              <p className="mt-1 text-xs text-slate-400">A single agent guides you from shortlisting to booking.</p>
            </div>
          </div>
        </div>
      </div>
      <PremiumFooter />
    </div>
  );
}
