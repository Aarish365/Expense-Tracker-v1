import { ArrowDownLeft, ArrowUpRight, Pencil, Receipt, Trash2 } from 'lucide-react';
import EmptyState from './EmptyState';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';

const TypeBadge = ({ type }) => (
  <span className={`badge capitalize ${type === 'income'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
    : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}
  >
    {type}
  </span>
);

const Amount = ({ transaction }) => (
  <span className={`font-bold ${transaction.type === 'income'
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-rose-600 dark:text-rose-400'}`}
  >
    {transaction.type === 'income' ? '+' : '-'}
    {formatCurrency(transaction.amount)}
  </span>
);

const IconFor = ({ type }) => {
  const Icon = type === 'income' ? ArrowUpRight : ArrowDownLeft;
  return (
    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${
      type === 'income'
        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
        : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
    }`}>
      <Icon className="h-4 w-4" />
    </span>
  );
};

export default function TransactionList({
  transactions = [], onEdit, onDelete, showActions = true, emptyMessage = 'No transactions found.',
}) {
  if (transactions.length === 0) {
    return <EmptyState icon={Receipt} title="Nothing here yet" description={emptyMessage} />;
  }

  const actions = (transaction) => (
    <div className="flex justify-end gap-1">
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
          title="Edit transaction"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(transaction)}
          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
          title="Delete transaction"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <th className="px-5 py-3 font-semibold">Transaction</th>
              <th className="px-3 py-3 font-semibold">Type</th>
              <th className="px-3 py-3 font-semibold">Category</th>
              <th className="px-3 py-3 font-semibold">Date</th>
              <th className="px-3 py-3 text-right font-semibold">Amount</th>
              {showActions && (onEdit || onDelete) && <th className="px-5 py-3 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((transaction) => (
              <tr key={transaction._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <IconFor type={transaction.type} />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{transaction.title}</p>
                      {transaction.description && (
                        <p className="max-w-[220px] truncate text-xs text-slate-400">{transaction.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3"><TypeBadge type={transaction.type} /></td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{transaction.category}</td>
                <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{formatDate(transaction.date)}</td>
                <td className="px-3 py-3 text-right"><Amount transaction={transaction} /></td>
                {showActions && (onEdit || onDelete) && <td className="px-5 py-3">{actions(transaction)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
        {transactions.map((transaction) => (
          <div key={transaction._id} className="flex items-start gap-3 px-4 py-3.5">
            <IconFor type={transaction.type} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{transaction.title}</p>
                <Amount transaction={transaction} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{transaction.category}</span>
                <span>•</span>
                <span>{formatDate(transaction.date)}</span>
              </div>
              {showActions && (onEdit || onDelete) && (
                <div className="mt-2 flex gap-1">{actions(transaction)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
