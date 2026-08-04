function CropActionBar({ onApply, onCancel }) {
  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-30 flex justify-center">
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-white/95 p-1.5 shadow-xl ring-1 ring-slate-900/10 backdrop-blur dark:bg-slate-900/95 dark:ring-white/10"
        role="toolbar"
        aria-label="Crop actions"
      >
        <span className="hidden px-3 text-sm font-semibold text-slate-800 dark:text-slate-100 sm:inline">
          Crop image
        </span>
        <span className="mx-1 hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onApply}
          className="min-h-10 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export default CropActionBar;
