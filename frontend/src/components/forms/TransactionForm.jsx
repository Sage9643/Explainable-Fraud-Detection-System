import { useId, useMemo, useState } from "react";

const V_FEATURES = Array.from({ length: 28 }, (_, i) => `V${i + 1}`);
const ALL_FIELDS = [...V_FEATURES, "Amount"];

function buildDefaultValues(initialValues) {
  const defaults = {};
  for (const key of V_FEATURES) {
    defaults[key] = initialValues?.[key] ?? 0;
  }
  defaults.Amount = initialValues?.Amount ?? 0;
  return defaults;
}

function validateField(field, rawValue) {
  if (rawValue === "" || rawValue === null || rawValue === undefined) {
    return "Required";
  }
  const numeric = Number(rawValue);
  if (Number.isNaN(numeric)) {
    return "Must be a number";
  }
  if (field === "Amount" && numeric < 0) {
    return "Must be 0 or greater";
  }
  return null;
}

/**
 * Shared transaction input form for both Predict Transaction and
 * Explainability - both need to collect the exact same 29 fields
 * (V1..V28 + Amount) that backend/schemas/prediction.py's TransactionRequest
 * expects. Validation mirrors the backend's own constraints (all fields
 * required and numeric, Amount >= 0) so a malformed submission is caught
 * client-side before any API call is made.
 */
export default function TransactionForm({ onSubmit, submitLabel, loading, initialValues }) {
  const formId = useId();
  const [values, setValues] = useState(() => buildDefaultValues(initialValues));
  const [touched, setTouched] = useState({});

  const errors = useMemo(() => {
    const result = {};
    for (const key of ALL_FIELDS) {
      const error = validateField(key, values[key]);
      if (error) result[key] = error;
    }
    return result;
  }, [values]);

  const isValid = Object.keys(errors).length === 0;
  const hasAttemptedSubmit = Object.keys(touched).length > 0;

  function handleChange(field, rawValue) {
    setValues((current) => ({ ...current, [field]: rawValue }));
  }

  function handleBlur(field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setTouched(Object.fromEntries(ALL_FIELDS.map((key) => [key, true])));
    if (!isValid) return;

    const payload = {};
    for (const key of V_FEATURES) {
      payload[key] = Number(values[key]);
    }
    payload.Amount = Number(values.Amount);
    onSubmit(payload);
  }

  function handleReset() {
    setValues(buildDefaultValues());
    setTouched({});
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {V_FEATURES.map((field) => {
          const fieldId = `${formId}-${field}`;
          const errorId = `${fieldId}-error`;
          const showError = touched[field] && errors[field];
          return (
            <div key={field} className="flex flex-col gap-1">
              <label htmlFor={fieldId} className="text-xs font-medium text-ink-500 dark:text-ink-400">
                {field}
              </label>
              <input
                id={fieldId}
                type="number"
                step="any"
                value={values[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                onBlur={() => handleBlur(field)}
                aria-invalid={showError ? "true" : "false"}
                aria-describedby={showError ? errorId : undefined}
                className={`rounded-md border bg-surface-light px-2 py-1.5 text-sm text-ink-800 focus:border-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500 dark:bg-surface-dark-subtle dark:text-ink-100 ${
                  showError ? "border-risk-critical" : "border-ink-200 dark:border-ink-700"
                }`}
              />
              {showError && (
                <span id={errorId} role="alert" className="text-[10px] text-risk-critical">
                  {errors[field]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-Amount`} className="text-xs font-medium text-ink-500 dark:text-ink-400">
            Amount
          </label>
          <input
            id={`${formId}-Amount`}
            type="number"
            step="any"
            min="0"
            value={values.Amount}
            onChange={(e) => handleChange("Amount", e.target.value)}
            onBlur={() => handleBlur("Amount")}
            aria-invalid={touched.Amount && errors.Amount ? "true" : "false"}
            aria-describedby={touched.Amount && errors.Amount ? `${formId}-Amount-error` : undefined}
            className={`w-40 rounded-md border bg-surface-light px-3 py-2 text-sm text-ink-800 focus:border-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500 dark:bg-surface-dark-subtle dark:text-ink-100 ${
              touched.Amount && errors.Amount ? "border-risk-critical" : "border-ink-200 dark:border-ink-700"
            }`}
          />
          {touched.Amount && errors.Amount && (
            <span id={`${formId}-Amount-error`} role="alert" className="text-[10px] text-risk-critical">
              {errors.Amount}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || (hasAttemptedSubmit && !isValid)}
          className="rounded-md bg-brand-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing…" : submitLabel}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="rounded-md border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
        >
          Reset
        </button>

        {hasAttemptedSubmit && !isValid && (
          <span role="alert" className="text-xs text-risk-critical">
            Please fix the highlighted fields before submitting.
          </span>
        )}
      </div>
    </form>
  );
}