import { useState } from "react";
import ImagePropertiesPanel from "./properties/ImagePropertiesPanel";
import MobileImagePropertiesPanel from "./properties/MobileImagePropertiesPanel";

const propertyPanelByType = {
  image: ImagePropertiesPanel,
};

const mobilePropertyPanelByType = {
  image: MobileImagePropertiesPanel,
};

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

function ObjectProperties({
  editorState,
  selectedObject,
  SelectedObjectPanel,
  onObjectChange,
}) {
  if (SelectedObjectPanel) {
    return (
      <SelectedObjectPanel
        canvas={editorState.canvas}
        object={selectedObject}
        onObjectChange={onObjectChange}
      />
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs leading-5 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
      {selectedObject
        ? "Properties for this object type are coming soon."
        : "Select a canvas element to view its properties."}
    </div>
  );
}

function PropertiesPanel({ project, editorState, onObjectChange }) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(true);
  const selectedObject = editorState?.selectedObject;
  const SelectedObjectPanel = selectedObject
    ? propertyPanelByType[selectedObject.type]
    : null;
  const MobileSelectedObjectPanel = selectedObject
    ? mobilePropertyPanelByType[selectedObject.type]
    : null;

  return (
    <>
      <aside
        className="hidden border-l border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-950 md:block"
        aria-label="Project properties"
      >
        <div className="h-full w-full overflow-y-auto p-5 md:w-72">
          <div className="border-b border-slate-100 pb-5 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Project information</p>
            <h2 className="mt-2 wrap-break-word text-base font-semibold text-slate-900 dark:text-slate-100">{project.title}</h2>
          </div>

          <dl className="space-y-4 border-b border-slate-100 py-5 text-sm dark:border-slate-800">
            <div>
              <dt className="font-medium text-slate-500 dark:text-slate-400">Created</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{formatDate(project.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500 dark:text-slate-400">Last updated</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{formatDate(project.updatedAt)}</dd>
            </div>
          </dl>

          <div className="py-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Properties</h3>
            <div className="mt-4">
              <ObjectProperties
                editorState={editorState}
                selectedObject={selectedObject}
                SelectedObjectPanel={SelectedObjectPanel}
                onObjectChange={onObjectChange}
              />
            </div>
          </div>
        </div>
      </aside>

      {selectedObject && (
        <aside
          className={`mobile-properties-sheet fixed inset-x-0 bottom-0 z-40 flex overflow-hidden rounded-t-2xl border border-b-0 border-slate-200 bg-white shadow-[0_-12px_36px_rgba(15,23,42,0.18)] transition-[height] duration-300 ease-out dark:border-slate-700 dark:bg-slate-950 md:hidden ${
            isMobileExpanded ? "h-[36dvh] flex-col" : "h-14"
          }`}
          aria-label="Selected object properties"
          data-expanded={isMobileExpanded}
        >
          <button
            type="button"
            onClick={() => setIsMobileExpanded((expanded) => !expanded)}
            className="flex min-h-14 w-full shrink-0 items-center justify-between gap-3 px-5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-blue-600"
            aria-expanded={isMobileExpanded}
            aria-controls="mobile-object-properties"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="h-1 w-10 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                Image properties
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
              {isMobileExpanded ? "Close" : "Edit"}
              <svg
                viewBox="0 0 24 24"
                className={`size-4 transition-transform duration-300 ${
                  isMobileExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>

          <div
            id="mobile-object-properties"
            className={`min-h-0 flex-1 overflow-y-auto border-t border-slate-100 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 transition-opacity duration-200 dark:border-slate-800 ${
              isMobileExpanded ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <ObjectProperties
              editorState={editorState}
              selectedObject={selectedObject}
              SelectedObjectPanel={MobileSelectedObjectPanel}
              onObjectChange={onObjectChange}
            />
          </div>
        </aside>
      )}
    </>
  );
}

export default PropertiesPanel;
