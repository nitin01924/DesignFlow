import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearProjectThumbnail,
  saveProjectCanvas,
  uploadProjectThumbnail,
} from "../services/projectService";
import { serializeCanvas } from "../components/editor/history/canvasSerialization.js";
import { createProjectThumbnail } from "../utils/projectThumbnail.js";

const hasStoredThumbnail = (project) =>
  Boolean(project?.thumbnail && project.thumbnail !== "https://...");

export function useProjectSave({ projectId, canvas, onSaved, disabled = false }) {
  const [saveStatus, setSaveStatus] = useState("saved");
  const saveInProgressRef = useRef(false);

  const save = useCallback(async () => {
    if (!canvas || disabled || saveInProgressRef.current) return;

    saveInProgressRef.current = true;
    setSaveStatus("saving");

    try {
      const canvasData = serializeCanvas(canvas);
      // Capture the exact visual state represented by canvasData. Encoding can
      // continue while the authoritative canvas document is saved.
      const thumbnailTask = createProjectThumbnail(canvas).then(
        (thumbnail) => ({ thumbnail, error: null }),
        (error) => ({ thumbnail: null, error }),
      );
      let updatedProject = await saveProjectCanvas(projectId, canvasData, {
        width: canvas.getWidth(),
        height: canvas.getHeight(),
      });

      try {
        const { thumbnail, error } = await thumbnailTask;
        if (error) throw error;

        if (thumbnail) {
          updatedProject = await uploadProjectThumbnail(projectId, thumbnail);
        } else if (hasStoredThumbnail(updatedProject)) {
          updatedProject = await clearProjectThumbnail(projectId);
        }
      } catch (thumbnailError) {
        // A thumbnail is derived data. Never roll back or report a failed Save
        // after the Fabric document has already persisted successfully.
        if (import.meta.env.DEV) {
          console.warn(
            "DesignFlow saved the project, but could not update its thumbnail.",
            thumbnailError,
          );
        }
      }

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
