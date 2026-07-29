import { TEXT_PRESETS } from "./textPresets";

function TextQuickActions({ onAddText, compact = false }) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {TEXT_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onAddText(preset.id)}
          className={`w-full rounded-xl border border-slate-200 bg-white text-left text-slate-900 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.99] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 ${
            compact ? "px-4 py-3" : "px-4 py-4"
          }`}
        >
          <span
            className="block truncate"
            style={{
              fontSize: compact
                ? Math.min(20, preset.fontSize * 0.45)
                : Math.min(24, preset.fontSize * 0.45),
              fontWeight: preset.fontWeight,
            }}
          >
            {preset.label.replace("Add ", "")}
          </span>
          <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
            {preset.fontSize}px · {preset.fontWeight}
          </span>
        </button>
      ))}
    </div>
  );
}

export default TextQuickActions;
