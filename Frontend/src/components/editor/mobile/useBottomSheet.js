import { useCallback, useEffect, useRef, useState } from "react";

const SNAP_ORDER = ["collapsed", "half", "full"];

const getViewportHeight = () =>
  window.visualViewport?.height || window.innerHeight;

const getSnapHeights = () => {
  const viewportHeight = getViewportHeight();
  const collapsed = 64;
  const half = Math.max(collapsed, Math.round(viewportHeight * 0.42));
  const full = Math.max(half, viewportHeight - 72);

  return { collapsed, half, full };
};

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

export function useBottomSheet(initialSnap = "half") {
  const [snap, setSnap] = useState(initialSnap);
  const [height, setHeight] = useState(() => getSnapHeights()[initialSnap]);
  const [isDragging, setIsDragging] = useState(false);
  const heightRef = useRef(height);
  const snapRef = useRef(snap);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);

  const updateHeight = useCallback((nextHeight) => {
    heightRef.current = nextHeight;
    setHeight(nextHeight);
  }, []);

  const settleAt = useCallback((nextSnap) => {
    const heights = getSnapHeights();
    snapRef.current = nextSnap;
    setSnap(nextSnap);
    updateHeight(heights[nextSnap]);
    setIsDragging(false);
  }, [updateHeight]);

  useEffect(() => {
    const syncToViewport = () => {
      const heights = getSnapHeights();
      updateHeight(heights[snapRef.current]);
    };

    window.addEventListener("resize", syncToViewport);
    window.visualViewport?.addEventListener("resize", syncToViewport);
    return () => {
      window.removeEventListener("resize", syncToViewport);
      window.visualViewport?.removeEventListener("resize", syncToViewport);
    };
  }, [updateHeight]);

  const onPointerDown = useCallback((event) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: heightRef.current,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocityY: 0,
      moved: false,
    };
    suppressClickRef.current = false;
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const now = performance.now();
    const elapsed = Math.max(1, now - drag.lastTime);
    drag.velocityY = (event.clientY - drag.lastY) / elapsed;
    drag.lastY = event.clientY;
    drag.lastTime = now;

    const distance = drag.startY - event.clientY;
    if (Math.abs(distance) > 5) {
      drag.moved = true;
      suppressClickRef.current = true;
    }

    const heights = getSnapHeights();
    updateHeight(
      clamp(
        drag.startHeight + distance,
        heights.collapsed,
        heights.full,
      ),
    );
  }, [updateHeight]);

  const finishDrag = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const heights = getSnapHeights();
    const velocityY =
      performance.now() - drag.lastTime > 80 ? 0 : drag.velocityY;
    const projectedHeight = clamp(
      heightRef.current - velocityY * 160,
      heights.collapsed,
      heights.full,
    );
    const nearestSnap = SNAP_ORDER.reduce((nearest, candidate) =>
      Math.abs(heights[candidate] - projectedHeight) <
      Math.abs(heights[nearest] - projectedHeight)
        ? candidate
        : nearest,
    );

    dragRef.current = null;
    settleAt(nearestSnap);
  }, [settleAt]);

  const onHandleClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    const currentIndex = SNAP_ORDER.indexOf(snapRef.current);
    const nextSnap = SNAP_ORDER[(currentIndex + 1) % SNAP_ORDER.length];
    settleAt(nextSnap);
  }, [settleAt]);

  return {
    snap,
    height,
    isDragging,
    settleAt,
    handleProps: {
      onClick: onHandleClick,
      onPointerDown,
      onPointerMove,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
    },
  };
}
