import { Point, util } from "fabric";

const MINIMUM_SCALE = 0.0001;

export const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

export const rotateVector = (x, y, angle) => {
  const radians = (angle * Math.PI) / 180;
  return new Point(
    x * Math.cos(radians) - y * Math.sin(radians),
    x * Math.sin(radians) + y * Math.cos(radians),
  );
};

export const getSourceDimensions = (image) => {
  const element = image.getElement();
  return {
    width:
      element.naturalWidth ||
      element.videoWidth ||
      element.width ||
      image.originalWidth ||
      image.width,
    height:
      element.naturalHeight ||
      element.videoHeight ||
      element.height ||
      image.originalHeight ||
      image.height,
  };
};

export const getExpandedImageCenter = (image, sourceWidth, sourceHeight) => {
  const visibleCenter = image.getCenterPoint();
  const cropCenterX = (image.cropX || 0) + image.width / 2;
  const cropCenterY = (image.cropY || 0) + image.height / 2;
  const sourceOffset = rotateVector(
    (sourceWidth / 2 - cropCenterX) * (image.scaleX || 1),
    (sourceHeight / 2 - cropCenterY) * (image.scaleY || 1),
    image.angle || 0,
  );

  return visibleCenter.add(sourceOffset);
};

// Crop controls operate in the image's rotated coordinate space. Clamping the
// dragged dimension and then restoring Fabric's fixed transform origin keeps
// the opposite edge pixel-perfect instead of recentring the whole frame.
export const constrainCropFrameToImage = (
  frame,
  image,
  sourceWidth,
  sourceHeight,
  transform,
  { minimumSize = 48 } = {},
) => {
  const corner = transform?.corner;
  if (!corner) return frame;

  const corners = ["tl", "tr", "br", "bl"];
  const changesWidth =
    corner === "ml" || corner === "mr" || corners.includes(corner);
  const changesHeight =
    corner === "mt" || corner === "mb" || corners.includes(corner);
  const originX =
    transform.originX || (corner.includes("l") ? "right" : "left");
  const originY =
    transform.originY || (corner.includes("t") ? "bottom" : "top");
  const fixedPoint = frame.getPointByOrigin(originX, originY);
  const imageCenter = image.getCenterPoint();
  const fixedLocal = rotateVector(
    fixedPoint.x - imageCenter.x,
    fixedPoint.y - imageCenter.y,
    -(image.angle || 0),
  );
  const halfImageWidth = (sourceWidth * Math.abs(image.scaleX || 1)) / 2;
  const halfImageHeight = (sourceHeight * Math.abs(image.scaleY || 1)) / 2;

  if (changesWidth) {
    const maximumWidth =
      originX === "right"
        ? fixedLocal.x + halfImageWidth
        : halfImageWidth - fixedLocal.x;
    const maximumScaleX = Math.max(1, maximumWidth) / Math.max(1, frame.width);
    const minimumScaleX =
      Math.min(minimumSize, Math.max(1, maximumWidth)) /
      Math.max(1, frame.width);
    frame.set(
      "scaleX",
      clamp(Math.abs(frame.scaleX || 1), minimumScaleX, maximumScaleX),
    );
  }

  if (changesHeight) {
    const maximumHeight =
      originY === "bottom"
        ? fixedLocal.y + halfImageHeight
        : halfImageHeight - fixedLocal.y;
    const maximumScaleY =
      Math.max(1, maximumHeight) / Math.max(1, frame.height);
    const minimumScaleY =
      Math.min(minimumSize, Math.max(1, maximumHeight)) /
      Math.max(1, frame.height);
    frame.set(
      "scaleY",
      clamp(Math.abs(frame.scaleY || 1), minimumScaleY, maximumScaleY),
    );
  }

  frame.setPositionByOrigin(fixedPoint, originX, originY);
  frame.setCoords();
  return frame;
};

// Panning is constrained without ever changing image scale. Resizing the crop
// frame and resizing the image are intentionally separate editor operations.
export const constrainImagePosition = (
  image,
  frame,
  sourceWidth,
  sourceHeight,
) => {
  const frameCenter = frame.getCenterPoint();
  const imageCenter = image.getCenterPoint();
  const angle = frame.angle || 0;
  const localOffset = rotateVector(
    imageCenter.x - frameCenter.x,
    imageCenter.y - frameCenter.y,
    -angle,
  );
  const maximumOffsetX = Math.max(
    0,
    (sourceWidth * Math.abs(image.scaleX || 1) -
      frame.width * Math.abs(frame.scaleX || 1)) /
      2,
  );
  const maximumOffsetY = Math.max(
    0,
    (sourceHeight * Math.abs(image.scaleY || 1) -
      frame.height * Math.abs(frame.scaleY || 1)) /
      2,
  );
  const boundedOffset = rotateVector(
    clamp(localOffset.x, -maximumOffsetX, maximumOffsetX),
    clamp(localOffset.y, -maximumOffsetY, maximumOffsetY),
    angle,
  );
  const nextCenter = frameCenter.add(boundedOffset);

  image.setPositionByOrigin(nextCenter, "center", "center");
  image.setCoords();

  return {
    center: nextCenter,
    constrainedX: Math.abs(localOffset.x) > maximumOffsetX,
    constrainedY: Math.abs(localOffset.y) > maximumOffsetY,
  };
};

export const calculateCropResult = (
  image,
  frame,
  sourceWidth,
  sourceHeight,
) => {
  const inverseImageMatrix = util.invertTransform(image.calcTransformMatrix());
  const localCenter = util.transformPoint(
    frame.getCenterPoint(),
    inverseImageMatrix,
  );
  const scaleX = Math.max(MINIMUM_SCALE, Math.abs(image.scaleX || 1));
  const scaleY = Math.max(MINIMUM_SCALE, Math.abs(image.scaleY || 1));
  const cropWidth = Math.min(
    sourceWidth,
    Math.max(1, (frame.width * Math.abs(frame.scaleX || 1)) / scaleX),
  );
  const cropHeight = Math.min(
    sourceHeight,
    Math.max(1, (frame.height * Math.abs(frame.scaleY || 1)) / scaleY),
  );
  const cropX = clamp(
    localCenter.x + sourceWidth / 2 - cropWidth / 2,
    0,
    sourceWidth - cropWidth,
  );
  const cropY = clamp(
    localCenter.y + sourceHeight / 2 - cropHeight / 2,
    0,
    sourceHeight - cropHeight,
  );
  const frameCenter = frame.getCenterPoint();

  return {
    left: frameCenter.x,
    top: frameCenter.y,
    width: cropWidth,
    height: cropHeight,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    originalWidth: sourceWidth,
    originalHeight: sourceHeight,
    angle: frame.angle,
  };
};
