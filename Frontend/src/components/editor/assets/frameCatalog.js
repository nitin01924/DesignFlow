const createFrameAsset = ({
  id,
  label,
  kind = id,
  width = 220,
  height = 180,
  keywords = [],
}) =>
  Object.freeze({
    id,
    type: "frame",
    sectionId: "frames",
    label,
    kind,
    width,
    height,
    searchText: [label, id, kind, ...keywords].join(" ").toLowerCase(),
  });

export const frameAssets = Object.freeze([
  createFrameAsset({ id: "rectangle", label: "Rectangle" }),
  createFrameAsset({
    id: "rounded-rectangle",
    label: "Rounded Rectangle",
    kind: "roundedRectangle",
    keywords: ["rounded", "square"],
  }),
  createFrameAsset({
    id: "circle",
    label: "Circle",
    width: 190,
    height: 190,
    keywords: ["round"],
  }),
  createFrameAsset({ id: "ellipse", label: "Ellipse", keywords: ["oval"] }),
  createFrameAsset({ id: "triangle", label: "Triangle", width: 210, height: 190 }),
  createFrameAsset({ id: "hexagon", label: "Hexagon", width: 210, height: 190 }),
  createFrameAsset({ id: "blob", label: "Blob", width: 210, height: 195, keywords: ["organic"] }),
  createFrameAsset({
    id: "phone-mockup",
    label: "Phone Mockup",
    kind: "phone",
    width: 150,
    height: 270,
    keywords: ["mobile", "device", "screen"],
  }),
  createFrameAsset({
    id: "laptop-mockup",
    label: "Laptop Mockup",
    kind: "laptop",
    width: 270,
    height: 180,
    keywords: ["computer", "device", "screen"],
  }),
  createFrameAsset({
    id: "browser-window",
    label: "Browser Window",
    kind: "browser",
    width: 270,
    height: 190,
    keywords: ["web", "website", "screen"],
  }),
]);

const framesById = new Map(frameAssets.map((asset) => [asset.id, asset]));

export const getFrameAsset = (assetId) => framesById.get(assetId) || null;
