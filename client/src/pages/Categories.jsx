import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, RotateCcw, Tags, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { categoryService } from '../services/categoryService';

const groups = [
  { type: 'income', title: 'Income Categories', icon: ArrowUpRight, color: 'text-emerald-600 dark:text-emerald-400' },
  { type: 'expense', title: 'Expense Categories', icon: ArrowDownLeft, color: 'text-rose-600 dark:text-rose-400' },
];

export default function Categories() {
  const { showToast } = useToast();
  const { data, loading, error, reload } = useAsync(() => categoryService.getAll(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'expense' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = data?.data?.categories || [];

  const openAdd = (type) => {
    setEditing(null);
    setForm({ name: '', type: type || 'expense' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({ name: category.name, type: category.type });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await categoryService.update(editing._id, form);
        showToast('Category updated');
      } else {
        await categoryService.create(form);
        showToast('Category added');
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete the "${category.name}" category?`)) return;
    try {
      await categoryService.delete(category._id);
      showToast('Category deleted');
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRestore = async () => {
    try {
      const response = await categoryService.restoreDefaults();
      showToast(response.data.message);
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <LoadingSpinner message="Loading categories…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">Categories</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Default categories are created with your account. Add your own any time.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={handleRestore}>
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Restore defaults</span>
          </button>
          <button type="button" className="btn-primary" onClick={() => openAdd()}>
            <Plus className="h-4 w-4" />
            Add category
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {groups.map(({ type, title, icon: Icon, color }) => {
          const items = categories.filter((item) => item.type === type);
          return (
            <div key={type} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                </div>
                <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <EmptyState icon={Tags} title="No categories yet" description="Add one to get started." />
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((category) => (
                    <div key={category._id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          type === 'income'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}>
                          <Tags className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{category.name}</p>
                          <p className="text-xs text-slate-400">{category.isDefault ? 'Default category' : 'Custom category'}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(category)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
                          title="Rename"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 p-3 dark:border-slate-800">
                <button type="button" onClick={() => openAdd(type)} className="w-full rounded-lg py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10">
                  + Add {type} category
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit category' : 'Add category'}
        subtitle="Categories help you organise your transactions."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="category-name">Category name</label>
            <input
              id="category-name"
              className="input"
              placeholder="e.g. Investments"
              value={form.name}
              onChange={(event) => { setForm({ ...form, name: event.target.value }); setFormError(''); }}
              maxLength={40}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="category-type">Type</label>
            <select
              id="category-type"
              className="input"
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          {formError && <p className="text-sm text-rose-600 dark:text-rose-400">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
