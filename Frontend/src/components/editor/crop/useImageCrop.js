import { useCallback, useEffect, useRef, useState } from "react";
import { ImageCropSession } from "./ImageCropSession.js";

const isFormControl = (target) =>
  target instanceof HTMLElement &&
  target.matches("button, input, textarea, select, [contenteditable='true']");

export function useImageCrop({ canvas, onSelectionChange, onModeChange }) {
  const [isCropping, setIsCropping] = useState(false);
  const sessionRef = useRef(null);

  const finishMode = useCallback(({ session, image }) => {
    if (sessionRef.current !== session) return;
    sessionRef.current = null;
    setIsCropping(false);
    onModeChange?.(false);
    onSelectionChange?.(image);
  }, [onModeChange, onSelectionChange]);

  const startCrop = useCallback((image) => {
    if (
      !canvas ||
      sessionRef.current ||
      image?.type !== "image" ||
      image.layerLocked ||
      image.visible === false
    ) {
      return;
    }

    const session = new ImageCropSession({
      canvas,
      image,
      onFinish: finishMode,
    });
    sessionRef.current = session;
    if (!session.start()) {
      sessionRef.current = null;
      return;
    }

    setIsCropping(true);
    onModeChange?.(true);
    onSelectionChange?.(image);
  }, [canvas, finishMode, onModeChange, onSelectionChange]);

  const cancelCrop = useCallback(() => sessionRef.current?.cancel(), []);
  const resetCrop = useCallback(() => sessionRef.current?.reset(), []);
  const doneCrop = useCallback(() => sessionRef.current?.done(), []);

  useEffect(() => {
    if (!isCropping) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelCrop();
        return;
      }
      if (event.key === "Enter" && !isFormControl(event.target)) {
        event.preventDefault();
        doneCrop();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelCrop, doneCrop, isCropping]);

  useEffect(() => () => {
    const session = sessionRef.current;
    if (session?.canvas === canvas) {
      session.dispose();
      sessionRef.current = null;
    }
  }, [canvas]);

  return {
    isCropping,
    startCrop,
    cancelCrop,
    resetCrop,
    doneCrop,
  };
}
