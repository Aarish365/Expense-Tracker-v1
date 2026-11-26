import { createContext, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = (id) => setToasts((current) => current.filter((toast) => toast.id !== id));

  const showToast = (message, type = 'success') => {
    const id = nextId;
    nextId += 1;
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => dismiss(id), 3500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = toast.type === 'error' ? AlertCircle : CheckCircle2;
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${toast.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`} />
              <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
