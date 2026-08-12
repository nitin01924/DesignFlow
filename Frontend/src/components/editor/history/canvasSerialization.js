import { FabricObject } from "fabric";
import "../frames/DesignFlowFrame.js";

// Keep document serialization in one place so persistence and in-memory history
// always restore the same DesignFlow-specific Fabric properties.
const DESIGNFLOW_OBJECT_PROPERTIES = [
  "id",
  "name",
  "metadata",
  "historyId",
  "layerLocked",
  "layerLockState",
  "layerVisibilityState",
  "selectable",
  "evented",
  "hasControls",
  "lockMovementX",
  "lockMovementY",
  "lockScalingX",
  "lockScalingY",
  "lockRotation",
  "editable",
  "aspectRatioLocked",
  "lockedAspectRatio",
  "assetType",
  "assetId",
  "assetLibrary",
  "assetColor",
  "shapeKind",
  "shapePoints",
  "frameKind",
  "frameAssetId",
  "frameImageSrc",
  "frameImageZoom",
  "frameImageOffsetX",
  "frameImageOffsetY",
  "cropWidth",
  "cropHeight",
  "originalWidth",
  "originalHeight",
];

FabricObject.customProperties = Array.from(
  new Set([
    ...(FabricObject.customProperties || []),
    ...DESIGNFLOW_OBJECT_PROPERTIES,
  ]),
);

export const serializeCanvas = (canvas) => canvas.toJSON();
