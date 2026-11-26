import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Target, Trash2 } from 'lucide-react';
import BudgetProgress from '../components/BudgetProgress';
import TransactionList from '../components/TransactionList';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { budgetService } from '../services/budgetService';
import { transactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/currency';
import { currentMonthYear, formatMonthYear, MONTHS, yearOptions } from '../utils/date';

export default function Budget() {
  const { showToast } = useToast();
  const now = currentMonthYear();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useAsync(
    () => Promise.all([
      budgetService.get(month, year),
      budgetService.list(),
      transactionService.getAll({ type: 'expense', month, year }),
    ]),
    [month, year]
  );

  const stats = data?.[0]?.data;
  const history = data?.[1]?.data?.budgets || [];
  const monthExpenses = data?.[2]?.data?.transactions || [];

  // Keep the input in sync when the selected month or saved budget changes.
  useEffect(() => {
    setAmount(stats?.budget ? String(stats.budget.amount) : '');
  }, [stats?.budget?._id, stats?.budget?.amount, month, year]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (Number(amount) <= 0) {
      showToast('Please enter a budget amount greater than zero', 'error');
      return;
    }

    setSaving(true);
    try {
      await budgetService.save({ month: Number(month), year: Number(year), amount: Number(amount) });
      showToast(`Budget for ${formatMonthYear(Number(month), Number(year))} saved`);
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Remove the budget for ${label}?`)) return;
    try {
      await budgetService.delete(id);
      showToast('Budget removed');
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <LoadingSpinner message="Loading budget…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">Monthly Budget</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose a month, set a limit and track your spending.</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-auto" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
            {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
          </select>
          <select className="input w-auto" value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {yearOptions().map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Progress + status */}
        <div className="card p-5 sm:p-6 lg:col-span-2">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{formatMonthYear(month, year)}</h3>
              <p className="text-xs text-slate-400">Budget progress</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Budget</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {stats?.budget ? formatCurrency(stats.budget.amount) : 'Not set'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total spending</p>
              <p className="mt-1 text-lg font-bold text-rose-600 dark:text-rose-400">{formatCurrency(stats?.spending || 0)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Remaining</p>
              <p className={`mt-1 text-lg font-bold ${stats?.remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {stats?.remaining === null || !stats ? '—' : formatCurrency(stats.remaining)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <BudgetProgress
              amount={stats?.budget?.amount || 0}
              spent={stats?.spending || 0}
              percentage={stats?.percentage || 0}
              isExceeded={stats?.isExceeded || false}
            />
          </div>

          {stats?.isExceeded && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              You have exceeded this month's budget by {formatCurrency(stats.spending - stats.budget.amount)}.
            </div>
          )}
          {stats && !stats.isExceeded && stats.budget && stats.percentage >= 80 && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              You have used {stats.percentage}% of your budget. Keep an eye on your spending.
            </div>
          )}
          {stats && !stats.budget && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Set a budget for this month using the form to start tracking.
            </div>
          )}
        </div>

        {/* Set / update budget */}
        <div className="card p-5 sm:p-6">
          <h3 className="font-bold text-slate-900 dark:text-white">
            {stats?.budget ? 'Update budget' : 'Set budget'}
          </h3>
          <p className="mt-1 text-xs text-slate-400">Amount in Indian Rupees</p>

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="budget-amount">Monthly limit (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                <input
                  id="budget-amount"
                  type="number"
                  min="1"
                  className="input pl-7"
                  placeholder="e.g. 45000"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? 'Saving…' : stats?.budget ? 'Update budget' : 'Save budget'}
            </button>
          </form>

          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            The budget is saved per month, so you can set a different amount for each month.
          </p>
        </div>
      </div>

      {/* History */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Saved budgets</h3>
          <p className="text-xs text-slate-400">All the monthly budgets you have set</p>
        </div>
        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No budgets saved yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((item) => (
              <div key={item.budget._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {formatMonthYear(item.month, item.year)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatCurrency(item.spending)} spent of {formatCurrency(item.budget.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${item.isExceeded
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                    {item.isExceeded ? 'Exceeded' : `${item.percentage}% used`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.budget._id, formatMonthYear(item.month, item.year))}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    title="Delete budget"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expenses in the selected month */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Expenses this month</h3>
          <p className="text-xs text-slate-400">Latest {Math.min(monthExpenses.length, 5)} expense transactions</p>
        </div>
        <TransactionList
          transactions={monthExpenses.slice(0, 5)}
          showActions={false}
          emptyMessage="No expenses recorded for this month."
        />
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Plus className="h-3.5 w-3.5" />
        Need to add an expense? Use the Add transaction button on the Transactions page.
      </p>
    </div>
  );
}
