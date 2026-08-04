import { useCallback, useEffect, useRef, useState } from "react";
import { Line, Point, Rect, util } from "fabric";
import {
  calculateCropResult,
  constrainImageToCropFrame,
  getCropZoomLimits,
  getExpandedImageCenter,
  getSourceDimensions,
} from "./cropGeometry.js";

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
  "lockScalingX",
  "lockScalingY",
  "lockScalingFlip",
];

const IMAGE_INTERACTION_FIELDS = [
  "hasBorders",
  "hasControls",
  "hoverCursor",
  "moveCursor",
  "cornerColor",
  "cornerStrokeColor",
  "cornerStyle",
  "cornerSize",
  "touchCornerSize",
  "transparentCorners",
  "borderColor",
  "borderDashArray",
  "padding",
];

const snapshotFields = (object, fields) =>
  Object.fromEntries(fields.map((field) => [field, object[field]]));

const snapshotObject = (object) => snapshotFields(object, CROP_FIELDS);

const helperProperties = {
  selectable: false,
  evented: false,
  excludeFromExport: true,
};

const createGridLines = () =>
  Array.from({ length: 4 }, () =>
    new Line([0, 0, 0, 0], {
      ...helperProperties,
      stroke: "rgba(255,255,255,0.82)",
      strokeWidth: 1,
      strokeUniform: true,
      opacity: 0,
      cropHelperType: "grid",
    }),
  );

const setHelperGeometry = (helper, frame) => {
  helper.set({
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
  helper.setCoords();
};

const positionCropDecorations = (session) => {
  const { frame, frameHalo, hole, clipFrame, gridLines } = session;
  setHelperGeometry(frameHalo, frame);
  setHelperGeometry(hole, frame);
  setHelperGeometry(clipFrame, frame);

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
};

const setDecorationProgress = (session, progress) => {
  session.decorationProgress = progress;
  session.overlay.set("opacity", progress);
  session.frame.set("opacity", progress);
  session.frameHalo.set("opacity", progress);
  session.gridLines.forEach((line) => line.set("opacity", progress));
  session.canvas.renderAll();
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const animateDecorations = (session, endValue, onComplete) => {
  session.animation?.abort();
  const startValue = session.decorationProgress;

  if (prefersReducedMotion() || startValue === endValue) {
    setDecorationProgress(session, endValue);
    onComplete?.();
    return;
  }

  session.animation = util.animate({
    startValue,
    endValue,
    duration: endValue > startValue ? 180 : 130,
    target: session.canvas,
    onChange: (value) => setDecorationProgress(session, value),
    onComplete: () => {
      session.animation = null;
      onComplete?.();
    },
  });
};

const distanceBetweenTouches = (touches) =>
  Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );

const getTouchMidpoint = (canvas, touches) => {
  const bounds = canvas.upperCanvasEl.getBoundingClientRect();
  const viewportPoint = new Point(
    (((touches[0].clientX + touches[1].clientX) / 2 - bounds.left) *
      canvas.getWidth()) /
      Math.max(1, bounds.width),
    (((touches[0].clientY + touches[1].clientY) / 2 - bounds.top) *
      canvas.getHeight()) /
      Math.max(1, bounds.height),
  );

  return util.transformPoint(
    viewportPoint,
    util.invertTransform(canvas.viewportTransform),
  );
};

const restoreControlVisibility = (image, controlsVisibility) => {
  if (controlsVisibility) {
    image._controlsVisibility = { ...controlsVisibility };
  } else {
    delete image._controlsVisibility;
  }
};

export function useImageCrop({ canvas, onSelectionChange, onModeChange }) {
  const [isCropping, setIsCropping] = useState(false);
  const sessionRef = useRef(null);

  const constrainSession = useCallback((session) => {
    if (!session || session.finishing) return;
    constrainImageToCropFrame(session.image, session.frame, session.zoomLimits);
  }, []);

  const restoreInteraction = useCallback((session) => {
    const { canvas: cropCanvas, image, imageInteraction } = session;

    session.objectInteraction.forEach(({ object, selectable, evented }) => {
      object.set({ selectable, evented });
    });
    image.set({
      ...imageInteraction.properties,
      clipPath: imageInteraction.clipPath,
    });
    restoreControlVisibility(image, imageInteraction.controlsVisibility);
    cropCanvas.set(session.canvasInteraction);
  }, []);

  const finalizeSession = useCallback((session, apply) => {
    if (!session || sessionRef.current !== session) return;
    session.animation?.abort();
    session.animation = null;

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
      });
    } else {
      image.set(snapshot);
    }

    image.set({
      cropModeActive: false,
      lockMovementX: snapshot.lockMovementX,
      lockMovementY: snapshot.lockMovementY,
      lockRotation: snapshot.lockRotation,
      lockScalingX: snapshot.lockScalingX,
      lockScalingY: snapshot.lockScalingY,
      lockScalingFlip: snapshot.lockScalingFlip,
    });
    restoreInteraction(session);
    image.setCoords();

    cropCanvas.discardActiveObject();
    cropCanvas.remove(...helpers);
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

  const finishSession = useCallback((apply) => {
    const session = sessionRef.current;
    if (!session || session.finishing) return;
    session.finishing = true;

    if (session.canvas._currentTransform) {
      session.canvas.endCurrentTransform();
    }
    session.image.set({ evented: false, hasControls: false });
    session.canvas.requestRenderAll();
    animateDecorations(session, 0, () => finalizeSession(session, apply));
  }, [finalizeSession]);

  const cancelCrop = useCallback(() => finishSession(false), [finishSession]);
  const applyCrop = useCallback(() => finishSession(true), [finishSession]);

  const startCrop = useCallback((image) => {
    if (
      !canvas ||
      sessionRef.current ||
      image?.type !== "image" ||
      image.layerLocked ||
      image.visible === false
    ) {
      return;
    }

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
    const imageInteraction = {
      properties: snapshotFields(image, IMAGE_INTERACTION_FIELDS),
      controlsVisibility: image._controlsVisibility
        ? { ...image._controlsVisibility }
        : null,
      clipPath: image.clipPath,
    };
    const canvasInteraction = {
      selection: canvas.selection,
      skipTargetFind: canvas.skipTargetFind,
      preserveObjectStacking: canvas.preserveObjectStacking,
      uniformScaling: canvas.uniformScaling,
      controlsAboveOverlay: canvas.controlsAboveOverlay,
      defaultCursor: canvas.defaultCursor,
    };

    objectInteraction.forEach(({ object }) => {
      if (object !== image) object.set({ selectable: false, evented: false });
    });

    const frame = new Rect({
      ...helperProperties,
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
      opacity: 0,
      cropHelperType: "frame",
    });
    const frameHalo = new Rect({
      ...helperProperties,
      fill: "transparent",
      stroke: "rgba(15,23,42,0.72)",
      strokeWidth: 5,
      strokeUniform: true,
      opacity: 0,
      cropHelperType: "frame-halo",
    });
    const hole = new Rect({
      ...helperProperties,
      absolutePositioned: true,
      inverted: true,
      fill: "#000000",
      cropHelperType: "hole",
    });
    const clipFrame = new Rect({
      ...helperProperties,
      absolutePositioned: true,
      fill: "#000000",
      cropHelperType: "clip",
    });
    const overlay = new Rect({
      ...helperProperties,
      left: 0,
      top: 0,
      width: canvas.getWidth(),
      height: canvas.getHeight(),
      fill: "rgba(2,6,23,0.66)",
      opacity: 0,
      cropHelperType: "overlay",
      clipPath: hole,
    });
    const gridLines = createGridLines();
    const helpers = [overlay, frameHalo, ...gridLines, frame];

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
      clipPath: clipFrame,
      selectable: true,
      evented: true,
      hasBorders: true,
      hasControls: true,
      lockMovementX: false,
      lockMovementY: false,
      lockScalingX: false,
      lockScalingY: false,
      lockScalingFlip: true,
      lockRotation: true,
      hoverCursor: "grab",
      moveCursor: "grabbing",
      cornerColor: "#ffffff",
      cornerStrokeColor: "#2563eb",
      cornerStyle: "circle",
      cornerSize: 14,
      touchCornerSize: 42,
      transparentCorners: false,
      borderColor: "rgba(255,255,255,0.92)",
      borderDashArray: [5, 5],
      padding: 0,
    });
    image.setControlsVisibility({
      tl: true,
      tr: true,
      br: true,
      bl: true,
      mt: false,
      mb: false,
      ml: false,
      mr: false,
      mtr: false,
    });
    image.setCoords();

    canvas.set({
      selection: false,
      skipTargetFind: false,
      preserveObjectStacking: true,
      uniformScaling: true,
      controlsAboveOverlay: true,
      defaultCursor: "default",
    });
    canvas.add(...helpers);

    const zoomLimits = {
      sourceWidth,
      sourceHeight,
      ...getCropZoomLimits(image, frame, sourceWidth, sourceHeight),
      scaleSignX: (snapshot.scaleX || 1) < 0 ? -1 : 1,
      scaleSignY: (snapshot.scaleY || 1) < 0 ? -1 : 1,
    };
    const session = {
      canvas,
      image,
      frame,
      frameHalo,
      hole,
      clipFrame,
      overlay,
      gridLines,
      helpers,
      snapshot,
      sourceWidth,
      sourceHeight,
      zoomLimits,
      objectInteraction,
      imageInteraction,
      canvasInteraction,
      decorationProgress: 0,
      animation: null,
      finishing: false,
    };

    sessionRef.current = session;
    positionCropDecorations(session);
    constrainSession(session);
    canvas.setActiveObject(image);
    canvas.requestRenderAll();
    animateDecorations(session, 1);

    setIsCropping(true);
    onModeChange?.(true);
    onSelectionChange?.(image);
  }, [canvas, constrainSession, onModeChange, onSelectionChange]);

  useEffect(() => {
    if (!canvas || !isCropping) return;

    const syncImageTransform = (event) => {
      const session = sessionRef.current;
      if (!session || event.target !== session.image) return;
      constrainSession(session);
      session.canvas.requestRenderAll();
    };
    const keepImageSelected = () => {
      const session = sessionRef.current;
      if (!session || session.finishing) return;
      queueMicrotask(() => {
        if (sessionRef.current !== session || session.finishing) return;
        session.canvas.setActiveObject(session.image);
        session.canvas.requestRenderAll();
      });
    };
    const confirmOnDoubleClick = (event) => {
      const session = sessionRef.current;
      if (session && event.target === session.image) {
        event.e?.preventDefault?.();
        applyCrop();
      }
    };
    const zoomWithTrackpad = (event) => {
      const session = sessionRef.current;
      const nativeEvent = event.e;
      if (
        !session ||
        session.finishing ||
        !(nativeEvent?.ctrlKey || nativeEvent?.metaKey)
      ) {
        return;
      }

      nativeEvent.preventDefault();
      nativeEvent.stopPropagation();
      const factor = Math.exp(-nativeEvent.deltaY * 0.002);
      const anchor = event.scenePoint || session.frame.getCenterPoint();
      const center = session.image.getCenterPoint();
      session.image.set({
        scaleX: session.image.scaleX * factor,
        scaleY: session.image.scaleY * factor,
      });
      session.image.setPositionByOrigin(
        new Point(
          anchor.x - (anchor.x - center.x) * factor,
          anchor.y - (anchor.y - center.y) * factor,
        ),
        "center",
        "center",
      );
      constrainSession(session);
      session.canvas.requestRenderAll();
    };

    canvas.on("object:moving", syncImageTransform);
    canvas.on("object:scaling", syncImageTransform);
    canvas.on("object:modified", syncImageTransform);
    canvas.on("selection:cleared", keepImageSelected);
    canvas.on("mouse:dblclick", confirmOnDoubleClick);
    canvas.on("mouse:wheel", zoomWithTrackpad);
    return () => {
      canvas.off("object:moving", syncImageTransform);
      canvas.off("object:scaling", syncImageTransform);
      canvas.off("object:modified", syncImageTransform);
      canvas.off("selection:cleared", keepImageSelected);
      canvas.off("mouse:dblclick", confirmOnDoubleClick);
      canvas.off("mouse:wheel", zoomWithTrackpad);
    };
  }, [applyCrop, canvas, constrainSession, isCropping]);

  useEffect(() => {
    if (!canvas || !isCropping) return;
    const pinchState = { current: null };
    const upperCanvas = canvas.upperCanvasEl;

    const startPinch = (event) => {
      const session = sessionRef.current;
      if (!session || session.finishing || event.touches.length !== 2) return;
      event.preventDefault();
      if (canvas._currentTransform) canvas.endCurrentTransform(event);

      const midpoint = getTouchMidpoint(canvas, event.touches);
      pinchState.current = {
        distance: Math.max(1, distanceBetweenTouches(event.touches)),
        midpoint,
        imageCenter: session.image.getCenterPoint(),
        scaleX: session.image.scaleX,
        scaleY: session.image.scaleY,
      };
    };
    const movePinch = (event) => {
      const session = sessionRef.current;
      const pinch = pinchState.current;
      if (!session || !pinch || event.touches.length < 2) return;
      event.preventDefault();
      event.stopPropagation();

      const factor = distanceBetweenTouches(event.touches) / pinch.distance;
      const midpoint = getTouchMidpoint(canvas, event.touches);
      session.image.set({
        scaleX: pinch.scaleX * factor,
        scaleY: pinch.scaleY * factor,
      });
      session.image.setPositionByOrigin(
        new Point(
          midpoint.x - (pinch.midpoint.x - pinch.imageCenter.x) * factor,
          midpoint.y - (pinch.midpoint.y - pinch.imageCenter.y) * factor,
        ),
        "center",
        "center",
      );
      constrainSession(session);
      session.canvas.requestRenderAll();
    };
    const endPinch = (event) => {
      if (!pinchState.current || event.touches.length >= 2) return;
      event.preventDefault();
      event.stopPropagation();
      pinchState.current = null;

      const session = sessionRef.current;
      if (!session) return;
      session.image.setCoords();
      session.canvas.fire("object:modified", {
        target: session.image,
        transform: { action: "scale" },
      });
      session.canvas.requestRenderAll();
    };

    upperCanvas.addEventListener("touchstart", startPinch, { passive: false });
    document.addEventListener("touchmove", movePinch, {
      capture: true,
      passive: false,
    });
    document.addEventListener("touchend", endPinch, {
      capture: true,
      passive: false,
    });
    document.addEventListener("touchcancel", endPinch, {
      capture: true,
      passive: false,
    });
    return () => {
      upperCanvas.removeEventListener("touchstart", startPinch);
      document.removeEventListener("touchmove", movePinch, { capture: true });
      document.removeEventListener("touchend", endPinch, { capture: true });
      document.removeEventListener("touchcancel", endPinch, { capture: true });
    };
  }, [canvas, constrainSession, isCropping]);

  useEffect(() => {
    if (!isCropping) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelCrop();
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.matches("button, input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        applyCrop();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [applyCrop, cancelCrop, isCropping]);

  useEffect(() => () => {
    const session = sessionRef.current;
    if (session?.canvas === canvas) finalizeSession(session, false);
  }, [canvas, finalizeSession]);

  return { isCropping, startCrop, cancelCrop, applyCrop };
}
