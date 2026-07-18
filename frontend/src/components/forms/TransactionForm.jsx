import { useState } from "react";

const V_FEATURES = Array.from({ length: 28 }, (_, i) => `V${i + 1}`);

function buildDefaultValues(initialValues) {
  const defaults = {};
  for (const key of V_FEATURES) {
    defaults[key] = initialValues?.[key] ?? 0;
  }
  defaults.Amount = initialValues?.Amount ?? 0;
  return defaults;
}

/**
 * Shared transaction input form for both Predict Transaction and
 * Explainability - both need to collect the exact same 29 fields
 * (V1..V28 + Amount) that backend/schemas/prediction.py's TransactionRequest
 * expects. Kept as one component so the two pages never drift apart on
 * field list, validation, or layout.
 */
export default function TransactionForm({ onSubmit, submitLabel, loading, initialValues }) {
  const [values, setValues] = useState(() => buildDefaultValues(initialValues));

  function handleChange(field, rawValue) {
    setValues((current) => ({ ...current, [field]: rawValue }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const payload = {};
    for (const key of V_FEATURES) {
      payload[key] = Number(values[key]);
    }
    payload.Amount = Number(values.Amount);
    onSubmit(payload);
  }

  function handleReset() {
    setValues(buildDefaultValues());
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {V_FEATURES.map((field) => (
          <label key={field} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink-500 dark:text-ink-400">{field}</span>
            <input
              type="number"
              step="any"
              value={values[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              className="rounded-md border border-ink-200 bg-surface-light px-2 py-1.5 text-sm text-ink-800 focus:border-brand-400 dark:border-ink-700 dark:bg-surface-dark-subtle dark:text-ink-100"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-500 dark:text-ink-400">Amount</span>
          <input
            type="number"
            step="any"
            min="0"
            value={values.Amount}
            onChange={(e) => handleChange("Amount", e.target.value)}
            className="w-40 rounded-md border border-ink-200 bg-surface-light px-3 py-2 text-sm text-ink-800 focus:border-brand-400 dark:border-ink-700 dark:bg-surface-dark-subtle dark:text-ink-100"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? "Processing…" : submitLabel}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="rounded-md border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
        >
          Reset
        </button>
      </div>
    </form>
  );
}