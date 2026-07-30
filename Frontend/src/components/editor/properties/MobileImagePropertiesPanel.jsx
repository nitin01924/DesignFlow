function MobileImagePropertiesPanel({ canvas, object, onObjectChange }) {
  const commit = (properties) => {
    object.set(properties);
    object.setCoords();
    canvas.requestRenderAll();
    onObjectChange(object);
  };

  const isAspectRatioLocked = Boolean(object.aspectRatioLocked);

  const toggleAspectRatio = (event) => {
    const locked = event.target.checked;
    object.set({
      aspectRatioLocked: locked,
      lockedAspectRatio: locked
        ? object.getScaledWidth() / Math.max(1, object.getScaledHeight())
        : undefined,
    });
    object.setControlsVisibility({
      mt: !locked,
      mb: !locked,
      ml: !locked,
      mr: !locked,
    });
    canvas.set({ uniformScaling: locked });
    object.setCoords();
    canvas.requestRenderAll();
    onObjectChange(object);
  };

  return (
    <div className="space-y-5">
      {/* <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
        Drag to move. Use the corner handles to resize and rotate.
      </div> */}

      <label className="block">
        <span className="mb-3 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
          <span>Opacity</span>
          <span>{Math.round((object.opacity ?? 1) * 100)}%</span>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round((object.opacity ?? 1) * 100)}
          onChange={(event) =>
            commit({ opacity: Number(event.target.value) / 100 })
          }
          className="h-3 w-full cursor-pointer accent-blue-600"
        />
      </label>

      <label className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 dark:border-slate-700">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Keep proportions
        </span>
        <input
          type="checkbox"
          checked={isAspectRatioLocked}
          onChange={toggleAspectRatio}
          className="size-5 accent-blue-600"
        />
      </label>
    </div>
  );
}

export default MobileImagePropertiesPanel;
