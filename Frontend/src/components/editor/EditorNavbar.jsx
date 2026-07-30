import { Link } from "react-router-dom";

const statusLabels = {
  saving: "Saving...",
  saved: "Saved",
  failed: "Failed",
};

function EditorNavbar({
  user,
  projectTitle,
  onSave,
  saveStatus,
  onExport,
  isExporting,
  isEditingDisabled,
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
