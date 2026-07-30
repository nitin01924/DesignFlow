import { Point, util } from "fabric";

const rotateVector = (x, y, angle) => {
  const radians = (angle * Math.PI) / 180;
  return new Point(
    x * Math.cos(radians) - y * Math.sin(radians),
    x * Math.sin(radians) + y * Math.cos(radians),
  );
};

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
