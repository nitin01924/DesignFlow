import { Control, Line, Point, Rect, util } from "fabric";
import { constrainCropFrameToImage } from "./cropGeometry.js";

const STATIC_HELPER_PROPERTIES = {
  selectable: false,
  evented: false,
  excludeFromExport: true,
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

const drawRoundedRect = (context, width, height, radius) => {
  const left = -width / 2;
  const top = -height / 2;
  context.beginPath();
  context.moveTo(left + radius, top);
  context.lineTo(left + width - radius, top);
  context.quadraticCurveTo(left + width, top, left + width, top + radius);
  context.lineTo(left + width, top + height - radius);
  context.quadraticCurveTo(
    left + width,
    top + height,
    left + width - radius,
    top + height,
  );
  context.lineTo(left + radius, top + height);
  context.quadraticCurveTo(left, top + height, left, top + height - radius);
  context.lineTo(left, top + radius);
  context.quadraticCurveTo(left, top, left + radius, top);
  context.closePath();
};

const renderCropHandle = (width, height) =>
  function renderHandle(context, left, top, _styleOverride, object) {
    context.save();
    context.translate(left, top);
    context.rotate(util.degreesToRadians(object.angle || 0));
    context.globalAlpha *= object.opacity ?? 1;
    context.shadowColor = "rgba(2,6,23,0.34)";
    context.shadowBlur = 4;
    context.shadowOffsetY = 1;
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#2563eb";
    context.lineWidth = 1.5;
    drawRoundedRect(context, width, height, Math.min(width, height) / 2);
    context.fill();
    context.shadowColor = "transparent";
    context.stroke();
    context.restore();
  };

const installCropControls = (frame) => {
  const cornerRenderer = renderCropHandle(13, 13);
  const verticalRenderer = renderCropHandle(6, 20);
  const horizontalRenderer = renderCropHandle(20, 6);

  Object.entries(frame.controls).forEach(([key, control]) => {
    let render = cornerRenderer;
    if (key === "ml" || key === "mr") render = verticalRenderer;
    if (key === "mt" || key === "mb") render = horizontalRenderer;
    frame.controls[key] = new Control({ ...control, render });
  });
};

export class ResizableCropViewport {
  constructor({ canvas, image }) {
    this.canvas = canvas;
    const center = image.getCenterPoint();
    const scaleX = Math.abs(image.scaleX || 1);
    const scaleY = Math.abs(image.scaleY || 1);
    const geometry = {
      left: center.x,
      top: center.y,
      originX: "center",
      originY: "center",
      width: image.width,
      height: image.height,
      scaleX,
      scaleY,
      angle: image.angle || 0,
      rx: Math.min(image.width / 2, 10 / scaleX),
      ry: Math.min(image.height / 2, 10 / scaleY),
    };

    this.frame = new Rect({
      ...geometry,
      selectable: true,
      evented: true,
      excludeFromExport: true,
      fill: "rgba(255,255,255,0.001)",
      stroke: "rgba(255,255,255,0.98)",
      strokeWidth: 2,
      strokeUniform: true,
      hasBorders: false,
      hasControls: true,
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingFlip: true,
      centeredScaling: false,
      cornerColor: "#ffffff",
      cornerStrokeColor: "#2563eb",
      cornerStyle: "circle",
      cornerSize: 13,
      touchCornerSize: 44,
      transparentCorners: false,
      hoverCursor: "grab",
      moveCursor: "grabbing",
      opacity: 0,
      cropHelperType: "frame",
    });
    this.frame.setControlsVisibility({
      tl: true,
      tr: true,
      br: true,
      bl: true,
      mt: true,
      mb: true,
      ml: true,
      mr: true,
      mtr: false,
    });
    installCropControls(this.frame);
    this.frameHalo = new Rect({
      ...STATIC_HELPER_PROPERTIES,
      ...geometry,
      fill: "transparent",
      stroke: "rgba(2,6,23,0.68)",
      strokeWidth: 6,
      strokeUniform: true,
      opacity: 0,
      cropHelperType: "frame-halo",
    });
    this.hole = new Rect({
      ...STATIC_HELPER_PROPERTIES,
      ...geometry,
      absolutePositioned: true,
      inverted: true,
      fill: "#000000",
      cropHelperType: "hole",
    });
    this.clipFrame = new Rect({
      ...STATIC_HELPER_PROPERTIES,
      ...geometry,
      absolutePositioned: true,
      fill: "#000000",
      cropHelperType: "clip",
    });
    this.overlay = new Rect({
      ...STATIC_HELPER_PROPERTIES,
      left: 0,
      top: 0,
      width: canvas.getWidth(),
      height: canvas.getHeight(),
      fill: "rgba(2,6,23,0.68)",
      opacity: 0,
      cropHelperType: "overlay",
      clipPath: this.hole,
    });
    this.gridLines = Array.from({ length: 4 }, () =>
      new Line([0, 0, 0, 0], {
        ...STATIC_HELPER_PROPERTIES,
        stroke: "rgba(255,255,255,0.8)",
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
    this.sync();
  }

  add() {
    this.canvas.add(...this.helpers);
  }

  remove() {
    this.canvas.remove(...this.helpers);
  }

  activate() {
    this.frame.set({ selectable: true, evented: true, hasControls: true });
    this.canvas.setActiveObject(this.frame);
  }

  setInteractive(interactive) {
    this.frame.set({
      selectable: interactive,
      evented: interactive,
      hasControls: interactive,
    });
  }

  captureGeometry() {
    return {
      left: this.frame.left,
      top: this.frame.top,
      scaleX: this.frame.scaleX,
      scaleY: this.frame.scaleY,
    };
  }

  applyGeometry({ left, top, scaleX, scaleY }) {
    this.frame.set({ left, top, scaleX, scaleY });
    this.frame.setCoords();
    this.sync();
  }

  constrain(image, sourceWidth, sourceHeight, transform) {
    constrainCropFrameToImage(
      this.frame,
      image,
      sourceWidth,
      sourceHeight,
      transform,
    );
    this.sync();
  }

  sync() {
    copyFrameGeometry(this.frameHalo, this.frame);
    copyFrameGeometry(this.hole, this.frame);
    copyFrameGeometry(this.clipFrame, this.frame);

    const matrix = this.frame.calcTransformMatrix();
    const halfWidth = this.frame.width / 2;
    const halfHeight = this.frame.height / 2;
    const definitions = [
      [
        new Point(-halfWidth / 3, -halfHeight),
        new Point(-halfWidth / 3, halfHeight),
      ],
      [
        new Point(halfWidth / 3, -halfHeight),
        new Point(halfWidth / 3, halfHeight),
      ],
      [
        new Point(-halfWidth, -halfHeight / 3),
        new Point(halfWidth, -halfHeight / 3),
      ],
      [
        new Point(-halfWidth, halfHeight / 3),
        new Point(halfWidth, halfHeight / 3),
      ],
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

  resizeCanvas() {
    this.overlay.set({
      left: 0,
      top: 0,
      width: this.canvas.getWidth(),
      height: this.canvas.getHeight(),
      scaleX: 1,
      scaleY: 1,
    });
    this.sync();
  }

  setOpacity(opacity) {
    this.overlay.set("opacity", opacity);
    this.frame.set("opacity", opacity);
    this.frameHalo.set("opacity", opacity);
    this.gridLines.forEach((line) => line.set("opacity", opacity));
  }
}
