import { useEffect, useId, useRef, useState } from "react";
import { EXPORT_FORMATS, RESOLUTION_OPTIONS } from "../../../utils/canvasExport";

function OptionCard({ checked, children, name, onChange, value }) {
  return (
    <label className={`flex min-h-12 cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${
      checked
        ? "border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100"
        : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    }`}>
      <span>{children}</span>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="size-4 accent-blue-600"
      />
    </label>
  );
}

function Switch({ checked, label, onChange, disabled = false }) {
  return (
    <label className={`flex min-h-12 items-center justify-between gap-4 rounded-xl px-1 ${disabled ? "opacity-45" : "cursor-pointer"}`}>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <span className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
        />
        <span className="block h-8 w-13 rounded-full border-2 border-slate-400 bg-slate-200 transition peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600 dark:bg-slate-700" />
        <span className="absolute left-1 top-1 size-6 rounded-full bg-slate-600 shadow-sm transition peer-checked:translate-x-5 peer-checked:bg-white dark:bg-slate-300" />
      </span>
    </label>
  );
}

function ExportDialog({ projectTitle, isExporting, onCancel, onExport }) {
  const titleId = useId();
  const fileNameInputRef = useRef(null);
  const dialogRef = useRef(null);
  const [fileName, setFileName] = useState(projectTitle);
  const [format, setFormat] = useState("png");
  const [multiplier, setMultiplier] = useState(1);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [quality, setQuality] = useState(0.9);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fileNameInputRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isExporting) onCancel();
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExporting, onCancel]);

  const submit = (event) => {
    event.preventDefault();
    onExport({
      fileName,
      format,
      multiplier,
      includeBackground,
      transparentBackground,
      quality,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isExporting) onCancel();
      }}
    >
      <form
        ref={dialogRef}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl dark:bg-slate-950 sm:max-w-xl sm:rounded-[1.75rem]"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div>
            <h2 id={titleId} className="text-xl font-semibold text-slate-950 dark:text-white">Export Design</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Download a production-ready copy of your canvas.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isExporting}
            aria-label="Close export dialog"
            className="grid size-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">File Name</span>
            <input
              ref={fileNameInputRef}
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              required
              maxLength={180}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <fieldset>
            <legend className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">Export Format</legend>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(EXPORT_FORMATS).map(([value, option]) => (
                <OptionCard
                  key={value}
                  name="export-format"
                  value={value}
                  checked={format === value}
                  onChange={() => setFormat(value)}
                >
                  <span className="text-sm font-semibold">{option.label}</span>
                </OptionCard>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">Resolution</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {RESOLUTION_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  name="export-resolution"
                  value={option.value}
                  checked={multiplier === option.value}
                  onChange={() => setMultiplier(option.value)}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{option.detail}</span>
                </OptionCard>
              ))}
            </div>
          </fieldset>

          <section className="rounded-2xl bg-slate-50 px-4 py-2 dark:bg-slate-900">
            <Switch
              label="Include Background"
              checked={includeBackground}
              onChange={(event) => setIncludeBackground(event.target.checked)}
            />
            {format === "png" && (
              <Switch
                label="Transparent Background"
                checked={transparentBackground}
                onChange={(event) => setTransparentBackground(event.target.checked)}
              />
            )}
          </section>

          {format === "jpeg" && (
            <label className="block rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <span className="mb-3 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                <span>Image Quality</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">{Math.round(quality * 100)}%</span>
              </span>
              <input
                type="range"
                min="80"
                max="100"
                step="10"
                value={quality * 100}
                onChange={(event) => setQuality(Number(event.target.value) / 100)}
                className="h-2 w-full cursor-pointer accent-blue-600"
              />
              <span className="mt-2 flex justify-between text-xs text-slate-400"><span>80%</span><span>90%</span><span>100%</span></span>
            </label>
          )}
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isExporting}
            className="h-11 rounded-full px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-40 dark:text-blue-300 dark:hover:bg-blue-950/50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isExporting || !fileName.trim()}
            className="flex h-11 min-w-28 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isExporting && <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </footer>
      </form>
    </div>
  );
}

export default ExportDialog;
