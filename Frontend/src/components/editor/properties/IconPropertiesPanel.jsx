import { setIconColor } from "../assets/iconStyle.js";

const COLOR_PRESETS = [
  "#111827",
  "#FFFFFF",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#DC2626",
  "#EA580C",
  "#16A34A",
];

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const displayNumber = (value) =>
  Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;

function NumberField({
  label,
  value,
  onChange,
  onInteractionStart,
  onInteractionEnd,
  min,
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
          value={displayNumber(value)}
          min={min}
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
          className={`h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${suffix ? "pr-9" : ""}`}
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

function IconPropertiesPanel({ canvas, object, onObjectChange, history }) {
  const color = object.assetColor || "#111827";

  const apply = (properties) => {
    object.set(properties);
    object.setCoords();
    object.set("dirty", true);
    canvas.requestRenderAll();
    onObjectChange(object);
  };

  const update = (action, properties) =>
    history.update(action, () => apply(properties));

  const execute = (action, mutation) => history.execute(action, mutation);

  const interactionProps = (action) => ({
    onInteractionStart: () => history.begin(action),
    onInteractionEnd: () => history.commit(action),
  });

  const changeColor = (nextColor) => {
    setIconColor(object, nextColor);
    canvas.requestRenderAll();
    onObjectChange(object);
  };

  const updateSize = (nextSize) => {
    const size = Math.max(1, nextSize);
    const scale = size / Math.max(1, object.width || 1, object.height || 1);
    update("Resize icon", { scaleX: scale, scaleY: scale });
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Icon color
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            {color.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-8 gap-1.5" role="toolbar" aria-label="Icon color presets">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() =>
                execute("Change icon color", () => changeColor(preset))
              }
              aria-label={`Set icon color to ${preset}`}
              aria-pressed={color.toLowerCase() === preset.toLowerCase()}
              className={`aspect-square rounded-lg border shadow-sm transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                color.toLowerCase() === preset.toLowerCase()
                  ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950"
                  : "border-slate-200 dark:border-slate-700"
              }`}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
        <label className="mt-3 flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 dark:border-slate-700">
          <input
            type="color"
            value={color}
            onFocus={() => history.begin("Change icon color")}
            onPointerDown={() => history.begin("Change icon color")}
            onPointerUp={() => history.commit("Change icon color")}
            onBlur={() => history.commit("Change icon color")}
            onChange={(event) =>
              history.update("Change icon color", () =>
                changeColor(event.target.value),
              )
            }
            className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
            aria-label="Custom icon color"
          />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Custom color
          </span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Size"
          value={Math.max(object.getScaledWidth(), object.getScaledHeight())}
          min={1}
          onChange={updateSize}
          {...interactionProps("Resize icon")}
          suffix="px"
        />
        <NumberField
          label="Rotation"
          value={object.angle || 0}
          onChange={(angle) => update("Rotate icon", { angle })}
          {...interactionProps("Rotate icon")}
          suffix="°"
        />
        <NumberField
          label="X position"
          value={object.left || 0}
          onChange={(left) => update("Move icon", { left })}
          {...interactionProps("Move icon")}
          suffix="px"
        />
        <NumberField
          label="Y position"
          value={object.top || 0}
          onChange={(top) => update("Move icon", { top })}
          {...interactionProps("Move icon")}
          suffix="px"
        />
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
          value={Math.round((object.opacity ?? 1) * 100)}
          onFocus={() => history.begin("Change icon opacity")}
          onPointerDown={() => history.begin("Change icon opacity")}
          onPointerUp={() => history.commit("Change icon opacity")}
          onPointerCancel={() => history.commit("Change icon opacity")}
          onKeyUp={() => history.commit("Change icon opacity")}
          onBlur={() => history.commit("Change icon opacity")}
          onChange={(event) =>
            update("Change icon opacity", {
              opacity: clamp(Number(event.target.value) / 100, 0, 1),
            })
          }
          className="h-2 w-full cursor-pointer accent-blue-600"
        />
      </label>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
          Vector icon
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Lucide · remains sharp at every size
        </p>
      </div>
    </div>
  );
}

export default IconPropertiesPanel;
