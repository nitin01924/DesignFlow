function CropActionBar({ onCancel, onReset, onDone }) {
  return (
    <div
      className="grid min-h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-slate-200 bg-white px-2.5 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:px-4"
      role="toolbar"
      aria-label="Crop image"
    >
      <div className="justify-self-start">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-4"
        >
          Cancel
        </button>
      </div>

      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        Crop
      </span>

      <div className="flex items-center justify-self-end gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onReset}
          className="min-h-10 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-4"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onDone}
          className="min-h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:px-5"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default CropActionBar;
