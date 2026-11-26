import { Link } from 'react-router-dom';
import {
  ArrowLeftRight, ArrowUpRight, CalendarDays, PiggyBank, Plus, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react';
import SummaryCard from '../components/SummaryCard';
import IncomeExpenseChart from '../components/IncomeExpenseChart';
import ExpensePieChart from '../components/ExpensePieChart';
import BudgetProgress from '../components/BudgetProgress';
import TransactionList from '../components/TransactionList';
import LoadingSpinner from '../components/LoadingSpinner';
import { dashboardService } from '../services/dashboardService';
import { useAsync } from '../hooks/useAsync';
import { formatCurrency } from '../utils/currency';
import { formatMonthYear } from '../utils/date';

export default function Dashboard() {
  const { data, loading, error, reload } = useAsync(() => dashboardService.get(), []);

  if (loading) return <LoadingSpinner message="Loading your dashboard…" />;

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold text-rose-600 dark:text-rose-400">{error}</p>
        <button type="button" onClick={reload} className="btn-secondary mt-4">Try again</button>
      </div>
    );
  }

  const { totals, currentMonth, monthly, expenseByCategory, recentTransactions, budget } = data.data;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">Financial overview</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Here is how your money is doing this month.
          </p>
        </div>
        <Link to="/transactions" className="btn-primary">
          <Plus className="h-4 w-4" />
          Add transaction
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Balance"
          amount={totals.totalBalance}
          icon={Wallet}
          tone="emerald"
          hint={`Includes opening balance of ${formatCurrency(totals.openingBalance)}`}
        />
        <SummaryCard
          title="Total Income"
          amount={totals.totalIncome}
          icon={TrendingUp}
          tone="blue"
          hint="All income transactions"
        />
        <SummaryCard
          title="Total Expenses"
          amount={totals.totalExpenses}
          icon={TrendingDown}
          tone="rose"
          hint="All expense transactions"
        />
        <SummaryCard
          title="Total Savings"
          amount={totals.totalSavings}
          icon={PiggyBank}
          tone="violet"
          hint="Income minus expenses"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-2">
            <h3 className="font-bold text-slate-900 dark:text-white">Income vs Expenses</h3>
            <p className="text-xs text-slate-400">Last 6 months</p>
          </div>
          <IncomeExpenseChart data={monthly} />
        </div>
        <div className="card p-5">
          <div className="mb-2">
            <h3 className="font-bold text-slate-900 dark:text-white">Expense Categories</h3>
            <p className="text-xs text-slate-400">This month's spending breakdown</p>
          </div>
          <ExpensePieChart data={expenseByCategory} />
        </div>
      </div>

      {/* Recent transactions + month overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Your 5 latest entries</p>
            </div>
            <Link to="/transactions" className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <TransactionList
            transactions={recentTransactions}
            showActions={false}
            emptyMessage="Add your first transaction to see it here."
          />
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">
                {formatMonthYear(currentMonth.month, currentMonth.year)}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Income</p>
                <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(currentMonth.income)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Expenses</p>
                <p className="mt-1 text-base font-bold text-rose-600 dark:text-rose-400">{formatCurrency(currentMonth.expenses)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Savings</p>
                <p className="mt-1 text-base font-bold text-violet-600 dark:text-violet-400">{formatCurrency(currentMonth.savings)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Entries</p>
                <p className="mt-1 text-base font-bold text-slate-800 dark:text-white">{currentMonth.transactionCount}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
              <BudgetProgress
                amount={budget.amount}
                spent={budget.spent}
                percentage={budget.percentage}
                isExceeded={budget.isExceeded}
              />
            </div>
          </div>

          <Link
            to="/reports"
            className="card flex items-center justify-between p-5 transition hover:border-emerald-300 dark:hover:border-emerald-700"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">Detailed reports</p>
                <p className="text-xs text-slate-400">Explore your spending over time</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
