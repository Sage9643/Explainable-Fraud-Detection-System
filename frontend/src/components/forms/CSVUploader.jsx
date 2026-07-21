import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileText } from "lucide-react";

/**
 * Generic file uploader with drag-and-drop and a browse button. Not
 * fraud/batch-specific - accepts any `accept` MIME/extension filter and
 * calls `onFileSelected(file)` once a file is chosen, leaving all
 * validation and upload logic to the caller.
 *
 * Accessibility: the drag-and-drop surface is a supplementary, mouse-only
 * convenience. Keyboard and screen-reader users get a real, natively
 * focusable <button> ("Browse Files") as the primary interaction - the
 * outer container is intentionally not made a second interactive element,
 * since nesting a role="button" region around a real <button> creates a
 * confusing double-control for assistive tech.
 */
export default function CSVUploader({ onFileSelected, disabled = false, accept = ".csv" }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const file = fileList?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors ${
        isDragging ? "border-brand-400 bg-brand-50 dark:bg-brand-700/10" : "border-ink-200 dark:border-ink-700"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-700/20 dark:text-brand-400"
        aria-hidden="true"
      >
        {isDragging ? <FileText size={20} /> : <UploadCloud size={20} />}
      </div>
      <div>
        <p className="text-sm font-medium text-ink-800 dark:text-ink-100">Drag and drop a CSV file here</p>
        <p className="text-xs text-ink-500 dark:text-ink-400">or use the button below to browse</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-label="Browse for a CSV file to upload"
        className="rounded-md bg-brand-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50"
      >
        Browse Files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
        aria-label="CSV file input"
      />
    </div>
  );
}