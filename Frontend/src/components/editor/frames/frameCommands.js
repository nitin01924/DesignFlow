import { getUniqueLayerName } from "../layers/layerUtils.js";
import { DesignFlowFrame, isDesignFlowFrame } from "./DesignFlowFrame.js";

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

export const createFrameOnCanvas = (canvas, asset, { position } = {}) => {
  if (!canvas || !asset) return null;

  const maxWidth = Math.max(80, canvas.getWidth() * 0.42);
  const maxHeight = Math.max(80, canvas.getHeight() * 0.42);
  const scale = Math.min(1, maxWidth / asset.width, maxHeight / asset.height);
  const width = asset.width * scale;
  const height = asset.height * scale;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const frame = new DesignFlowFrame({
    left: clamp(
      position?.x ?? canvas.getWidth() / 2,
      halfWidth,
      canvas.getWidth() - halfWidth,
    ),
    top: clamp(
      position?.y ?? canvas.getHeight() / 2,
      halfHeight,
      canvas.getHeight() - halfHeight,
    ),
    originX: "center",
    originY: "center",
    width,
    height,
    frameKind: asset.kind,
    frameAssetId: asset.id,
    assetType: "frame",
    assetId: asset.id,
    assetLibrary: "designflow",
    name: getUniqueLayerName(canvas, asset.label),
    selectable: true,
    evented: true,
    hasControls: true,
    lockScalingFlip: true,
    aspectRatioLocked: asset.kind === "circle",
    lockedAspectRatio: asset.kind === "circle" ? 1 : undefined,
    touchCornerSize: 44,
  });

  if (asset.kind === "circle") {
    frame.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });
  }
  frame.setCoords();
  canvas.add(frame);
  canvas.setActiveObject(frame);
  canvas.requestRenderAll();
  return frame;
};

export const placeCanvasImageInFrame = async (canvas, frame, image) => {
  if (!canvas || !isDesignFlowFrame(frame) || image?.type !== "image") {
    return null;
  }

  const source = image.getSrc?.();
  if (!source) throw new Error("This image does not have a reusable source.");

  await frame.setFrameImage(source);
  canvas.discardActiveObject();
  canvas.remove(image);
  canvas.setActiveObject(frame);
  frame.setCoords();
  canvas.requestRenderAll();
  return frame;
};

export const replaceFrameImage = async (canvas, frame, source) => {
  if (!canvas || !isDesignFlowFrame(frame) || !source) return null;
  await frame.setFrameImage(source);
  canvas.setActiveObject(frame);
  frame.setCoords();
  canvas.requestRenderAll();
  return frame;
};

export const findFrameAtPoint = (canvas, point, excludedObject = null) => {
  if (!canvas || !point) return null;
  return [...canvas.getObjects()]
    .reverse()
    .find(
      (object) =>
        object !== excludedObject &&
        isDesignFlowFrame(object) &&
        object.visible !== false &&
        !object.layerLocked &&
        object.containsPoint(point),
    ) || null;
};

export { isDesignFlowFrame };
