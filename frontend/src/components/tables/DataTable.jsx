/**
 * Generic table shell. Callers supply `columns` (each with a `key`,
 * `header`, and optional `render(row)`) and `rows`. Deliberately has no
 * knowledge of prediction/fraud domain concepts - RiskBadge and other
 * domain-specific rendering are injected via column `render` functions,
 * which is what keeps this component reusable for Batch Prediction results
 * and Analytics tables in later sprints.
 */
export default function DataTable({ columns, rows, keyField = "id" }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-ink-100 dark:border-ink-700">
            {columns.map((column) => (
              <th
                key={column.key}
                className="whitespace-nowrap px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[keyField]}
              className="border-b border-ink-50 last:border-b-0 hover:bg-ink-50/60 dark:border-ink-800 dark:hover:bg-ink-800/40"
            >
              {columns.map((column) => (
                <td key={column.key} className="whitespace-nowrap px-4 py-3 text-ink-700 dark:text-ink-200">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}