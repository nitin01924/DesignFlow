import ImagePropertiesPanel from "./properties/ImagePropertiesPanel";
import MobileImagePropertiesPanel from "./properties/MobileImagePropertiesPanel";
import TextPropertiesPanel from "./properties/TextPropertiesPanel";
import { useBottomSheet } from "./mobile/useBottomSheet";

const propertyPanelByType = {
  image: ImagePropertiesPanel,
  "i-text": TextPropertiesPanel,
  text: TextPropertiesPanel,
  textbox: TextPropertiesPanel,
};

const mobilePropertyPanelByType = {
  image: MobileImagePropertiesPanel,
  "i-text": TextPropertiesPanel,
  text: TextPropertiesPanel,
  textbox: TextPropertiesPanel,
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

function PropertiesPanel({
  project,
  editorState,
  onObjectChange,
  isEditingDisabled = false,
}) {
  const bottomSheet = useBottomSheet("half");
  const selectedObject = editorState?.selectedObject;
  const SelectedObjectPanel = selectedObject
    ? propertyPanelByType[selectedObject.type]
    : null;
  const MobileSelectedObjectPanel = selectedObject
    ? mobilePropertyPanelByType[selectedObject.type]
    : null;
  const selectedObjectLabel =
    selectedObject?.type === "i-text" ||
    selectedObject?.type === "text" ||
    selectedObject?.type === "textbox"
      ? "Text properties"
      : "Image properties";

  if (isEditingDisabled) {
    return (
      <aside
        className="hidden border-l border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 md:block"
        aria-label="Properties unavailable while cropping"
      />
    );
  }

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
          className={`mobile-properties-sheet fixed inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden rounded-t-3xl border border-b-0 border-slate-200 bg-white shadow-[0_-12px_36px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-950 md:hidden ${
            bottomSheet.isDragging
              ? "transition-none"
              : "transition-[height] duration-400 ease-[cubic-bezier(0.22,1.15,0.36,1)]"
          }`}
          style={{ height: `${bottomSheet.height}px` }}
          aria-label="Selected object properties"
          data-snap={bottomSheet.snap}
          data-dragging={bottomSheet.isDragging}
        >
          <button
            type="button"
            {...bottomSheet.handleProps}
            className="flex h-7 w-full shrink-0 touch-none items-center justify-center cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-blue-600"
            aria-label="Drag properties panel or tap to change its height"
            aria-expanded={bottomSheet.snap !== "collapsed"}
            aria-controls="mobile-object-properties"
          >
            <span className="h-1.5 w-11 rounded-full bg-slate-300 transition-colors dark:bg-slate-600" />
          </button>

          <div className="flex min-h-9 shrink-0 items-start justify-between gap-3 px-5 pb-3">
            <span className="flex min-w-0 items-center gap-3">
              <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {selectedObjectLabel}
              </span>
            </span>
            <span className="shrink-0 text-xs font-medium capitalize text-blue-600 dark:text-blue-400">
              {bottomSheet.snap}
            </span>
          </div>

          <div
            id="mobile-object-properties"
            className={`min-h-0 flex-1 overscroll-contain overflow-y-auto border-t border-slate-100 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 transition-opacity duration-200 dark:border-slate-800 ${
              bottomSheet.snap !== "collapsed" || bottomSheet.isDragging
                ? "opacity-100"
                : "pointer-events-none opacity-0"
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
