import { ReactNode } from 'react';

export type AvailabilityRow = {
  id: string;
  label: string;
  beds: Array<{ id: string; status: string }>;
};

interface AvailabilityMatrixProps {
  rows: AvailabilityRow[];
  isLoading?: boolean;
}

const statusColor = (status?: string) => {
  if (status === 'available') return 'badge badge--success';
  if (status === 'reserved') return 'badge badge--warning';
  if (status === 'occupied') return 'badge badge--danger';
  return 'badge';
};

export default function AvailabilityMatrix({ rows, isLoading }: AvailabilityMatrixProps) {
  const maxBeds = rows.reduce((max, row) => Math.max(max, row.beds.length), 0);

  if (isLoading) {
    return <p className="text-sm text-slate-400">Loading availability...</p>;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">No rooms available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="table-modern text-left text-sm">
        <thead>
          <tr>
            <th>Room</th>
            {Array.from({ length: maxBeds }).map((_, index) => (
              <th key={index} className="text-center">Bed {index + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-white/5">
              <td className="font-semibold text-[var(--text)]">{row.label}</td>
              {Array.from({ length: maxBeds }).map((_, index) => {
                const bed = row.beds[index];
                return (
                  <td key={index} className="text-center">
                    {bed ? (
                      <span className={statusColor(bed.status)}>
                        {bed.status}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
