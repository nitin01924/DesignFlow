import { Point, util } from "fabric";
import {
  calculateCropResult,
  constrainImagePosition,
  getExpandedImageCenter,
  getSourceDimensions,
  rotateVector,
} from "./cropGeometry.js";
import { ResizableCropViewport } from "./ResizableCropViewport.js";

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
  "objectCaching",
];

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

// The viewport and the source image are independent edit targets. Fabric owns
// frame handles while the session only pans the fixed-scale image beneath it.
// High-frequency input stays outside React and history commits only on Done.
export class ImageCropSession {
  constructor({ canvas, image, onFinish }) {
    this.canvas = canvas;
    this.image = image;
    this.onFinish = onFinish;
    this.active = false;
    this.finishing = false;
    this.manualPan = null;
    this.decorationProgress = 0;
    this.decorationAnimation = null;
    this.resetAnimation = null;
    this.resetTarget = null;
    this.momentumFrame = null;
    this.lastInputWasTouch = false;
    this.lastDragSample = null;
    this.dragVelocity = new Point(0, 0);

    this.handleFrameTransform = this.handleFrameTransform.bind(this);
    this.handleSelectionCleared = this.handleSelectionCleared.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleCanvasResize = this.handleCanvasResize.bind(this);
  }

  start() {
    if (this.active) return false;
    this.snapshot = captureCropState(this.image);
    const { width, height } = getSourceDimensions(this.image);
    this.sourceWidth = width;
    this.sourceHeight = height;
    const expandedCenter = getExpandedImageCenter(
      this.image,
      this.sourceWidth,
      this.sourceHeight,
    );
    this.initialExpandedCenter = expandedCenter;

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
      centeredScaling: this.canvas.centeredScaling,
      centeredKey: this.canvas.centeredKey,
      controlsAboveOverlay: this.canvas.controlsAboveOverlay,
      defaultCursor: this.canvas.defaultCursor,
      allowTouchScrolling: this.canvas.allowTouchScrolling,
    };
    this.objectInteraction.forEach(({ object }) => {
      object.set({ selectable: false, evented: false });
    });

    this.viewport = new ResizableCropViewport({
      canvas: this.canvas,
      image: this.image,
    });
    this.initialFrameGeometry = this.viewport.captureGeometry();
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
      clipPath: this.viewport.clipFrame,
      selectable: false,
      evented: false,
      hasBorders: false,
      hasControls: false,
      lockRotation: true,
      objectCaching: true,
    });
    this.image.setCoords();

    this.canvas.set({
      selection: false,
      skipTargetFind: false,
      preserveObjectStacking: true,
      uniformScaling: false,
      centeredScaling: false,
      centeredKey: null,
      controlsAboveOverlay: true,
      defaultCursor: "default",
      allowTouchScrolling: false,
    });
    this.viewport.add();
    this.active = true;
    this.constrainImage();
    this.bindInput();
    this.viewport.activate();
    this.canvas.requestRenderAll();
    this.animateDecorations(1);
    return true;
  }

  bindInput() {
    this.canvas.on("object:scaling", this.handleFrameTransform);
    this.canvas.on("object:modified", this.handleFrameTransform);
    this.canvas.on("selection:cleared", this.handleSelectionCleared);
    this.canvas.on("mouse:dblclick", this.handleDoubleClick);
    this.canvas.on("mouse:down", this.handlePointerDown);
    this.canvas.on("mouse:move", this.handlePointerMove);
    this.canvas.on("mouse:up", this.handlePointerUp);
    this.canvas.on("designflow:canvas-resized", this.handleCanvasResize);
  }

  unbindInput() {
    this.canvas.off("object:scaling", this.handleFrameTransform);
    this.canvas.off("object:modified", this.handleFrameTransform);
    this.canvas.off("selection:cleared", this.handleSelectionCleared);
    this.canvas.off("mouse:dblclick", this.handleDoubleClick);
    this.canvas.off("mouse:down", this.handlePointerDown);
    this.canvas.off("mouse:move", this.handlePointerMove);
    this.canvas.off("mouse:up", this.handlePointerUp);
    this.canvas.off("designflow:canvas-resized", this.handleCanvasResize);
  }

  constrainImage() {
    return constrainImagePosition(
      this.image,
      this.viewport.frame,
      this.sourceWidth,
      this.sourceHeight,
    );
  }

  handleFrameTransform(event) {
    if (
      !this.active ||
      this.finishing ||
      event.target !== this.viewport.frame
    ) {
      return;
    }
    this.cancelMomentum();
    this.cancelResetAnimation();
    this.viewport.constrain(
      this.image,
      this.sourceWidth,
      this.sourceHeight,
      event.transform,
    );
    this.constrainImage();
    this.canvas.requestRenderAll();
  }

  handleSelectionCleared() {
    if (!this.active || this.finishing) return;
    queueMicrotask(() => {
      if (!this.active || this.finishing) return;
      this.viewport.activate();
      this.canvas.requestRenderAll();
    });
  }

  handleDoubleClick(event) {
    if (event.target !== this.viewport.frame) return;
    event.e?.preventDefault?.();
    this.done();
  }

  handlePointerDown(event) {
    if (!this.active || this.finishing) return;
    this.cancelMomentum();
    this.cancelResetAnimation();
    this.lastInputWasTouch = isTouchInput(event.e);
    this.lastDragSample = null;
    this.dragVelocity = new Point(0, 0);

    if (
      event.target === this.viewport.frame &&
      !event.transform?.corner
    ) {
      this.manualPan = {
        pointer: event.scenePoint,
        imageCenter: this.image.getCenterPoint(),
      };
      event.e?.preventDefault?.();
    }
  }

  handlePointerMove(event) {
    if (!this.active || this.finishing || !this.manualPan) return;
    event.e?.preventDefault?.();
    const pointer = event.scenePoint;
    this.image.setPositionByOrigin(
      new Point(
        this.manualPan.imageCenter.x +
          pointer.x -
          this.manualPan.pointer.x,
        this.manualPan.imageCenter.y +
          pointer.y -
          this.manualPan.pointer.y,
      ),
      "center",
      "center",
    );
    const result = this.constrainImage();
    this.captureDragVelocity(event.e, result.center);
    this.canvas.requestRenderAll();
  }

  handlePointerUp() {
    if (!this.manualPan) return;
    this.manualPan = null;
    if (
      !this.lastInputWasTouch ||
      !this.lastDragSample ||
      window.performance.now() - this.lastDragSample.time > 90
    ) {
      return;
    }
    this.startMomentum();
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
      const constrained = this.constrainImage();
      let localVelocity = rotateVector(
        velocity.x,
        velocity.y,
        -(this.viewport.frame.angle || 0),
      );
      if (constrained.constrainedX) localVelocity.x = 0;
      if (constrained.constrainedY) localVelocity.y = 0;
      velocity = rotateVector(
        localVelocity.x,
        localVelocity.y,
        this.viewport.frame.angle || 0,
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
    if (this.momentumFrame === null) return;
    window.cancelAnimationFrame(this.momentumFrame);
    this.momentumFrame = null;
  }

  handleCanvasResize({ scaleX = 1, scaleY = 1 } = {}) {
    if (!this.active || this.finishing) return;
    const wasResetting = Boolean(this.resetAnimation);
    this.cancelResetAnimation();
    this.initialFrameGeometry = {
      left: this.initialFrameGeometry.left * scaleX,
      top: this.initialFrameGeometry.top * scaleY,
      scaleX: this.initialFrameGeometry.scaleX * Math.abs(scaleX),
      scaleY: this.initialFrameGeometry.scaleY * Math.abs(scaleY),
    };
    this.initialExpandedCenter = new Point(
      this.initialExpandedCenter.x * scaleX,
      this.initialExpandedCenter.y * scaleY,
    );
    this.snapshot = {
      ...this.snapshot,
      left: this.snapshot.left * scaleX,
      top: this.snapshot.top * scaleY,
      scaleX: this.snapshot.scaleX * Math.abs(scaleX),
      scaleY: this.snapshot.scaleY * Math.abs(scaleY),
    };
    this.viewport.resizeCanvas();
    this.constrainImage();
    this.canvas.requestRenderAll();
    if (wasResetting) this.reset();
  }

  createResetTarget() {
    return {
      frame: { ...this.initialFrameGeometry },
      image: {
        left: this.initialExpandedCenter.x,
        top: this.initialExpandedCenter.y,
      },
    };
  }

  reset() {
    if (!this.active || this.finishing) return;
    this.cancelMomentum();
    this.cancelResetAnimation();
    this.manualPan = null;
    if (this.canvas._currentTransform) this.canvas.endCurrentTransform();

    this.resetTarget = this.createResetTarget();
    const frameStart = this.viewport.captureGeometry();
    const imageCenter = this.image.getCenterPoint();
    const start = [
      frameStart.left,
      frameStart.top,
      frameStart.scaleX,
      frameStart.scaleY,
      imageCenter.x,
      imageCenter.y,
    ];
    const end = [
      this.resetTarget.frame.left,
      this.resetTarget.frame.top,
      this.resetTarget.frame.scaleX,
      this.resetTarget.frame.scaleY,
      this.resetTarget.image.left,
      this.resetTarget.image.top,
    ];
    const applyValues = ([
      frameLeft,
      frameTop,
      frameScaleX,
      frameScaleY,
      imageLeft,
      imageTop,
    ]) => {
      this.viewport.applyGeometry({
        left: frameLeft,
        top: frameTop,
        scaleX: frameScaleX,
        scaleY: frameScaleY,
      });
      this.image.set({
        left: imageLeft,
        top: imageTop,
      });
      this.constrainImage();
      this.canvas.renderAll();
    };
    const complete = () => {
      this.resetAnimation = null;
      this.resetTarget = null;
      if (!this.active || this.finishing) return;
      this.viewport.setInteractive(true);
      this.viewport.activate();
      this.canvas.requestRenderAll();
    };

    this.viewport.setInteractive(false);
    if (prefersReducedMotion()) {
      applyValues(end);
      complete();
      return;
    }
    this.resetAnimation = util.animate({
      startValue: start,
      endValue: end,
      duration: 220,
      target: this.viewport.frame,
      onChange: applyValues,
      onComplete: complete,
    });
  }

  applyResetTarget() {
    if (!this.resetTarget) return;
    this.viewport.applyGeometry(this.resetTarget.frame);
    this.image.set(this.resetTarget.image);
    this.constrainImage();
  }

  cancelResetAnimation(complete = false) {
    if (!this.resetAnimation) return;
    this.resetAnimation.abort();
    this.resetAnimation = null;
    if (complete) this.applyResetTarget();
    this.resetTarget = null;
    if (this.active && !this.finishing) {
      this.viewport.setInteractive(true);
      this.viewport.activate();
    }
  }

  setDecorationProgress(progress) {
    this.decorationProgress = progress;
    this.viewport.setOpacity(progress);
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
    this.manualPan = null;
    this.unbindInput();
    if (this.canvas._currentTransform) this.canvas.endCurrentTransform();
    this.viewport.setInteractive(false);
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
          this.viewport.frame,
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
    this.viewport.remove();
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
