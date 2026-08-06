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

export const createCropConstraints = (
  image,
  frame,
  sourceWidth,
  sourceHeight,
) => {
  const baseScaleX = Math.max(MINIMUM_SCALE, Math.abs(image.scaleX || 1));
  const baseScaleY = Math.max(MINIMUM_SCALE, Math.abs(image.scaleY || 1));
  const scaledFrameWidth = frame.width * Math.abs(frame.scaleX || 1);
  const scaledFrameHeight = frame.height * Math.abs(frame.scaleY || 1);
  const minimumZoom = Math.max(
    scaledFrameWidth / Math.max(1, sourceWidth * baseScaleX),
    scaledFrameHeight / Math.max(1, sourceHeight * baseScaleY),
  );

  return {
    sourceWidth,
    sourceHeight,
    baseScaleX,
    baseScaleY,
    minimumZoom,
    maximumZoom: Math.max(1, minimumZoom) * 32,
    scaleSignX: (image.scaleX || 1) < 0 ? -1 : 1,
    scaleSignY: (image.scaleY || 1) < 0 ? -1 : 1,
  };
};

export const constrainCropTransform = (image, frame, constraints) => {
  const {
    sourceWidth,
    sourceHeight,
    baseScaleX,
    baseScaleY,
    minimumZoom,
    maximumZoom,
    scaleSignX,
    scaleSignY,
  } = constraints;
  const zoom = clamp(
    Math.max(
      Math.abs(image.scaleX || 0) / baseScaleX,
      Math.abs(image.scaleY || 0) / baseScaleY,
      minimumZoom,
    ),
    minimumZoom,
    maximumZoom,
  );

  image.set({
    scaleX: scaleSignX * baseScaleX * zoom,
    scaleY: scaleSignY * baseScaleY * zoom,
  });

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
    (sourceWidth * Math.abs(image.scaleX) -
      frame.width * Math.abs(frame.scaleX || 1)) /
      2,
  );
  const maximumOffsetY = Math.max(
    0,
    (sourceHeight * Math.abs(image.scaleY) -
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
    zoom,
    center: nextCenter,
    constrainedX: Math.abs(localOffset.x) > maximumOffsetX,
    constrainedY: Math.abs(localOffset.y) > maximumOffsetY,
  };
};

export const zoomImageAroundPoint = (image, factor, anchor) => {
  const center = image.getCenterPoint();
  image.set({
    scaleX: image.scaleX * factor,
    scaleY: image.scaleY * factor,
  });
  image.setPositionByOrigin(
    new Point(
      anchor.x - (anchor.x - center.x) * factor,
      anchor.y - (anchor.y - center.y) * factor,
    ),
    "center",
    "center",
  );
};

export const isPointInsideCropFrame = (point, frame) => {
  const localPoint = util.transformPoint(
    point,
    util.invertTransform(frame.calcTransformMatrix()),
  );

  return (
    Math.abs(localPoint.x) <= frame.width / 2 &&
    Math.abs(localPoint.y) <= frame.height / 2
  );
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
