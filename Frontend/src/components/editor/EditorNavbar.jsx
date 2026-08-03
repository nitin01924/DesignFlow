import { Link } from "react-router-dom";

const statusLabels = {
  saving: "Saving...",
  saved: "Saved",
  failed: "Failed",
};

function HistoryButton({ direction, history, disabled }) {
  const isUndo = direction === "undo";
  const available = isUndo ? history.canUndo : history.canRedo;
  const actionLabel = isUndo ? history.undoLabel : history.redoLabel;
  const label = `${isUndo ? "Undo" : "Redo"}${actionLabel ? ` ${actionLabel}` : ""}`;

  return (
    <button
      type="button"
      onClick={() => void (isUndo ? history.undo() : history.redo())}
      disabled={disabled || !available}
      title={`${label} (${isUndo ? "Ctrl/Cmd+Z" : "Ctrl/Cmd+Shift+Z"})`}
      aria-label={label}
      className="grid size-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        aria-hidden="true"
      >
        {isUndo ? (
          <path d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="m15 7 5 5-5 5m4-5h-8a6 6 0 0 0-6 6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

function EditorNavbar({
  user,
  projectTitle,
  onSave,
  saveStatus,
  onExport,
  isExporting,
  isEditingDisabled,
  history,
}) {
  const userName = user?.name?.trim() || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="hidden h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 transition-colors dark:border-slate-800 dark:bg-slate-950 sm:px-6 md:flex">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/dashboard"
          aria-label="Back to dashboard"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              d="m15 18-6-6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Design Project
          </p>
          <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
            {projectTitle}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span
          className={`text-xs font-medium ${
            saveStatus === "failed"
              ? "text-red-600 dark:text-red-400"
              : "text-slate-500 dark:text-slate-400"
          }`}
          role="status"
          aria-live="polite"
        >
          {statusLabels[saveStatus]}
        </span>
        <div className="flex items-center gap-0.5 border-l border-slate-200 pl-2 dark:border-slate-700" role="group" aria-label="Canvas history">
          <HistoryButton direction="undo" history={history} disabled={isEditingDisabled} />
          <HistoryButton direction="redo" history={history} disabled={isEditingDisabled} />
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saveStatus === "saving" || isEditingDisabled}
          title={isEditingDisabled ? "Finish cropping before saving" : "Save project (Ctrl+S)"}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-4"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting || isEditingDisabled}
          className="hidden min-w-24 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-65 sm:flex"
        >
          {isExporting && <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
          {isExporting ? "Exporting..." : "Export"}
        </button>
        <div
          className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-blue-600"
          aria-label={`${userName} profile`}
          title={userName}
        >
          {userInitial}
        </div>
      </div>
    </header>
  );
}

export default EditorNavbar;
