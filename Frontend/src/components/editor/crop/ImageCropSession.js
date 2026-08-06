import { Line, Point, Rect, util } from "fabric";
import {
  calculateCropResult,
  clamp,
  constrainCropTransform,
  createCropConstraints,
  getExpandedImageCenter,
  getSourceDimensions,
  isPointInsideCropFrame,
  rotateVector,
  zoomImageAroundPoint,
} from "./cropGeometry.js";

const CROP_STATE_FIELDS = [
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
  "padding",
  "objectCaching",
];

const HELPER_PROPERTIES = {
  selectable: false,
  evented: false,
  excludeFromExport: true,
};

const copyFields = (object, fields) =>
  Object.fromEntries(fields.map((field) => [field, object[field]]));

export const captureCropState = (image) =>
  copyFields(image, CROP_STATE_FIELDS);

const isTouchInput = (event) =>
  Boolean(
    event?.touches ||
      event?.changedTouches ||
      event?.pointerType === "touch",
  );

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const restoreControlVisibility = (image, visibility) => {
  if (visibility) {
    image._controlsVisibility = { ...visibility };
  } else {
    delete image._controlsVisibility;
  }
};

const copyFrameGeometry = (target, frame) => {
  target.set({
    left: frame.left,
    top: frame.top,
    width: frame.width,
    height: frame.height,
    scaleX: frame.scaleX,
    scaleY: frame.scaleY,
    angle: frame.angle,
    originX: frame.originX,
    originY: frame.originY,
    rx: frame.rx,
    ry: frame.ry,
  });
  target.setCoords();
};

const touchDistance = (touches) =>
  Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );

const touchMidpoint = (canvas, touches) => {
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

// A crop session owns all temporary Fabric state and high-frequency input.
// React only starts/finishes the session, keeping pointer frames off the
// component render path and guaranteeing a single history commit on Done.
export class ImageCropSession {
  constructor({ canvas, image, onFinish }) {
    this.canvas = canvas;
    this.image = image;
    this.onFinish = onFinish;
    this.active = false;
    this.finishing = false;
    this.pinch = null;
    this.decorationProgress = 0;
    this.decorationAnimation = null;
    this.resetAnimation = null;
    this.momentumFrame = null;
    this.lastInputWasTouch = false;
    this.lastDragSample = null;
    this.dragVelocity = new Point(0, 0);

    this.handleTransform = this.handleTransform.bind(this);
    this.handleSelectionCleared = this.handleSelectionCleared.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleCanvasResize = this.handleCanvasResize.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  start() {
    if (this.active) return false;

    this.snapshot = captureCropState(this.image);
    const sourceDimensions = getSourceDimensions(this.image);
    this.sourceWidth = sourceDimensions.width;
    this.sourceHeight = sourceDimensions.height;
    const visibleCenter = this.image.getCenterPoint();
    const expandedCenter = getExpandedImageCenter(
      this.image,
      this.sourceWidth,
      this.sourceHeight,
    );

    this.objectInteraction = this.canvas.getObjects().map((object) => ({
      object,
      selectable: object.selectable,
      evented: object.evented,
    }));
    this.imageInteraction = {
      properties: copyFields(this.image, IMAGE_INTERACTION_FIELDS),
      controlsVisibility: this.image._controlsVisibility
        ? { ...this.image._controlsVisibility }
        : null,
      clipPath: this.image.clipPath,
    };
    this.canvasInteraction = {
      selection: this.canvas.selection,
      skipTargetFind: this.canvas.skipTargetFind,
      preserveObjectStacking: this.canvas.preserveObjectStacking,
      uniformScaling: this.canvas.uniformScaling,
      controlsAboveOverlay: this.canvas.controlsAboveOverlay,
      defaultCursor: this.canvas.defaultCursor,
      allowTouchScrolling: this.canvas.allowTouchScrolling,
    };

    this.objectInteraction.forEach(({ object }) => {
      if (object !== this.image) {
        object.set({ selectable: false, evented: false });
      }
    });

    this.createViewport(visibleCenter);
    this.image.set({
      left: expandedCenter.x,
      top: expandedCenter.y,
      originX: "center",
      originY: "center",
      width: this.sourceWidth,
      height: this.sourceHeight,
      cropX: 0,
      cropY: 0,
      cropModeActive: true,
      clipPath: this.clipFrame,
      selectable: true,
      evented: true,
      hasBorders: false,
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
      touchCornerSize: 44,
      transparentCorners: false,
      padding: 0,
      objectCaching: true,
    });
    this.image.setControlsVisibility({
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
    this.image.setCoords();

    this.canvas.set({
      selection: false,
      skipTargetFind: false,
      preserveObjectStacking: true,
      uniformScaling: true,
      controlsAboveOverlay: true,
      defaultCursor: "default",
      allowTouchScrolling: false,
    });
    this.canvas.add(...this.helpers);
    this.constraints = createCropConstraints(
      this.image,
      this.frame,
      this.sourceWidth,
      this.sourceHeight,
    );
    this.active = true;
    this.positionDecorations();
    this.constrain();
    this.bindInput();
    this.canvas.setActiveObject(this.image);
    this.canvas.requestRenderAll();
    this.animateDecorations(1);
    return true;
  }

  createViewport(center) {
    const frameScaleX = Math.abs(this.image.scaleX || 1);
    const frameScaleY = Math.abs(this.image.scaleY || 1);
    const rx = Math.min(this.image.width / 2, 12 / frameScaleX);
    const ry = Math.min(this.image.height / 2, 12 / frameScaleY);
    const frameGeometry = {
      left: center.x,
      top: center.y,
      originX: "center",
      originY: "center",
      width: this.image.width,
      height: this.image.height,
      scaleX: frameScaleX,
      scaleY: frameScaleY,
      angle: this.image.angle || 0,
      rx,
      ry,
    };

    this.frame = new Rect({
      ...HELPER_PROPERTIES,
      ...frameGeometry,
      fill: "transparent",
      stroke: "rgba(255,255,255,0.96)",
      strokeWidth: 2,
      strokeUniform: true,
      opacity: 0,
      cropHelperType: "frame",
    });
    this.frameHalo = new Rect({
      ...HELPER_PROPERTIES,
      ...frameGeometry,
      fill: "transparent",
      stroke: "rgba(2,6,23,0.62)",
      strokeWidth: 6,
      strokeUniform: true,
      opacity: 0,
      cropHelperType: "frame-halo",
    });
    this.hole = new Rect({
      ...HELPER_PROPERTIES,
      ...frameGeometry,
      absolutePositioned: true,
      inverted: true,
      fill: "#000000",
      cropHelperType: "hole",
    });
    this.clipFrame = new Rect({
      ...HELPER_PROPERTIES,
      ...frameGeometry,
      absolutePositioned: true,
      fill: "#000000",
      cropHelperType: "clip",
    });
    this.overlay = new Rect({
      ...HELPER_PROPERTIES,
      left: 0,
      top: 0,
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight(),
      fill: "rgba(2,6,23,0.68)",
      opacity: 0,
      cropHelperType: "overlay",
      clipPath: this.hole,
    });
    this.gridLines = Array.from({ length: 4 }, () =>
      new Line([0, 0, 0, 0], {
        ...HELPER_PROPERTIES,
        stroke: "rgba(255,255,255,0.78)",
        strokeWidth: 1,
        strokeUniform: true,
        opacity: 0,
        cropHelperType: "grid",
      }),
    );
    this.helpers = [
      this.overlay,
      this.frameHalo,
      ...this.gridLines,
      this.frame,
    ];
  }

  positionDecorations() {
    copyFrameGeometry(this.frameHalo, this.frame);
    copyFrameGeometry(this.hole, this.frame);
    copyFrameGeometry(this.clipFrame, this.frame);

    const matrix = this.frame.calcTransformMatrix();
    const halfWidth = this.frame.width / 2;
    const halfHeight = this.frame.height / 2;
    const definitions = [
      [new Point(-halfWidth / 3, -halfHeight), new Point(-halfWidth / 3, halfHeight)],
      [new Point(halfWidth / 3, -halfHeight), new Point(halfWidth / 3, halfHeight)],
      [new Point(-halfWidth, -halfHeight / 3), new Point(halfWidth, -halfHeight / 3)],
      [new Point(-halfWidth, halfHeight / 3), new Point(halfWidth, halfHeight / 3)],
    ];

    definitions.forEach(([start, end], index) => {
      const worldStart = util.transformPoint(start, matrix);
      const worldEnd = util.transformPoint(end, matrix);
      this.gridLines[index].set({
        x1: worldStart.x,
        y1: worldStart.y,
        x2: worldEnd.x,
        y2: worldEnd.y,
      });
      this.gridLines[index].setCoords();
    });
  }

  bindInput() {
    this.canvas.on("object:moving", this.handleTransform);
    this.canvas.on("object:scaling", this.handleTransform);
    this.canvas.on("object:modified", this.handleTransform);
    this.canvas.on("selection:cleared", this.handleSelectionCleared);
    this.canvas.on("mouse:dblclick", this.handleDoubleClick);
    this.canvas.on("mouse:wheel", this.handleWheel);
    this.canvas.on("mouse:down", this.handlePointerDown);
    this.canvas.on("mouse:up", this.handlePointerUp);
    this.canvas.on("designflow:canvas-resized", this.handleCanvasResize);
    this.canvas.upperCanvasEl.addEventListener(
      "touchstart",
      this.handleTouchStart,
      { passive: false },
    );
    document.addEventListener("touchmove", this.handleTouchMove, {
      capture: true,
      passive: false,
    });
    document.addEventListener("touchend", this.handleTouchEnd, {
      capture: true,
      passive: false,
    });
    document.addEventListener("touchcancel", this.handleTouchEnd, {
      capture: true,
      passive: false,
    });
  }

  unbindInput() {
    this.canvas.off("object:moving", this.handleTransform);
    this.canvas.off("object:scaling", this.handleTransform);
    this.canvas.off("object:modified", this.handleTransform);
    this.canvas.off("selection:cleared", this.handleSelectionCleared);
    this.canvas.off("mouse:dblclick", this.handleDoubleClick);
    this.canvas.off("mouse:wheel", this.handleWheel);
    this.canvas.off("mouse:down", this.handlePointerDown);
    this.canvas.off("mouse:up", this.handlePointerUp);
    this.canvas.off("designflow:canvas-resized", this.handleCanvasResize);
    this.canvas.upperCanvasEl.removeEventListener(
      "touchstart",
      this.handleTouchStart,
    );
    document.removeEventListener("touchmove", this.handleTouchMove, {
      capture: true,
    });
    document.removeEventListener("touchend", this.handleTouchEnd, {
      capture: true,
    });
    document.removeEventListener("touchcancel", this.handleTouchEnd, {
      capture: true,
    });
  }

  constrain() {
    return constrainCropTransform(this.image, this.frame, this.constraints);
  }

  handleTransform(event) {
    if (!this.active || this.finishing || event.target !== this.image) return;
    const result = this.constrain();
    if (event.transform?.action === "drag" || event.e?.type?.includes("move")) {
      this.captureDragVelocity(event.e, result.center);
    }
    this.canvas.requestRenderAll();
  }

  captureDragVelocity(event, center) {
    if (!this.lastInputWasTouch && !isTouchInput(event)) return;
    this.lastInputWasTouch = true;
    const now = window.performance.now();
    const previous = this.lastDragSample;

    if (previous) {
      const elapsed = now - previous.time;
      if (elapsed > 0 && elapsed < 80) {
        const rawVelocity = new Point(
          (center.x - previous.center.x) / elapsed,
          (center.y - previous.center.y) / elapsed,
        );
        this.dragVelocity = new Point(
          this.dragVelocity.x * 0.25 + rawVelocity.x * 0.75,
          this.dragVelocity.y * 0.25 + rawVelocity.y * 0.75,
        );
      }
    }
    this.lastDragSample = { center, time: now };
  }

  handleSelectionCleared() {
    if (!this.active || this.finishing) return;
    queueMicrotask(() => {
      if (!this.active || this.finishing) return;
      this.canvas.setActiveObject(this.image);
      this.canvas.requestRenderAll();
    });
  }

  handleDoubleClick(event) {
    if (event.target !== this.image) return;
    event.e?.preventDefault?.();
    this.done();
  }

  handleWheel(event) {
    if (!this.active || this.finishing) return;
    const nativeEvent = event.e;
    nativeEvent?.preventDefault?.();
    nativeEvent?.stopPropagation?.();
    this.cancelMomentum();
    this.cancelResetAnimation();

    const delta = clamp(nativeEvent?.deltaY || 0, -240, 240);
    const factor = Math.exp(-delta * 0.0022);
    const scenePoint = event.scenePoint || this.frame.getCenterPoint();
    const anchor = isPointInsideCropFrame(scenePoint, this.frame)
      ? scenePoint
      : this.frame.getCenterPoint();
    zoomImageAroundPoint(this.image, factor, anchor);
    this.constrain();
    this.canvas.requestRenderAll();
  }

  handlePointerDown(event) {
    this.cancelMomentum();
    this.cancelResetAnimation();
    this.lastInputWasTouch = isTouchInput(event.e);
    this.lastDragSample = null;
    this.dragVelocity = new Point(0, 0);
  }

  handlePointerUp() {
    if (
      !this.lastInputWasTouch ||
      this.pinch ||
      !this.lastDragSample ||
      window.performance.now() - this.lastDragSample.time > 90
    ) {
      return;
    }
    this.startMomentum();
  }

  startMomentum() {
    this.cancelMomentum();
    let velocity = this.dragVelocity;
    if (Math.hypot(velocity.x, velocity.y) < 0.05) return;
    let previousTime = window.performance.now();

    const tick = (time) => {
      if (!this.active || this.finishing) return;
      const elapsed = Math.min(32, time - previousTime);
      previousTime = time;
      const center = this.image.getCenterPoint();
      this.image.setPositionByOrigin(
        new Point(
          center.x + velocity.x * elapsed,
          center.y + velocity.y * elapsed,
        ),
        "center",
        "center",
      );
      const constrained = this.constrain();
      let localVelocity = rotateVector(
        velocity.x,
        velocity.y,
        -(this.frame.angle || 0),
      );
      if (constrained.constrainedX) localVelocity.x = 0;
      if (constrained.constrainedY) localVelocity.y = 0;
      velocity = rotateVector(
        localVelocity.x,
        localVelocity.y,
        this.frame.angle || 0,
      );
      const friction = Math.pow(0.9, elapsed / 16.67);
      velocity = new Point(velocity.x * friction, velocity.y * friction);
      this.canvas.requestRenderAll();

      if (Math.hypot(velocity.x, velocity.y) >= 0.02) {
        this.momentumFrame = window.requestAnimationFrame(tick);
      } else {
        this.momentumFrame = null;
      }
    };

    this.momentumFrame = window.requestAnimationFrame(tick);
  }

  cancelMomentum() {
    if (this.momentumFrame !== null) {
      window.cancelAnimationFrame(this.momentumFrame);
      this.momentumFrame = null;
    }
  }

  handleTouchStart(event) {
    if (!this.active || this.finishing || event.touches.length !== 2) return;
    event.preventDefault();
    this.cancelMomentum();
    this.cancelResetAnimation();
    if (this.canvas._currentTransform) {
      this.canvas.endCurrentTransform(event);
    }

    this.pinch = {
      distance: Math.max(1, touchDistance(event.touches)),
      midpoint: touchMidpoint(this.canvas, event.touches),
      imageCenter: this.image.getCenterPoint(),
      scaleX: this.image.scaleX,
      scaleY: this.image.scaleY,
    };
  }

  handleTouchMove(event) {
    if (!this.active || !this.pinch || event.touches.length < 2) return;
    event.preventDefault();
    event.stopPropagation();
    const factor = touchDistance(event.touches) / this.pinch.distance;
    const midpoint = touchMidpoint(this.canvas, event.touches);

    this.image.set({
      scaleX: this.pinch.scaleX * factor,
      scaleY: this.pinch.scaleY * factor,
    });
    this.image.setPositionByOrigin(
      new Point(
        midpoint.x -
          (this.pinch.midpoint.x - this.pinch.imageCenter.x) * factor,
        midpoint.y -
          (this.pinch.midpoint.y - this.pinch.imageCenter.y) * factor,
      ),
      "center",
      "center",
    );
    this.constrain();
    this.canvas.requestRenderAll();
  }

  handleTouchEnd(event) {
    if (!this.pinch || (event.touches?.length || 0) >= 2) return;
    event.preventDefault();
    event.stopPropagation();
    this.pinch = null;
    this.image.setCoords();
    this.canvas.fire("object:modified", {
      target: this.image,
      transform: { action: "scale" },
    });
    this.canvas.requestRenderAll();
  }

  handleCanvasResize({ scaleX = 1, scaleY = 1 } = {}) {
    if (!this.active || this.finishing) return;
    const wasResetting = Boolean(this.resetAnimation);
    this.cancelResetAnimation();
    this.constraints.baseScaleX *= Math.abs(scaleX);
    this.constraints.baseScaleY *= Math.abs(scaleY);
    this.overlay.set({
      left: 0,
      top: 0,
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight(),
      scaleX: 1,
      scaleY: 1,
    });
    this.positionDecorations();
    this.constrain();
    this.canvas.requestRenderAll();
    if (wasResetting) this.reset();
  }

  reset() {
    if (!this.active || this.finishing) return;
    this.cancelMomentum();
    this.cancelResetAnimation();
    if (this.canvas._currentTransform) this.canvas.endCurrentTransform();

    const frameCenter = this.frame.getCenterPoint();
    const target = [
      frameCenter.x,
      frameCenter.y,
      this.constraints.scaleSignX *
        this.constraints.baseScaleX *
        this.constraints.minimumZoom,
      this.constraints.scaleSignY *
        this.constraints.baseScaleY *
        this.constraints.minimumZoom,
    ];
    this.resetTarget = target;
    const start = [
      this.image.getCenterPoint().x,
      this.image.getCenterPoint().y,
      this.image.scaleX,
      this.image.scaleY,
    ];
    const applyValues = ([left, top, scaleX, scaleY]) => {
      this.image.set({ left, top, scaleX, scaleY });
      this.constrain();
      this.canvas.renderAll();
    };
    const complete = () => {
      this.resetAnimation = null;
      this.resetTarget = null;
      if (!this.active || this.finishing) return;
      this.image.set({ evented: true, hasControls: true });
      this.canvas.setActiveObject(this.image);
      this.canvas.requestRenderAll();
    };

    this.image.set({ evented: false, hasControls: false });
    if (prefersReducedMotion()) {
      applyValues(target);
      complete();
      return;
    }
    this.resetAnimation = util.animate({
      startValue: start,
      endValue: target,
      duration: 220,
      target: this.image,
      onChange: applyValues,
      onComplete: complete,
    });
  }

  cancelResetAnimation(complete = false) {
    if (!this.resetAnimation) return;
    this.resetAnimation.abort();
    this.resetAnimation = null;
    if (complete && this.resetTarget) {
      const [left, top, scaleX, scaleY] = this.resetTarget;
      this.image.set({ left, top, scaleX, scaleY });
      this.constrain();
    }
    this.resetTarget = null;
    if (this.active && !this.finishing) {
      this.image.set({ evented: true, hasControls: true });
    }
  }

  setDecorationProgress(progress) {
    this.decorationProgress = progress;
    this.overlay.set("opacity", progress);
    this.frame.set("opacity", progress);
    this.frameHalo.set("opacity", progress);
    this.gridLines.forEach((line) => line.set("opacity", progress));
    this.canvas.renderAll();
  }

  animateDecorations(endValue, onComplete) {
    this.decorationAnimation?.abort();
    const startValue = this.decorationProgress;
    if (prefersReducedMotion() || startValue === endValue) {
      this.setDecorationProgress(endValue);
      onComplete?.();
      return;
    }

    this.decorationAnimation = util.animate({
      startValue,
      endValue,
      duration: endValue > startValue ? 180 : 130,
      target: this.canvas,
      onChange: (value) => this.setDecorationProgress(value),
      onComplete: () => {
        this.decorationAnimation = null;
        onComplete?.();
      },
    });
  }

  done() {
    this.finish(true);
  }

  cancel() {
    this.finish(false);
  }

  finish(apply) {
    if (!this.active || this.finishing) return;
    this.finishing = true;
    this.cancelMomentum();
    this.cancelResetAnimation(apply);
    this.unbindInput();
    if (this.canvas._currentTransform) this.canvas.endCurrentTransform();
    this.image.set({ evented: false, hasControls: false });
    this.canvas.requestRenderAll();
    this.animateDecorations(0, () => this.finalize(apply, true));
  }

  restoreInteraction() {
    this.objectInteraction.forEach(({ object, selectable, evented }) => {
      object.set({ selectable, evented });
    });
    this.image.set({
      ...this.imageInteraction.properties,
      clipPath: this.imageInteraction.clipPath,
    });
    restoreControlVisibility(
      this.image,
      this.imageInteraction.controlsVisibility,
    );
    this.canvas.set(this.canvasInteraction);
  }

  finalize(apply, notify) {
    if (!this.active) return;
    this.decorationAnimation?.abort();
    this.decorationAnimation = null;
    const before = { ...this.snapshot };

    if (apply) {
      this.image.set({
        ...calculateCropResult(
          this.image,
          this.frame,
          this.sourceWidth,
          this.sourceHeight,
        ),
        originX: "center",
        originY: "center",
      });
    } else {
      this.image.set(this.snapshot);
    }
    this.image.set({
      cropModeActive: false,
      lockMovementX: this.snapshot.lockMovementX,
      lockMovementY: this.snapshot.lockMovementY,
      lockRotation: this.snapshot.lockRotation,
      lockScalingX: this.snapshot.lockScalingX,
      lockScalingY: this.snapshot.lockScalingY,
      lockScalingFlip: this.snapshot.lockScalingFlip,
    });
    this.restoreInteraction();
    this.image.setCoords();
    this.canvas.discardActiveObject();
    this.canvas.remove(...this.helpers);
    if (this.image.visible !== false) this.canvas.setActiveObject(this.image);
    this.canvas.requestRenderAll();

    this.active = false;
    this.finishing = false;
    const after = captureCropState(this.image);
    if (apply) {
      this.canvas.fire("designflow:crop", {
        target: this.image,
        before,
        after,
      });
    }
    if (notify) {
      this.onFinish?.({
        session: this,
        image: this.image,
        applied: apply,
        before,
        after,
      });
    }
  }

  dispose() {
    if (!this.active) return;
    this.cancelMomentum();
    this.cancelResetAnimation();
    this.unbindInput();
    this.finalize(false, false);
  }
}
