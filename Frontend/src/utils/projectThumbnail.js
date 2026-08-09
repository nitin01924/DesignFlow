const MAX_THUMBNAIL_EDGE = 960;
const MAX_RENDER_MULTIPLIER = 3;
const THUMBNAIL_QUALITY = 0.86;

const hasVisibleDesignObjects = (canvas) =>
  canvas
    .getObjects()
    .some(
      (object) =>
        object.visible !== false &&
        !object.excludeFromExport &&
        !object.cropHelperType,
    );

const canvasToBlob = (element, type, quality) =>
  new Promise((resolve) => element.toBlob(resolve, type, quality));

const suppressTransientObjectVisuals = (canvas) => {
  const states = canvas
    .getObjects()
    .filter((object) => object.frameDropActive || object.frameEditActive)
    .map((object) => ({
      object,
      frameDropActive: object.frameDropActive,
      frameEditActive: object.frameEditActive,
    }));

  states.forEach(({ object }) => {
    object.frameDropActive = false;
    object.frameEditActive = false;
    object.dirty = true;
  });

  return () => {
    states.forEach(({ object, frameDropActive, frameEditActive }) => {
      object.frameDropActive = frameDropActive;
      object.frameEditActive = frameEditActive;
      object.dirty = true;
    });
    if (states.length) canvas.requestRenderAll();
  };
};

export const createProjectThumbnail = async (canvas) => {
  if (!canvas || !hasVisibleDesignObjects(canvas)) return null;

  const width = Math.max(1, canvas.getWidth());
  const height = Math.max(1, canvas.getHeight());
  const multiplier = Math.min(
    MAX_RENDER_MULTIPLIER,
    MAX_THUMBNAIL_EDGE / Math.max(width, height),
  );

  // Fabric renders only the lower design canvas here. Selection controls,
  // editor overlays, and objects marked excludeFromExport never enter this copy.
  const restoreTransientVisuals = suppressTransientObjectVisuals(canvas);
  let thumbnailCanvas;
  try {
    canvas.renderAll();
    thumbnailCanvas = canvas.toCanvasElement(multiplier);
  } finally {
    restoreTransientVisuals();
  }
  let blob = await canvasToBlob(
    thumbnailCanvas,
    "image/webp",
    THUMBNAIL_QUALITY,
  );

  // PNG is a safe fallback for browsers that cannot encode WebP.
  if (!blob) blob = await canvasToBlob(thumbnailCanvas, "image/png");
  if (!blob) throw new Error("The browser could not generate a project preview.");
  return blob;
};
