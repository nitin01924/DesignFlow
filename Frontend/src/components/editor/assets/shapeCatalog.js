const createShapeAsset = ({ id, label, kind = id, keywords = [] }) =>
  Object.freeze({
    id,
    type: "shape",
    sectionId: "shapes",
    label,
    kind,
    searchText: [label, id, kind, ...keywords].join(" ").toLowerCase(),
  });

export const shapeAssets = Object.freeze([
  createShapeAsset({ id: "rectangle", label: "Rectangle" }),
  createShapeAsset({
    id: "rounded-rectangle",
    label: "Rounded Rectangle",
    kind: "roundedRectangle",
    keywords: ["rounded", "corner", "square"],
  }),
  createShapeAsset({ id: "circle", label: "Circle", keywords: ["round"] }),
  createShapeAsset({ id: "ellipse", label: "Ellipse", keywords: ["oval"] }),
  createShapeAsset({ id: "triangle", label: "Triangle" }),
  createShapeAsset({ id: "line", label: "Line", keywords: ["divider"] }),
  createShapeAsset({ id: "arrow", label: "Arrow", keywords: ["direction"] }),
  createShapeAsset({ id: "star", label: "Star", keywords: ["favorite"] }),
  createShapeAsset({ id: "hexagon", label: "Hexagon", keywords: ["six"] }),
  createShapeAsset({ id: "diamond", label: "Diamond", keywords: ["rhombus"] }),
]);

const shapesById = new Map(shapeAssets.map((asset) => [asset.id, asset]));

export const getShapeAsset = (assetId) => shapesById.get(assetId) || null;
