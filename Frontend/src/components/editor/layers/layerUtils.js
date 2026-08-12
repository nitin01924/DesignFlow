const TEXT_TYPES = new Set(["i-text", "text", "textbox"]);

const SHAPE_NAMES = {
  circle: "Circle",
  ellipse: "Ellipse",
  line: "Line",
  path: "Shape",
  polygon: "Polygon",
  polyline: "Polyline",
  rect: "Rectangle",
  triangle: "Triangle",
};

const ASSET_SHAPE_NAMES = {
  arrow: "Arrow",
  circle: "Circle",
  diamond: "Diamond",
  ellipse: "Ellipse",
  hexagon: "Hexagon",
  line: "Line",
  rectangle: "Rectangle",
  roundedRectangle: "Rounded Rectangle",
  star: "Star",
  triangle: "Triangle",
};

const normalizeType = (object) => String(object?.type || "").toLowerCase();

export const isTextLayer = (object) => TEXT_TYPES.has(normalizeType(object));

export const getLayerKind = (object) => {
  const type = normalizeType(object);
  if (object?.assetType === "frame") return "frame";
  if (object?.assetType === "icon") return "icon";
  if (object?.assetType === "shape") return "shape";
  if (type === "image") return "image";
  if (TEXT_TYPES.has(type)) return "text";
  if (type === "group") return "group";
  return "shape";
};

const getTextLayerName = (object) => {
  const text = String(object?.text || "").trim();
  const normalizedText = text.toLowerCase();

  if (normalizedText === "add a heading") return "Heading";
  if (normalizedText === "add a subheading") return "Subheading";
  if (normalizedText === "add body text") return "Body text";

  const firstLine = text.split(/\r?\n/)[0]?.trim();
  return firstLine ? firstLine.slice(0, 36) : "Text";
};

export const getLayerBaseName = (object) => {
  const type = normalizeType(object);
  if (object?.assetType === "frame") return "Frame";
  if (object?.assetType === "icon") return "Icon";
  if (object?.assetType === "shape") {
    return ASSET_SHAPE_NAMES[object.shapeKind] || SHAPE_NAMES[type] || "Shape";
  }
  if (type === "image") return "Image";
  if (TEXT_TYPES.has(type)) return getTextLayerName(object);
  if (type === "group") return "Group";
  return SHAPE_NAMES[type] || "Shape";
};

export const configureLayerControls = (object) => {
  if (!object) return;

  const isImage = normalizeType(object) === "image";
  const isIcon = object.assetType === "icon";
  const isFrame = object.assetType === "frame";
  const isShape = object.assetType === "shape";
  if (!isImage && !isIcon && !isFrame && !isShape) return;

  if (isIcon) {
    object.set({ aspectRatioLocked: true, lockedAspectRatio: 1 });
  }
  if (isFrame && object.frameKind === "circle") {
    object.set({ aspectRatioLocked: true, lockedAspectRatio: 1 });
  }
  const aspectRatioLocked = Boolean(object.aspectRatioLocked);
  object.setControlsVisibility({
    mt: !aspectRatioLocked,
    mb: !aspectRatioLocked,
    ml: !aspectRatioLocked,
    mr: !aspectRatioLocked,
    mtr: true,
  });
};

export const getUniqueLayerName = (
  canvas,
  baseName,
  { excludeObject = null, alwaysNumber = false } = {},
) => {
  const existingNames = new Set(
    (canvas?.getObjects() || [])
      .filter((object) => object !== excludeObject)
      .map((object) => String(object.name || "").trim().toLowerCase())
      .filter(Boolean),
  );
  const cleanBaseName = String(baseName || "Layer").trim() || "Layer";

  if (!alwaysNumber && !existingNames.has(cleanBaseName.toLowerCase())) {
    return cleanBaseName;
  }

  let suffix = alwaysNumber ? 1 : 2;
  let candidate = `${cleanBaseName} ${suffix}`;
  while (existingNames.has(candidate.toLowerCase())) {
    suffix += 1;
    candidate = `${cleanBaseName} ${suffix}`;
  }
  return candidate;
};

export const ensureLayerName = (canvas, object) => {
  if (!object || object.excludeFromExport || object.cropHelperType) return null;
  if (String(object.name || "").trim()) return object.name;

  const baseName = getLayerBaseName(object);
  const name = getUniqueLayerName(canvas, baseName, {
    excludeObject: object,
    alwaysNumber: getLayerKind(object) === "image",
  });
  object.set("name", name);
  return name;
};

export const applyLayerInteractionState = (object) => {
  if (!object || object.excludeFromExport || object.cropHelperType) return;

  if (object.visible === false) {
    object.set({ selectable: false, evented: false });
    return;
  }

  if (object.layerLocked) {
    object.set({
      selectable: true,
      evented: true,
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      ...(isTextLayer(object) ? { editable: false } : {}),
    });
  }
};

export const initializeLayerObject = (canvas, object) => {
  ensureLayerName(canvas, object);
  configureLayerControls(object);
  applyLayerInteractionState(object);
  object?.setCoords();
};
