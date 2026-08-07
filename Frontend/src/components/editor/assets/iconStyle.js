const visitIconShapes = (object, visitor) => {
  const children = object?.getObjects?.();
  if (children?.length) {
    children.forEach((child) => visitIconShapes(child, visitor));
    return;
  }
  if (object) visitor(object);
};

const isPainted = (paint) =>
  typeof paint === "string" &&
  paint !== "" &&
  paint !== "none" &&
  paint !== "transparent";

export const setIconColor = (object, color) => {
  if (!object || !color) return false;

  visitIconShapes(object, (shape) => {
    const properties = {};
    if (isPainted(shape.stroke)) properties.stroke = color;
    if (isPainted(shape.fill)) properties.fill = color;
    if (Object.keys(properties).length) shape.set(properties);
  });
  object.set({ assetColor: color, dirty: true });
  object.setCoords();
  return true;
};
