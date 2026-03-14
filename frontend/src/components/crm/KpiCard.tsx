import { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: string;
  hint?: string;
}

export default function KpiCard({ title, value, icon, tone, hint }: KpiCardProps) {
  return (
    <div className="page-card">
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-xl p-2.5 ${tone ?? 'bg-white/10 text-slate-200'}`}>
          {icon}
        </div>
        {hint ? (
          <span className="badge">
            {hint}
          </span>
        ) : null}
      </div>
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{title}</p>
      <p className="mt-2 text-2xl font-bold text-[var(--text)]">{value}</p>
    </div>
  );
}
