import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, FabricImage } from "fabric";
import EditorToolbar from "./EditorToolbar";
import MobileObjectToolbar from "./mobile/MobileObjectToolbar";

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

function CanvasArea({
  canvasImage,
  canvasData,
  savedCanvasWidth,
  savedCanvasHeight,
  projectTitle,
  onEditorStateChange,
}) {
  const canvasElementRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const fabricImageRef = useRef(null);
  const lastCanvasSizeRef = useRef(null);
  const [isHydrated, setIsHydrated] = useState(false);
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
    setIsHydrated(false);
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
      const object = event?.target || fabricCanvas.getActiveObject() || null;
      fabricCanvas.uniformScaling = !(
        object?.type === "image" && !object.aspectRatioLocked
      );
      handleSelectionChange(object);
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
    fabricCanvas.on("text:changed", syncSelection);

    const resizeCanvas = () => {
      const { width, height } =
        canvasContainerRef.current.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(width));
      const nextHeight = Math.max(1, Math.round(height));
      const previousSize = lastCanvasSizeRef.current;

      fabricCanvas.setDimensions({
        width: nextWidth,
        height: nextHeight,
      });

      if (previousSize && fabricCanvas.getObjects().length) {
        const scaleX = nextWidth / previousSize.width;
        const scaleY = nextHeight / previousSize.height;

        fabricCanvas.getObjects().forEach((object) => {
          object.set({
            left: (object.left || 0) * scaleX,
            top: (object.top || 0) * scaleY,
            scaleX: (object.scaleX || 1) * scaleX,
            scaleY: (object.scaleY || 1) * scaleY,
          });
          object.setCoords();
        });
      } else if (fabricImageRef.current) {
        fitImageToCanvas(fabricImageRef.current, fabricCanvas);
      }

      lastCanvasSizeRef.current = { width: nextWidth, height: nextHeight };
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
      fabricCanvas.off("text:changed", syncSelection);
      fabricImageRef.current = null;
      lastCanvasSizeRef.current = null;
      fabricCanvasRef.current = null;
      void fabricCanvas.dispose();
    };
  }, [handleSelectionChange, onEditorStateChange]);

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    let isCurrent = true;

    const hydrateCanvas = async () => {
      try {
        if (canvasData) {
          await fabricCanvas.loadFromJSON(canvasData);
          if (!isCurrent) return;

          const targetWidth = fabricCanvas.getWidth();
          const targetHeight = fabricCanvas.getHeight();
          const sourceWidth = Number(savedCanvasWidth) || targetWidth;
          const sourceHeight = Number(savedCanvasHeight) || targetHeight;
          const scaleX = targetWidth / sourceWidth;
          const scaleY = targetHeight / sourceHeight;

          fabricCanvas.getObjects().forEach((object) => {
            object.set({
              left: (object.left || 0) * scaleX,
              top: (object.top || 0) * scaleY,
              scaleX: (object.scaleX || 1) * scaleX,
              scaleY: (object.scaleY || 1) * scaleY,
            });
            if (object.type === "image") {
              const locked = Boolean(object.aspectRatioLocked);
              object.setControlsVisibility({
                mt: !locked,
                mb: !locked,
                ml: !locked,
                mr: !locked,
              });
            }
            object.setCoords();
          });
          fabricCanvas.requestRenderAll();
        }
      } catch (error) {
        console.error("Unable to restore the saved Fabric canvas", error);
      } finally {
        if (isCurrent) setIsHydrated(true);
      }
    };

    void hydrateCanvas();
    return () => {
      isCurrent = false;
    };
  }, [canvasData, savedCanvasHeight, savedCanvasWidth]);

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas || !isHydrated) return;

    const abortController = new AbortController();

    const loadCanvasImage = async () => {
      if (!canvasImage) {
        fabricCanvas.requestRenderAll();
        return;
      }

      // A previously uploaded image is already restored by loadFromJSON().
      // Only add the asset when it is not part of the serialized document.
      const existingImage = fabricCanvas
        .getObjects()
        .find((object) => object.type === "image" && object.getSrc?.() === canvasImage);
      if (existingImage) {
        fabricImageRef.current = existingImage;
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
            aspectRatioLocked: false,
            touchCornerSize: 36,
          },
        );

        if (abortController.signal.aborted) return;

        fitImageToCanvas(image, fabricCanvas);
        image.setControlsVisibility({
          mt: true,
          mb: true,
          ml: true,
          mr: true,
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
  }, [canvasImage, handleSelectionChange, isHydrated]);

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col">
      <div className="hidden md:block">
        <EditorToolbar
          canvas={selection.canvas}
          selectedObject={selection.object}
          onSelectionChange={handleSelectionChange}
        />
      </div>
      <MobileObjectToolbar
        canvas={selection.canvas}
        selectedObject={selection.object}
        onSelectionChange={handleSelectionChange}
      />
      <section
        className="mobile-canvas-workspace flex min-h-0 min-w-0 flex-1 touch-none items-center justify-center overflow-hidden bg-slate-100 p-3 transition-[padding,background-color] duration-300 dark:bg-slate-900 md:min-h-96 md:overflow-auto md:p-10"
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

        {!canvasImage && !canvasData?.objects?.length && (
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
