import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getProject, uploadProjectImage } from "../services/projectService";
import CanvasArea from "../components/editor/CanvasArea";
import EditorNavbar from "../components/editor/EditorNavbar";
import EditorSidebar from "../components/editor/EditorSidebar";
import PropertiesPanel from "../components/editor/PropertiesPanel";
import MobileEditorHeader from "../components/editor/mobile/MobileEditorHeader";

function ProjectWorkspace({ user }) {
  // useParams reads dynamic values from the route, so /project/:id gives us this project's id.
  const { id } = useParams();

  // useState stores values that change after render: the project data, loading state, and errors.
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
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
      setProject(updatedProject);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err.message || "Unable to upload image");
    } finally {
      setIsUploading(false);
    }
  };

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
            <EditorNavbar user={user} projectTitle={project.title} />
            <MobileEditorHeader
              projectTitle={project.title}
              onUpload={handleImageUpload}
              isUploading={isUploading}
            />

            {/* This composition leaves clear extension points for future canvas state, tools, and element properties. */}
            <div className="editor-layout grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[6rem_minmax(0,1fr)_18rem]">
              <EditorSidebar
                onUpload={handleImageUpload}
                isUploading={isUploading}
              />
              {/* The workspace provides project data; CanvasArea owns all Fabric state and interactions. */}
              <CanvasArea
                canvasImage={project.canvasImage}
                projectTitle={project.title}
                onEditorStateChange={handleEditorStateChange}
              />
              <PropertiesPanel
                project={project}
                editorState={editorState}
                onObjectChange={handleObjectChange}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default ProjectWorkspace;
