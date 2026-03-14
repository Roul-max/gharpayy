import { Link } from 'react-router-dom';
import { Building2, Mail, Phone } from 'lucide-react';

export default function PremiumFooter() {
  return (
    <footer className="home-footer px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
        <div>
          <p className="home-footer__brand text-lg font-bold">Gharpayy</p>
          <p className="home-footer__copy mt-2 text-sm">
            Full-stack PG operating system for marketplace, CRM, and owner operations.
          </p>
          <div className="home-footer__meta mt-4 space-y-2 text-xs">
            <p className="inline-flex items-center gap-2">
              <Mail className="home-footer__icon h-3.5 w-3.5" /> TEAM@GHARPAYY.COM
            </p>
            <p className="inline-flex items-center gap-2">
              <Phone className="home-footer__icon h-3.5 w-3.5" /> +91 7988114576
            </p>
            <p className="inline-flex items-center gap-2">
              <Building2 className="home-footer__icon h-3.5 w-3.5" /> Bangalore, India
            </p>
          </div>
        </div>

        <div>
          <p className="home-footer__section-title text-sm font-semibold uppercase tracking-[0.14em]">Product</p>
          <div className="home-footer__links mt-3 space-y-2 text-sm">
            <Link to="/explore" className="home-footer__link block">Explore</Link>
            <Link to="/capture" className="home-footer__link block">Lead Capture</Link>
            <Link to="/auth" className="home-footer__link block">CRM Login</Link>
            <Link to="/owner-portal" className="home-footer__link block">Owner Portal</Link>
          </div>
        </div>

        <div>
          <p className="home-footer__section-title text-sm font-semibold uppercase tracking-[0.14em]">Company</p>
          <div className="home-footer__links mt-3 space-y-2 text-sm">
            <Link to="/about" className="home-footer__link block">About</Link>
            <Link to="/careers" className="home-footer__link block">Careers</Link>
            <Link to="/contact" className="home-footer__link block">Contact</Link>
          </div>
        </div>

        <div>
          <p className="home-footer__section-title text-sm font-semibold uppercase tracking-[0.14em]">Legal</p>
          <div className="home-footer__links mt-3 space-y-2 text-sm">
            <Link to="/terms" className="home-footer__link block">Terms</Link>
            <Link to="/privacy" className="home-footer__link block">Privacy</Link>
          </div>
          <div className="mt-6">
            <p className="home-footer__version-label text-xs">Build version</p>
            <p className="home-footer__version text-xs">vNext - March 2026</p>
          </div>
        </div>
      </div>

      <div className="home-footer__bottom mx-auto mt-8 max-w-7xl pt-4 text-xs">
        Copyright {new Date().getFullYear()} Gharpayy. All rights reserved.
      </div>
    </footer>
  );
}
