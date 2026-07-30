import { useCallback, useState } from "react";
import { exportCanvas } from "../utils/canvasExport";

export function useCanvasExport(canvas) {
  const [isExporting, setIsExporting] = useState(false);

  const runExport = useCallback(async (options) => {
    if (!canvas || isExporting) return null;

    setIsExporting(true);
    try {
      return await exportCanvas(canvas, options);
    } finally {
      setIsExporting(false);
    }
  }, [canvas, isExporting]);

  return { exportCanvas: runExport, isExporting };
}
