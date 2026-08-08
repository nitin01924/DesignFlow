import { useCallback, useEffect, useRef, useState } from "react";
import { isDesignFlowFrame } from "./DesignFlowFrame.js";

const EDIT_ACTION = {
  type: "edit-frame-image",
  label: "Reposition frame image",
};

export function useFrameEditing({
  canvas,
  history,
  onModeChange,
  onRequestReplace,
}) {
  const activeFrameRef = useRef(null);
  const imageSnapshotRef = useRef(null);
  const interactionSnapshotRef = useRef(null);
  const panRef = useRef(null);
  const touchPointsRef = useRef(new Map());
  const pinchDistanceRef = useRef(0);
  const [state, setState] = useState({ frame: null, revision: 0 });

  const restoreFrameInteraction = useCallback((frame) => {
    const interaction = interactionSnapshotRef.current;
    if (!frame || !interaction) return;
    frame.set(interaction);
    frame.frameEditActive = false;
    frame.hoverCursor = "move";
    frame.dirty = true;
    frame.setCoords();
  }, []);

  const done = useCallback(() => {
    const frame = activeFrameRef.current;
    if (!frame) return false;
    restoreFrameInteraction(frame);
    activeFrameRef.current = null;
    imageSnapshotRef.current = null;
    interactionSnapshotRef.current = null;
    panRef.current = null;
    canvas?.setActiveObject(frame);
    canvas?.requestRenderAll();
    history.commit(EDIT_ACTION);
    setState((current) => ({ frame: null, revision: current.revision + 1 }));
    onModeChange?.(false);
    return true;
  }, [canvas, history, onModeChange, restoreFrameInteraction]);

  const cancel = useCallback(() => {
    const frame = activeFrameRef.current;
    if (!frame) return false;
    frame.restoreFrameImageState(imageSnapshotRef.current);
    restoreFrameInteraction(frame);
    activeFrameRef.current = null;
    imageSnapshotRef.current = null;
    interactionSnapshotRef.current = null;
    panRef.current = null;
    canvas?.setActiveObject(frame);
    canvas?.requestRenderAll();
    history.cancel();
    setState((current) => ({ frame: null, revision: current.revision + 1 }));
    onModeChange?.(false);
    return true;
  }, [canvas, history, onModeChange, restoreFrameInteraction]);

  const start = useCallback(
    (frame) => {
      if (!canvas || !isDesignFlowFrame(frame) || frame.layerLocked) return false;
      if (!frame.hasFrameImage) {
        onRequestReplace?.(frame);
        return false;
      }
      if (activeFrameRef.current === frame) return true;
      if (activeFrameRef.current) done();
      if (!history.begin(EDIT_ACTION)) return false;

      imageSnapshotRef.current = frame.getFrameImageState();
      interactionSnapshotRef.current = {
        selectable: frame.selectable,
        evented: frame.evented,
        hasControls: frame.hasControls,
        lockMovementX: frame.lockMovementX,
        lockMovementY: frame.lockMovementY,
        lockScalingX: frame.lockScalingX,
        lockScalingY: frame.lockScalingY,
        lockRotation: frame.lockRotation,
      };
      activeFrameRef.current = frame;
      frame.set({
        selectable: true,
        evented: true,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        hoverCursor: "grab",
      });
      frame.frameEditActive = true;
      frame.dirty = true;
      canvas.setActiveObject(frame);
      canvas.requestRenderAll();
      setState((current) => ({ frame, revision: current.revision + 1 }));
      onModeChange?.(true);
      return true;
    },
    [canvas, done, history, onModeChange, onRequestReplace],
  );

  const setZoom = useCallback(
    (zoom) => {
      const frame = activeFrameRef.current;
      if (!frame) return;
      frame.setFrameImageZoom(zoom);
      setState((current) => ({ ...current, revision: current.revision + 1 }));
    },
    [],
  );

  useEffect(() => {
    if (!canvas) return;
    const touchPoints = touchPointsRef.current;

    const getPoint = (event) =>
      event.scenePoint || (event.e ? canvas.getScenePoint(event.e) : null);

    const handleDoubleClick = (event) => {
      if (isDesignFlowFrame(event.target)) start(event.target);
    };
    const handleMouseDown = (event) => {
      const frame = activeFrameRef.current;
      if (!frame) return;
      if (event.target !== frame) {
        done();
        return;
      }
      const point = getPoint(event);
      if (!point) return;
      panRef.current = point;
      frame.hoverCursor = "grabbing";
      canvas.setCursor("grabbing");
    };
    const handleMouseMove = (event) => {
      const frame = activeFrameRef.current;
      const previous = panRef.current;
      const point = getPoint(event);
      if (!frame || !previous || !point) return;

      const deltaX = point.x - previous.x;
      const deltaY = point.y - previous.y;
      const radians = ((frame.angle || 0) * Math.PI) / 180;
      const cosine = Math.cos(radians);
      const sine = Math.sin(radians);
      const localX =
        (deltaX * cosine + deltaY * sine) /
        Math.max(0.0001, Math.abs(frame.scaleX || 1));
      const localY =
        (-deltaX * sine + deltaY * cosine) /
        Math.max(0.0001, Math.abs(frame.scaleY || 1));
      frame.panFrameImage(localX, localY);
      panRef.current = point;
      setState((current) => ({ ...current, revision: current.revision + 1 }));
    };
    const handleMouseUp = () => {
      const frame = activeFrameRef.current;
      panRef.current = null;
      if (frame) {
        frame.hoverCursor = "grab";
        canvas.setCursor("grab");
      }
    };
    const handleWheel = (event) => {
      const frame = activeFrameRef.current;
      if (!frame || event.target !== frame) return;
      event.e.preventDefault();
      event.e.stopPropagation();
      const factor = Math.exp(-event.e.deltaY * 0.0015);
      setZoom(frame.frameImageZoom * factor);
    };
    const getPinchDistance = () => {
      const [first, second] = [...touchPoints.values()];
      if (!first || !second) return 0;
      return Math.hypot(second.x - first.x, second.y - first.y);
    };
    const handlePointerDown = (event) => {
      if (!activeFrameRef.current || event.pointerType !== "touch") return;
      touchPoints.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      if (touchPoints.size === 2) {
        pinchDistanceRef.current = getPinchDistance();
        panRef.current = null;
      }
    };
    const handlePointerMove = (event) => {
      const frame = activeFrameRef.current;
      if (
        !frame ||
        event.pointerType !== "touch" ||
        !touchPoints.has(event.pointerId)
      ) return;
      touchPoints.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      if (touchPoints.size !== 2) return;
      const distance = getPinchDistance();
      const previousDistance = pinchDistanceRef.current;
      if (distance > 0 && previousDistance > 0) {
        event.preventDefault();
        setZoom(frame.frameImageZoom * (distance / previousDistance));
      }
      pinchDistanceRef.current = distance;
    };
    const handlePointerUp = (event) => {
      touchPoints.delete(event.pointerId);
      if (touchPoints.size < 2) pinchDistanceRef.current = 0;
    };
    const handleKeyDown = (event) => {
      if (!activeFrameRef.current) return;
      if (event.key === "Enter") {
        event.preventDefault();
        done();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
    };

    canvas.on("mouse:dblclick", handleDoubleClick);
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);
    canvas.on("mouse:wheel", handleWheel);
    canvas.upperCanvasEl.addEventListener("pointerdown", handlePointerDown);
    canvas.upperCanvasEl.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    canvas.upperCanvasEl.addEventListener("pointerup", handlePointerUp);
    canvas.upperCanvasEl.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      canvas.off("mouse:dblclick", handleDoubleClick);
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
      canvas.off("mouse:wheel", handleWheel);
      canvas.upperCanvasEl.removeEventListener("pointerdown", handlePointerDown);
      canvas.upperCanvasEl.removeEventListener("pointermove", handlePointerMove);
      canvas.upperCanvasEl.removeEventListener("pointerup", handlePointerUp);
      canvas.upperCanvasEl.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
      touchPoints.clear();
      pinchDistanceRef.current = 0;
      const frame = activeFrameRef.current;
      if (frame) {
        frame.restoreFrameImageState(imageSnapshotRef.current);
        restoreFrameInteraction(frame);
        history.cancel();
        activeFrameRef.current = null;
        onModeChange?.(false);
      }
    };
  }, [cancel, canvas, done, history, onModeChange, restoreFrameInteraction, setZoom, start]);

  return {
    isEditing: Boolean(state.frame),
    frame: state.frame,
    zoom: state.frame?.frameImageZoom || 1,
    start,
    done,
    cancel,
    setZoom,
  };
}
