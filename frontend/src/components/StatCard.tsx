import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend: 'up' | 'down';
  trendValue: string;
  icon: any;
  colorClass: string;
}

export function StatCard({ title, value, trend, trendValue, icon: Icon, colorClass }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="page-card group transition-all"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-xl p-3 shadow-[0_6px_18px_rgba(2,6,23,0.2)] ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend === 'up' ? (
          <span className="badge badge--success">
            <ArrowUpRight className="w-3 h-3 mr-1" /> {trendValue}
          </span>
        ) : (
          <span className="badge badge--danger">
            <ArrowDownRight className="w-3 h-3 mr-1" /> {trendValue}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-[var(--text-muted)] mb-1">{title}</h3>
        <p className="text-3xl font-bold tracking-tight text-[var(--text)]">{value}</p>
      </div>
    </motion.div>
  );
}
