import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CreateProjectModal from "../components/CreateProjectModal";
import EmptyState from "../components/EmptyState";
import ProjectCard from "../components/ProjectCard";
import {
  createProject,
  deleteProject,
  getProjects,
  renameProject,
} from "../services/projectService";
import { createProjectFromTemplate } from "../services/templateService.js";

const TemplateGalleryModal = lazy(
  () => import("../components/templates/TemplateGalleryModal.jsx"),
);

function Dashboard() {
  const navigate = useNavigate();

  // useState stores UI state that can change after render: projects, loading, errors, and modal visibility.
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);

  const loadProjects = async () => {
    try {
      setError("");
      setIsLoading(true);
      const projectList = await getProjects();
      setProjects(projectList);
    } catch (err) {
      setError(err.message || "Unable to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // useEffect runs after the first render, which is the right time to fetch data from the backend.
    let isMounted = true;

    const fetchInitialProjects = async () => {
      try {
        const projectList = await getProjects();
        if (isMounted) {
          setProjects(projectList);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load projects");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInitialProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateProject = async (title) => {
    await createProject(title);
    toast.success("Project created");
    await loadProjects();
  };

  const handleUseTemplate = async (template) => {
    const project = await createProjectFromTemplate(template.id);
    toast.success(`Created ${template.name}`);
    navigate(`/project/${project._id}`);
  };

  const handleOpenProject = (project) => {
    navigate(`/project/${project._id}`);
  };

  const handleRenameProject = async (project) => {
    const nextTitle = window.prompt("Rename project", project.title);
    if (!nextTitle || nextTitle.trim() === project.title) return;

    try {
      const updatedProject = await renameProject(project._id, nextTitle);

      // Project list state is lifted to Dashboard because create, rename, delete, and cards all depend on it.
      setProjects((currentProjects) =>
        currentProjects.map((item) =>
          item._id === updatedProject._id ? updatedProject : item,
        ),
      );
      toast.success("Project renamed");
    } catch (err) {
      toast.error(err.message || "Unable to rename project");
    }
  };

  const handleDeleteProject = async (project) => {
    const shouldDelete = window.confirm(
      `Delete "${project.title}"? This cannot be undone.`,
    );
    if (!shouldDelete) return;

    try {
      await deleteProject(project._id);
      setProjects((currentProjects) =>
        currentProjects.filter((item) => item._id !== project._id),
      );
      toast.success("Project deleted");
    } catch (err) {
      toast.error(err.message || "Unable to delete project");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-gray-500 dark:text-slate-400">Manage your design projects.</p>
          </div>

          <div className="flex flex-col gap-2 min-[420px]:flex-row">
            <button
              type="button"
              onClick={() => setIsTemplateGalleryOpen(true)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
            >
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 4h16v16H4zM4 10h16M10 10v10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Start from Template
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              + Blank Project
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading projects...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && projects.length === 0 && (
          <EmptyState onCreate={() => setIsCreateModalOpen(true)} />
        )}

        {!isLoading && !error && projects.length > 0 && (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onOpen={handleOpenProject}
                onRename={handleRenameProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </section>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />
      {isTemplateGalleryOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 text-sm font-medium text-white backdrop-blur-sm">
              Loading templates…
            </div>
          }
        >
          <TemplateGalleryModal
            isOpen
            onClose={() => setIsTemplateGalleryOpen(false)}
            onUseTemplate={handleUseTemplate}
          />
        </Suspense>
      )}
    </main>
  );
}

export default Dashboard;
