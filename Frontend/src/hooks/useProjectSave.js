import { useCallback, useEffect, useRef, useState } from "react";
import { saveProjectCanvas } from "../services/projectService";
import { serializeCanvas } from "../components/editor/history/canvasSerialization.js";

export function useProjectSave({ projectId, canvas, onSaved, disabled = false }) {
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveInProgressRef = useRef(false);

  const save = useCallback(async () => {
    if (!canvas || disabled || saveInProgressRef.current) return;

    saveInProgressRef.current = true;
    setSaveStatus("saving");

    try {
      const canvasData = serializeCanvas(canvas);
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
