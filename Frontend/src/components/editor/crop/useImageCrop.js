import { useCallback, useEffect, useRef, useState } from "react";
import { Line, Point, Rect, util } from "fabric";
import {
  calculateCropResult,
  getExpandedImageCenter,
  getSourceDimensions,
} from "./cropGeometry";

const CROP_FIELDS = [
  "left",
  "top",
  "width",
  "height",
  "scaleX",
  "scaleY",
  "angle",
  "originX",
  "originY",
  "cropX",
  "cropY",
  "cropWidth",
  "cropHeight",
  "originalWidth",
  "originalHeight",
  "lockMovementX",
  "lockMovementY",
  "lockRotation",
];

const snapshotObject = (object) =>
  Object.fromEntries(CROP_FIELDS.map((field) => [field, object[field]]));

const createGridLines = () =>
  Array.from({ length: 4 }, () =>
    new Line([0, 0, 0, 0], {
      stroke: "rgba(255,255,255,0.75)",
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      cropHelperType: "grid",
    }),
  );

export function useImageCrop({ canvas, onSelectionChange, onModeChange }) {
  const [isCropping, setIsCropping] = useState(false);
  const sessionRef = useRef(null);

  const updateDecorations = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const { canvas: cropCanvas, frame, hole, gridLines } = session;

    hole.set({
      left: frame.left,
      top: frame.top,
      width: frame.width,
      height: frame.height,
      scaleX: frame.scaleX,
      scaleY: frame.scaleY,
      angle: frame.angle,
      originX: frame.originX,
      originY: frame.originY,
    });
    hole.setCoords();

    const matrix = frame.calcTransformMatrix();
    const halfWidth = frame.width / 2;
    const halfHeight = frame.height / 2;
    const definitions = [
      [new Point(-halfWidth / 3, -halfHeight), new Point(-halfWidth / 3, halfHeight)],
      [new Point(halfWidth / 3, -halfHeight), new Point(halfWidth / 3, halfHeight)],
      [new Point(-halfWidth, -halfHeight / 3), new Point(halfWidth, -halfHeight / 3)],
      [new Point(-halfWidth, halfHeight / 3), new Point(halfWidth, halfHeight / 3)],
    ];

    definitions.forEach(([start, end], index) => {
      const worldStart = util.transformPoint(start, matrix);
      const worldEnd = util.transformPoint(end, matrix);
      gridLines[index].set({
        x1: worldStart.x,
        y1: worldStart.y,
        x2: worldEnd.x,
        y2: worldEnd.y,
      });
      gridLines[index].setCoords();
    });
    cropCanvas.requestRenderAll();
  }, []);

  const restoreInteraction = useCallback((session) => {
    session.objectInteraction.forEach(({ object, selectable, evented }) => {
      object.set({ selectable, evented });
    });
    session.canvas.set({
      preserveObjectStacking: session.preserveObjectStacking,
      uniformScaling: session.uniformScaling,
    });
  }, []);

  const finishSession = useCallback((apply) => {
    const session = sessionRef.current;
    if (!session) return;
    const {
      canvas: cropCanvas,
      image,
      frame,
      helpers,
      snapshot,
      sourceWidth,
      sourceHeight,
    } = session;

    const before = { ...snapshot };

    if (apply) {
      image.set({
        ...calculateCropResult(
          image,
          frame,
          sourceWidth,
          sourceHeight,
        ),
        originX: "center",
        originY: "center",
        lockRotation: snapshot.lockRotation,
      });
    } else {
      image.set(snapshot);
    }

    image.set({
      cropModeActive: false,
      lockMovementX: snapshot.lockMovementX,
      lockMovementY: snapshot.lockMovementY,
      lockRotation: snapshot.lockRotation,
    });
    const locked = Boolean(image.aspectRatioLocked);
    image.setControlsVisibility({
      mt: !locked,
      mb: !locked,
      ml: !locked,
      mr: !locked,
      mtr: true,
    });
    image.setCoords();

    cropCanvas.discardActiveObject();
    cropCanvas.remove(...helpers);
    restoreInteraction(session);
    cropCanvas.setActiveObject(image);
    cropCanvas.requestRenderAll();

    sessionRef.current = null;
    setIsCropping(false);
    onModeChange?.(false);
    onSelectionChange?.(image);

    if (apply) {
      cropCanvas.fire("designflow:crop", {
        target: image,
        before,
        after: snapshotObject(image),
      });
    }
  }, [onModeChange, onSelectionChange, restoreInteraction]);

  const cancelCrop = useCallback(() => finishSession(false), [finishSession]);
  const applyCrop = useCallback(() => finishSession(true), [finishSession]);

  const startCrop = useCallback((image) => {
    if (!canvas || isCropping || image?.type !== "image") return;

    const snapshot = snapshotObject(image);
    const dimensions = getSourceDimensions(image);
    const sourceWidth = dimensions.width;
    const sourceHeight = dimensions.height;
    const visibleWidth = image.width;
    const visibleHeight = image.height;
    const visibleCenter = image.getCenterPoint();
    const fullImageCenter = getExpandedImageCenter(
      image,
      sourceWidth,
      sourceHeight,
    );
    const objectInteraction = canvas.getObjects().map((object) => ({
      object,
      selectable: object.selectable,
      evented: object.evented,
    }));

    objectInteraction.forEach(({ object }) => {
      if (object !== image) object.set({ selectable: false, evented: false });
    });

    image.set({
      left: fullImageCenter.x,
      top: fullImageCenter.y,
      originX: "center",
      originY: "center",
      width: sourceWidth,
      height: sourceHeight,
      cropX: 0,
      cropY: 0,
      cropModeActive: true,
      lockMovementX: false,
      lockMovementY: false,
      lockRotation: true,
    });
    image.setControlsVisibility({
      mt: false,
      mb: false,
      ml: false,
      mr: false,
      mtr: false,
    });
    image.setCoords();

    const frame = new Rect({
      left: visibleCenter.x,
      top: visibleCenter.y,
      originX: "center",
      originY: "center",
      width: visibleWidth,
      height: visibleHeight,
      scaleX: Math.abs(image.scaleX || 1),
      scaleY: Math.abs(image.scaleY || 1),
      angle: image.angle || 0,
      fill: "transparent",
      stroke: "#ffffff",
      strokeWidth: 2,
      strokeUniform: true,
      cornerColor: "#ffffff",
      cornerStrokeColor: "#2563eb",
      borderColor: "#ffffff",
      cornerStyle: "circle",
      cornerSize: 14,
      transparentCorners: false,
      lockRotation: true,
      perPixelTargetFind: true,
      excludeFromExport: true,
      cropHelperType: "frame",
    });
    frame.setControlsVisibility({ mtr: false });

    const hole = new Rect({
      left: frame.left,
      top: frame.top,
      originX: "center",
      originY: "center",
      width: frame.width,
      height: frame.height,
      scaleX: frame.scaleX,
      scaleY: frame.scaleY,
      angle: frame.angle,
      absolutePositioned: true,
      inverted: true,
      fill: "#000000",
      selectable: false,
      evented: false,
      excludeFromExport: true,
      cropHelperType: "hole",
    });
    const overlay = new Rect({
      left: 0,
      top: 0,
      width: canvas.getWidth(),
      height: canvas.getHeight(),
      fill: "rgba(2,6,23,0.62)",
      selectable: false,
      evented: false,
      excludeFromExport: true,
      cropHelperType: "overlay",
      clipPath: hole,
    });
    const gridLines = createGridLines();
    const helpers = [overlay, ...gridLines, frame];
    const preserveObjectStacking = canvas.preserveObjectStacking;
    const uniformScaling = canvas.uniformScaling;

    canvas.set({ preserveObjectStacking: true, uniformScaling: false });
    canvas.add(...helpers);
    canvas.setActiveObject(frame);

    sessionRef.current = {
      canvas,
      image,
      frame,
      hole,
      gridLines,
      helpers,
      snapshot,
      sourceWidth,
      sourceHeight,
      objectInteraction,
      preserveObjectStacking,
      uniformScaling,
    };

    updateDecorations();
    setIsCropping(true);
    onModeChange?.(true);
    onSelectionChange?.(image);
  }, [canvas, isCropping, onModeChange, onSelectionChange, updateDecorations]);

  useEffect(() => {
    if (!canvas || !isCropping) return;

    const syncCropObjects = (event) => {
      const session = sessionRef.current;
      if (!session) return;
      if (event.target === session.frame) updateDecorations();
    };

    canvas.on("object:moving", syncCropObjects);
    canvas.on("object:scaling", syncCropObjects);
    canvas.on("object:modified", syncCropObjects);
    return () => {
      canvas.off("object:moving", syncCropObjects);
      canvas.off("object:scaling", syncCropObjects);
      canvas.off("object:modified", syncCropObjects);
    };
  }, [canvas, isCropping, updateDecorations]);

  useEffect(() => {
    if (!isCropping) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelCrop();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelCrop, isCropping]);

  useEffect(() => () => {
    if (sessionRef.current) finishSession(false);
  }, [finishSession]);

  return { isCropping, startCrop, cancelCrop, applyCrop };
}
