import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Briefcase, Building2, Mail, Phone, ShieldCheck, Sparkles, Target, Users } from 'lucide-react';
import { api } from '../../services/api';
import PremiumFooter from '../../components/PremiumFooter';
import PublicNavbar from '../../components/PublicNavbar';
import TurnstileWidget from '../../components/TurnstileWidget';

function PageShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const location = useLocation();
  return (
    <div className="marketplace-page app-shell pt-28">
      <PublicNavbar
        activePath={location.pathname}
        items={[
          { to: '/', label: 'Home' },
          { to: '/explore', label: 'Explore' },
          { to: '/about', label: 'About' },
          { to: '/contact', label: 'Contact' }
        ]}
        ctaLabel="Capture Lead"
        ctaTo="/capture"
      />
      <div className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="glass-surface rounded-3xl p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5" /> Company
                </p>
                <h1 className="mt-3 page-title text-white">{title}</h1>
                <p className="page-subtitle">{subtitle}</p>
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>
      <PremiumFooter />
    </div>
  );
}

export function AboutPage() {
  return (
    <PageShell title="Gharpayy" subtitle="Safe, healthy rental accommodations for urban millennials.">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card-surface p-6 text-sm leading-relaxed text-slate-300">
          <p>
            GHARPAYY provides safe and healthy rental accommodations for urban millennials. We have stringent cleanliness
            measures in place to deliver the highest hygiene standards. Our smartly designed interiors enable work-play
            balance so you absolutely love each moment spent at Gharpayy.
          </p>
          <p className="mt-4">
            Gharpayy turns "PG" into Personal Growth, where you come for a room and walk into a circle of friends,
            support, and people who genuinely care.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/explore" className="btn-primary">Start Your Booking</Link>
            <Link to="/contact" className="btn-secondary">We are here</Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="card-surface p-5">
            <Target className="h-5 w-5 text-cyan-300" />
            <h3 className="mt-3 text-lg font-semibold text-white">Our Vision</h3>
            <p className="mt-2 text-sm text-slate-300">To change the way millennials live.</p>
          </div>
          <div className="card-surface p-5">
            <Users className="h-5 w-5 text-cyan-300" />
            <h3 className="mt-3 text-lg font-semibold text-white">Our Mission</h3>
            <p className="mt-2 text-sm text-slate-300">
              To bring millennials together by providing them a truly exceptional living experience.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-4 text-sm text-slate-300">
          <Building2 className="mb-2 h-5 w-5 text-cyan-300" />
          Bangalore, India
        </div>
        <div className="card-surface p-4 text-sm text-slate-300">
          <Mail className="mb-2 h-5 w-5 text-cyan-300" />
          TEAM@GHARPAYY.COM
        </div>
        <div className="card-surface p-4 text-sm text-slate-300">
          <Phone className="mb-2 h-5 w-5 text-cyan-300" />
          +91 7988114576
        </div>
      </div>

      <div className="card-surface p-6 text-sm text-slate-300">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Service Areas</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-semibold text-white">Koramangala, S.G. Palya, Adugodi, Dairy Circle, Forum Belt, MG Road, HSR Layout</p>
            <p className="mt-1 text-xs text-slate-400">83073 96042</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-semibold text-white">Marathahalli, Bellandur, Kadubeesanahalli, Sarjapur Road, EcoWorld Belt, Mahadevapura</p>
            <p className="mt-1 text-xs text-slate-400">63636 07724</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-semibold text-white">Whitefield, Brookfield, Hoodi, Kundalahalli, ITPL, EPIP Zone, Kadugodi, PMC</p>
            <p className="mt-1 text-xs text-slate-400">83073 96042</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-semibold text-white">Manyata Tech Park, Nagawara, Hebbal, Thanisandra, Mathikere</p>
            <p className="mt-1 text-xs text-slate-400">84315 13647</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
            <p className="font-semibold text-white">Anywhere in Bangalore, Christ & Jain University, MCC, St Joseph, Yeshwanthpur, Peenya, UB City, Bagmane, WTC, Electronic City</p>
            <p className="mt-1 text-xs text-slate-400">79881 14576</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const captchaBypass = import.meta.env.VITE_CAPTCHA_BYPASS === 'true';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('Submitting...');
    try {
      if (!captchaBypass && !captchaToken) {
        setStatus('Please complete the captcha to continue.');
        return;
      }
      await api.public.captureLead({
        name: form.name,
        phone: form.phone,
        email: form.email,
        source: 'website',
        note: form.message,
        captchaToken: captchaBypass ? 'bypass' : captchaToken
      });
      setStatus('Your request has been submitted to our CRM team.');
      setForm({ name: '', phone: '', email: '', message: '' });
      setCaptchaToken('');
      setCaptchaKey((value) => value + 1);
    } catch {
      setStatus('Could not submit request. Please retry.');
    }
  };

  return (
    <PageShell title="Contact Us" subtitle="Reach sales, support, or partnerships.">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-4 text-sm text-slate-300">
          <Mail className="mb-2 h-5 w-5 text-cyan-300" />
          TEAM@GHARPAYY.COM
        </div>
        <div className="card-surface p-4 text-sm text-slate-300">
          <Phone className="mb-2 h-5 w-5 text-cyan-300" />
          +91 7988114576
        </div>
        <div className="card-surface p-4 text-sm text-slate-300">
          <Building2 className="mb-2 h-5 w-5 text-cyan-300" />
          Koramangala, Bangalore
        </div>
      </div>
      <form onSubmit={submit} className="card-surface grid gap-3 p-6 md:grid-cols-2">
        <input className="input-modern" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        <input className="input-modern" placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
        <input className="input-modern" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
        <input className="input-modern" placeholder="Subject" value="General Inquiry" readOnly />
        <textarea className="input-modern md:col-span-2 min-h-28" placeholder="Message" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
        <div className="md:col-span-2">
          <TurnstileWidget
            key={captchaKey}
            siteKey={turnstileSiteKey}
            onVerify={setCaptchaToken}
            onExpire={() => setCaptchaToken('')}
            onError={() => setCaptchaToken('')}
            className="rounded-xl"
          />
        </div>
        <button className="btn-primary md:col-span-2" type="submit">Send Message</button>
        {status && <p className="md:col-span-2 text-sm text-cyan-300">{status}</p>}
      </form>
    </PageShell>
  );
}

export function CareersPage() {
  const roles = useMemo(
    () => [
      { id: 'r1', title: 'Sales Operations Manager', location: 'Bangalore', type: 'Full-time' },
      { id: 'r2', title: 'Frontend Engineer (React)', location: 'Remote', type: 'Full-time' },
      { id: 'r3', title: 'Inventory Success Associate', location: 'Bangalore', type: 'Full-time' }
    ],
    []
  );

  const [appliedRole, setAppliedRole] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  return (
    <PageShell title="Careers" subtitle="Build the operating system for managed PG living.">
      <div className="space-y-3">
        {roles.map((role) => (
          <div key={role.id} className="card-surface flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-white">{role.title}</p>
              <p className="text-xs text-slate-400">{role.location} - {role.type}</p>
            </div>
            <button className="btn-secondary" onClick={() => setAppliedRole(role.title)}>
              <Briefcase className="h-4 w-4" />
              Apply
            </button>
          </div>
        ))}
      </div>
      <div className="card-surface p-5">
        <p className="text-sm text-slate-300">Selected Role: <strong className="text-white">{appliedRole || 'None'}</strong></p>
        <div className="mt-3 flex gap-2">
          <input className="input-modern" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button
            className="btn-primary"
            onClick={() => setStatus(appliedRole && email ? `Application initiated for ${appliedRole}.` : 'Select role and enter email.')}
          >
            Submit
          </button>
        </div>
        {status && <p className="mt-2 text-sm text-cyan-300">{status}</p>}
      </div>
    </PageShell>
  );
}

export function TermsPage() {
  const sections = [
    { title: 'Platform Use', body: 'Users must provide accurate information for lead capture, booking, and account operations.' },
    { title: 'Booking & Payments', body: 'Pre-booking locks are time-bound and subject to availability confirmation and payment status.' },
    { title: 'Owner Obligations', body: 'Owners must keep inventory data, pricing, and room availability current and truthful.' },
    { title: 'Data & Compliance', body: 'Operational logs, booking records, and communication data are retained for service and compliance.' }
  ];
  return (
    <PageShell title="Terms of Service" subtitle="Commercial and operational usage terms.">
      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.title} className="card-surface p-5">
            <h3 className="text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{s.body}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function PrivacyPage() {
  const sections = [
    { title: 'Data Collected', body: 'Name, contact details, requirement preferences, booking, and conversation metadata.' },
    { title: 'Usage', body: 'Used for lead routing, CRM follow-up, matching, and booking completion workflows.' },
    { title: 'Access Control', body: 'Role-based controls are applied for agent, manager, admin, and owner access boundaries.' },
    { title: 'Retention', body: 'Records are retained for operations, analytics, and dispute handling based on policy windows.' }
  ];
  return (
    <PageShell title="Privacy Policy" subtitle="How Gharpayy stores and processes data.">
      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.title} className="card-surface p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              <h3 className="text-lg font-semibold text-white">{s.title}</h3>
            </div>
            <p className="mt-2 text-sm text-slate-300">{s.body}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function NotFoundPage() {
  return (
    <PageShell title="Page Not Found" subtitle="The route you opened does not exist.">
      <div className="card-surface p-6">
        <p className="text-sm text-slate-300">Use these shortcuts to continue:</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/" className="btn-secondary">Home</Link>
          <Link to="/explore" className="btn-secondary">Explore</Link>
          <Link to="/capture" className="btn-secondary">Capture Lead</Link>
          <Link to="/auth" className="btn-primary">CRM Login</Link>
        </div>
      </div>
    </PageShell>
  );
}
