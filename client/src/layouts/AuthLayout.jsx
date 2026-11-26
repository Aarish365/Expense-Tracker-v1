import { Outlet } from 'react-router-dom';
import { CheckCircle2, TrendingUp, Wallet } from 'lucide-react';

const highlights = [
  'Track income and expenses in one place',
  'Understand where your money goes',
  'Set monthly budgets and stay on target',
];

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-12 text-white lg:flex">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold tracking-tight">ArthFlow</p>
            <p className="text-xs text-emerald-100">Personal finance tracker</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Your money, clearly.</h1>
          <p className="mt-4 text-emerald-50/90">
            A calm, simple way to see what comes in, what goes out, and how much you are really saving.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-emerald-50">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-200" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-emerald-100/80">
          <TrendingUp className="h-4 w-4" />
          Built for simple, everyday money decisions.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center bg-slate-50 px-4 py-10 sm:px-8 dark:bg-slate-950">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">ArthFlow</span>
        </div>

        <div className="w-full max-w-md">
          <Outlet />
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} ArthFlow. Made in India 🇮🇳
        </p>
      </div>
    </div>
  );
}
