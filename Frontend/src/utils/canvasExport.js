export const EXPORT_FORMATS = {
  png: {
    label: "PNG",
    extension: "png",
    mimeType: "image/png",
  },
  jpeg: {
    label: "JPG",
    extension: "jpg",
    mimeType: "image/jpeg",
  },
  pdf: {
    label: "PDF",
    extension: "pdf",
    mimeType: "application/pdf",
  },
};

export const RESOLUTION_OPTIONS = [
  { value: 1, label: "Standard", detail: "1x" },
  { value: 2, label: "High", detail: "2x" },
  { value: 4, label: "Ultra", detail: "4x" },
];

const MAX_EXPORT_PIXELS = 100_000_000;
const MAX_EXPORT_SIDE = 32_767;

export const sanitizeFileName = (value) => {
  const sanitized = Array.from(value)
    .filter((character) => character.charCodeAt(0) >= 32)
    .join("")
    .trim()
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\.(png|jpe?g|pdf)$/i, "")
    .replace(/[.\s]+$/g, "")
    .slice(0, 180);

  return sanitized || "design";
};

const waitForPaint = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

const canvasToBlob = (element, mimeType, quality) =>
  new Promise((resolve, reject) => {
    element.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The browser could not create the export file."));
      },
      mimeType,
      quality,
    );
  });

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const validateExportSize = (canvas, multiplier) => {
  const width = Math.round(canvas.getWidth() * multiplier);
  const height = Math.round(canvas.getHeight() * multiplier);

  if (
    width > MAX_EXPORT_SIDE ||
    height > MAX_EXPORT_SIDE ||
    width * height > MAX_EXPORT_PIXELS
  ) {
    throw new Error(
      `This ${multiplier}x export is too large for the browser. Choose a lower resolution.`,
    );
  }
};

const createExportCanvas = async (canvas, options, imageFormat) => {
  validateExportSize(canvas, options.multiplier);
  await document.fonts?.ready;

  const originalBackground = canvas.backgroundColor;
  const shouldBeTransparent =
    imageFormat === "png" &&
    (options.transparentBackground || !options.includeBackground);

  canvas.backgroundColor = shouldBeTransparent
    ? ""
    : options.includeBackground && originalBackground
      ? originalBackground
      : "#ffffff";

  try {
    canvas.renderAll();
    return canvas.toCanvasElement(options.multiplier);
  } finally {
    canvas.backgroundColor = originalBackground;
    canvas.requestRenderAll();
  }
};

const imageExporter = (format) => async (canvas, options) => {
  const exportCanvas = await createExportCanvas(canvas, options, format);
  return canvasToBlob(
    exportCanvas,
    EXPORT_FORMATS[format].mimeType,
    format === "jpeg" ? options.quality : undefined,
  );
};

const exportPdf = async (canvas, options) => {
  const { jsPDF } = await import("jspdf");
  const exportCanvas = await createExportCanvas(canvas, options, "png");
  const imageBlob = await canvasToBlob(exportCanvas, "image/png");
  const imageData = new Uint8Array(await imageBlob.arrayBuffer());
  const landscape = canvas.getWidth() > canvas.getHeight();
  const pdf = new jsPDF({
    orientation: landscape ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const scale = Math.min(
    (pageWidth - margin * 2) / exportCanvas.width,
    (pageHeight - margin * 2) / exportCanvas.height,
  );
  const width = exportCanvas.width * scale;
  const height = exportCanvas.height * scale;

  pdf.addImage(
    imageData,
    "PNG",
    (pageWidth - width) / 2,
    (pageHeight - height) / 2,
    width,
    height,
    undefined,
    "FAST",
  );

  return pdf.output("blob");
};

// Add future exporters here without changing the dialog or download workflow.
const exporters = {
  png: imageExporter("png"),
  jpeg: imageExporter("jpeg"),
  pdf: exportPdf,
};

export const exportCanvas = async (canvas, options) => {
  const format = EXPORT_FORMATS[options.format];
  const exporter = exporters[options.format];
  if (!canvas || !format || !exporter) {
    throw new Error("The selected export format is not supported.");
  }

  await waitForPaint();
  const blob = await exporter(canvas, options);
  const fileName = `${sanitizeFileName(options.fileName)}.${format.extension}`;
  downloadBlob(blob, fileName);
  return fileName;
};
