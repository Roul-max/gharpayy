import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="page-card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
        {subtitle ? <p className="text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
      </div>
      <div className="min-w-0">
        {children}
      </div>
    </div>
  );
}
