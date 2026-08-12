export const ASSET_DRAG_MIME = "application/x-designflow-asset";

export const writeAssetDragData = (dataTransfer, asset) => {
  if (!dataTransfer || !asset?.id || !asset?.type) return;

  dataTransfer.effectAllowed = "copy";
  dataTransfer.setData(
    ASSET_DRAG_MIME,
    JSON.stringify({
      id: asset.id,
      type: asset.type,
      sectionId: asset.sectionId,
      label: asset.label,
      sourceUrl: asset.sourceUrl,
      width: asset.width,
      height: asset.height,
      originalFilename: asset.originalFilename,
    }),
  );
};

export const hasAssetDragData = (dataTransfer) =>
  Array.from(dataTransfer?.types || []).includes(ASSET_DRAG_MIME);

export const readAssetDragData = (dataTransfer) => {
  try {
    const payload = JSON.parse(dataTransfer?.getData(ASSET_DRAG_MIME) || "");
    if (!payload?.id || !payload?.type) return null;
    return payload;
  } catch {
    return null;
  }
};
