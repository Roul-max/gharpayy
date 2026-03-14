import { ReactNode } from 'react';
import clsx from 'clsx';

type Column<T> = {
  key: string;
  label: string;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T) => ReactNode;
};

interface DataTableProps<T> {
  columns: Array<Column<T>>;
  data: T[];
  isLoading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (item: T) => void;
}

export default function DataTable<T>({ columns, data, isLoading, emptyState, onRowClick }: DataTableProps<T>) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table-modern text-left text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(col.headerClassName, col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="p-6 text-sm text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-10 text-center text-slate-400">
                  {emptyState ?? 'No data found.'}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  className={clsx(onRowClick && 'cursor-pointer hover:bg-white/5')}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(col.className, col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                    >
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
