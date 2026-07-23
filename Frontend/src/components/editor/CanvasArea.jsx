import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, FabricImage } from "fabric";
import EditorToolbar from "./EditorToolbar";

const fitImageToCanvas = (image, canvas) => {
  const imageWidth = image.width || 1;
  const imageHeight = image.height || 1;
  const scale = Math.min(
    canvas.getWidth() / imageWidth,
    canvas.getHeight() / imageHeight,
  );

  image.set({
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: "center",
    originY: "center",
    scaleX: scale,
    scaleY: scale,
  });
  image.setCoords();
};

function CanvasArea({ canvasImage, projectTitle, onEditorStateChange }) {
  const canvasElementRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const fabricImageRef = useRef(null);
  const [selection, setSelection] = useState({
    canvas: null,
    object: null,
    revision: 0,
  });

  const handleSelectionChange = useCallback((object) => {
    setSelection((current) => ({
      canvas: current.canvas,
      object,
      revision: current.revision + 1,
    }));
    onEditorStateChange?.({
      canvas: fabricCanvasRef.current,
      selectedObject: object,
    });
  }, [onEditorStateChange]);

  useEffect(() => {
    if (!canvasElementRef.current || !canvasContainerRef.current) return;

    // Fabric owns the imperative canvas lifecycle and object interactions. React
    // only provides the DOM node, which prevents React renders from resetting drag state.
    const fabricCanvas = new Canvas(canvasElementRef.current, {
      backgroundColor: "#ffffff",
      selection: true,
    });
    fabricCanvasRef.current = fabricCanvas;
    setSelection((current) => ({
      canvas: fabricCanvas,
      object: null,
      revision: current.revision + 1,
    }));
    onEditorStateChange?.({
      canvas: fabricCanvas,
      selectedObject: null,
    });

    const syncSelection = (event) => {
      handleSelectionChange(
        event?.target || fabricCanvas.getActiveObject() || null,
      );
    };

    const syncScaling = (event) => {
      const object = event.target;

      if (object?.aspectRatioLocked) {
        const ratio =
          object.lockedAspectRatio ||
          object.getScaledWidth() / Math.max(1, object.getScaledHeight());
        const scaleY =
          (Math.max(1, object.width || 1) * Math.abs(object.scaleX || 1)) /
          (ratio * Math.max(1, object.height || 1));

        object.set({
          scaleY: (object.scaleY || 1) < 0 ? -scaleY : scaleY,
        });
      }

      syncSelection(event);
    };

    fabricCanvas.on("selection:created", syncSelection);
    fabricCanvas.on("selection:updated", syncSelection);
    fabricCanvas.on("selection:cleared", syncSelection);
    fabricCanvas.on("object:moving", syncSelection);
    fabricCanvas.on("object:scaling", syncScaling);
    fabricCanvas.on("object:rotating", syncSelection);
    fabricCanvas.on("object:modified", syncSelection);

    const resizeCanvas = () => {
      const { width, height } =
        canvasContainerRef.current.getBoundingClientRect();

      fabricCanvas.setDimensions({
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
      });

      if (fabricImageRef.current) {
        fitImageToCanvas(fabricImageRef.current, fabricCanvas);
      }

      fabricCanvas.requestRenderAll();
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvasContainerRef.current);
    resizeCanvas();

    return () => {
      resizeObserver.disconnect();
      fabricCanvas.off("selection:created", syncSelection);
      fabricCanvas.off("selection:updated", syncSelection);
      fabricCanvas.off("selection:cleared", syncSelection);
      fabricCanvas.off("object:moving", syncSelection);
      fabricCanvas.off("object:scaling", syncScaling);
      fabricCanvas.off("object:rotating", syncSelection);
      fabricCanvas.off("object:modified", syncSelection);
      fabricImageRef.current = null;
      fabricCanvasRef.current = null;
      void fabricCanvas.dispose();
    };
  }, [handleSelectionChange, onEditorStateChange]);

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const abortController = new AbortController();

    const loadCanvasImage = async () => {
      if (fabricImageRef.current) {
        fabricCanvas.discardActiveObject();
        fabricCanvas.remove(fabricImageRef.current);
        fabricImageRef.current = null;
        handleSelectionChange(null);
      }

      if (!canvasImage) {
        fabricCanvas.requestRenderAll();
        return;
      }

      try {
        const image = await FabricImage.fromURL(
          canvasImage,
          {
            crossOrigin: "anonymous",
            signal: abortController.signal,
          },
          {
            selectable: true,
            evented: true,
            hasControls: true,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false,
            aspectRatioLocked: true,
          },
        );

        if (abortController.signal.aborted) return;

        fitImageToCanvas(image, fabricCanvas);
        image.set({
          lockedAspectRatio:
            image.getScaledWidth() / Math.max(1, image.getScaledHeight()),
        });
        image.setControlsVisibility({
          mt: false,
          mb: false,
          ml: false,
          mr: false,
        });
        fabricCanvas.add(image);
        fabricImageRef.current = image;
        fabricCanvas.requestRenderAll();
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unable to load the project image into Fabric", error);
        }
      }
    };

    loadCanvasImage();

    return () => {
      abortController.abort();
    };
  }, [canvasImage, handleSelectionChange]);

  return (
    <div className="flex min-h-0 min-w-0 flex-col">
      <EditorToolbar
        canvas={selection.canvas}
        selectedObject={selection.object}
        onSelectionChange={handleSelectionChange}
      />
      <section
        className="flex min-h-96 min-w-0 flex-1 items-center justify-center overflow-auto bg-slate-100 p-6 transition-colors dark:bg-slate-900 sm:p-10"
        aria-label="Design canvas workspace"
      >
      {/* ProjectWorkspace only supplies project data. Keeping Fabric objects in
          refs separates React state from Fabric state and avoids competing render models. */}
      <div
        ref={canvasContainerRef}
        className="relative aspect-4/3 w-full max-w-3xl overflow-hidden border border-slate-200 bg-white text-center shadow-[0_20px_50px_rgba(15,23,42,0.10)] dark:border-slate-700 dark:shadow-[0_20px_50px_rgba(0,0,0,0.30)]"
      >
        <canvas
          ref={canvasElementRef}
          aria-label={`${projectTitle} editable canvas`}
        />

        {!canvasImage && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-8">
            <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  d="M4 4h16v16H4zM8 2v4m8-4v4M8 18v4m8-4v4M2 8h4m-4 8h4m12-8h4m-4 8h4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800">
              Canvas Area
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Upload an image to begin
            </p>
          </div>
        )}
      </div>
      </section>
    </div>
  );
}

export default CanvasArea;
