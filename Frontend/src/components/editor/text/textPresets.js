import { IText } from "fabric";

export const TEXT_PRESETS = [
  {
    id: "heading",
    label: "Add Heading",
    text: "Add a heading",
    fontSize: 64,
    fontWeight: 700,
  },
  {
    id: "subheading",
    label: "Add Subheading",
    text: "Add a subheading",
    fontSize: 36,
    fontWeight: 600,
  },
  {
    id: "body",
    label: "Add Body Text",
    text: "Add body text",
    fontSize: 20,
    fontWeight: 400,
  },
];

export const addTextToCanvas = (canvas, presetId) => {
  const preset = TEXT_PRESETS.find((item) => item.id === presetId);
  if (!canvas || !preset) return null;

  const text = new IText(preset.text, {
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: "center",
    originY: "center",
    fontFamily: "Arial",
    fontSize: preset.fontSize,
    fontWeight: preset.fontWeight,
    fill: "#111827",
    lineHeight: 1.2,
    textAlign: "left",
    editable: true,
    padding: 4,
  });

  canvas.add(text);
  canvas.setActiveObject(text);
  text.setCoords();
  canvas.requestRenderAll();
  return text;
};
