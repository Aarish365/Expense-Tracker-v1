import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form);
      showToast('Welcome back to ArthFlow!');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not log in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-7 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Log in to see your money at a glance.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="input pr-11"
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-800 dark:bg-emerald-500/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Try the demo account</p>
            <p className="mt-0.5 text-xs text-emerald-700/80 dark:text-emerald-400/80">demo@arthflow.app · demo1234</p>
          </div>
          <button
            type="button"
            className="shrink-0 text-xs font-bold text-emerald-700 underline dark:text-emerald-400"
            onClick={() => setForm({ email: 'demo@arthflow.app', password: 'demo1234' })}
          >
            Fill
          </button>
        </div>
        <p className="mt-2 text-[11px] text-emerald-700/70 dark:text-emerald-400/70">
          Run <code className="font-semibold">npm run seed</code> first to load demo data.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        New to ArthFlow?{' '}
        <Link to="/register" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
          Create an account
        </Link>
      </p>
    </div>
  );
}
