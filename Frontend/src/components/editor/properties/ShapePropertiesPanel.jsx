const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const displayNumber = (value) =>
  Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;

const labelClass =
  "mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400";
const fieldClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const colorValue = (paint, fallback) =>
  typeof paint === "string" && /^#[0-9a-f]{6}$/i.test(paint)
    ? paint
    : fallback;

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
      <span className={labelClass}>{label}</span>
      <span className="relative block">
        <input
          type="number"
          value={displayNumber(value)}
          min={min}
          max={max}
          step={step}
          onFocus={onInteractionStart}
          onBlur={onInteractionEnd}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          onChange={(event) => {
            if (Number.isFinite(event.target.valueAsNumber)) {
              onChange(event.target.valueAsNumber);
            }
          }}
          className={`${fieldClass} ${suffix ? "pr-9" : ""}`}
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

function ColorField({ label, value, action, history, onChange }) {
  return (
    <label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 dark:border-slate-700">
      <input
        type="color"
        value={value}
        onFocus={() => history.begin(action)}
        onPointerDown={() => history.begin(action)}
        onPointerUp={() => history.commit(action)}
        onPointerCancel={() => history.commit(action)}
        onBlur={() => history.commit(action)}
        onChange={(event) =>
          history.update(action, () => onChange(event.target.value))
        }
        className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
        aria-label={label}
      />
      <span className="min-w-0">
        <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </span>
        <span className="block font-mono text-[10px] text-slate-400">
          {value.toUpperCase()}
        </span>
      </span>
    </label>
  );
}

function ShapePropertiesPanel({ canvas, object, onObjectChange, history }) {
  const shapeKind = object.shapeKind || object.type;
  const isLine = shapeKind === "line";
  const isRoundedRectangle = shapeKind === "roundedRectangle";
  // Fabric's bounding-box helpers include the stroke. Inspector dimensions
  // describe vector geometry so entering a value remains stable at any stroke.
  const scaledWidth = (object.width || 0) * Math.abs(object.scaleX || 1);
  const scaledHeight = (object.height || 0) * Math.abs(object.scaleY || 1);
  const isAspectRatioLocked = Boolean(object.aspectRatioLocked);
  const fill = colorValue(object.fill, "#2563EB");
  const stroke = colorValue(object.stroke, isLine ? "#2563EB" : "#1E3A8A");

  const apply = (properties) => {
    object.set(properties);
    object.set({ dirty: true });
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

  const signedScale = (size, baseSize, currentScale) =>
    (currentScale < 0 ? -1 : 1) * (Math.max(1, size) / Math.max(1, baseSize));

  const updateWidth = (nextWidth) => {
    const width = Math.max(1, nextWidth);
    const scaleX = signedScale(width, object.width || 1, object.scaleX || 1);
    if (!isAspectRatioLocked) {
      update(isLine ? "Change line length" : "Resize shape", { scaleX });
      return;
    }
    const ratio =
      object.lockedAspectRatio || scaledWidth / Math.max(1, scaledHeight);
    update("Resize shape", {
      scaleX,
      scaleY: signedScale(
        width / Math.max(0.0001, ratio),
        object.height || 1,
        object.scaleY || 1,
      ),
    });
  };

  const updateHeight = (nextHeight) => {
    const height = Math.max(1, nextHeight);
    const scaleY = signedScale(height, object.height || 1, object.scaleY || 1);
    if (!isAspectRatioLocked) {
      update("Resize shape", { scaleY });
      return;
    }
    const ratio =
      object.lockedAspectRatio || scaledWidth / Math.max(1, scaledHeight);
    update("Resize shape", {
      scaleX: signedScale(
        height * ratio,
        object.width || 1,
        object.scaleX || 1,
      ),
      scaleY,
    });
  };

  const toggleAspectRatio = (event) => {
    const locked = event.target.checked;
    const ratio = scaledWidth / Math.max(1, scaledHeight);
    history.execute(
      locked ? "Lock shape aspect ratio" : "Unlock shape aspect ratio",
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
          mtr: true,
        });
        apply({});
      },
    );
  };

  const displayedCornerRadius = isRoundedRectangle
    ? Math.min(
        (object.rx || 0) * Math.abs(object.scaleX || 1),
        (object.ry || 0) * Math.abs(object.scaleY || 1),
      )
    : 0;

  return (
    <div className="space-y-5">
      <div className={`grid gap-3 ${isLine ? "grid-cols-1" : "grid-cols-2"}`}>
        <NumberField
          label={isLine || shapeKind === "arrow" ? "Length" : "Width"}
          value={scaledWidth}
          min={1}
          onChange={updateWidth}
          {...interactionProps(isLine ? "Change line length" : "Resize shape")}
          suffix="px"
        />
        {!isLine && (
          <NumberField
            label="Height"
            value={scaledHeight}
            min={1}
            onChange={updateHeight}
            {...interactionProps("Resize shape")}
            suffix="px"
          />
        )}
        <NumberField
          label="X position"
          value={object.left || 0}
          onChange={(left) => update("Move shape", { left })}
          {...interactionProps("Move shape")}
          suffix="px"
        />
        <NumberField
          label="Y position"
          value={object.top || 0}
          onChange={(top) => update("Move shape", { top })}
          {...interactionProps("Move shape")}
          suffix="px"
        />
      </div>

      <NumberField
        label="Rotation"
        value={object.angle || 0}
        onChange={(angle) => update("Rotate shape", { angle })}
        {...interactionProps("Rotate shape")}
        suffix="°"
      />

      <div className={`grid gap-3 ${isLine ? "grid-cols-1" : "grid-cols-2"}`}>
        {!isLine && (
          <ColorField
            label="Fill color"
            value={fill}
            action="Change shape fill"
            history={history}
            onChange={(nextFill) => apply({ fill: nextFill })}
          />
        )}
        <ColorField
          label="Stroke color"
          value={stroke}
          action="Change shape stroke"
          history={history}
          onChange={(nextStroke) => apply({ stroke: nextStroke })}
        />
      </div>

      <NumberField
        label="Stroke width"
        value={object.strokeWidth || 0}
        min={0}
        max={100}
        step={0.5}
        onChange={(strokeWidth) =>
          update("Change shape stroke width", {
            strokeWidth: clamp(strokeWidth, 0, 100),
          })
        }
        {...interactionProps("Change shape stroke width")}
        suffix="px"
      />

      {isRoundedRectangle && (
        <NumberField
          label="Corner radius"
          value={displayedCornerRadius}
          min={0}
          max={Math.min(scaledWidth, scaledHeight) / 2}
          onChange={(radius) => {
            const nextRadius = clamp(
              radius,
              0,
              Math.min(scaledWidth, scaledHeight) / 2,
            );
            update("Change corner radius", {
              rx: nextRadius / Math.max(0.0001, Math.abs(object.scaleX || 1)),
              ry: nextRadius / Math.max(0.0001, Math.abs(object.scaleY || 1)),
            });
          }}
          {...interactionProps("Change corner radius")}
          suffix="px"
        />
      )}

      <label className="block">
        <span className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Opacity</span>
          <span>{Math.round((object.opacity ?? 1) * 100)}%</span>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round((object.opacity ?? 1) * 100)}
          onFocus={() => history.begin("Change shape opacity")}
          onPointerDown={() => history.begin("Change shape opacity")}
          onPointerUp={() => history.commit("Change shape opacity")}
          onPointerCancel={() => history.commit("Change shape opacity")}
          onKeyUp={() => history.commit("Change shape opacity")}
          onBlur={() => history.commit("Change shape opacity")}
          onChange={(event) =>
            update("Change shape opacity", {
              opacity: clamp(Number(event.target.value) / 100, 0, 1),
            })
          }
          className="h-2 w-full cursor-pointer accent-blue-600"
        />
      </label>

      {!isLine && (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
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
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
          Editable vector shape
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Remains sharp in saved designs and exports
        </p>
      </div>
    </div>
  );
}

export default ShapePropertiesPanel;
