import { Settings } from 'lucide-react';
import { SettingsModule } from './AdvancedModules';

export default function SettingsPage() {
  return (
    <div className="page-shell">
      <div className="page-card">
        <div className="page-header">
          <div>
            <p className="page-header__eyebrow">Settings</p>
            <h1 className="page-header__title mt-2">Workspace Settings</h1>
            <p className="page-header__subtitle">Control CRM automation, notifications, and display preferences.</p>
          </div>
          <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-cyan-200">
            <Settings className="h-5 w-5" />
          </div>
        </div>
      </div>

      <SettingsModule />
    </div>
  );
}
