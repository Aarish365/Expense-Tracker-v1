import { formatCurrency } from '../utils/currency';

export default function BudgetProgress({ amount = 0, spent = 0, percentage = 0, isExceeded = false }) {
  const barColor = isExceeded ? 'bg-rose-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  const width = Math.min(Math.max(percentage, 0), 100);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-sm">
        <span className="font-medium text-slate-600 dark:text-slate-300">Monthly budget</span>
        <span className="font-semibold text-slate-900 dark:text-white">
          {formatCurrency(spent)} <span className="font-normal text-slate-400">/</span> {formatCurrency(amount)}
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${amount > 0 ? barColor : 'bg-slate-300 dark:bg-slate-700'}`}
          style={{ width: `${amount > 0 ? width : 0}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          {amount > 0 ? `${percentage}% used` : 'No budget set yet'}
        </span>
        {amount > 0 && (
          <span className={isExceeded ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}>
            {isExceeded
              ? `${formatCurrency(spent - amount)} over budget`
              : `${formatCurrency(amount - spent)} remaining`}
          </span>
        )}
      </div>
    </div>
  );
}
