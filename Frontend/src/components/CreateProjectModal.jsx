import { useState } from "react";
import Button from "./Button";
import Input from "./Input";

function CreateProjectModal({ isOpen, onClose, onCreate }) {
  // useState keeps form input and submit status in sync with what the user sees.
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextTitle = title.trim();
    if (!nextTitle) {
      setError("Project title is required");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await onCreate(nextTitle);
      setTitle("");
      onClose();
    } catch (err) {
      setError(err.message || "Unable to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setTitle("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 dark:bg-black/70">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:border dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">New Project</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded px-2 py-1 text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close create project modal"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Project title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Website redesign"
          />

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProjectModal;
