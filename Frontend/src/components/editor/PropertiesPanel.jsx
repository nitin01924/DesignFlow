import { useState } from "react";
import ImagePropertiesPanel from "./properties/ImagePropertiesPanel";
import MobileImagePropertiesPanel from "./properties/MobileImagePropertiesPanel";
import TextPropertiesPanel from "./properties/TextPropertiesPanel";
import IconPropertiesPanel from "./properties/IconPropertiesPanel";
import LayersPanel from "./layers/LayersPanel";
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

const inspectorTabs = [
  { id: "layers", label: "Layers" },
  { id: "properties", label: "Properties" },
];

function InspectorTabs({ activeTab, onChange, labelledBy }) {
  return (
    <div className="grid h-10 grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900" role="tablist" aria-label={labelledBy}>
      {inspectorTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
            activeTab === tab.id
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ObjectProperties({
  editorState,
  selectedObject,
  SelectedObjectPanel,
  onObjectChange,
  history,
}) {
  if (selectedObject?.layerLocked) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-xs leading-5 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
        This layer is locked. Unlock it in Layers to edit its properties.
      </div>
    );
  }

  if (SelectedObjectPanel) {
    return (
      <SelectedObjectPanel
        canvas={editorState.canvas}
        object={selectedObject}
        onObjectChange={onObjectChange}
        history={history}
      />
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs leading-5 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
      {selectedObject
        ? "Properties for this object type are coming soon."
        : "Select a canvas element or layer to view its properties."}
    </div>
  );
}

function PropertiesContent({
  editorState,
  selectedObject,
  SelectedObjectPanel,
  onObjectChange,
  history,
}) {
  return (
    <div className="h-full overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Properties</h2>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {selectedObject?.name || "No layer selected"}
          </p>
        </div>
        {selectedObject?.layerLocked && (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            Locked
          </span>
        )}
      </div>
      <ObjectProperties
        editorState={editorState}
        selectedObject={selectedObject}
        SelectedObjectPanel={SelectedObjectPanel}
        onObjectChange={onObjectChange}
        history={history}
      />
    </div>
  );
}

function PropertiesPanel({
  editorState,
  onObjectChange,
  isEditingDisabled = false,
  history,
}) {
  const [desktopTab, setDesktopTab] = useState("layers");
  const [mobileTab, setMobileTab] = useState("layers");
  const bottomSheet = useBottomSheet("collapsed");
  const selectedObject = editorState?.selectedObject;
  const isIcon = selectedObject?.assetType === "icon";
  const SelectedObjectPanel = isIcon
    ? IconPropertiesPanel
    : selectedObject
      ? propertyPanelByType[selectedObject.type]
      : null;
  const MobileSelectedObjectPanel = isIcon
    ? IconPropertiesPanel
    : selectedObject
      ? mobilePropertyPanelByType[selectedObject.type]
      : null;

  const changeMobileTab = (tab) => {
    setMobileTab(tab);
    if (bottomSheet.snap === "collapsed") bottomSheet.settleAt("half");
  };

  if (isEditingDisabled) {
    return (
      <aside
        className="hidden border-l border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 md:block"
        aria-label="Inspector unavailable while the editor is busy"
      />
    );
  }

  return (
    <>
      <aside
        className="hidden min-h-0 border-l border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-950 md:block"
        aria-label="Layers and properties"
      >
        <div className="flex h-full w-72 min-h-0 flex-col">
          <div className="shrink-0 border-b border-slate-100 p-3 dark:border-slate-800">
            <InspectorTabs
              activeTab={desktopTab}
              onChange={setDesktopTab}
              labelledBy="Desktop inspector sections"
            />
          </div>
          <div className="min-h-0 flex-1" role="tabpanel">
            {desktopTab === "layers" ? (
              <LayersPanel
                canvas={editorState.canvas}
                selectedObject={selectedObject}
                onObjectChange={onObjectChange}
                history={history}
              />
            ) : (
              <PropertiesContent
                editorState={editorState}
                selectedObject={selectedObject}
                SelectedObjectPanel={SelectedObjectPanel}
                onObjectChange={onObjectChange}
                history={history}
              />
            )}
          </div>
        </div>
      </aside>

      {editorState.canvas && (
        <aside
          className={`mobile-properties-sheet fixed inset-x-0 bottom-0 z-40 flex flex-col overflow-hidden rounded-t-3xl border border-b-0 border-slate-200 bg-white shadow-[0_-12px_36px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-950 md:hidden ${
            bottomSheet.isDragging
              ? "transition-none"
              : "transition-[height] duration-400 ease-[cubic-bezier(0.22,1.15,0.36,1)]"
          }`}
          style={{ height: `${bottomSheet.height}px` }}
          aria-label="Mobile layers and properties"
          data-snap={bottomSheet.snap}
          data-dragging={bottomSheet.isDragging}
        >
          <button
            type="button"
            {...bottomSheet.handleProps}
            className="flex h-6 w-full shrink-0 touch-none items-center justify-center cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-blue-600"
            aria-label="Drag inspector panel or tap to change its height"
            aria-expanded={bottomSheet.snap !== "collapsed"}
            aria-controls="mobile-editor-inspector"
          >
            <span className="h-1.5 w-11 rounded-full bg-slate-300 transition-colors dark:bg-slate-600" />
          </button>

          <div className="h-10 shrink-0 px-3 pb-1">
            <InspectorTabs
              activeTab={mobileTab}
              onChange={changeMobileTab}
              labelledBy="Mobile inspector sections"
            />
          </div>

          <div
            id="mobile-editor-inspector"
            role="tabpanel"
            className={`min-h-0 flex-1 border-t border-slate-100 transition-opacity duration-200 dark:border-slate-800 ${
              bottomSheet.snap !== "collapsed" || bottomSheet.isDragging
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            {mobileTab === "layers" ? (
              <LayersPanel
                canvas={editorState.canvas}
                selectedObject={selectedObject}
                onObjectChange={onObjectChange}
                history={history}
              />
            ) : (
              <PropertiesContent
                editorState={editorState}
                selectedObject={selectedObject}
                SelectedObjectPanel={MobileSelectedObjectPanel}
                onObjectChange={onObjectChange}
                history={history}
              />
            )}
          </div>
        </aside>
      )}
    </>
  );
}

export default PropertiesPanel;
