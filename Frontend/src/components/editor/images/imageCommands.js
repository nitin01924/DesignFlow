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
