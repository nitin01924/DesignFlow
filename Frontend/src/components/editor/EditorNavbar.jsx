import { Link } from "react-router-dom";

function EditorNavbar({ user, projectTitle }) {
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
        <button
          type="button"
          disabled
          title="Saving will be available in a future update"
          className="cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-400 dark:border-slate-700 dark:text-slate-600 sm:px-4"
        >
          Save
        </button>
        <button
          type="button"
          disabled
          title="Exporting will be available in a future update"
          className="hidden cursor-not-allowed rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white opacity-45 sm:block"
        >
          Export
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
