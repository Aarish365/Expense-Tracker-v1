import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarRange, PiggyBank, Receipt } from 'lucide-react';
import SummaryCard from '../components/SummaryCard';
import IncomeExpenseChart from '../components/IncomeExpenseChart';
import ExpensePieChart from '../components/ExpensePieChart';
import TransactionList from '../components/TransactionList';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAsync } from '../hooks/useAsync';
import { reportService } from '../services/reportService';
import { currentMonthYear, monthsAgoInput, toInputDate, todayInput } from '../utils/date';

const initialRange = { startDate: monthsAgoInput(5), endDate: todayInput(), type: '' };

export default function Reports() {
  const [filters, setFilters] = useState(initialRange);
  const { data, loading, error, reload } = useAsync(
    () => reportService.get(filters),
    [filters.startDate, filters.endDate, filters.type]
  );

  const applyPreset = (preset) => {
    const now = currentMonthYear();
    if (preset === 'month') {
      setFilters({
        ...filters,
        startDate: toInputDate(new Date(now.year, now.month - 1, 1)),
        endDate: todayInput(),
      });
    } else if (preset === 'six') {
      setFilters({ ...filters, startDate: monthsAgoInput(5), endDate: todayInput() });
    } else {
      setFilters({ ...filters, startDate: `${now.year}-01-01`, endDate: todayInput() });
    }
  };

  if (loading) return <LoadingSpinner message="Preparing your report…" />;

  const report = data?.data;
  const pieTitle = filters.type === 'income' ? 'Income by category' : 'Expense by category';
  const pieData = filters.type === 'income' ? report?.incomeByCategory : report?.expenseByCategory;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">Reports</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Analyse your income and expenses over any date range.</p>
      </div>

      {/* Filters */}
      <div className="card p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="start-date">From</label>
            <input
              id="start-date"
              type="date"
              className="input"
              value={filters.startDate}
              onChange={(event) => setFilters({ ...filters, startDate: event.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="end-date">To</label>
            <input
              id="end-date"
              type="date"
              className="input"
              value={filters.endDate}
              onChange={(event) => setFilters({ ...filters, endDate: event.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="report-type">Transaction type</label>
            <select
              id="report-type"
              className="input"
              value={filters.type}
              onChange={(event) => setFilters({ ...filters, type: event.target.value })}
            >
              <option value="">Income & expenses</option>
              <option value="income">Income only</option>
              <option value="expense">Expenses only</option>
            </select>
          </div>
          <div>
            <label className="label">Quick ranges</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary !px-2.5 !py-2 !text-xs" onClick={() => applyPreset('month')}>This month</button>
              <button type="button" className="btn-secondary !px-2.5 !py-2 !text-xs" onClick={() => applyPreset('six')}>6 months</button>
              <button type="button" className="btn-secondary !px-2.5 !py-2 !text-xs" onClick={() => applyPreset('year')}>This year</button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="card p-6 text-center">
          <p className="font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          <button type="button" className="btn-secondary mt-4" onClick={reload}>Try again</button>
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard title="Total Income" amount={report.totals.totalIncome} icon={ArrowUpRight} tone="blue" />
            <SummaryCard title="Total Expenses" amount={report.totals.totalExpenses} icon={ArrowDownLeft} tone="rose" />
            <SummaryCard title="Net Savings" amount={report.totals.totalSavings} icon={PiggyBank} tone="violet" />
            <SummaryCard title="Transactions" amount={report.totals.transactionCount} icon={Receipt} tone="emerald" hint="In the selected period" plain />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <div className="mb-2 flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">Income vs Expenses</h3>
              </div>
              <IncomeExpenseChart data={report.monthly} />
            </div>
            <div className="card p-5">
              <h3 className="mb-2 font-bold text-slate-900 dark:text-white">{pieTitle}</h3>
              <ExpensePieChart data={pieData || []} title={pieTitle} />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Transactions in this period</h3>
              <p className="text-xs text-slate-400">{report.totals.transactionCount} record(s)</p>
            </div>
            <TransactionList
              transactions={report.transactions.slice(0, 20)}
              showActions={false}
              emptyMessage="No transactions in this date range."
            />
            {report.transactions.length > 20 && (
              <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400 dark:border-slate-800">
                Showing the 20 most recent transactions.
              </p>
            )}
          </div>

          <p className="text-xs text-slate-400">
            All amounts are shown in Indian Rupees (₹) using the en-IN locale.
          </p>
        </>
      )}
    </div>
  );
}
