import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { PAYMENT_METHODS } from '../utils/constants';
import { toInputDate, todayInput } from '../utils/date';

export default function TransactionForm({ categories, initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    type: initialData?.type || 'income',
    title: initialData?.title || '',
    amount: initialData?.amount ?? '',
    category: initialData?.category || '',
    date: initialData ? toInputDate(initialData.date) : todayInput(),
    paymentMethod: initialData?.paymentMethod || 'Cash',
    description: initialData?.description || '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableCategories = categories.filter((item) => item.type === form.type);

  // When the type changes, pick the first matching category automatically.
  useEffect(() => {
    if (availableCategories.length && !availableCategories.some((item) => item.name === form.category)) {
      setForm((current) => ({ ...current, category: availableCategories[0].name }));
    }
  }, [form.type, categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || Number(form.amount) <= 0 || !form.category || !form.date) {
      setError('Please fill in title, a positive amount, category and date.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        title: form.title.trim(),
        amount: Number(form.amount),
        description: form.description.trim(),
      });
    } catch (err) {
      setError(err.message || 'Could not save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Income / expense toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {['income', 'expense'].map((type) => {
          const Icon = type === 'income' ? ArrowUpRight : ArrowDownLeft;
          const active = form.type === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => change('type', type)}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold capitalize transition ${
                active
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {type}
            </button>
          );
        })}
      </div>

      <div>
        <label className="label" htmlFor="tx-title">Title</label>
        <input
          id="tx-title"
          className="input"
          placeholder={form.type === 'income' ? 'e.g. Monthly salary' : 'e.g. Grocery shopping'}
          value={form.title}
          onChange={(event) => change('title', event.target.value)}
          maxLength={100}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="tx-amount">Amount (₹)</label>
          <input
            id="tx-amount"
            className="input"
            type="number"
            min="1"
            step="1"
            placeholder="0"
            value={form.amount}
            onChange={(event) => change('amount', event.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="tx-date">Date</label>
          <input
            id="tx-date"
            className="input"
            type="date"
            value={form.date}
            onChange={(event) => change('date', event.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="tx-category">Category</label>
          {availableCategories.length > 0 ? (
            <select
              id="tx-category"
              className="input"
              value={form.category}
              onChange={(event) => change('category', event.target.value)}
              required
            >
              {availableCategories.map((item) => (
                <option key={item._id} value={item.name}>{item.name}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-rose-500">Add a {form.type} category first.</p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="tx-payment">Payment method</label>
          <select
            id="tx-payment"
            className="input"
            value={form.paymentMethod}
            onChange={(event) => change('paymentMethod', event.target.value)}
          >
            {PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="tx-description">Description <span className="font-normal text-slate-400">(optional)</span></label>
        <textarea
          id="tx-description"
          className="input resize-none"
          rows={2}
          placeholder="Add a short note…"
          value={form.description}
          onChange={(event) => change('description', event.target.value)}
          maxLength={500}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : initialData ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}
