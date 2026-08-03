import { ActiveSelection } from "fabric";
import { serializeCanvas } from "./canvasSerialization.js";

const DEFAULT_MAX_STATES = 100;
let fallbackId = 0;

const isTextObject = (object) =>
  object?.type === "i-text" ||
  object?.type === "text" ||
  object?.type === "textbox";

const objectName = (object) => {
  if (object?.type === "image") return "image";
  if (isTextObject(object)) return "text";
  if (object?.type) return object.type.replaceAll("-", " ");
  return "object";
};

const createHistoryId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  fallbackId += 1;
  return `designflow-${Date.now()}-${fallbackId}`;
};

const normalizeAction = (action, fallbackLabel = "Edit canvas") => {
  if (typeof action === "string") {
    return {
      type: action.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, ""),
      label: action,
    };
  }

  return {
    type: action?.type || "canvas-change",
    label: action?.label || fallbackLabel,
    ...action,
  };
};

const createEntryMetadata = (action) => ({
  id: createHistoryId(),
  timestamp: Date.now(),
  ...normalizeAction(action),
});

const getTransformAction = (event) => {
  const action = event?.transform?.action;
  const name = objectName(event?.target);

  if (action === "drag") {
    return { type: "move-object", label: `Move ${name}` };
  }
  if (action === "rotate") {
    return { type: "rotate-object", label: `Rotate ${name}` };
  }
  if (action?.startsWith("scale") || action === "resizing") {
    return { type: "resize-object", label: `Resize ${name}` };
  }

  return { type: "modify-object", label: `Edit ${name}` };
};

const isHistoryObject = (object) =>
  Boolean(object && !object.excludeFromExport && !object.cropHelperType);

export class CanvasHistoryManager {
  constructor({ maxStates = DEFAULT_MAX_STATES } = {}) {
    this.maxStates = Math.max(2, maxStates);
    this.canvas = null;
    this.current = null;
    this.past = [];
    this.future = [];
    this.listeners = new Set();
    this.onRestored = null;
    this.isRestoring = false;
    this.isActive = false;
    this.transaction = null;
    this.pendingImplicitAction = null;
    this.implicitCommitScheduled = false;

    this.handleObjectAdded = (event) => {
      if (!isHistoryObject(event.target)) return;
      this.scheduleImplicitCommit({
        type: `add-${objectName(event.target)}`,
        label: `Add ${objectName(event.target)}`,
      });
    };
    this.handleObjectRemoved = (event) => {
      if (!isHistoryObject(event.target)) return;
      this.scheduleImplicitCommit({
        type: `delete-${objectName(event.target)}`,
        label: `Delete ${objectName(event.target)}`,
      });
    };
    this.handleObjectModified = (event) => {
      if (!isHistoryObject(event.target) || event.target.cropModeActive) return;
      this.record(getTransformAction(event));
    };
    this.handleTextEditingExited = (event) => {
      if (!isHistoryObject(event.target)) return;
      this.record({ type: "edit-text", label: "Edit text" });
    };
    this.handleCropApplied = () => {
      this.record({ type: "crop-image", label: "Crop image" });
    };
  }

  attach(canvas, { onRestored } = {}) {
    if (this.canvas === canvas) {
      this.onRestored = onRestored || null;
      return;
    }

    this.detach();
    this.canvas = canvas;
    this.onRestored = onRestored || null;
    canvas.on("object:added", this.handleObjectAdded);
    canvas.on("object:removed", this.handleObjectRemoved);
    canvas.on("object:modified", this.handleObjectModified);
    canvas.on("text:editing:exited", this.handleTextEditingExited);
    canvas.on("designflow:crop", this.handleCropApplied);
    this.notify();
  }

  detach(canvas = this.canvas) {
    if (!this.canvas || (canvas && canvas !== this.canvas)) return;

    this.canvas.off("object:added", this.handleObjectAdded);
    this.canvas.off("object:removed", this.handleObjectRemoved);
    this.canvas.off("object:modified", this.handleObjectModified);
    this.canvas.off("text:editing:exited", this.handleTextEditingExited);
    this.canvas.off("designflow:crop", this.handleCropApplied);
    this.canvas = null;
    this.onRestored = null;
    this.clear();
  }

  reset(action = { type: "initial-state", label: "Initial state" }) {
    if (!this.canvas) return;

    this.past = [];
    this.future = [];
    this.transaction = null;
    this.pendingImplicitAction = null;
    this.current = this.capture(action);
    this.isActive = true;
    this.notify();
  }

  clear() {
    this.current = null;
    this.past = [];
    this.future = [];
    this.transaction = null;
    this.pendingImplicitAction = null;
    this.isActive = false;
    this.isRestoring = false;
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  getState() {
    const undoEntry = this.past.at(-1);
    const redoEntry = this.future.at(-1);

    return {
      isReady: this.isActive,
      canUndo: this.isActive && !this.isRestoring && Boolean(undoEntry),
      canRedo: this.isActive && !this.isRestoring && Boolean(redoEntry),
      isRestoring: this.isRestoring,
      undoLabel: this.current?.metadata?.label || null,
      redoLabel: redoEntry?.metadata?.label || null,
      length: this.past.length + (this.current ? 1 : 0) + this.future.length,
    };
  }

  // Metadata-only timeline data is intentionally public so a future version
  // history panel can reuse this manager without exposing heavyweight snapshots.
  getTimeline() {
    const entries = [
      ...this.past,
      ...(this.current ? [this.current] : []),
      ...[...this.future].reverse(),
    ];

    return entries.map((entry) => ({
      ...entry.metadata,
      isCurrent: entry === this.current,
    }));
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  ensureObjectIds() {
    this.canvas?.getObjects().forEach((object) => {
      if (!object.historyId) object.set("historyId", createHistoryId());
    });
  }

  capture(action) {
    this.ensureObjectIds();
    const activeObjects = this.canvas.getActiveObjects();

    return {
      document: JSON.stringify(serializeCanvas(this.canvas)),
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight(),
      selectedObjectIds: activeObjects
        .map((object) => object.historyId)
        .filter(Boolean),
      metadata: createEntryMetadata(action),
    };
  }

  syncCurrentSelection() {
    if (!this.current || !this.canvas) return;

    this.ensureObjectIds();
    this.current.selectedObjectIds = this.canvas
      .getActiveObjects()
      .map((object) => object.historyId)
      .filter(Boolean);
  }

  record(action) {
    if (
      !this.canvas ||
      !this.isActive ||
      this.isRestoring ||
      this.transaction
    ) {
      return false;
    }

    this.syncCurrentSelection();
    const next = this.capture(action);
    if (next.document === this.current?.document) return false;

    if (this.current) this.past.push(this.current);
    this.current = next;
    this.future = [];

    // The current state counts toward the cap. Releasing old serialized strings
    // lets the browser reclaim memory even in image-heavy documents.
    while (this.past.length > this.maxStates - 1) this.past.shift();

    this.notify();
    return true;
  }

  scheduleImplicitCommit(action) {
    if (
      !this.canvas ||
      !this.isActive ||
      this.isRestoring ||
      this.transaction
    ) {
      return;
    }

    this.pendingImplicitAction = action;
    if (this.implicitCommitScheduled) return;

    this.implicitCommitScheduled = true;
    queueMicrotask(() => {
      this.implicitCommitScheduled = false;
      const pendingAction = this.pendingImplicitAction;
      this.pendingImplicitAction = null;
      if (pendingAction) this.record(pendingAction);
    });
  }

  begin(action) {
    if (!this.canvas || !this.isActive || this.isRestoring) return false;
    if (this.transaction) return true;

    this.syncCurrentSelection();
    this.transaction = { action: normalizeAction(action) };
    return true;
  }

  commit(action) {
    const transactionAction = this.transaction?.action;
    this.transaction = null;
    return this.record(action || transactionAction);
  }

  cancel() {
    this.transaction = null;
  }

  execute(action, mutation) {
    if (!this.begin(action)) return undefined;

    try {
      const result = mutation();
      if (result && typeof result.then === "function") {
        return result.then(
          (value) => {
            this.commit(action);
            return value;
          },
          (error) => {
            this.cancel();
            throw error;
          },
        );
      }

      this.commit(action);
      return result;
    } catch (error) {
      this.cancel();
      throw error;
    }
  }

  update(action, mutation) {
    if (!this.begin(action)) return undefined;
    return mutation();
  }

  finishActiveTextEditing() {
    const activeObject = this.canvas?.getActiveObject();
    if (activeObject?.isEditing && activeObject.exitEditing) {
      activeObject.exitEditing();
      activeObject.setCoords();
      this.canvas.requestRenderAll();
    }
  }

  async undo() {
    this.finishActiveTextEditing();
    if (!this.canvas || this.isRestoring || !this.past.length) return false;

    const target = this.past.at(-1);
    const previous = this.current;
    const restored = await this.restore(target);
    if (!restored) return false;

    this.past.pop();
    if (previous) this.future.push(previous);
    this.current = target;
    this.notify();
    return true;
  }

  async redo() {
    this.finishActiveTextEditing();
    if (!this.canvas || this.isRestoring || !this.future.length) return false;

    const target = this.future.at(-1);
    const previous = this.current;
    const restored = await this.restore(target);
    if (!restored) return false;

    this.future.pop();
    if (previous) this.past.push(previous);
    this.current = target;
    this.notify();
    return true;
  }

  async restore(entry) {
    if (!this.canvas || !entry) return false;

    const canvasInteraction = {
      selection: this.canvas.selection,
      skipTargetFind: this.canvas.skipTargetFind,
    };
    this.isRestoring = true;
    this.transaction = null;
    this.pendingImplicitAction = null;
    this.canvas.set?.({ selection: false, skipTargetFind: true });
    this.notify();

    try {
      const canvasWidth = this.canvas.getWidth();
      const canvasHeight = this.canvas.getHeight();
      await this.canvas.loadFromJSON(JSON.parse(entry.document));

      const scaleX = canvasWidth / Math.max(1, entry.width || canvasWidth);
      const scaleY = canvasHeight / Math.max(1, entry.height || canvasHeight);

      this.canvas.getObjects().forEach((object) => {
        object.set({
          left: (object.left || 0) * scaleX,
          top: (object.top || 0) * scaleY,
          scaleX: (object.scaleX || 1) * scaleX,
          scaleY: (object.scaleY || 1) * scaleY,
        });

        if (object.type === "image") {
          const locked = Boolean(object.aspectRatioLocked);
          object.setControlsVisibility({
            mt: !locked,
            mb: !locked,
            ml: !locked,
            mr: !locked,
          });
        }
        object.setCoords();
      });

      const selectedObjects = entry.selectedObjectIds
        .map((id) => this.canvas.getObjects().find((object) => object.historyId === id))
        .filter(Boolean);

      this.canvas.discardActiveObject();
      if (selectedObjects.length === 1) {
        this.canvas.setActiveObject(selectedObjects[0]);
      } else if (selectedObjects.length > 1) {
        this.canvas.setActiveObject(
          new ActiveSelection(selectedObjects, { canvas: this.canvas }),
        );
      }

      this.canvas.requestRenderAll();
      this.onRestored?.(this.canvas.getActiveObject() || null);
      return true;
    } catch (error) {
      console.error("Unable to restore canvas history", error);
      return false;
    } finally {
      this.canvas?.set?.(canvasInteraction);
      this.isRestoring = false;
      this.notify();
    }
  }
}
