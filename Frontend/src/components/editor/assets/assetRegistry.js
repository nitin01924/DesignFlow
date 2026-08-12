const providers = [
  {
    id: "icons",
    label: "Icons",
    assetType: "icon",
    description: "Open-source SVG icons from Lucide",
    async load() {
      const catalog = await import("./iconCatalog.js");
      return catalog.iconAssets;
    },
    async resolve(assetId) {
      const catalog = await import("./iconCatalog.js");
      return catalog.getIconAsset(assetId);
    },
  },
  {
    id: "frames",
    label: "Frames",
    assetType: "frame",
    description: "Non-destructive image containers",
    async load() {
      const catalog = await import("./frameCatalog.js");
      return catalog.frameAssets;
    },
    async resolve(assetId) {
      const catalog = await import("./frameCatalog.js");
      return catalog.getFrameAsset(assetId);
    },
  },
  {
    id: "shapes",
    label: "Shapes",
    assetType: "shape",
    description: "Editable Fabric vector shapes",
    async load() {
      const catalog = await import("./shapeCatalog.js");
      return catalog.shapeAssets;
    },
    async resolve(assetId) {
      const catalog = await import("./shapeCatalog.js");
      return catalog.getShapeAsset(assetId);
    },
  },
];

const providersById = new Map(providers.map((provider) => [provider.id, provider]));
const providersByType = new Map(
  providers.map((provider) => [provider.assetType, provider]),
);

// New asset families register one provider here without changing the browser,
// drag payload, insertion entry point, or editor shell.
export const assetSections = Object.freeze(
  providers.map(({ id, label, assetType, description }) =>
    Object.freeze({ id, label, assetType, description }),
  ),
);

export const loadAssetSection = async (sectionId) => {
  const provider = providersById.get(sectionId);
  if (!provider) return [];
  return provider.load();
};

export const resolveAsset = async ({ id, type, sectionId }) => {
  const provider = providersById.get(sectionId) || providersByType.get(type);
  if (!provider || !id) return null;
  return provider.resolve(id);
};
