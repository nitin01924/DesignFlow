import { deleteLayers, duplicateLayer } from "../layers/layerCommands.js";

const actions = [
  {
    label: "Duplicate",
    icon: "M8 8h11v11H8zM5 16H4V4h12v1",
    async run(canvas, object, finish) {
      const clone = await duplicateLayer(canvas, object, 16);
      finish(clone);
    },
  },
  {
    label: "Rotate",
    icon: "M20 11a8 8 0 1 0-2 5.3M20 5v6h-6",
    run(canvas, object, finish) {
      object.rotate((object.angle || 0) + 90);
      finish();
    },
  },
  {
    label: "Delete",
    icon: "M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13",
    destructive: true,
    run(canvas, object, finish) {
      const activeObjects = canvas.getActiveObjects();
      deleteLayers(canvas, activeObjects);
      finish(null);
    },
  },
];

function MobileObjectToolbar({
  canvas,
  selectedObject,
  onSelectionChange,
  onCrop,
  onEditFrame,
  onReplaceFrame,
  history,
}) {
  if (!canvas || !selectedObject) {
    return (
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex justify-center md:hidden">
        <p className="rounded-full bg-slate-950/75 px-4 py-2 text-xs font-medium text-white shadow-lg backdrop-blur">
          Tap an object to start editing
        </p>
      </div>
    );
  }

  const finish = (object = selectedObject) => {
    object?.setCoords();
    canvas.requestRenderAll();
    onSelectionChange(object || null);
  };

  const runAction = (action) =>
    history.execute(
      {
        type: action.label.toLowerCase().replaceAll(" ", "-"),
        label: `${action.label} object`,
      },
      () => action.run(canvas, selectedObject, finish),
    );
  const isHistoryUnavailable = !history.isReady || history.isRestoring;
  const isLayerLocked = Boolean(selectedObject.layerLocked);

  return (
    <div
      className="absolute inset-x-3 top-3 z-20 flex justify-center md:hidden"
      role="toolbar"
      aria-label="Selected object actions"
    >
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-white/95 p-1.5 shadow-xl ring-1 ring-slate-900/10 backdrop-blur dark:bg-slate-900/95 dark:ring-white/10">
        {selectedObject.type === "image" && (
          <button
            type="button"
            onClick={() => onCrop?.(selectedObject)}
            disabled={isHistoryUnavailable || isLayerLocked}
            className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-700 active:bg-slate-100 disabled:opacity-35 dark:text-slate-200 dark:active:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M7 3v14a4 4 0 0 0 4 4h10M3 7h14a4 4 0 0 1 4 4v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Crop
          </button>
        )}
        {selectedObject.assetType === "frame" && selectedObject.hasFrameImage && (
          <button
            type="button"
            onClick={() => onEditFrame?.(selectedObject)}
            disabled={isHistoryUnavailable || isLayerLocked}
            className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-700 active:bg-slate-100 disabled:opacity-35 dark:text-slate-200 dark:active:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 18.5V20h1.5L16.8 8.7l-1.5-1.5L4 18.5ZM18 4l2 2-2.2 2.2-2-2L18 4Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit
          </button>
        )}
        {selectedObject.assetType === "frame" && (
          <button
            type="button"
            onClick={() => onReplaceFrame?.(selectedObject)}
            disabled={isHistoryUnavailable || isLayerLocked}
            className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-700 active:bg-slate-100 disabled:opacity-35 dark:text-slate-200 dark:active:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 7h12m0 0-3-3m3 3-3 3M20 17H8m0 0 3 3m-3-3 3-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {selectedObject.hasFrameImage ? "Replace" : "Add image"}
          </button>
        )}
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => runAction(action)}
            disabled={isHistoryUnavailable || isLayerLocked}
            className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium active:bg-slate-100 disabled:opacity-35 dark:active:bg-slate-800 ${
              action.destructive
                ? "text-red-600 dark:text-red-400"
                : "text-slate-700 dark:text-slate-200"
            }`}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d={action.icon} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MobileObjectToolbar;
