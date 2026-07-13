import Button from "./Button";

const DEFAULT_THUMBNAIL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='400' viewBox='0 0 640 400'%3E%3Crect width='640' height='400' fill='%23f1f5f9'/%3E%3Cpath d='M118 291h404L397 149l-89 101-57-65z' fill='%23cbd5e1'/%3E%3Ccircle cx='217' cy='136' r='42' fill='%2394a3b8'/%3E%3C/svg%3E";

const formatUpdatedDate = (date) => {
  if (!date) return "Updated recently";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

function ProjectCard({ project, onOpen, onRename, onDelete }) {
  const thumbnail =
    project.thumbnail && project.thumbnail !== "https://..."
      ? project.thumbnail
      : DEFAULT_THUMBNAIL;

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(project);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project)}
      onKeyDown={handleKeyDown}
      className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <img
        src={thumbnail}
        alt={`${project.title} thumbnail`}
        className="aspect-16/10 w-full bg-gray-100 object-cover"
      />

      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-gray-900">
          {project.title}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Updated {formatUpdatedDate(project.updatedAt)}
        </p>

        <div className="mt-4 flex gap-2" onClick={(event) => event.stopPropagation()}>
          {/* Callback props let this reusable card ask the parent to change shared project state. */}
          <Button
            type="button"
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation();
              onRename(project);
            }}
          >
            Rename
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(project);
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}

export default ProjectCard;
