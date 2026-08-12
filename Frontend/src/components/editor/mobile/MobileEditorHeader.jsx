import { lazy, Suspense, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TextQuickActions from "../text/TextQuickActions";
import { IMAGE_UPLOAD_ACCEPT } from "../images/imageValidation.js";

const AssetLibraryPanel = lazy(() => import("../assets/AssetLibraryPanel.jsx"));
const ImageLibraryPanel = lazy(() => import("../images/ImageLibraryPanel.jsx"));

function MobileEditorHeader({
  projectTitle,
  onUpload,
  isUploading,
  onSave,
  saveStatus,
  onAddText,
  onInsertAsset,
  onUploadImage,
  onExport,
  isExporting,
  isEditingDisabled,
  history,
}) {
  const fileInputRef = useRef(null);
  const [showTextTools, setShowTextTools] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [showShapes, setShowShapes] = useState(false);
  const [showImages, setShowImages] = useState(false);

  const handleFileChange = (event) => {
    const [file] = event.target.files;
    event.target.value = "";
    if (file) onUpload(file);
  };

  return (
    <header className="relative z-50 shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <div className="flex h-14 items-center justify-between gap-2 px-2">
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
          onClick={() => void history.undo()}
          disabled={!history.canUndo || history.isRestoring || isEditingDisabled}
          className="grid size-9 place-items-center rounded-full text-slate-600 active:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:active:bg-slate-800"
          aria-label={history.undoLabel ? `Undo ${history.undoLabel}` : "Undo"}
          title="Undo"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => void history.redo()}
          disabled={!history.canRedo || history.isRestoring || isEditingDisabled}
          className="grid size-9 place-items-center rounded-full text-slate-600 active:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:active:bg-slate-800"
          aria-label={history.redoLabel ? `Redo ${history.redoLabel}` : "Redo"}
          title="Redo"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="m15 7 5 5-5 5m4-5h-8a6 6 0 0 0-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saveStatus === "saving" || isEditingDisabled}
          className="rounded-lg px-2 py-2 text-xs font-semibold text-blue-600 disabled:opacity-60 dark:text-blue-400"
          aria-label="Save project"
        >
          {saveStatus === "saving" ? "Saving..." : saveStatus === "failed" ? "Failed" : "Save"}
        </button>
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting || isEditingDisabled}
          className="flex h-10 min-w-16 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white active:bg-blue-700 disabled:opacity-60"
          aria-label={isExporting ? "Exporting design" : "Export design"}
          title="Export design"
        >
          {isExporting && (
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          <span>Export</span>
        </button>
      </div>
      </div>
      <div className="grid h-12 grid-cols-5 border-t border-slate-100 px-1 dark:border-slate-800" role="toolbar" aria-label="Add design content">
        <button
          type="button"
          onClick={() => {
            setShowTextTools(false);
            setShowAssets(false);
            setShowShapes(false);
            setShowImages(false);
            fileInputRef.current?.click();
          }}
          disabled={isUploading || isEditingDisabled}
          className="flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-slate-600 active:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:active:bg-slate-800"
          aria-label={isUploading ? "Uploading image" : "Upload image"}
        >
          {isUploading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <path d="M12 16V4m0 0L7 9m5-5 5 5M5 14v5h14v-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          Upload
        </button>
        <button
          type="button"
          onClick={() => {
            setShowAssets(false);
            setShowShapes(false);
            setShowImages(false);
            setShowTextTools((visible) => !visible);
          }}
          disabled={isEditingDisabled}
          className={`flex items-center justify-center gap-2 rounded-xl text-xs font-semibold ${
            showTextTools
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
              : "text-slate-600 active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800"
          }`}
          aria-label="Add text"
          aria-expanded={showTextTools}
        >
          <span className="text-base font-bold" aria-hidden="true">T</span>
          Text
        </button>
        <button
          type="button"
          onClick={() => {
            setShowTextTools(false);
            setShowShapes(false);
            setShowImages(false);
            setShowAssets((visible) => !visible);
          }}
          disabled={isEditingDisabled}
          className={`flex items-center justify-center gap-2 rounded-xl text-xs font-semibold ${
            showAssets
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
              : "text-slate-600 active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800"
          }`}
          aria-label="Browse assets"
          aria-expanded={showAssets}
        >
          <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14l3 6h-6z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Assets
        </button>
        <button
          type="button"
          onClick={() => {
            setShowTextTools(false);
            setShowAssets(false);
            setShowImages(false);
            setShowShapes((visible) => !visible);
          }}
          disabled={isEditingDisabled}
          className={`flex items-center justify-center gap-2 rounded-xl text-xs font-semibold ${
            showShapes
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
              : "text-slate-600 active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800"
          }`}
          aria-label="Add shapes"
          aria-expanded={showShapes}
        >
          <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 4h7v7H4zM14 14h6v6h-6zM17 4l3 6h-6z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Shapes
        </button>
        <button
          type="button"
          onClick={() => {
            setShowTextTools(false);
            setShowAssets(false);
            setShowShapes(false);
            setShowImages((visible) => !visible);
          }}
          disabled={isEditingDisabled}
          className={`flex items-center justify-center gap-1 rounded-xl text-xs font-semibold ${
            showImages
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
              : "text-slate-600 active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800"
          }`}
          aria-label="Browse uploaded images"
          aria-expanded={showImages}
        >
          <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 5h16v14H4zM4 16l4-4 3 3 3-3 6 6M16 9h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Images
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
      {(showAssets || showShapes) && (
        <section className="absolute inset-x-0 top-full h-[min(72dvh,38rem)] overflow-hidden rounded-b-3xl border border-t-0 border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <Suspense
            fallback={
              <div className="grid h-full place-items-center text-sm text-slate-400">
                Loading assets…
              </div>
            }
          >
            <AssetLibraryPanel
              key={showShapes ? "shapes" : "assets"}
              mobile
              sectionId={showShapes ? "shapes" : undefined}
              onInsertAsset={onInsertAsset}
              onClose={() => {
                setShowAssets(false);
                setShowShapes(false);
              }}
            />
          </Suspense>
        </section>
      )}
      {showImages && (
        <section className="absolute inset-x-0 top-full h-[min(72dvh,38rem)] overflow-hidden rounded-b-3xl border border-t-0 border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <Suspense
            fallback={
              <div className="grid h-full place-items-center text-sm text-slate-400">
                Loading images…
              </div>
            }
          >
            <ImageLibraryPanel
              mobile
              onUploadImage={onUploadImage}
              onInsertAsset={onInsertAsset}
              onClose={() => setShowImages(false)}
              isUploading={isUploading}
            />
          </Suspense>
        </section>
      )}
    </header>
  );
}

export default MobileEditorHeader;
