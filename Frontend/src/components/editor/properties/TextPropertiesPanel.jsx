const FONT_FAMILIES = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Trebuchet MS",
  "Courier New",
];

const FONT_WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semi Bold", value: 600 },
  { label: "Bold", value: 700 },
  { label: "Extra Bold", value: 800 },
];

const ALIGNMENTS = [
  { value: "left", label: "Align left", icon: "M5 6h14M5 10h9M5 14h14M5 18h9" },
  { value: "center", label: "Align center", icon: "M5 6h14M8 10h8M5 14h14M8 18h8" },
  { value: "right", label: "Align right", icon: "M5 6h14M10 10h9M5 14h14M10 18h9" },
  { value: "justify", label: "Justify", icon: "M5 6h14M5 10h14M5 14h14M5 18h14" },
];

const labelClass = "mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400";
const fieldClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

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
  const displayValue = Number.isFinite(value)
    ? Math.round(value * 100) / 100
    : 0;

  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <span className="relative block">
        <input
          type="number"
          value={displayValue}
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

function FormatButton({ active, label, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`grid h-10 min-w-10 flex-1 place-items-center rounded-xl border text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
          : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function TextPropertiesPanel({ canvas, object, onObjectChange, history }) {
  const apply = (properties) => {
    object.set(properties);
    object.setCoords();
    canvas.requestRenderAll();
    onObjectChange(object);
  };

  const execute = (action, properties) =>
    history.execute(action, () => apply(properties));

  const update = (action, properties) =>
    history.update(action, () => apply(properties));

  const interactionProps = (action) => ({
    onInteractionStart: () => history.begin(action),
    onInteractionEnd: () => history.commit(action),
  });

  const fill = typeof object.fill === "string" && object.fill.startsWith("#")
    ? object.fill
    : "#111827";

  return (
    <div className="space-y-5">
      <label className="block">
        <span className={labelClass}>Font family</span>
        <select
          value={object.fontFamily || "Arial"}
          onChange={(event) => execute("Change font family", { fontFamily: event.target.value })}
          className={fieldClass}
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Font size"
          value={object.fontSize}
          min={1}
          max={500}
          onChange={(fontSize) => update("Change font size", { fontSize: Math.max(1, fontSize) })}
          {...interactionProps("Change font size")}
          suffix="px"
        />
        <label className="block">
          <span className={labelClass}>Font weight</span>
          <select
            value={Number(object.fontWeight) || 400}
            onChange={(event) => execute("Change font weight", { fontWeight: Number(event.target.value) })}
            className={fieldClass}
          >
            {FONT_WEIGHTS.map((weight) => (
              <option key={weight.value} value={weight.value}>{weight.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-2" role="toolbar" aria-label="Text formatting">
        <FormatButton
          active={object.fontStyle === "italic"}
          label="Italic"
          onClick={() => execute("Change italic style", { fontStyle: object.fontStyle === "italic" ? "normal" : "italic" })}
        >
          <span className="font-serif text-base font-semibold italic">I</span>
        </FormatButton>
        <FormatButton
          active={Boolean(object.underline)}
          label="Underline"
          onClick={() => execute("Change underline style", { underline: !object.underline })}
        >
          <span className="text-base font-semibold underline">U</span>
        </FormatButton>
        <label className="flex h-10 flex-[2] cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 dark:border-slate-700">
          <input
            type="color"
            value={fill}
            onFocus={() => history.begin("Change text color")}
            onBlur={() => history.commit("Change text color")}
            onChange={(event) => update("Change text color", { fill: event.target.value })}
            className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
            aria-label="Text color"
          />
          <span className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">{fill.toUpperCase()}</span>
        </label>
      </div>

      <div>
        <span className={labelClass}>Alignment</span>
        <div className="flex gap-2" role="toolbar" aria-label="Text alignment">
          {ALIGNMENTS.map((alignment) => (
            <FormatButton
              key={alignment.value}
              active={(object.textAlign || "left") === alignment.value}
              label={alignment.label}
              onClick={() => execute("Change text alignment", { textAlign: alignment.value })}
            >
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d={alignment.icon} strokeLinecap="round" />
              </svg>
            </FormatButton>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Letter spacing"
          value={(object.charSpacing || 0) / 10}
          min={-20}
          max={100}
          step={0.1}
          onChange={(spacing) => update("Change letter spacing", { charSpacing: spacing * 10 })}
          {...interactionProps("Change letter spacing")}
          suffix="%"
        />
        <NumberField
          label="Line height"
          value={object.lineHeight || 1.2}
          min={0.5}
          max={5}
          step={0.1}
          onChange={(lineHeight) => update("Change line height", { lineHeight: Math.max(0.5, lineHeight) })}
          {...interactionProps("Change line height")}
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
          onFocus={() => history.begin("Change text opacity")}
          onPointerDown={() => history.begin("Change text opacity")}
          onPointerUp={() => history.commit("Change text opacity")}
          onPointerCancel={() => history.commit("Change text opacity")}
          onKeyUp={() => history.commit("Change text opacity")}
          onBlur={() => history.commit("Change text opacity")}
          onChange={(event) => update("Change text opacity", { opacity: Number(event.target.value) / 100 })}
          className="h-2 w-full cursor-pointer accent-blue-600"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="X position"
          value={object.left || 0}
          onChange={(left) => update("Move text", { left })}
          suffix="px"
          {...interactionProps("Move text")}
        />
        <NumberField
          label="Y position"
          value={object.top || 0}
          onChange={(top) => update("Move text", { top })}
          suffix="px"
          {...interactionProps("Move text")}
        />
        <div className="col-span-2">
          <NumberField
            label="Rotation"
            value={object.angle || 0}
            onChange={(angle) => update("Rotate text", { angle })}
            suffix="°"
            {...interactionProps("Rotate text")}
          />
        </div>
      </div>
    </div>
  );
}

export default TextPropertiesPanel;
