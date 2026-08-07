import {
  applyLayerInteractionState,
  configureLayerControls,
  getUniqueLayerName,
  isTextLayer,
} from "./layerUtils.js";

const getActiveObjects = (canvas) => canvas?.getActiveObjects?.() || [];

export const selectLayer = (canvas, object) => {
  if (!canvas || !object || object.visible === false) return false;

  canvas.setActiveObject(object);
  canvas.requestRenderAll();
  return true;
};

export const setLayerVisibility = (canvas, object, visible) => {
  if (!canvas || !object) return false;

  if (!visible) {
    if (object.visible !== false && !object.layerVisibilityState) {
      object.set("layerVisibilityState", {
        selectable: object.selectable !== false,
        evented: object.evented !== false,
      });
    }
    object.set({ visible: false, selectable: false, evented: false });

    if (getActiveObjects(canvas).includes(object)) {
      canvas.discardActiveObject();
    }
  } else {
    const visibilityState = object.layerVisibilityState;
    object.set({
      visible: true,
      selectable: visibilityState?.selectable ?? true,
      evented: visibilityState?.evented ?? true,
      layerVisibilityState: undefined,
    });
    applyLayerInteractionState(object);
  }

  object.setCoords();
  canvas.requestRenderAll();
  return true;
};

export const setLayerLocked = (canvas, object, locked) => {
  if (!canvas || !object) return false;

  if (locked) {
    if (!object.layerLocked) {
      object.set("layerLockState", {
        lockMovementX: Boolean(object.lockMovementX),
        lockMovementY: Boolean(object.lockMovementY),
        lockScalingX: Boolean(object.lockScalingX),
        lockScalingY: Boolean(object.lockScalingY),
        lockRotation: Boolean(object.lockRotation),
        hasControls: object.hasControls !== false,
        selectable: object.selectable !== false,
        evented: object.evented !== false,
        editable: object.editable,
      });
    }
    object.set({ layerLocked: true });
    applyLayerInteractionState(object);
  } else {
    const previous = object.layerLockState || {};
    object.set({
      layerLocked: false,
      layerLockState: undefined,
      lockMovementX: previous.lockMovementX ?? false,
      lockMovementY: previous.lockMovementY ?? false,
      lockScalingX: previous.lockScalingX ?? false,
      lockScalingY: previous.lockScalingY ?? false,
      lockRotation: previous.lockRotation ?? false,
      hasControls: previous.hasControls ?? true,
      selectable:
        object.visible === false ? false : (previous.selectable ?? true),
      evented: object.visible === false ? false : (previous.evented ?? true),
      ...(isTextLayer(object)
        ? { editable: previous.editable ?? true }
        : {}),
    });

    configureLayerControls(object);
  }

  object.setCoords();
  canvas.requestRenderAll();
  return true;
};

export const renameLayer = (canvas, object, name) => {
  if (!canvas || !object) return false;
  const nextName = String(name || "").trim();
  if (!nextName || nextName === object.name) return false;

  object.set("name", nextName);
  canvas.requestRenderAll();
  return true;
};

export const duplicateLayer = async (canvas, object, offset = 20) => {
  if (!canvas || !object) return null;

  const clone = await object.clone();
  clone.set({
    left: (object.left || 0) + offset,
    top: (object.top || 0) + offset,
    historyId: undefined,
    name: getUniqueLayerName(canvas, `${object.name || "Layer"} copy`),
  });
  configureLayerControls(clone);
  applyLayerInteractionState(clone);
  clone.setCoords();
  canvas.add(clone);

  if (clone.visible !== false) canvas.setActiveObject(clone);
  canvas.requestRenderAll();
  return clone;
};

export const deleteLayers = (canvas, objects) => {
  const removableObjects = (objects || []).filter(Boolean);
  if (!canvas || !removableObjects.length) return false;

  if (getActiveObjects(canvas).some((object) => removableObjects.includes(object))) {
    canvas.discardActiveObject();
  }
  canvas.remove(...removableObjects);
  canvas.requestRenderAll();
  return true;
};

export const moveLayerTo = (canvas, object, targetIndex) => {
  if (!canvas || !object || targetIndex < 0) return false;
  const changed = canvas.moveObjectTo(object, targetIndex);
  if (changed) canvas.requestRenderAll();
  return changed;
};

export const moveLayerBy = (canvas, object, direction) => {
  if (!canvas || !object) return false;
  const changed =
    direction === "forward"
      ? canvas.bringObjectForward(object)
      : canvas.sendObjectBackwards(object);
  if (changed) canvas.requestRenderAll();
  return changed;
};
