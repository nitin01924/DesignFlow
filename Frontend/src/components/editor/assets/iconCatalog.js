import { icons } from "lucide";

const FEATURED_ICON_IDS = [
  "home",
  "heart",
  "star",
  "user",
  "search",
  "camera",
  "image",
  "mail",
  "phone",
  "map-pin",
  "check",
  "x",
  "plus",
  "menu",
  "arrow-right",
  "circle-play",
  "calendar",
  "clock",
  "settings",
  "shopping-cart",
];

const featuredRank = new Map(
  FEATURED_ICON_IDS.map((iconId, index) => [iconId, index]),
);

const toLabel = (name) =>
  name
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/(\d+)/g, " $1 ")
    .replaceAll(/\s+/g, " ")
    .trim();

const toId = (name) =>
  toLabel(name)
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");

const seenNodes = new Set();

export const iconAssets = Object.freeze(
  Object.entries(icons)
    .filter(([, node]) => {
      if (!Array.isArray(node) || seenNodes.has(node)) return false;
      seenNodes.add(node);
      return true;
    })
    .map(([sourceName, node]) => {
      const id = toId(sourceName);
      const label = toLabel(sourceName);
      return Object.freeze({
        id,
        type: "icon",
        sectionId: "icons",
        label,
        sourceName,
        node,
        searchText: `${label} ${id} ${sourceName}`.toLowerCase(),
      });
    })
    .sort((first, second) => {
      const firstRank = featuredRank.get(first.id) ?? Number.MAX_SAFE_INTEGER;
      const secondRank = featuredRank.get(second.id) ?? Number.MAX_SAFE_INTEGER;
      return firstRank - secondRank || first.label.localeCompare(second.label);
    }),
);

const iconsById = new Map(iconAssets.map((asset) => [asset.id, asset]));

export const getIconAsset = (assetId) => iconsById.get(assetId) || null;
