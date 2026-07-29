import { useRef } from "react";
import { Link } from "react-router-dom";

function MobileEditorHeader({ projectTitle, onUpload, isUploading, onSave, saveStatus }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const [file] = event.target.files;
    event.target.value = "";
    if (file) onUpload(file);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950 md:hidden">
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
    </header>
  );
}

export default MobileEditorHeader;
