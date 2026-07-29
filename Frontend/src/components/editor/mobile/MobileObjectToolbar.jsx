const actions = [
  {
    label: "Duplicate",
    icon: "M8 8h11v11H8zM5 16H4V4h12v1",
    async run(canvas, object, finish) {
      const clone = await object.clone();
      clone.set({
        left: (object.left || 0) + 16,
        top: (object.top || 0) + 16,
        aspectRatioLocked: object.aspectRatioLocked,
        lockedAspectRatio: object.lockedAspectRatio,
      });
      if (object.type === "image") {
        const locked = object.aspectRatioLocked !== false;
        clone.setControlsVisibility({
          mt: !locked,
          mb: !locked,
          ml: !locked,
          mr: !locked,
        });
      }
      canvas.add(clone);
      canvas.setActiveObject(clone);
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
      canvas.discardActiveObject();
      canvas.remove(...activeObjects);
      finish(null);
    },
  },
];

function MobileObjectToolbar({ canvas, selectedObject, onSelectionChange }) {
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

  return (
    <div
      className="absolute inset-x-3 top-3 z-20 flex justify-center md:hidden"
      role="toolbar"
      aria-label="Selected object actions"
    >
      <div className="flex items-center gap-1 rounded-2xl bg-white/95 p-1.5 shadow-xl ring-1 ring-slate-900/10 backdrop-blur dark:bg-slate-900/95 dark:ring-white/10">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => action.run(canvas, selectedObject, finish)}
            className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium active:bg-slate-100 dark:active:bg-slate-800 ${
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
