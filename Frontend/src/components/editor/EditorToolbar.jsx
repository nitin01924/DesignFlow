const iconPaths = {
  delete: "M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5",
  duplicate: "M8 8h11v11H8zM5 16H4V4h12v1",
  forward: "M12 5l5 5h-3v5h-4v-5H7zM6 19h12",
  backward: "M12 19l-5-5h3V9h4v5h3zM6 5h12",
  rotateLeft: "M7 7H3V3M3.5 7.5A8 8 0 1 1 4 17",
  rotateRight: "M17 7h4V3m-.5 4.5A8 8 0 1 0 20 17",
  lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5zM12 14v2",
  unlock: "M8 10V7a4 4 0 0 1 7.5-2M5 10h14v10H5zM12 14v2",
};

function ToolbarButton({ action, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={action.disabled}
      title={action.label}
      aria-label={action.label}
      aria-pressed={action.pressed}
      className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          d={iconPaths[action.icon]}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="hidden xl:inline">{action.shortLabel || action.label}</span>
    </button>
  );
}

function EditorToolbar({ canvas, selectedObject, onSelectionChange }) {
  const hasSelection = Boolean(canvas && selectedObject);
  const isMovementLocked = Boolean(
    selectedObject?.lockMovementX && selectedObject?.lockMovementY,
  );

  const finishAction = (object = selectedObject) => {
    object?.setCoords();
    canvas?.requestRenderAll();
    onSelectionChange?.(object || null);
  };

  const deleteSelection = () => {
    // getActiveObjects also handles a multi-object ActiveSelection correctly.
    const objects = canvas.getActiveObjects();
    canvas.discardActiveObject();
    canvas.remove(...objects);
    finishAction(null);
  };

  const duplicateSelection = async () => {
    // Fabric 7 clone() is asynchronous because some objects may contain images.
    const clone = await selectedObject.clone();
    clone.set({
      left: (selectedObject.left || 0) + 20,
      top: (selectedObject.top || 0) + 20,
      aspectRatioLocked: selectedObject.aspectRatioLocked,
      lockedAspectRatio: selectedObject.lockedAspectRatio,
    });
    if (selectedObject.type === "image") {
      const locked = selectedObject.aspectRatioLocked !== false;
      clone.setControlsVisibility({
        mt: !locked,
        mb: !locked,
        ml: !locked,
        mr: !locked,
      });
    }
    canvas.add(clone);
    canvas.setActiveObject(clone);
    finishAction(clone);
  };

  const rotate = (degrees) => {
    // rotate() respects Fabric's origin and normalizes the object's angle handling.
    selectedObject.rotate((selectedObject.angle || 0) + degrees);
    finishAction();
  };

  const toggleMovementLock = () => {
    selectedObject.set({
      lockMovementX: !isMovementLocked,
      lockMovementY: !isMovementLocked,
    });
    finishAction();
  };

  // New commands can be appended here without changing the toolbar markup.
  const actions = [
    { label: "Delete selected object", shortLabel: "Delete", icon: "delete", run: deleteSelection },
    { label: "Duplicate selected object", shortLabel: "Duplicate", icon: "duplicate", run: duplicateSelection },
    { label: "Bring forward", icon: "forward", run: () => { canvas.bringObjectForward(selectedObject); finishAction(); } },
    { label: "Send backward", icon: "backward", run: () => { canvas.sendObjectBackwards(selectedObject); finishAction(); } },
    { label: "Rotate left 90 degrees", shortLabel: "Rotate left", icon: "rotateLeft", run: () => rotate(-90) },
    { label: "Rotate right 90 degrees", shortLabel: "Rotate right", icon: "rotateRight", run: () => rotate(90) },
    {
      label: isMovementLocked ? "Unlock object movement" : "Lock object movement",
      shortLabel: isMovementLocked ? "Unlock" : "Lock",
      icon: isMovementLocked ? "unlock" : "lock",
      pressed: isMovementLocked,
      run: toggleMovementLock,
    },
  ];

  return (
    <div
      className="flex min-h-14 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
      role="toolbar"
      aria-label="Selected object actions"
    >
      {actions.map((action) => (
        <ToolbarButton
          key={action.label}
          action={{ ...action, disabled: !hasSelection }}
          onClick={action.run}
        />
      ))}
      {!hasSelection && (
        <span className="ml-2 whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">
          Select an object to edit it
        </span>
      )}
    </div>
  );
}

export default EditorToolbar;
