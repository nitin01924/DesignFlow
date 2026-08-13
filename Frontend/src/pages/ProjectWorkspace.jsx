import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getProject, uploadProjectImage } from "../services/projectService";
import CanvasArea from "../components/editor/CanvasArea";
import EditorNavbar from "../components/editor/EditorNavbar";
import EditorSidebar from "../components/editor/EditorSidebar";
import PropertiesPanel from "../components/editor/PropertiesPanel";
import MobileEditorHeader from "../components/editor/mobile/MobileEditorHeader";
import { useProjectSave } from "../hooks/useProjectSave";
import { addTextToCanvas } from "../components/editor/text/textPresets";
import ExportDialog from "../components/editor/export/ExportDialog";
import { useCanvasExport } from "../hooks/useCanvasExport";
import { useCanvasHistory } from "../components/editor/history/useCanvasHistory";
import { replaceFrameImage } from "../components/editor/frames/frameCommands.js";
import { uploadImageAsset } from "../services/imageLibraryService.js";
import { createProjectFromTemplate } from "../services/templateService.js";
import { replaceCanvasImageWithLibraryAsset } from "../components/editor/images/imageCommands.js";

function ProjectWorkspace({ user }) {
  // useParams reads dynamic values from the route, so /project/:id gives us this project's id.
  const { id } = useParams();
  const navigate = useNavigate();

  // useState stores values that change after render: the project data, loading state, and errors.
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [isFrameEditing, setIsFrameEditing] = useState(false);
  const [editorState, setEditorState] = useState({
    canvas: null,
    selectedObject: null,
    revision: 0,
  });

  const handleEditorStateChange = useCallback(({ canvas, selectedObject }) => {
    setEditorState((current) => ({
      canvas,
      selectedObject,
      revision: current.revision + 1,
    }));
  }, []);

  const handleObjectChange = useCallback((selectedObject) => {
    setEditorState((current) => ({
      ...current,
      selectedObject,
      revision: current.revision + 1,
    }));
  }, []);

  const handleSavedProject = useCallback((updatedProject) => {
    setProject((current) => ({
      ...updatedProject,
      // Keep the live Fabric instance as the source of truth during this
      // session; swapping the payload reference would re-hydrate the editor.
      canvasData: current?.canvasData,
      canvasWidth: current?.canvasWidth,
      canvasHeight: current?.canvasHeight,
    }));
  }, []);

  const history = useCanvasHistory({
    disabled: isCropping || isFrameEditing,
    maxStates: 100,
  });
  const executeHistoryAction = history.execute;
  const isEditorBusy =
    isCropping || isFrameEditing || history.isRestoring || !history.isReady;
  const { save, saveStatus } = useProjectSave({
    projectId: id,
    canvas: editorState.canvas,
    onSaved: handleSavedProject,
    disabled: isEditorBusy,
  });
  const { exportCanvas, isExporting } = useCanvasExport(editorState.canvas);

  const handleSave = useCallback(() => {
    void save().catch((err) => {
      toast.error(err.message || "Unable to save project");
    });
  }, [save]);

  const handleAddText = useCallback((presetId) => {
    const text = executeHistoryAction(
      { type: "add-text", label: "Add text" },
      () => addTextToCanvas(editorState.canvas, presetId),
    );
    if (text) handleEditorStateChange({
      canvas: editorState.canvas,
      selectedObject: text,
    });
  }, [editorState.canvas, executeHistoryAction, handleEditorStateChange]);

  const handleInsertAsset = useCallback(
    async (descriptor, position) => {
      if (!editorState.canvas || isEditorBusy) return null;

      try {
        const { insertAssetIntoCanvas } = await import(
          "../components/editor/assets/assetCommands.js"
        );
        const insertedObject = await executeHistoryAction(
          {
            type: `add-${descriptor.type}`,
            label: `Add ${descriptor.label || descriptor.type}`,
          },
          () =>
            insertAssetIntoCanvas(editorState.canvas, descriptor, {
              position,
            }),
        );
        if (insertedObject) {
          handleEditorStateChange({
            canvas: editorState.canvas,
            selectedObject: insertedObject,
          });
        }
        return insertedObject;
      } catch (err) {
        toast.error(err.message || "Unable to add this asset");
        return null;
      }
    },
    [
      editorState.canvas,
      executeHistoryAction,
      handleEditorStateChange,
      isEditorBusy,
    ],
  );

  const handleExport = useCallback(async (options) => {
    try {
      const fileName = await exportCanvas(options);
      if (!fileName) return;
      setIsExportDialogOpen(false);
      toast.success(`${fileName} exported successfully`);
    } catch (err) {
      toast.error(err.message || "Unable to export this design");
    }
  }, [exportCanvas]);

  useEffect(() => {
    // useEffect runs after the component mounts; fetching here keeps rendering separate from backend side effects.
    let isMounted = true;

    const fetchProject = async () => {
      try {
        setError("");
        setIsLoading(true);

        // The project id is only available after React Router renders this page, so fetching starts after mount.
        const projectDetails = await getProject(id);

        if (isMounted) {
          setProject(projectDetails);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load project");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProject();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleImageUpload = async (file) => {
    try {
      setIsUploading(true);
      const updatedProject = await uploadProjectImage(id, file);

      // The workspace owns project state because the sidebar changes it and the
      // canvas and properties panel both consume the updated project data.
      setProject((current) => ({
        ...updatedProject,
        canvasData: current?.canvasData,
        canvasWidth: current?.canvasWidth,
        canvasHeight: current?.canvasHeight,
      }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err.message || "Unable to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLibraryImageUpload = useCallback(
    async (file) => {
      try {
        setIsUploading(true);
        const asset = await uploadImageAsset(id, file);
        toast.success("Image added to your library");
        return asset;
      } finally {
        setIsUploading(false);
      }
    },
    [id],
  );

  const handleUseTemplate = useCallback(
    async (template) => {
      const createdProject = await createProjectFromTemplate(template.id);
      toast.success(`Created ${template.name}`);
      navigate(`/project/${createdProject._id}`);
    },
    [navigate],
  );

  const handleReplaceFrameImage = useCallback(
    async (frame, file) => {
      if (
        !frame ||
        !file ||
        !editorState.canvas?.getObjects().includes(frame) ||
        history.isRestoring ||
        !history.isReady
      ) {
        return null;
      }

      try {
        setIsUploading(true);
        const hadImage = Boolean(frame.frameImageSrc);
        const updatedProject = await uploadProjectImage(id, file);
        const source = updatedProject.canvasImage;
        if (
          !editorState.canvas.getObjects().includes(frame) ||
          history.isRestoring
        ) {
          throw new Error("The frame is no longer available.");
        }
        const replacedFrame = await executeHistoryAction(
          {
            type: hadImage
              ? "replace-frame-image"
              : "add-image-to-frame",
            label: hadImage
              ? "Replace frame image"
              : "Add image to frame",
          },
          () => replaceFrameImage(editorState.canvas, frame, source),
        );

        setProject((current) => ({
          ...updatedProject,
          canvasData: current?.canvasData,
          canvasWidth: current?.canvasWidth,
          canvasHeight: current?.canvasHeight,
        }));
        if (replacedFrame) {
          handleEditorStateChange({
            canvas: editorState.canvas,
            selectedObject: replacedFrame,
          });
          toast.success(hadImage ? "Frame image replaced" : "Image added to frame");
        }
        return replacedFrame;
      } catch (err) {
        toast.error(err.message || "Unable to replace the frame image");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [
      editorState.canvas,
      executeHistoryAction,
      handleEditorStateChange,
      history.isReady,
      history.isRestoring,
      id,
    ],
  );

  const replacementTarget =
    editorState.selectedObject?.assetType === "frame"
      ? editorState.selectedObject
      : editorState.selectedObject?.type === "image"
        ? editorState.selectedObject
        : null;
  const replacementTargetLabel = replacementTarget
    ? `“${replacementTarget.name || (replacementTarget.assetType === "frame" ? "Frame" : "Image")}”`
    : "";

  const handleReplaceWithLibraryAsset = useCallback(
    async (descriptor) => {
      const canvas = editorState.canvas;
      const target = editorState.selectedObject;
      if (
        !canvas ||
        !target ||
        target.layerLocked ||
        !canvas.getObjects().includes(target) ||
        history.isRestoring ||
        !history.isReady
      ) {
        return null;
      }

      const isFrame = target.assetType === "frame";
      const isImage = target.type === "image";
      if (!isFrame && !isImage) return null;

      const replacement = await executeHistoryAction(
        {
          type: isFrame ? "replace-frame-image" : "replace-image",
          label: isFrame ? "Replace frame image" : "Replace image",
        },
        () =>
          isFrame
            ? replaceFrameImage(canvas, target, descriptor.sourceUrl)
            : replaceCanvasImageWithLibraryAsset(canvas, target, descriptor),
      );
      if (replacement) {
        handleEditorStateChange({ canvas, selectedObject: replacement });
        toast.success(isFrame ? "Frame image replaced" : "Image replaced");
      }
      return replacement;
    },
    [
      editorState.canvas,
      editorState.selectedObject,
      executeHistoryAction,
      handleEditorStateChange,
      history.isReady,
      history.isRestoring,
    ],
  );

  return (
    <main className="h-dvh overflow-hidden bg-slate-100 text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100 md:h-auto md:min-h-[calc(100vh-73px)] md:overflow-visible">
      <div className="flex h-full items-center justify-center md:min-h-[calc(100vh-73px)]">
        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400" role="status">
            Loading project...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300" role="alert">
            {error}
          </div>
        )}

        {!isLoading && !error && project && (
          // Each editor region owns one concern, making it reusable and allowing future editing features to evolve independently.
          <div className="flex h-full w-full flex-col bg-white dark:bg-slate-950 md:min-h-[calc(100vh-73px)]">
            {/* Props keep data ownership in this page while presenting the same project consistently across editor regions. */}
            <EditorNavbar
              user={user}
              projectTitle={project.title}
              onSave={handleSave}
              saveStatus={saveStatus}
              onExport={() => setIsExportDialogOpen(true)}
              isExporting={isExporting}
              isEditingDisabled={isEditorBusy}
              history={history}
            />
            <MobileEditorHeader
              projectTitle={project.title}
              onUpload={handleImageUpload}
              isUploading={isUploading}
              onSave={handleSave}
              saveStatus={saveStatus}
              onAddText={handleAddText}
              onInsertAsset={handleInsertAsset}
              onUploadImage={handleLibraryImageUpload}
              onReplaceImageAsset={handleReplaceWithLibraryAsset}
              imageReplacementTarget={replacementTargetLabel}
              onUseTemplate={handleUseTemplate}
              onExport={() => setIsExportDialogOpen(true)}
              isExporting={isExporting}
              isEditingDisabled={isEditorBusy}
              history={history}
            />

            {/* This composition leaves clear extension points for future canvas state, tools, and element properties. */}
            <div className="editor-layout grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[6rem_minmax(0,1fr)_18rem]">
              <EditorSidebar
                onUpload={handleImageUpload}
                isUploading={isUploading}
                onAddText={handleAddText}
                onInsertAsset={handleInsertAsset}
                onUploadImage={handleLibraryImageUpload}
                onReplaceImageAsset={handleReplaceWithLibraryAsset}
                imageReplacementTarget={replacementTargetLabel}
                onUseTemplate={handleUseTemplate}
                disabled={isEditorBusy}
              />
              {/* The workspace provides project data; CanvasArea owns all Fabric state and interactions. */}
              <CanvasArea
                key={id}
                canvasImage={project.canvasImage}
                canvasData={project.canvasData}
                savedCanvasWidth={project.canvasWidth}
                savedCanvasHeight={project.canvasHeight}
                projectTitle={project.title}
                onEditorStateChange={handleEditorStateChange}
                onCropModeChange={setIsCropping}
                onFrameEditModeChange={setIsFrameEditing}
                history={history}
                onInsertAsset={handleInsertAsset}
                onReplaceFrameImage={handleReplaceFrameImage}
              />
              <PropertiesPanel
                editorState={editorState}
                onObjectChange={handleObjectChange}
                isEditingDisabled={isEditorBusy}
                history={history}
              />
            </div>
          </div>
        )}
      </div>
      {isExportDialogOpen && project && (
        <ExportDialog
          projectTitle={project.title}
          isExporting={isExporting}
          onCancel={() => setIsExportDialogOpen(false)}
          onExport={handleExport}
        />
      )}
    </main>
  );
}

export default ProjectWorkspace;
