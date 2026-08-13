import { FabricImage } from "fabric";
import { getUniqueLayerName } from "../layers/layerUtils.js";

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const getSourceUrl = (descriptor) =>
  descriptor?.sourceUrl || descriptor?.secureUrl || "";

export const createLibraryImageOnCanvas = async (
  canvas,
  descriptor,
  { position } = {},
) => {
  const sourceUrl = getSourceUrl(descriptor);
  if (!canvas || !sourceUrl) {
    throw new Error("This image is no longer available.");
  }

  let image;
  try {
    image = await FabricImage.fromURL(
      sourceUrl,
      { crossOrigin: "anonymous" },
      {
        selectable: true,
        evented: true,
        hasControls: true,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false,
        lockScalingFlip: true,
        aspectRatioLocked: true,
        touchCornerSize: 44,
        objectCaching: true,
      },
    );
  } catch (error) {
    throw new Error("Unable to load this image. Try uploading it again.", {
      cause: error,
    });
  }

  const sourceWidth = Math.max(1, image.width || descriptor.width || 1);
  const sourceHeight = Math.max(1, image.height || descriptor.height || 1);
  const maximumWidth = Math.max(72, canvas.getWidth() * 0.42);
  const maximumHeight = Math.max(72, canvas.getHeight() * 0.42);
  const scale = Math.min(
    1,
    maximumWidth / sourceWidth,
    maximumHeight / sourceHeight,
  );
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const left = clamp(
    position?.x ?? canvas.getWidth() / 2,
    width / 2,
    Math.max(width / 2, canvas.getWidth() - width / 2),
  );
  const top = clamp(
    position?.y ?? canvas.getHeight() / 2,
    height / 2,
    Math.max(height / 2, canvas.getHeight() - height / 2),
  );

  image.set({
    left,
    top,
    originX: "center",
    originY: "center",
    scaleX: scale,
    scaleY: scale,
    name: getUniqueLayerName(canvas, descriptor.label || "Image"),
    assetType: "image",
    assetId: descriptor.id,
    assetLibrary: "user-uploads",
    originalWidth: sourceWidth,
    originalHeight: sourceHeight,
    lockedAspectRatio: sourceWidth / sourceHeight,
  });
  image.setControlsVisibility({
    mt: false,
    mb: false,
    ml: false,
    mr: false,
    mtr: true,
  });
  image.setCoords();
  canvas.add(image);
  canvas.setActiveObject(image);
  canvas.requestRenderAll();
  return image;
};

export const replaceCanvasImageWithLibraryAsset = async (
  canvas,
  currentImage,
  descriptor,
) => {
  const sourceUrl = getSourceUrl(descriptor);
  if (!canvas || currentImage?.type !== "image" || !sourceUrl) return null;

  let replacement;
  try {
    replacement = await FabricImage.fromURL(sourceUrl, {
      crossOrigin: "anonymous",
    });
  } catch (error) {
    throw new Error("Unable to load this replacement image.", { cause: error });
  }

  const objects = canvas.getObjects();
  const targetIndex = objects.indexOf(currentImage);
  if (targetIndex < 0) return null;

  const sourceWidth = Math.max(1, replacement.width || descriptor.width || 1);
  const sourceHeight = Math.max(1, replacement.height || descriptor.height || 1);
  const displayedWidth = Math.max(1, currentImage.getScaledWidth());
  const displayedHeight = Math.max(1, currentImage.getScaledHeight());
  const scaleDirectionX = (currentImage.scaleX || 1) < 0 ? -1 : 1;
  const scaleDirectionY = (currentImage.scaleY || 1) < 0 ? -1 : 1;

  replacement.set({
    left: currentImage.left,
    top: currentImage.top,
    originX: currentImage.originX || "center",
    originY: currentImage.originY || "center",
    scaleX: (displayedWidth / sourceWidth) * scaleDirectionX,
    scaleY: (displayedHeight / sourceHeight) * scaleDirectionY,
    angle: currentImage.angle || 0,
    opacity: currentImage.opacity ?? 1,
    name: currentImage.name || descriptor.label || "Image",
    selectable: true,
    evented: true,
    hasControls: true,
    lockRotation: false,
    lockScalingX: false,
    lockScalingY: false,
    lockScalingFlip: true,
    aspectRatioLocked: Boolean(currentImage.aspectRatioLocked),
    lockedAspectRatio: sourceWidth / sourceHeight,
    touchCornerSize: 44,
    objectCaching: true,
    assetType: "image",
    assetId: descriptor.id,
    assetLibrary: "user-uploads",
    originalWidth: sourceWidth,
    originalHeight: sourceHeight,
    cropX: 0,
    cropY: 0,
    cropWidth: sourceWidth,
    cropHeight: sourceHeight,
  });
  const locked = Boolean(replacement.aspectRatioLocked);
  replacement.setControlsVisibility({
    mt: !locked,
    mb: !locked,
    ml: !locked,
    mr: !locked,
    mtr: true,
  });
  replacement.setCoords();

  canvas.remove(currentImage);
  canvas.insertAt(targetIndex, replacement);
  canvas.setActiveObject(replacement);
  canvas.requestRenderAll();
  return replacement;
};
