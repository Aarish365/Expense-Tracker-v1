export default function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600 dark:border-slate-700 dark:border-t-emerald-500" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
