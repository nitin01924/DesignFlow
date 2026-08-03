const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const toDisplayNumber = (value) =>
  Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;

function NumberField({
  label,
  value,
  onChange,
  onInteractionStart,
  onInteractionEnd,
  min,
  max,
  step = 1,
  suffix,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="relative block">
        <input
          type="number"
          value={toDisplayNumber(value)}
          min={min}
          max={max}
          step={step}
          onFocus={onInteractionStart}
          onBlur={onInteractionEnd}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          onChange={(event) => {
            const nextValue = event.target.valueAsNumber;
            if (Number.isFinite(nextValue)) onChange(nextValue);
          }}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

function ImagePropertiesPanel({ canvas, object, onObjectChange, history }) {
  const scaledWidth = object.getScaledWidth();
  const scaledHeight = object.getScaledHeight();
  const isAspectRatioLocked = Boolean(object.aspectRatioLocked);

  const apply = (properties) => {
    object.set(properties);
    object.setCoords();
    canvas.requestRenderAll();
    onObjectChange(object);
  };

  const update = (action, properties) =>
    history.update(action, () => apply(properties));

  const interactionProps = (action) => ({
    onInteractionStart: () => history.begin(action),
    onInteractionEnd: () => history.commit(action),
  });

  const updateWidth = (nextWidth) => {
    const width = Math.max(1, nextWidth);
    const nextScaleX = width / Math.max(1, object.width || 1);

    if (!isAspectRatioLocked) {
      update("Resize image", { scaleX: nextScaleX });
      return;
    }

    const ratio =
      object.lockedAspectRatio || scaledWidth / Math.max(1, scaledHeight);
    update("Resize image", {
      scaleX: nextScaleX,
      scaleY: width / ratio / Math.max(1, object.height || 1),
    });
  };

  const updateHeight = (nextHeight) => {
    const height = Math.max(1, nextHeight);
    const nextScaleY = height / Math.max(1, object.height || 1);

    if (!isAspectRatioLocked) {
      update("Resize image", { scaleY: nextScaleY });
      return;
    }

    const ratio =
      object.lockedAspectRatio || scaledWidth / Math.max(1, scaledHeight);
    update("Resize image", {
      scaleX: (height * ratio) / Math.max(1, object.width || 1),
      scaleY: nextScaleY,
    });
  };

  const toggleAspectRatio = (event) => {
    const locked = event.target.checked;
    const ratio =
      object.getScaledWidth() / Math.max(1, object.getScaledHeight());

    history.execute(
      {
        type: locked ? "lock-aspect-ratio" : "unlock-aspect-ratio",
        label: locked ? "Lock aspect ratio" : "Unlock aspect ratio",
      },
      () => {
        object.set({
          aspectRatioLocked: locked,
          lockedAspectRatio: locked ? ratio : undefined,
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
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Width"
          value={scaledWidth}
          min={1}
          onChange={updateWidth}
          {...interactionProps("Resize image")}
          suffix="px"
        />
        <NumberField
          label="Height"
          value={scaledHeight}
          min={1}
          onChange={updateHeight}
          {...interactionProps("Resize image")}
          suffix="px"
        />
        <NumberField
          label="X position"
          value={object.left || 0}
          onChange={(left) => update("Move image", { left })}
          {...interactionProps("Move image")}
          suffix="px"
        />
        <NumberField
          label="Y position"
          value={object.top || 0}
          onChange={(top) => update("Move image", { top })}
          {...interactionProps("Move image")}
          suffix="px"
        />
      </div>

      <NumberField
        label="Rotation"
        value={object.angle || 0}
        onChange={(angle) => update("Rotate image", { angle })}
        {...interactionProps("Rotate image")}
        step={1}
        suffix="°"
      />

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
          onFocus={() => history.begin("Change image opacity")}
          onPointerDown={() => history.begin("Change image opacity")}
          onPointerUp={() => history.commit("Change image opacity")}
          onPointerCancel={() => history.commit("Change image opacity")}
          onKeyUp={() => history.commit("Change image opacity")}
          onBlur={() => history.commit("Change image opacity")}
          onChange={(event) =>
            update("Change image opacity", {
              opacity: clamp(Number(event.target.value) / 100, 0, 1),
            })
          }
          className="h-2 w-full cursor-pointer accent-blue-600"
        />
      </label>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        <span>
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Lock aspect ratio
          </span>
          <span className="mt-0.5 block text-xs text-slate-400">
            Keep width and height proportional
          </span>
        </span>
        <input
          type="checkbox"
          checked={isAspectRatioLocked}
          onChange={toggleAspectRatio}
          className="size-4 accent-blue-600"
        />
      </label>
    </div>
  );
}

export default ImagePropertiesPanel;
