import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, FabricImage } from "fabric";
import EditorToolbar from "./EditorToolbar";
import MobileObjectToolbar from "./mobile/MobileObjectToolbar";
import CropActionBar from "./crop/CropActionBar";
import { useImageCrop } from "./crop/useImageCrop";
import FrameEditActionBar from "./frames/FrameEditActionBar.jsx";
import { useFrameEditing } from "./frames/useFrameEditing.js";
import {
  findFrameAtPoint,
  isDesignFlowFrame,
  placeCanvasImageInFrame,
} from "./frames/frameCommands.js";
import { initializeLayerObject } from "./layers/layerUtils.js";
import {
  hasAssetDragData,
  readAssetDragData,
} from "./assets/assetDrag.js";
import { IMAGE_UPLOAD_ACCEPT } from "./images/imageValidation.js";

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
  onCropModeChange,
  onFrameEditModeChange,
  history,
  onInsertAsset,
  onReplaceFrameImage,
}) {
  const canvasElementRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const fabricImageRef = useRef(null);
  const frameReplaceInputRef = useRef(null);
  const pendingFrameReplacementRef = useRef(null);
  const frameDropTargetRef = useRef(null);
  const frameDropTransactionImageRef = useRef(null);
  const externalDragFrameRef = useRef(null);
  const lastCanvasSizeRef = useRef(null);
  const hasInitializedHistoryRef = useRef(false);
  const {
    attachCanvas,
    detachCanvas,
    reset: resetHistory,
    begin: beginHistory,
    commit: commitHistory,
    cancel: cancelHistory,
  } = history;
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAssetDragOver, setIsAssetDragOver] = useState(false);
  const [dragMessage, setDragMessage] = useState("Drop to add this asset");
  const [frameContextMenu, setFrameContextMenu] = useState(null);
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

  const crop = useImageCrop({
    canvas: selection.canvas,
    onSelectionChange: handleSelectionChange,
    onModeChange: onCropModeChange,
  });

  const openFrameReplaceDialog = useCallback((frame) => {
    if (!isDesignFlowFrame(frame) || frame.layerLocked) return;
    pendingFrameReplacementRef.current = frame;
    frameReplaceInputRef.current?.click();
  }, []);

  const frameEditing = useFrameEditing({
    canvas: selection.canvas,
    history,
    onModeChange: onFrameEditModeChange,
    onRequestReplace: openFrameReplaceDialog,
  });
  const {
    start: startFrameEditing,
    done: doneFrameEditing,
    isEditing: isFrameImageEditing,
  } = frameEditing;

  const requestFrameReplacement = useCallback(
    (frame) => {
      if (isFrameImageEditing) doneFrameEditing();
      openFrameReplaceDialog(frame);
    },
    [doneFrameEditing, isFrameImageEditing, openFrameReplaceDialog],
  );

  useEffect(() => {
    const canvas = selection.canvas;
    if (!canvas) return;
    const handleEditRequest = (event) => startFrameEditing(event.frame);
    const handleReplaceRequest = (event) =>
      requestFrameReplacement(event.frame);
    canvas.on("designflow:frame-edit-request", handleEditRequest);
    canvas.on("designflow:frame-replace-request", handleReplaceRequest);
    return () => {
      canvas.off("designflow:frame-edit-request", handleEditRequest);
      canvas.off("designflow:frame-replace-request", handleReplaceRequest);
    };
  }, [requestFrameReplacement, selection.canvas, startFrameEditing]);

  const handleFrameReplacementFile = async (event) => {
    const [file] = event.target.files;
    const frame = pendingFrameReplacementRef.current;
    event.target.value = "";
    pendingFrameReplacementRef.current = null;
    if (!file || !frame) return;
    const replaced = await onReplaceFrameImage?.(frame, file);
    if (replaced) handleSelectionChange(frame);
  };

  useEffect(() => {
    if (!frameContextMenu) return;
    const closeMenu = () => setFrameContextMenu(null);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [frameContextMenu]);

  useEffect(() => {
    if (!selection.canvas) return;

    const blocked = !history.isReady || history.isRestoring;
    selection.canvas.set({
      selection: !blocked,
      skipTargetFind: blocked,
    });
  }, [history.isReady, history.isRestoring, selection.canvas]);

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
      const interactionObject =
        event?.target || fabricCanvas.getActiveObject() || null;
      const cropTarget = fabricCanvas
        .getObjects()
        .find((object) => object.cropModeActive);
      const selectedObject = interactionObject?.cropHelperType
        ? cropTarget
        : interactionObject || cropTarget || null;

      fabricCanvas.uniformScaling =
        interactionObject?.cropHelperType === "frame"
          ? false
          : !(
              interactionObject?.type === "image" &&
              !interactionObject.aspectRatioLocked &&
              !interactionObject.cropModeActive
            );

      // The crop session renders transforms imperatively at pointer frequency.
      // Avoid routing every crop-frame resize or image pan through React state.
      if (selectedObject?.cropModeActive && event?.transform) return;
      handleSelectionChange(selectedObject);
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

    const syncLayerObject = (event) => {
      initializeLayerObject(fabricCanvas, event.target);
    };

    const setFrameDropHighlight = (frame) => {
      if (frameDropTargetRef.current === frame) return;
      if (frameDropTargetRef.current) {
        frameDropTargetRef.current.frameDropActive = false;
        frameDropTargetRef.current.dirty = true;
      }
      frameDropTargetRef.current = frame || null;
      if (frame) {
        frame.frameDropActive = true;
        frame.dirty = true;
      }
      fabricCanvas.requestRenderAll();
    };

    const handleFrameDropHover = (event) => {
      const image = event.target;
      if (image?.type !== "image" || image.cropModeActive) return;
      const frame = findFrameAtPoint(
        fabricCanvas,
        image.getCenterPoint(),
        image,
      );
      setFrameDropHighlight(frame);
      image._designflowFrameDropTarget = frame || null;
      if (frame && image._designflowFrameDropOpacity === undefined) {
        image._designflowFrameDropOpacity = image.opacity ?? 1;
        image.set({ opacity: Math.min(image.opacity ?? 1, 0.72) });
      } else if (!frame && image._designflowFrameDropOpacity !== undefined) {
        image.set({ opacity: image._designflowFrameDropOpacity });
        delete image._designflowFrameDropOpacity;
      }
      if (frame && frameDropTransactionImageRef.current !== image) {
        // Begin only after a frame is encountered. This suppresses Fabric's
        // transform commit so removing the source image and filling the frame
        // becomes one atomic undo entry.
        beginHistory({
          type: "place-image-in-frame",
          label: "Place image in frame",
        });
        frameDropTransactionImageRef.current = image;
        image._designflowFrameDropTransaction = true;
      }
    };

    const handleFrameDrop = (event) => {
      const image = event.target;
      if (image?.type !== "image") return;
      const frame = image._designflowFrameDropTarget;
      const ownsTransaction = frameDropTransactionImageRef.current === image;
      if (image._designflowFrameDropOpacity !== undefined) {
        image.set({ opacity: image._designflowFrameDropOpacity });
        delete image._designflowFrameDropOpacity;
      }
      delete image._designflowFrameDropTarget;
      delete image._designflowFrameDropTransaction;
      frameDropTransactionImageRef.current = null;
      setFrameDropHighlight(null);

      if (!ownsTransaction) return;
      if (!frame) {
        commitHistory({ type: "move-image", label: "Move image" });
        return;
      }

      void placeCanvasImageInFrame(fabricCanvas, frame, image).then(
        (placedFrame) => {
          commitHistory({
            type: "place-image-in-frame",
            label: "Place image in frame",
          });
          if (placedFrame) handleSelectionChange(placedFrame);
        },
        (error) => {
          cancelHistory();
          console.error("Unable to place image in frame", error);
        },
      );
    };

    const handleContextMenu = (event) => {
      const target = fabricCanvas.findTarget(event);
      if (!isDesignFlowFrame(target) || target.layerLocked) return;
      event.preventDefault();
      fabricCanvas.setActiveObject(target);
      handleSelectionChange(target);
      setFrameContextMenu({
        frame: target,
        x: Math.max(8, Math.min(event.clientX, window.innerWidth - 196)),
        y: Math.max(8, Math.min(event.clientY, window.innerHeight - 128)),
      });
    };

    fabricCanvas.on("object:added", syncLayerObject);
    fabricCanvas.on("selection:created", syncSelection);
    fabricCanvas.on("selection:updated", syncSelection);
    fabricCanvas.on("selection:cleared", syncSelection);
    fabricCanvas.on("object:moving", syncSelection);
    fabricCanvas.on("object:moving", handleFrameDropHover);
    fabricCanvas.on("object:scaling", syncScaling);
    fabricCanvas.on("object:rotating", syncSelection);
    fabricCanvas.on("object:modified", syncSelection);
    fabricCanvas.on("text:changed", syncSelection);
    fabricCanvas.on("mouse:up", handleFrameDrop);
    fabricCanvas.upperCanvasEl.addEventListener("contextmenu", handleContextMenu);
    attachCanvas(fabricCanvas, { onRestored: handleSelectionChange });

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
        fabricCanvas.fire("designflow:canvas-resized", {
          width: nextWidth,
          height: nextHeight,
          scaleX,
          scaleY,
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
      fabricCanvas.off("object:added", syncLayerObject);
      fabricCanvas.off("selection:created", syncSelection);
      fabricCanvas.off("selection:updated", syncSelection);
      fabricCanvas.off("selection:cleared", syncSelection);
      fabricCanvas.off("object:moving", syncSelection);
      fabricCanvas.off("object:moving", handleFrameDropHover);
      fabricCanvas.off("object:scaling", syncScaling);
      fabricCanvas.off("object:rotating", syncSelection);
      fabricCanvas.off("object:modified", syncSelection);
      fabricCanvas.off("text:changed", syncSelection);
      fabricCanvas.off("mouse:up", handleFrameDrop);
      fabricCanvas.upperCanvasEl.removeEventListener("contextmenu", handleContextMenu);
      if (frameDropTargetRef.current) {
        frameDropTargetRef.current.frameDropActive = false;
        frameDropTargetRef.current = null;
      }
      detachCanvas(fabricCanvas);
      fabricImageRef.current = null;
      lastCanvasSizeRef.current = null;
      fabricCanvasRef.current = null;
      void fabricCanvas.dispose();
    };
  }, [
    attachCanvas,
    beginHistory,
    cancelHistory,
    commitHistory,
    detachCanvas,
    handleSelectionChange,
    onEditorStateChange,
    openFrameReplaceDialog,
  ]);

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
            initializeLayerObject(fabricCanvas, object);
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
            if (isDesignFlowFrame(object)) {
              object.frameDropActive = false;
              object.frameEditActive = false;
              object.dirty = true;
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
        if (!hasInitializedHistoryRef.current) {
          resetHistory();
          hasInitializedHistoryRef.current = true;
        }
        return;
      }

      // A previously uploaded image is already restored by loadFromJSON().
      // Only add the asset when it is not part of the serialized document.
      const existingImage = fabricCanvas
        .getObjects()
        .find(
          (object) =>
            (object.type === "image" && object.getSrc?.() === canvasImage) ||
            (isDesignFlowFrame(object) && object.frameImageSrc === canvasImage),
        );
      if (existingImage) {
        if (existingImage.type === "image") {
          fabricImageRef.current = existingImage;
        }
        if (!hasInitializedHistoryRef.current) {
          resetHistory();
          hasInitializedHistoryRef.current = true;
        }
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
        fabricCanvas.discardActiveObject();
        fabricImageRef.current = image;
        // Upload only places the asset. Selection and edit modes remain
        // explicit user actions through the canvas and toolbars.
        handleSelectionChange(null);
        fabricCanvas.requestRenderAll();
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unable to load the project image into Fabric", error);
        }
      } finally {
        if (
          !abortController.signal.aborted &&
          !hasInitializedHistoryRef.current
        ) {
          resetHistory();
          hasInitializedHistoryRef.current = true;
        }
      }
    };

    loadCanvasImage();

    return () => {
      abortController.abort();
    };
  }, [canvasImage, handleSelectionChange, isHydrated, resetHistory]);

  const clearExternalFrameHighlight = () => {
    if (!externalDragFrameRef.current) return;
    externalDragFrameRef.current.frameDropActive = false;
    externalDragFrameRef.current.dirty = true;
    externalDragFrameRef.current = null;
    fabricCanvasRef.current?.requestRenderAll();
  };

  const handleAssetDragOver = (event) => {
    const isAsset = hasAssetDragData(event.dataTransfer);
    const isImageFile = Array.from(event.dataTransfer?.items || []).some(
      (item) => item.kind === "file" && item.type.startsWith("image/"),
    );
    if (!isAsset && !isImageFile) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";

    if (isImageFile && fabricCanvasRef.current) {
      const point = fabricCanvasRef.current.getScenePoint(event.nativeEvent);
      const frame = findFrameAtPoint(fabricCanvasRef.current, point);
      if (externalDragFrameRef.current !== frame) {
        clearExternalFrameHighlight();
        externalDragFrameRef.current = frame;
        if (frame) {
          frame.frameDropActive = true;
          frame.dirty = true;
          fabricCanvasRef.current.requestRenderAll();
        }
      }
      setDragMessage("Drop the image onto a frame");
      setIsAssetDragOver(!frame);
      return;
    }

    setDragMessage("Drop to add this asset");
    if (!isAssetDragOver) setIsAssetDragOver(true);
  };

  const handleAssetDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsAssetDragOver(false);
      clearExternalFrameHighlight();
    }
  };

  const handleAssetDrop = (event) => {
    const descriptor = readAssetDragData(event.dataTransfer);
    const [imageFile] = Array.from(event.dataTransfer?.files || []).filter(
      (file) => file.type.startsWith("image/"),
    );
    const targetFrame = externalDragFrameRef.current;
    if (!fabricCanvasRef.current || (!descriptor && !imageFile)) return;
    event.preventDefault();
    setIsAssetDragOver(false);
    clearExternalFrameHighlight();
    if (imageFile) {
      if (targetFrame) {
        void Promise.resolve(onReplaceFrameImage?.(targetFrame, imageFile)).then((replaced) => {
          if (replaced) handleSelectionChange(targetFrame);
        });
      }
      return;
    }
    const position = fabricCanvasRef.current.getScenePoint(event.nativeEvent);
    void onInsertAsset?.(descriptor, { x: position.x, y: position.y });
  };

  const hasCanvasObjects = Boolean(
    canvasImage ||
      canvasData?.objects?.length ||
      selection.canvas
        ?.getObjects()
        .some((object) => !object.excludeFromExport && !object.cropHelperType),
  );

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col">
      <input
        ref={frameReplaceInputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        onChange={(event) => void handleFrameReplacementFile(event)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      {frameContextMenu && (
        <div
          className="fixed z-[90] w-48 rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          style={{ left: frameContextMenu.x, top: frameContextMenu.y }}
          role="menu"
          aria-label="Frame actions"
          onPointerDown={(event) => event.stopPropagation()}
        >
          {frameContextMenu.frame.hasFrameImage && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                frameEditing.start(frameContextMenu.frame);
                setFrameContextMenu(null);
              }}
              className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span aria-hidden="true">✎</span>
              Edit image
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              requestFrameReplacement(frameContextMenu.frame);
              setFrameContextMenu(null);
            }}
            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span aria-hidden="true">⇄</span>
            {frameContextMenu.frame.hasFrameImage ? "Replace image" : "Add image"}
          </button>
        </div>
      )}
      {crop.isCropping ? (
        <CropActionBar
          onCancel={crop.cancelCrop}
          onReset={crop.resetCrop}
          onDone={crop.doneCrop}
        />
      ) : frameEditing.isEditing ? (
        <FrameEditActionBar
          zoom={frameEditing.zoom}
          onZoomChange={frameEditing.setZoom}
          onCancel={frameEditing.cancel}
          onReplace={() => requestFrameReplacement(frameEditing.frame)}
          onDone={frameEditing.done}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <EditorToolbar
              canvas={selection.canvas}
              selectedObject={selection.object}
              onSelectionChange={handleSelectionChange}
              onCrop={crop.startCrop}
              onEditFrame={frameEditing.start}
              onReplaceFrame={requestFrameReplacement}
              history={history}
            />
          </div>
          <MobileObjectToolbar
            canvas={selection.canvas}
            selectedObject={selection.object}
            onSelectionChange={handleSelectionChange}
            onCrop={crop.startCrop}
            onEditFrame={frameEditing.start}
            onReplaceFrame={requestFrameReplacement}
            history={history}
          />
        </>
      )}
      <section
        className="mobile-canvas-workspace flex min-h-0 min-w-0 flex-1 touch-none items-center justify-center overflow-hidden bg-slate-100 p-3 transition-[padding,background-color] duration-300 dark:bg-slate-900 md:min-h-96 md:overflow-auto md:p-10"
        aria-label="Design canvas workspace"
      >
      {/* ProjectWorkspace only supplies project data. Keeping Fabric objects in
          refs separates React state from Fabric state and avoids competing render models. */}
      <div
        ref={canvasContainerRef}
        onDragOver={handleAssetDragOver}
        onDragLeave={handleAssetDragLeave}
        onDrop={handleAssetDrop}
        className={`relative aspect-4/3 w-full max-w-3xl overflow-hidden border bg-white text-center shadow-[0_20px_50px_rgba(15,23,42,0.10)] transition-[border-color,box-shadow] dark:shadow-[0_20px_50px_rgba(0,0,0,0.30)] ${
          isAssetDragOver
            ? "border-blue-500 shadow-[0_20px_60px_rgba(37,99,235,0.24)] ring-4 ring-blue-500/20"
            : "border-slate-200 dark:border-slate-700"
        }`}
      >
        <canvas
          ref={canvasElementRef}
          aria-label={`${projectTitle} editable canvas`}
        />

        {!hasCanvasObjects && (
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
              Upload an image or add an asset to begin
            </p>
          </div>
        )}
        {isAssetDragOver && (
          <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-blue-600/10 backdrop-blur-[1px]">
            <div className="rounded-2xl bg-slate-950/85 px-5 py-3 text-sm font-semibold text-white shadow-xl">
              {dragMessage}
            </div>
          </div>
        )}
      </div>
      </section>
    </div>
  );
}

export default CanvasArea;
