const tools = [
  {
    label: "Upload",
    path: "M12 16V4m0 0L7 9m5-5 5 5M5 14v5h14v-5",
  },
  { label: "Text", path: "M5 6V4h14v2M12 4v16m-4 0h8" },
  { label: "Shapes", path: "M4 4h7v7H4zM14 14h6v6h-6zM17 4l3 6h-6z" },
  {
    label: "Images",
    path: "M4 5h16v14H4zM4 16l4-4 3 3 3-3 6 6M15.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 3z",
  },
  {
    label: "Templates",
    path: "M4 4h16v16H4zM4 10h16M10 10v10",
  },
];

function EditorSidebar() {
  return (
    <aside className="border-r border-slate-200 bg-white" aria-label="Editor tools">
      <div className="flex h-full gap-1 overflow-x-auto p-2 md:w-24 md:flex-col md:gap-2 md:overflow-x-visible md:py-4">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={`${tool.label} tools coming soon`}
            className="group flex min-w-18 flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-medium text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 md:min-w-0"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d={tool.path} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {tool.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

export default EditorSidebar;
