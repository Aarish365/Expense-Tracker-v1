import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Plus, RotateCcw, Search, Tags } from 'lucide-react';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { formatCurrency } from '../utils/currency';
import { MONTHS, yearOptions } from '../utils/date';

const emptyFilters = { search: '', type: '', month: '', year: '' };

export default function Transactions() {
  const { showToast } = useToast();
  const [filters, setFilters] = useState(emptyFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: categoryData } = useAsync(() => categoryService.getAll(), []);
  const {
    data, loading, error, reload,
  } = useAsync(
    () => transactionService.getAll(filters),
    [filters.search, filters.type, filters.month, filters.year]
  );

  const categories = categoryData?.data?.categories || [];
  const transactions = data?.data?.transactions || [];

  const totals = transactions.reduce(
    (acc, item) => {
      acc[item.type] += item.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (transaction) => {
    setEditing(transaction);
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    if (editing) {
      await transactionService.update(editing._id, values);
      showToast('Transaction updated');
    } else {
      await transactionService.create(values);
      showToast('Transaction added');
    }
    setModalOpen(false);
    setEditing(null);
    reload();
  };

  const handleDelete = async (transaction) => {
    if (!window.confirm(`Delete "${transaction.title}"? This cannot be undone.`)) return;
    try {
      await transactionService.delete(transaction._id);
      showToast('Transaction deleted');
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">Transactions</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add, search and manage every entry.</p>
        </div>
        <button type="button" className="btn-primary" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by title…"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
            />
          </div>
          <select className="input" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="input" value={filters.month} onChange={(event) => updateFilter('month', event.target.value)}>
            <option value="">All months</option>
            {MONTHS.map((name, index) => (
              <option key={name} value={index + 1}>{name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <select className="input" value={filters.year} onChange={(event) => updateFilter('year', event.target.value)}>
              <option value="">All years</option>
              {yearOptions().map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <button
              type="button"
              className="btn-secondary !px-3"
              onClick={() => setFilters(emptyFilters)}
              title="Reset filters"
              aria-label="Reset filters"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
          <span className="font-semibold text-slate-500 dark:text-slate-400">{transactions.length} result(s)</span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="h-3.5 w-3.5" />
            Income {formatCurrency(totals.income)}
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <ArrowDownLeft className="h-3.5 w-3.5" />
            Expenses {formatCurrency(totals.expense)}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading transactions…" />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="font-semibold text-rose-600 dark:text-rose-400">{error}</p>
            <button type="button" onClick={reload} className="btn-secondary mt-4">Try again</button>
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            onEdit={openEdit}
            onDelete={handleDelete}
            emptyMessage="Try a different filter or add your first transaction."
          />
        )}
      </div>

      {categories.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <Tags className="h-4 w-4" />
          You need at least one category before adding transactions.{' '}
          <Link to="/categories" className="font-semibold underline">Add categories</Link>
        </p>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit transaction' : 'New transaction'}
        subtitle={editing ? 'Update the details below.' : 'Record money coming in or going out.'}
      >
        <TransactionForm
          categories={categories}
          initialData={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
