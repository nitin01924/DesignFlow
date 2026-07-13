import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProject } from "../services/projectService";

const DEFAULT_THUMBNAIL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='400' viewBox='0 0 640 400'%3E%3Crect width='640' height='400' fill='%23f1f5f9'/%3E%3Cpath d='M118 291h404L397 149l-89 101-57-65z' fill='%23cbd5e1'/%3E%3Ccircle cx='217' cy='136' r='42' fill='%2394a3b8'/%3E%3C/svg%3E";

const formatDate = (date) => {
  if (!date) return "Not available";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

function ProjectWorkspace() {
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

  const thumbnail =
    project?.thumbnail && project.thumbnail !== "https://..."
      ? project.thumbnail
      : DEFAULT_THUMBNAIL;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-8 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>

        {isLoading && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
            Loading project...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && project && (
          <div className="space-y-6">
            <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="grid gap-6 p-6 md:grid-cols-[280px_1fr]">
                <img
                  src={thumbnail}
                  alt={`${project.title} thumbnail`}
                  className="aspect-16/10 w-full rounded bg-gray-100 object-cover"
                />

                <div>
                  <h1 className="text-3xl font-bold">{project.title}</h1>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-gray-700">Created</dt>
                      <dd className="mt-1 text-gray-500">
                        {formatDate(project.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-700">Updated</dt>
                      <dd className="mt-1 text-gray-500">
                        {formatDate(project.updatedAt)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>

            <section className="flex min-h-130 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-xl font-semibold text-gray-400 shadow-sm">
              Canvas coming soon
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

export default ProjectWorkspace;
