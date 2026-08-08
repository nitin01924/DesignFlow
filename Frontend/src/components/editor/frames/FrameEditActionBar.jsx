function FrameEditActionBar({ zoom, onZoomChange, onCancel, onReplace, onDone }) {
  return (
    <div
      className="z-30 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950"
      role="toolbar"
      aria-label="Edit frame image"
    >
      <button
        type="button"
        onClick={onCancel}
        className="min-h-10 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Cancel
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-3">
        <span className="hidden text-xs font-medium text-slate-500 sm:inline">Zoom</span>
        <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M8 11h6" strokeLinecap="round" />
        </svg>
        <input
          type="range"
          min="1"
          max="8"
          step="0.01"
          value={zoom}
          onChange={(event) => onZoomChange(Number(event.target.value))}
          className="h-2 w-full max-w-52 cursor-pointer touch-manipulation accent-blue-600"
          aria-label="Frame image zoom"
        />
        <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M8 11h6m-3-3v6" strokeLinecap="round" />
        </svg>
      </div>
      <button
        type="button"
        onClick={onReplace}
        className="hidden min-h-10 rounded-xl px-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 sm:block"
      >
        Replace
      </button>
      <button
        type="button"
        onClick={onDone}
        className="min-h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        Done
      </button>
    </div>
  );
}

export default FrameEditActionBar;
