import { UserCircle2 } from 'lucide-react';
import { ProfileModule } from './AdvancedModules';

export default function ProfilePage() {
  return (
    <div className="page-shell">
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">Profile</p>
            <h1 className="page-header__title mt-2">My Profile</h1>
            <p className="page-header__subtitle">Update your name, avatar, and workspace preferences.</p>
          </div>
          <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-cyan-200">
            <UserCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <ProfileModule />
    </div>
  );
}
