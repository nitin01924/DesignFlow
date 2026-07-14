function formatDate(date) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

function PropertiesPanel({ project }) {
  return (
    <aside className="border-l border-slate-200 bg-white" aria-label="Project properties">
      <div className="h-full w-full overflow-y-auto p-5 md:w-72">
        <div className="border-b border-slate-100 pb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project information</p>
          <h2 className="mt-2 wrap-break-word text-base font-semibold text-slate-900">{project.title}</h2>
        </div>

        <dl className="space-y-4 border-b border-slate-100 py-5 text-sm">
          <div>
            <dt className="font-medium text-slate-500">Created</dt>
            <dd className="mt-1 text-slate-800">{formatDate(project.createdAt)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Last updated</dt>
            <dd className="mt-1 text-slate-800">{formatDate(project.updatedAt)}</dd>
          </div>
        </dl>

        <div className="py-5">
          <h3 className="text-sm font-semibold text-slate-800">Properties</h3>
          <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs leading-5 text-slate-400">
            Select a canvas element to view its properties.
          </div>
        </div>
      </div>
    </aside>
  );
}

export default PropertiesPanel;
