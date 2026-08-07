import { memo, useState } from "react";
import {
  deleteLayers,
  duplicateLayer,
  moveLayerBy,
  moveLayerTo,
  renameLayer,
  selectLayer,
  setLayerLocked,
  setLayerVisibility,
} from "./layerCommands.js";
import { getLayerBaseName, getLayerKind } from "./layerUtils.js";

const isCanvasLayer = (object) =>
  !object.excludeFromExport && !object.cropHelperType;

const layerIconPaths = {
  icon: "M12 3l2.4 5.2L20 9l-4 4 .9 5.8L12 16l-4.9 2.8L8 13 4 9l5.6-.8z",
  image: "M4 5h16v14H4zM4 16l4-4 3 3 3-3 6 6M16 9h.01",
  text: "M5 6V4h14v2M12 4v16m-4 0h8",
  shape: "M5 5h14v14H5z",
  group: "M4 4h7v7H4zM13 13h7v7h-7z",
};

function LayerIcon({ object }) {
  const kind = getLayerKind(object);
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d={layerIconPaths[kind]} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function IconButton({ label, pressed, disabled, destructive = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      className={`grid size-8 shrink-0 place-items-center rounded-lg transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-30 ${
        destructive
          ? "text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function LayerActionBar({
  canvas,
  object,
  layerIndex,
  layerCount,
  disabled,
  history,
  onObjectChange,
  onRename,
}) {
  const locked = Boolean(object.layerLocked);

  const move = (direction) => {
    history.execute(
      {
        type: direction === "forward" ? "bring-forward" : "send-backward",
        label: direction === "forward" ? "Move layer up" : "Move layer down",
      },
      () => {
        moveLayerBy(canvas, object, direction);
        onObjectChange?.(canvas.getActiveObject() || null);
      },
    );
  };

  const duplicate = async () => {
    const clone = await history.execute(
      { type: "duplicate-layer", label: "Duplicate layer" },
      () => duplicateLayer(canvas, object),
    );
    if (clone) onObjectChange?.(canvas.getActiveObject() || null);
  };

  const remove = () => {
    history.execute(
      { type: "delete-layer", label: "Delete layer" },
      () => {
        deleteLayers(canvas, [object]);
        onObjectChange?.(canvas.getActiveObject() || null);
      },
    );
  };

  const actionClass = "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white";

  return (
    <div className="mx-2 mb-2 flex items-center gap-0.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900" role="toolbar" aria-label={`${object.name} layer actions`}>
      <button type="button" onClick={() => move("forward")} disabled={disabled || locked || layerIndex === 0} className={actionClass} aria-label="Move layer up">
        <span aria-hidden="true">↑</span><span>Up</span>
      </button>
      <button type="button" onClick={() => move("backward")} disabled={disabled || locked || layerIndex === layerCount - 1} className={actionClass} aria-label="Move layer down">
        <span aria-hidden="true">↓</span><span>Down</span>
      </button>
      <button type="button" onClick={onRename} disabled={disabled || locked} className={actionClass} aria-label="Rename layer">
        <span aria-hidden="true">✎</span><span>Rename</span>
      </button>
      <button type="button" onClick={() => void duplicate()} disabled={disabled || locked} className={actionClass} aria-label="Duplicate layer">
        <span aria-hidden="true">⧉</span><span>Copy</span>
      </button>
      <button type="button" onClick={remove} disabled={disabled || locked} className={`${actionClass} text-red-500 dark:text-red-400`} aria-label="Delete layer">
        <span aria-hidden="true">×</span><span>Delete</span>
      </button>
    </div>
  );
}

function LayersPanel({
  canvas,
  selectedObject,
  onObjectChange,
  history,
  disabled = false,
}) {
  const [query, setQuery] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [nameDraft, setNameDraft] = useState("");
  const [draggedId, setDraggedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [menuLayerId, setMenuLayerId] = useState(null);

  const layers = (canvas?.getObjects() || []).filter(isCanvasLayer).reverse();
  const activeLayerIds = new Set(
    (canvas?.getActiveObjects() || [])
      .map((object) => object.historyId)
      .filter(Boolean),
  );
  const layerIndexById = new Map(
    layers.map((object, index) => [object.historyId, index]),
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredLayers = normalizedQuery
    ? layers.filter((object) =>
        String(object.name || getLayerBaseName(object))
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : layers;

  const chooseLayer = (object) => {
    if (disabled || object.visible === false) return;
    if (selectLayer(canvas, object)) onObjectChange?.(object);
  };

  const toggleVisibility = (object) => {
    const visible = object.visible === false;
    history.execute(
      {
        type: visible ? "show-layer" : "hide-layer",
        label: visible ? "Show layer" : "Hide layer",
      },
      () => {
        setLayerVisibility(canvas, object, visible);
        onObjectChange?.(canvas.getActiveObject() || null);
      },
    );
  };

  const toggleLock = (object) => {
    const locked = !object.layerLocked;
    history.execute(
      {
        type: locked ? "lock-layer" : "unlock-layer",
        label: locked ? "Lock layer" : "Unlock layer",
      },
      () => {
        setLayerLocked(canvas, object, locked);
        onObjectChange?.(canvas.getActiveObject() || null);
      },
    );
  };

  const startRenaming = (object) => {
    if (disabled || object.layerLocked) return;
    setRenamingId(object.historyId);
    setNameDraft(object.name || getLayerBaseName(object));
    setMenuLayerId(object.historyId);
  };

  const finishRenaming = (object) => {
    const nextName = nameDraft.trim();
    setRenamingId(null);
    if (!nextName || nextName === object.name) return;

    history.execute(
      { type: "rename-layer", label: "Rename layer" },
      () => {
        renameLayer(canvas, object, nextName);
        if (activeLayerIds.has(object.historyId)) onObjectChange?.(object);
      },
    );
  };

  const reorder = (targetObject) => {
    const sourceObject = layers.find((object) => object.historyId === draggedId);
    setDraggedId(null);
    setDropTargetId(null);
    if (!sourceObject || sourceObject === targetObject || sourceObject.layerLocked) return;

    const targetIndex = canvas.getObjects().indexOf(targetObject);
    history.execute(
      { type: "reorder-layers", label: "Reorder layers" },
      () => {
        moveLayerTo(canvas, sourceObject, targetIndex);
        if (sourceObject.visible !== false) {
          selectLayer(canvas, sourceObject);
          onObjectChange?.(sourceObject);
        }
      },
    );
  };

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Layers panel">
      <div className="shrink-0 px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Layers</h2>
            <p className="mt-0.5 text-xs text-slate-400">Top layers appear first</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            {layers.length}
          </span>
        </div>
        <label className="relative block">
          <span className="sr-only">Search layers</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search layers"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-950"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!layers.length && (
          <div className="mx-2 mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No layers yet</p>
            <p className="mt-1 text-xs text-slate-400">Add an image, text, or shape to begin.</p>
          </div>
        )}

        {layers.length > 0 && !filteredLayers.length && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">No layers match “{query}”.</p>
        )}

        <ol className="space-y-1" aria-label="Canvas layers">
          {filteredLayers.map((object) => {
            const isActive =
              activeLayerIds.has(object.historyId) || selectedObject === object;
            const isHidden = object.visible === false;
            const isLocked = Boolean(object.layerLocked);
            const isRenaming = renamingId === object.historyId;
            const isMenuOpen = menuLayerId === object.historyId;
            const layerIndex = layerIndexById.get(object.historyId) ?? 0;
            const layerName = object.name || getLayerBaseName(object);

            return (
              <li
                key={object.historyId || `${object.type}-${layerIndex}`}
                className={`group rounded-xl border transition ${
                  dropTargetId === object.historyId
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/35"
                    : isActive
                      ? "border-blue-300 bg-blue-50/80 dark:border-blue-700 dark:bg-blue-950/35"
                      : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                } ${isHidden ? "opacity-60" : ""}`}
                onDragOver={(event) => {
                  if (!draggedId || draggedId === object.historyId) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDropTargetId(object.historyId);
                }}
                onDragLeave={() => {
                  if (dropTargetId === object.historyId) setDropTargetId(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  reorder(object);
                }}
              >
                <div className="flex min-h-12 items-center gap-1 px-1.5 py-1">
                  <span
                    draggable={!disabled && !isLocked}
                    onDragStart={(event) => {
                      setDraggedId(object.historyId);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", object.historyId);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDropTargetId(null);
                    }}
                    className={`grid size-6 shrink-0 place-items-center text-slate-300 dark:text-slate-600 ${
                      disabled || isLocked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
                    }`}
                    title={isLocked ? "Unlock this layer to reorder it" : "Drag to reorder layer"}
                    aria-hidden="true"
                  >
                    <span className="text-sm leading-none">⠿</span>
                  </span>

                  <LayerIcon object={object} />

                  <div className="min-w-0 flex-1">
                    {isRenaming ? (
                      <input
                        autoFocus
                        value={nameDraft}
                        onChange={(event) => setNameDraft(event.target.value)}
                        onBlur={() => finishRenaming(object)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                          if (event.key === "Escape") {
                            setRenamingId(null);
                            setNameDraft(object.name || layerName);
                          }
                        }}
                        onClick={(event) => event.stopPropagation()}
                        className="h-8 w-full rounded-lg border border-blue-500 bg-white px-2 text-sm font-medium text-slate-900 outline-none ring-2 ring-blue-500/20 dark:bg-slate-950 dark:text-slate-100"
                        aria-label={`Rename ${layerName}`}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => chooseLayer(object)}
                        onDoubleClick={() => startRenaming(object)}
                        disabled={disabled || isHidden}
                        className="block w-full truncate rounded-md px-1 py-1.5 text-left text-sm font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed dark:text-slate-200"
                        title={isHidden ? `${layerName} is hidden` : `${layerName} — double-click to rename`}
                      >
                        {layerName}
                      </button>
                    )}
                  </div>

                  <IconButton
                    label={isHidden ? `Show ${layerName}` : `Hide ${layerName}`}
                    pressed={isHidden}
                    disabled={disabled}
                    onClick={() => toggleVisibility(object)}
                  >
                    {isHidden ? (
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 4 16 16M10.6 10.7a2 2 0 0 0 2.7 2.7M9.8 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a15.5 15.5 0 0 1-2.1 3M6.2 6.3C4.2 7.8 3 12 3 12s3.5 7 9 7c1.2 0 2.3-.3 3.3-.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" /><circle cx="12" cy="12" r="2.5" /></svg>
                    )}
                  </IconButton>

                  <IconButton
                    label={isLocked ? `Unlock ${layerName}` : `Lock ${layerName}`}
                    pressed={isLocked}
                    disabled={disabled}
                    onClick={() => toggleLock(object)}
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      {isLocked ? <path d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5zM12 14v2" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M8 10V7a4 4 0 0 1 7.5-2M5 10h14v10H5zM12 14v2" strokeLinecap="round" strokeLinejoin="round" />}
                    </svg>
                  </IconButton>

                  <IconButton
                    label={`${isMenuOpen ? "Close" : "Open"} actions for ${layerName}`}
                    pressed={isMenuOpen}
                    disabled={disabled}
                    onClick={() => setMenuLayerId((current) => current === object.historyId ? null : object.historyId)}
                  >
                    <span className="text-base leading-none" aria-hidden="true">•••</span>
                  </IconButton>
                </div>

                {isMenuOpen && (
                  <LayerActionBar
                    canvas={canvas}
                    object={object}
                    layerIndex={layerIndex}
                    layerCount={layers.length}
                    disabled={disabled}
                    history={history}
                    onObjectChange={onObjectChange}
                    onRename={() => startRenaming(object)}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default memo(LayersPanel);
