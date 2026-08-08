import { loadSVGFromString, util } from "fabric";
import { getUniqueLayerName } from "../layers/layerUtils.js";
import { resolveAsset } from "./assetRegistry.js";
import { createFrameOnCanvas } from "../frames/frameCommands.js";

const DEFAULT_ICON_COLOR = "#111827";

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const escapeAttribute = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const serializeIconNode = (node, color) =>
  node
    .map(([tagName, attributes]) => {
      const serializedAttributes = Object.entries(attributes)
        .map(([name, value]) => {
          const resolvedValue = value === "currentColor" ? color : value;
          return `${name}="${escapeAttribute(resolvedValue)}"`;
        })
        .join(" ");
      return `<${tagName}${serializedAttributes ? ` ${serializedAttributes}` : ""}/>`;
    })
    .join("");

const createIconSvg = (asset, color) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="0" y="0" width="24" height="24" fill="transparent" stroke="none" stroke-width="0"/>
    ${serializeIconNode(asset.node, color)}
  </svg>
`;

const insertIcon = async (canvas, asset, { position, color } = {}) => {
  const iconColor = color || DEFAULT_ICON_COLOR;
  const parsed = await loadSVGFromString(createIconSvg(asset, iconColor));
  const objects = parsed.objects.filter(Boolean);
  if (!objects.length) throw new Error(`Unable to load ${asset.label}`);

  const icon = util.groupSVGElements(objects, parsed.options);
  const targetSize = clamp(
    Math.min(canvas.getWidth(), canvas.getHeight()) * 0.22,
    64,
    128,
  );
  const scale = targetSize / Math.max(1, icon.width, icon.height);
  const halfSize = targetSize / 2;
  const center = {
    x: clamp(position?.x ?? canvas.getWidth() / 2, halfSize, canvas.getWidth() - halfSize),
    y: clamp(position?.y ?? canvas.getHeight() / 2, halfSize, canvas.getHeight() - halfSize),
  };

  icon.set({
    left: center.x,
    top: center.y,
    originX: "center",
    originY: "center",
    scaleX: scale,
    scaleY: scale,
    name: getUniqueLayerName(canvas, asset.label),
    assetType: "icon",
    assetId: asset.id,
    assetLibrary: "lucide",
    assetColor: iconColor,
    aspectRatioLocked: true,
    lockedAspectRatio: 1,
    selectable: true,
    evented: true,
    hasControls: true,
    lockRotation: false,
    lockScalingFlip: true,
    touchCornerSize: 44,
    objectCaching: true,
  });
  icon.setControlsVisibility({
    mt: false,
    mb: false,
    ml: false,
    mr: false,
    mtr: true,
  });
  icon.setCoords();
  canvas.add(icon);
  canvas.setActiveObject(icon);
  canvas.requestRenderAll();
  return icon;
};

const inserters = {
  icon: insertIcon,
  frame: createFrameOnCanvas,
};

export const insertAssetIntoCanvas = async (canvas, descriptor, options) => {
  if (!canvas || !descriptor) return null;
  const asset = await resolveAsset(descriptor);
  const insert = asset && inserters[asset.type];
  if (!asset || !insert) throw new Error("This asset type is not supported yet.");
  return insert(canvas, asset, options);
};
