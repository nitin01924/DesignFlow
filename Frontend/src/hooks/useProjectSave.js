import { useCallback, useEffect, useRef, useState } from "react";
import { FabricObject } from "fabric";
import { saveProjectCanvas } from "../services/projectService";

// Fabric only serializes registered properties. These are used by DesignFlow
// today, while metadata/id/name keep the format extensible for layers and plugins.
const SERIALIZED_OBJECT_PROPERTIES = [
  "id",
  "name",
  "metadata",
  "aspectRatioLocked",
  "lockedAspectRatio",
  "cropWidth",
  "cropHeight",
  "originalWidth",
  "originalHeight",
];

FabricObject.customProperties = Array.from(
  new Set([
    ...(FabricObject.customProperties || []),
    ...SERIALIZED_OBJECT_PROPERTIES,
  ]),
);

export function useProjectSave({ projectId, canvas, onSaved, disabled = false }) {
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveInProgressRef = useRef(false);

  const save = useCallback(async () => {
    if (!canvas || disabled || saveInProgressRef.current) return;

    saveInProgressRef.current = true;
    setSaveStatus("saving");

    try {
      const canvasData = canvas.toJSON();
      const updatedProject = await saveProjectCanvas(projectId, canvasData, {
        width: canvas.getWidth(),
        height: canvas.getHeight(),
      });
      setSaveStatus("saved");
      onSaved?.(updatedProject);
    } catch (error) {
      setSaveStatus("failed");
      throw error;
    } finally {
      saveInProgressRef.current = false;
    }
  }, [canvas, disabled, onSaved, projectId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save().catch(() => {});
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [save]);

  return { save, saveStatus };
}
