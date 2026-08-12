import {
  Circle,
  Ellipse,
  Line,
  Path,
  Polygon,
  Rect,
  Triangle,
} from "fabric";
import {
  configureLayerControls,
  getUniqueLayerName,
} from "../layers/layerUtils.js";

const DEFAULT_FILL = "#2563EB";
const DEFAULT_STROKE = "#1E3A8A";

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const radialPoints = (count, outerRadius, innerRadius = outerRadius) =>
  Array.from({ length: count * (innerRadius === outerRadius ? 1 : 2) }, (_, index) => {
    const total = count * (innerRadius === outerRadius ? 1 : 2);
    const radius = innerRadius === outerRadius || index % 2 === 0
      ? outerRadius
      : innerRadius;
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / total;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });

const shapeFactories = {
  rectangle: () => new Rect({ width: 180, height: 120 }),
  roundedRectangle: () =>
    new Rect({ width: 180, height: 120, rx: 22, ry: 22 }),
  circle: () =>
    new Circle({
      radius: 70,
      aspectRatioLocked: true,
      lockedAspectRatio: 1,
    }),
  ellipse: () => new Ellipse({ rx: 90, ry: 60 }),
  triangle: () => new Triangle({ width: 170, height: 145 }),
  line: () =>
    new Line([0, 0, 190, 0], {
      fill: "transparent",
      stroke: DEFAULT_FILL,
      strokeWidth: 5,
      strokeLineCap: "round",
    }),
  arrow: () =>
    new Path("M 0 20 L 130 20 L 130 0 L 185 30 L 130 60 L 130 40 L 0 40 Z"),
  star: () =>
    new Polygon(radialPoints(5, 78, 34), {
      shapePoints: 5,
      aspectRatioLocked: true,
      lockedAspectRatio: 1,
    }),
  hexagon: () =>
    new Polygon(radialPoints(6, 78), {
      aspectRatioLocked: true,
      lockedAspectRatio: 1,
    }),
  diamond: () =>
    new Polygon(
      [
        { x: 0, y: -76 },
        { x: 94, y: 0 },
        { x: 0, y: 76 },
        { x: -94, y: 0 },
      ],
      {},
    ),
};

export const createShapeObject = (asset) => {
  const create = shapeFactories[asset?.kind];
  if (!create) throw new Error("This shape is not supported.");

  const shape = create();
  const isLine = asset.kind === "line";
  shape.set({
    fill: isLine ? "transparent" : DEFAULT_FILL,
    stroke: shape.stroke || DEFAULT_STROKE,
    strokeWidth: shape.strokeWidth ?? (isLine ? 5 : 1),
    strokeUniform: true,
    originX: "center",
    originY: "center",
    assetType: "shape",
    assetId: asset.id,
    assetLibrary: "designflow",
    shapeKind: asset.kind,
    selectable: true,
    evented: true,
    hasControls: true,
    lockRotation: false,
    lockScalingFlip: true,
    touchCornerSize: 44,
    objectCaching: true,
  });
  return shape;
};

export const createShapeOnCanvas = (canvas, asset, { position } = {}) => {
  if (!canvas || !asset) return null;

  const shape = createShapeObject(asset);
  const maximumSize = Math.max(72, Math.min(canvas.getWidth(), canvas.getHeight()) * 0.32);
  const naturalSize = Math.max(1, shape.width || 1, shape.height || 1);
  const scale = Math.min(1, maximumSize / naturalSize);
  const halfWidth = Math.max(12, ((shape.width || 1) * scale) / 2);
  const halfHeight = Math.max(12, ((shape.height || 1) * scale) / 2);
  const x = clamp(
    position?.x ?? canvas.getWidth() / 2,
    halfWidth,
    Math.max(halfWidth, canvas.getWidth() - halfWidth),
  );
  const y = clamp(
    position?.y ?? canvas.getHeight() / 2,
    halfHeight,
    Math.max(halfHeight, canvas.getHeight() - halfHeight),
  );

  shape.set({
    left: x,
    top: y,
    scaleX: scale,
    scaleY: scale,
    name: getUniqueLayerName(canvas, asset.label),
  });
  configureLayerControls(shape);
  shape.setCoords();
  canvas.add(shape);
  canvas.setActiveObject(shape);
  canvas.requestRenderAll();
  return shape;
};
