const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

function FramePropertiesPanel({ canvas, object, onObjectChange, history }) {
  const hasImage = Boolean(object.hasFrameImage);
  const applyOpacity = (opacity) => {
    history.update("Change frame opacity", () => {
      object.set({ opacity });
      object.dirty = true;
      object.setCoords();
      canvas.requestRenderAll();
      onObjectChange(object);
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 4h16v16H4zM8 8h8v8H8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {hasImage ? "Image frame" : "Empty frame"}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {hasImage
                ? `${Math.round((object.frameImageZoom || 1) * 100)}% image zoom`
                : "Drop an image here to fill it"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {hasImage && (
          <button
            type="button"
            onClick={() => canvas.fire("designflow:frame-edit-request", { frame: object })}
            className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/40"
          >
            Edit image
          </button>
        )}
        <button
          type="button"
          onClick={() => canvas.fire("designflow:frame-replace-request", { frame: object })}
          className={`min-h-11 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 ${hasImage ? "" : "col-span-2"}`}
        >
          {hasImage ? "Replace" : "Add image"}
        </button>
      </div>

      <label className="block">
        <span className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Opacity</span>
          <span>{Math.round((object.opacity ?? 1) * 100)}%</span>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round((object.opacity ?? 1) * 100)}
          onFocus={() => history.begin("Change frame opacity")}
          onPointerDown={() => history.begin("Change frame opacity")}
          onPointerUp={() => history.commit("Change frame opacity")}
          onPointerCancel={() => history.commit("Change frame opacity")}
          onKeyUp={() => history.commit("Change frame opacity")}
          onBlur={() => history.commit("Change frame opacity")}
          onChange={(event) =>
            applyOpacity(clamp(Number(event.target.value) / 100, 0, 1))
          }
          className="h-2 w-full cursor-pointer accent-blue-600"
        />
      </label>

      <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        Double-click the frame to reposition its image without changing the frame.
      </p>
    </div>
  );
}

export default FramePropertiesPanel;
