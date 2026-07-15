function EmptyState({ onCreate }) {
  return (
    <section className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={onCreate}
        aria-label="Create your first project"
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600 transition hover:bg-blue-100 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-900/70 dark:hover:text-blue-300"
      >
        +
      </button>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">No projects yet</h2>
      <p className="mt-2 text-gray-500 dark:text-slate-400">Create your first design.</p>
    </section>
  );
}

export default EmptyState;
