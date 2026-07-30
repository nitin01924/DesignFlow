function CropActionBar({ onApply, onCancel }) {
  return (
    <>
      <div
        className="hidden min-h-14 items-center justify-between border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-950 md:flex"
        role="toolbar"
        aria-label="Crop actions"
      >
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Crop image</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Move or zoom the image, then resize the crop frame.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Apply Crop
          </button>
        </div>
      </div>

      <div className="absolute inset-x-3 top-3 z-30 flex justify-center md:hidden">
        <div
          className="flex items-center gap-2 rounded-2xl bg-white/95 p-1.5 shadow-xl ring-1 ring-slate-900/10 backdrop-blur dark:bg-slate-900/95 dark:ring-white/10"
          role="toolbar"
          aria-label="Crop actions"
        >
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-700 active:bg-slate-100 dark:text-slate-200 dark:active:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white active:bg-blue-700"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </>
  );
}

export default CropActionBar;
