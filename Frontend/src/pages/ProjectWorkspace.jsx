import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProject } from "../services/projectService";
import CanvasArea from "../components/editor/CanvasArea";
import EditorNavbar from "../components/editor/EditorNavbar";
import EditorSidebar from "../components/editor/EditorSidebar";
import PropertiesPanel from "../components/editor/PropertiesPanel";

function ProjectWorkspace({ user }) {
  // useParams reads dynamic values from the route, so /project/:id gives us this project's id.
  const { id } = useParams();

  // useState stores values that change after render: the project data, loading state, and errors.
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-100 text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100">
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
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
          <div className="flex min-h-[calc(100vh-73px)] w-full flex-col bg-white dark:bg-slate-950">
            {/* Props keep data ownership in this page while presenting the same project consistently across editor regions. */}
            <EditorNavbar user={user} projectTitle={project.title} />

            {/* This composition leaves clear extension points for future canvas state, tools, and element properties. */}
            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[6rem_minmax(0,1fr)_18rem]">
              <EditorSidebar />
              <CanvasArea />
              <PropertiesPanel project={project} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default ProjectWorkspace;
