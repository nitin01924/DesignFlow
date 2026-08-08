import { FabricObject, classRegistry, util } from "fabric";

const MIN_IMAGE_ZOOM = 1;
const MAX_IMAGE_ZOOM = 8;
const FRAME_SERIALIZED_PROPERTIES = [
  "frameKind",
  "frameAssetId",
  "frameImageSrc",
  "frameImageZoom",
  "frameImageOffsetX",
  "frameImageOffsetY",
];

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const roundedRectPath = (context, x, y, width, height, radius) => {
  const resolvedRadius = Math.min(radius, width / 2, height / 2);
  context.moveTo(x + resolvedRadius, y);
  context.lineTo(x + width - resolvedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + resolvedRadius);
  context.lineTo(x + width, y + height - resolvedRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - resolvedRadius,
    y + height,
  );
  context.lineTo(x + resolvedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - resolvedRadius);
  context.lineTo(x, y + resolvedRadius);
  context.quadraticCurveTo(x, y, x + resolvedRadius, y);
};

const getViewport = (frame) => {
  const width = Math.max(1, frame.width || 1);
  const height = Math.max(1, frame.height || 1);

  if (frame.frameKind === "phone") {
    return {
      x: -width / 2 + 9,
      y: -height / 2 + 14,
      width: width - 18,
      height: height - 28,
      radius: 14,
    };
  }
  if (frame.frameKind === "laptop") {
    return {
      x: -width / 2 + 14,
      y: -height / 2 + 10,
      width: width - 28,
      height: height - 40,
      radius: 5,
    };
  }
  if (frame.frameKind === "browser") {
    return {
      x: -width / 2 + 6,
      y: -height / 2 + 27,
      width: width - 12,
      height: height - 33,
      radius: 3,
    };
  }

  return {
    x: -width / 2,
    y: -height / 2,
    width,
    height,
    radius: frame.frameKind === "roundedRectangle" ? 26 : 0,
  };
};

const traceSimpleFrame = (context, frame, viewport) => {
  const { x, y, width, height } = viewport;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  context.beginPath();

  switch (frame.frameKind) {
    case "roundedRectangle":
      roundedRectPath(context, x, y, width, height, viewport.radius);
      break;
    case "circle":
    case "ellipse":
      context.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, Math.PI * 2);
      break;
    case "triangle":
      context.moveTo(centerX, y);
      context.lineTo(x + width, y + height);
      context.lineTo(x, y + height);
      break;
    case "hexagon":
      context.moveTo(x + width * 0.25, y);
      context.lineTo(x + width * 0.75, y);
      context.lineTo(x + width, centerY);
      context.lineTo(x + width * 0.75, y + height);
      context.lineTo(x + width * 0.25, y + height);
      context.lineTo(x, centerY);
      break;
    case "blob":
      context.moveTo(x + width * 0.52, y + height * 0.03);
      context.bezierCurveTo(
        x + width * 0.79,
        y - height * 0.02,
        x + width * 1.02,
        y + height * 0.2,
        x + width * 0.96,
        y + height * 0.5,
      );
      context.bezierCurveTo(
        x + width * 0.91,
        y + height * 0.78,
        x + width * 0.7,
        y + height * 1.02,
        x + width * 0.42,
        y + height * 0.96,
      );
      context.bezierCurveTo(
        x + width * 0.14,
        y + height * 0.91,
        x - width * 0.04,
        y + height * 0.67,
        x + width * 0.04,
        y + height * 0.38,
      );
      context.bezierCurveTo(
        x + width * 0.12,
        y + height * 0.11,
        x + width * 0.3,
        y + height * 0.07,
        x + width * 0.52,
        y + height * 0.03,
      );
      break;
    default:
      context.rect(x, y, width, height);
  }
  context.closePath();
};

const traceContentPath = (context, frame, viewport) => {
  if (["phone", "laptop", "browser"].includes(frame.frameKind)) {
    context.beginPath();
    roundedRectPath(
      context,
      viewport.x,
      viewport.y,
      viewport.width,
      viewport.height,
      viewport.radius,
    );
    context.closePath();
    return;
  }
  traceSimpleFrame(context, frame, viewport);
};

const drawMockupShell = (context, frame, viewport) => {
  const width = frame.width || 1;
  const height = frame.height || 1;
  context.save();
  context.fillStyle = "#111827";
  context.strokeStyle = "#334155";
  context.lineWidth = 2;

  if (frame.frameKind === "phone") {
    context.beginPath();
    roundedRectPath(context, -width / 2, -height / 2, width, height, 22);
    context.closePath();
    context.fill();
    context.beginPath();
    roundedRectPath(context, -18, -height / 2 + 6, 36, 6, 3);
    context.fillStyle = "#020617";
    context.fill();
  } else if (frame.frameKind === "laptop") {
    context.beginPath();
    roundedRectPath(context, -width / 2 + 4, -height / 2, width - 8, height - 24, 10);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(-width / 2, height / 2 - 25);
    context.lineTo(width / 2, height / 2 - 25);
    context.lineTo(width / 2 - 18, height / 2);
    context.lineTo(-width / 2 + 18, height / 2);
    context.closePath();
    context.fillStyle = "#64748b";
    context.fill();
  } else if (frame.frameKind === "browser") {
    context.beginPath();
    roundedRectPath(context, -width / 2, -height / 2, width, height, 10);
    context.closePath();
    context.fillStyle = "#f8fafc";
    context.fill();
    context.stroke();
    context.fillStyle = "#e2e8f0";
    context.fillRect(-width / 2 + 1, -height / 2 + 10, width - 2, 17);
    [0, 1, 2].forEach((index) => {
      context.beginPath();
      context.arc(-width / 2 + 12 + index * 9, -height / 2 + 18.5, 2.5, 0, Math.PI * 2);
      context.fillStyle = ["#fb7185", "#fbbf24", "#34d399"][index];
      context.fill();
    });
  }

  context.restore();

  context.save();
  traceContentPath(context, frame, viewport);
  context.strokeStyle = frame.frameDropActive || frame.frameEditActive
    ? "#2563eb"
    : "rgba(15, 23, 42, 0.4)";
  context.lineWidth = frame.frameDropActive || frame.frameEditActive ? 4 : 1.5;
  context.stroke();
  context.restore();
};

const drawPlaceholder = (context, viewport) => {
  const centerX = viewport.x + viewport.width / 2;
  const centerY = viewport.y + viewport.height / 2;
  const size = Math.max(12, Math.min(viewport.width, viewport.height) * 0.15);
  context.fillStyle = "#e2e8f0";
  context.fillRect(viewport.x, viewport.y, viewport.width, viewport.height);
  context.strokeStyle = "#94a3b8";
  context.lineWidth = Math.max(1.5, size * 0.1);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(centerX - size, centerY + size * 0.55);
  context.lineTo(centerX - size * 0.3, centerY - size * 0.2);
  context.lineTo(centerX + size * 0.18, centerY + size * 0.25);
  context.lineTo(centerX + size * 0.56, centerY - size * 0.22);
  context.lineTo(centerX + size, centerY + size * 0.55);
  context.stroke();
  context.beginPath();
  context.arc(centerX + size * 0.42, centerY - size * 0.5, size * 0.18, 0, Math.PI * 2);
  context.stroke();
};

const drawEditGrid = (context, viewport) => {
  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.78)";
  context.lineWidth = 1;
  context.setLineDash([4, 4]);
  for (let step = 1; step <= 2; step += 1) {
    const x = viewport.x + (viewport.width * step) / 3;
    const y = viewport.y + (viewport.height * step) / 3;
    context.beginPath();
    context.moveTo(x, viewport.y);
    context.lineTo(x, viewport.y + viewport.height);
    context.moveTo(viewport.x, y);
    context.lineTo(viewport.x + viewport.width, y);
    context.stroke();
  }
  context.restore();
};

// A frame is deliberately one Fabric object. Its image source and focal
// transform live inside the object so Layers, history, save/load, and export
// never have to coordinate a fragile group of helper objects.
export class DesignFlowFrame extends FabricObject {
  static type = "DesignFlowFrame";

  constructor(options = {}) {
    const {
      frameKind = "rectangle",
      frameAssetId = "rectangle",
      frameImageSrc = "",
      frameImageZoom = 1,
      frameImageOffsetX = 0,
      frameImageOffsetY = 0,
      ...fabricOptions
    } = options;
    super({
      width: 220,
      height: 180,
      fill: "transparent",
      strokeWidth: 0,
      objectCaching: true,
      ...fabricOptions,
    });
    this.frameKind = frameKind;
    this.frameAssetId = frameAssetId;
    this.frameImageSrc = frameImageSrc || "";
    this.frameImageZoom = clamp(Number(frameImageZoom) || 1, MIN_IMAGE_ZOOM, MAX_IMAGE_ZOOM);
    this.frameImageOffsetX = Number(frameImageOffsetX) || 0;
    this.frameImageOffsetY = Number(frameImageOffsetY) || 0;
    this.frameDropActive = false;
    this.frameEditActive = false;
    this._frameImageElement = null;
  }

  get hasFrameImage() {
    return Boolean(this.frameImageSrc && this._frameImageElement);
  }

  getFrameViewport() {
    return getViewport(this);
  }

  getFrameImageState() {
    return {
      frameImageSrc: this.frameImageSrc,
      frameImageZoom: this.frameImageZoom,
      frameImageOffsetX: this.frameImageOffsetX,
      frameImageOffsetY: this.frameImageOffsetY,
    };
  }

  restoreFrameImageState(state) {
    if (!state) return;
    this.frameImageZoom = state.frameImageZoom || 1;
    this.frameImageOffsetX = state.frameImageOffsetX || 0;
    this.frameImageOffsetY = state.frameImageOffsetY || 0;
    this._constrainImagePosition();
    this.dirty = true;
  }

  async setFrameImage(source, { signal } = {}) {
    const normalizedSource = String(source || "");
    if (!normalizedSource) {
      this.frameImageSrc = "";
      this._frameImageElement = null;
      this.frameImageZoom = 1;
      this.frameImageOffsetX = 0;
      this.frameImageOffsetY = 0;
      this.dirty = true;
      this.canvas?.requestRenderAll();
      return this;
    }

    const element = await util.loadImage(normalizedSource, {
      crossOrigin: "anonymous",
      signal,
    });
    this.frameImageSrc = normalizedSource;
    this._frameImageElement = element;
    this.frameImageZoom = 1;
    this.frameImageOffsetX = 0;
    this.frameImageOffsetY = 0;
    this._constrainImagePosition();
    this.dirty = true;
    this.canvas?.requestRenderAll();
    return this;
  }

  setFrameImageZoom(zoom) {
    this.frameImageZoom = clamp(Number(zoom) || 1, MIN_IMAGE_ZOOM, MAX_IMAGE_ZOOM);
    this._constrainImagePosition();
    this.dirty = true;
    this.canvas?.requestRenderAll();
  }

  panFrameImage(deltaX, deltaY) {
    this.frameImageOffsetX += Number(deltaX) || 0;
    this.frameImageOffsetY += Number(deltaY) || 0;
    this._constrainImagePosition();
    this.dirty = true;
    this.canvas?.requestRenderAll();
  }

  _getImageLayout() {
    const image = this._frameImageElement;
    const viewport = this.getFrameViewport();
    if (!image) return { viewport, width: 0, height: 0 };

    const sourceWidth = Math.max(1, image.naturalWidth || image.width || 1);
    const sourceHeight = Math.max(1, image.naturalHeight || image.height || 1);
    const coverScale = Math.max(
      viewport.width / sourceWidth,
      viewport.height / sourceHeight,
    );
    const scale = coverScale * this.frameImageZoom;
    return {
      viewport,
      width: sourceWidth * scale,
      height: sourceHeight * scale,
    };
  }

  _constrainImagePosition() {
    const { viewport, width, height } = this._getImageLayout();
    const maxOffsetX = Math.max(0, (width - viewport.width) / 2);
    const maxOffsetY = Math.max(0, (height - viewport.height) / 2);
    this.frameImageOffsetX = clamp(this.frameImageOffsetX, -maxOffsetX, maxOffsetX);
    this.frameImageOffsetY = clamp(this.frameImageOffsetY, -maxOffsetY, maxOffsetY);
  }

  _render(context) {
    const viewport = this.getFrameViewport();

    if (["phone", "laptop", "browser"].includes(this.frameKind)) {
      drawMockupShell(context, this, viewport);
    }

    context.save();
    traceContentPath(context, this, viewport);
    context.clip();

    if (this._frameImageElement) {
      const layout = this._getImageLayout();
      const centerX = viewport.x + viewport.width / 2 + this.frameImageOffsetX;
      const centerY = viewport.y + viewport.height / 2 + this.frameImageOffsetY;
      context.drawImage(
        this._frameImageElement,
        centerX - layout.width / 2,
        centerY - layout.height / 2,
        layout.width,
        layout.height,
      );
    } else {
      drawPlaceholder(context, viewport);
    }

    if (this.frameDropActive) {
      context.fillStyle = "rgba(37, 99, 235, 0.18)";
      context.fillRect(viewport.x, viewport.y, viewport.width, viewport.height);
    }
    if (this.frameEditActive && this._frameImageElement) {
      drawEditGrid(context, viewport);
    }
    context.restore();

    if (!["phone", "laptop", "browser"].includes(this.frameKind)) {
      context.save();
      traceSimpleFrame(context, this, viewport);
      context.strokeStyle = this.frameDropActive || this.frameEditActive
        ? "#2563eb"
        : "rgba(100, 116, 139, 0.72)";
      context.lineWidth = this.frameDropActive || this.frameEditActive ? 4 : 2;
      context.setLineDash(this._frameImageElement ? [] : [8, 6]);
      context.stroke();
      context.restore();
    }
  }

  toObject(propertiesToInclude = []) {
    return {
      ...super.toObject([
        ...FRAME_SERIALIZED_PROPERTIES,
        ...propertiesToInclude,
      ]),
      ...this.getFrameImageState(),
      frameKind: this.frameKind,
      frameAssetId: this.frameAssetId,
    };
  }

  static async fromObject(serialized, options = {}) {
    const frameOptions = { ...serialized };
    delete frameOptions.type;
    delete frameOptions.version;
    const frame = new DesignFlowFrame(frameOptions);
    if (serialized.frameImageSrc) {
      try {
        await frame.setFrameImage(serialized.frameImageSrc, options);
        frame.frameImageZoom = serialized.frameImageZoom || 1;
        frame.frameImageOffsetX = serialized.frameImageOffsetX || 0;
        frame.frameImageOffsetY = serialized.frameImageOffsetY || 0;
        frame._constrainImagePosition();
      } catch {
        // Keep the frame and source metadata recoverable if an external image
        // is temporarily unavailable while a project is loading.
        frame.frameImageSrc = serialized.frameImageSrc;
      }
    }
    return frame;
  }
}

classRegistry.setClass(DesignFlowFrame);
classRegistry.setClass(DesignFlowFrame, "designflow-frame");

export const isDesignFlowFrame = (object) =>
  object instanceof DesignFlowFrame || object?.assetType === "frame";
