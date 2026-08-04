import { Point, util } from "fabric";

const rotateVector = (x, y, angle) => {
  const radians = (angle * Math.PI) / 180;
  return new Point(
    x * Math.cos(radians) - y * Math.sin(radians),
    x * Math.sin(radians) + y * Math.cos(radians),
  );
};

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

export const getSourceDimensions = (image) => {
  const element = image.getElement();
  return {
    width: element.naturalWidth || element.videoWidth || element.width || image.width,
    height: element.naturalHeight || element.videoHeight || element.height || image.height,
  };
};

export const getExpandedImageCenter = (image, sourceWidth, sourceHeight) => {
  const visibleCenter = image.getCenterPoint();
  const cropCenterX = (image.cropX || 0) + image.width / 2;
  const cropCenterY = (image.cropY || 0) + image.height / 2;
  const centerOffset = rotateVector(
    (sourceWidth / 2 - cropCenterX) * (image.scaleX || 1),
    (sourceHeight / 2 - cropCenterY) * (image.scaleY || 1),
    image.angle || 0,
  );

  return visibleCenter.add(centerOffset);
};

export const getCropZoomLimits = (
  image,
  frame,
  sourceWidth,
  sourceHeight,
) => {
  const baseScaleX = Math.max(0.0001, Math.abs(image.scaleX || 1));
  const baseScaleY = Math.max(0.0001, Math.abs(image.scaleY || 1));
  const frameWidth = frame.width * Math.abs(frame.scaleX || 1);
  const frameHeight = frame.height * Math.abs(frame.scaleY || 1);
  const minimumZoom = Math.max(
    frameWidth / Math.max(1, sourceWidth * baseScaleX),
    frameHeight / Math.max(1, sourceHeight * baseScaleY),
  );

  return {
    baseScaleX,
    baseScaleY,
    minimumZoom,
    // A generous cap prevents accidental runaway scales without limiting
    // normal detail work on high-resolution images.
    maximumZoom: Math.max(1, minimumZoom) * 32,
  };
};

export const constrainImageToCropFrame = (
  image,
  frame,
  {
    sourceWidth,
    sourceHeight,
    baseScaleX,
    baseScaleY,
    minimumZoom,
    maximumZoom,
    scaleSignX = 1,
    scaleSignY = 1,
  },
) => {
  const zoomX = Math.abs(image.scaleX || 0) / baseScaleX;
  const zoomY = Math.abs(image.scaleY || 0) / baseScaleY;
  const zoom = clamp(
    Math.max(zoomX, zoomY, minimumZoom),
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
  const constrainedOffset = rotateVector(
    clamp(localOffset.x, -maximumOffsetX, maximumOffsetX),
    clamp(localOffset.y, -maximumOffsetY, maximumOffsetY),
    angle,
  );

  image.setPositionByOrigin(
    frameCenter.add(constrainedOffset),
    "center",
    "center",
  );
  image.setCoords();

  return zoom;
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
  const scaleX = Math.max(0.0001, Math.abs(image.scaleX || 1));
  const scaleY = Math.max(0.0001, Math.abs(image.scaleY || 1));
  const cropWidth = Math.min(
    sourceWidth,
    Math.max(1, (frame.width * Math.abs(frame.scaleX || 1)) / scaleX),
  );
  const cropHeight = Math.min(
    sourceHeight,
    Math.max(1, (frame.height * Math.abs(frame.scaleY || 1)) / scaleY),
  );
  const cropX = Math.min(
    sourceWidth - cropWidth,
    Math.max(0, localCenter.x + sourceWidth / 2 - cropWidth / 2),
  );
  const cropY = Math.min(
    sourceHeight - cropHeight,
    Math.max(0, localCenter.y + sourceHeight / 2 - cropHeight / 2),
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
