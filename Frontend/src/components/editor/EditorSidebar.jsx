import { useRef, useState } from "react";
import TextQuickActions from "./text/TextQuickActions";

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

function EditorSidebar({ onUpload, isUploading, onAddText, disabled = false }) {
  const fileInputRef = useRef(null);
  const [activeTool, setActiveTool] = useState(null);

  const handleToolClick = (tool) => {
    // Upload starts in the tools sidebar because it is an editor action, just like
    // the text, shape, image, and template tools that will be implemented later.
    if (tool.label === "Upload" && !isUploading) {
      fileInputRef.current?.click();
      setActiveTool(null);
    } else if (tool.label === "Text") {
      setActiveTool((current) => (current === "Text" ? null : "Text"));
    }
  };

  const handleFileChange = (event) => {
    const [file] = event.target.files;
    event.target.value = "";

    if (file) {
      onUpload(file);
    }
  };

  return (
    <aside className="relative z-30 hidden border-r border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-950 md:block" aria-label="Editor tools">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <div className="flex h-full gap-1 overflow-x-auto p-2 md:w-24 md:flex-col md:gap-2 md:overflow-x-visible md:py-4">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={() => handleToolClick(tool)}
            disabled={disabled || (tool.label === "Upload" && isUploading)}
            title={
              tool.label === "Upload"
                ? "Upload an image"
                : tool.label === "Text"
                  ? "Add text"
                  : `${tool.label} tools coming soon`
            }
            aria-pressed={tool.label === "Text" ? activeTool === "Text" : undefined}
            className={`group flex min-w-18 flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-medium transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 md:min-w-0 ${
              activeTool === tool.label
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d={tool.path} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {tool.label === "Upload" && isUploading ? "Uploading..." : tool.label}
          </button>
        ))}
      </div>
      {activeTool === "Text" && (
        <section className="absolute inset-y-0 left-full w-72 overflow-y-auto border-r border-slate-200 bg-slate-50 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Text</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add typography to your design</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTool(null)}
              aria-label="Close text tools"
              className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <TextQuickActions
            onAddText={(presetId) => {
              onAddText(presetId);
              setActiveTool(null);
            }}
          />
        </section>
      )}
    </aside>
  );
}

export default EditorSidebar;
