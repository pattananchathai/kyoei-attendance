export function Notice({ message, error = false }) {
  if (!message) return null;
  return <div role={error ? 'alert' : 'status'} aria-live="polite" className={`my-4 rounded-xl border p-4 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{message}</div>;
}
