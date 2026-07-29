import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import TextQuickActions from "../text/TextQuickActions";

function MobileEditorHeader({ projectTitle, onUpload, isUploading, onSave, saveStatus, onAddText }) {
  const fileInputRef = useRef(null);
  const [showTextTools, setShowTextTools] = useState(false);

  const handleFileChange = (event) => {
    const [file] = event.target.files;
    event.target.value = "";
    if (file) onUpload(file);
  };

  return (
    <header className="relative z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-2 dark:border-slate-800 dark:bg-slate-950 md:hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <Link
        to="/dashboard"
        className="grid size-11 shrink-0 place-items-center rounded-full text-slate-600 active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800"
        aria-label="Back to dashboard"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
        {projectTitle}
      </h1>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setShowTextTools((visible) => !visible)}
          className={`grid size-10 place-items-center rounded-full text-lg font-semibold ${
            showTextTools
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
              : "text-slate-600 dark:text-slate-300"
          }`}
          aria-label="Add text"
          aria-expanded={showTextTools}
        >
          T
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saveStatus === "saving"}
          className="rounded-lg px-2 py-2 text-xs font-semibold text-blue-600 disabled:opacity-60 dark:text-blue-400"
          aria-label="Save project"
        >
          {saveStatus === "saving" ? "Saving..." : saveStatus === "failed" ? "Failed" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="grid size-11 place-items-center rounded-full bg-blue-600 text-white active:bg-blue-700 disabled:opacity-50"
          aria-label={isUploading ? "Uploading image" : "Add image"}
        >
          {isUploading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
      {showTextTools && (
        <section className="absolute inset-x-3 top-[calc(100%+0.5rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add text</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose a text style</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTextTools(false)}
              className="grid size-9 place-items-center rounded-full text-slate-500 active:bg-slate-100 dark:active:bg-slate-800"
              aria-label="Close text tools"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <TextQuickActions
            compact
            onAddText={(presetId) => {
              onAddText(presetId);
              setShowTextTools(false);
            }}
          />
        </section>
      )}
    </header>
  );
}

export default MobileEditorHeader;
