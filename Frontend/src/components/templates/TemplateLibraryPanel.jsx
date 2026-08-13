import { useEffect, useMemo, useState } from "react";
import { getTemplates } from "../../services/templateService.js";

const ALL_CATEGORY = "All";

function TemplatePreview({ template }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="relative grid w-full place-items-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900"
      style={{ aspectRatio: `${template.canvasWidth} / ${template.canvasHeight}` }}
    >
      {failed ? (
        <div className="grid size-full place-items-center bg-gradient-to-br from-slate-100 to-slate-200 px-3 text-center text-xs font-medium text-slate-400 dark:from-slate-800 dark:to-slate-900">
          Preview unavailable
        </div>
      ) : (
        <img
          src={template.preview}
          alt={`${template.name} template preview`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-contain transition duration-300 group-hover:scale-[1.025]"
        />
      )}
    </div>
  );
}

function TemplateCard({ template, isCreating, isDisabled, onUseTemplate }) {
  return (
    <article className="group flex min-w-0 self-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700">
      <TemplatePreview template={template} />
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
          {template.category}
        </span>
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
          {template.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
          {template.description}
        </p>
        <button
          type="button"
          onClick={() => onUseTemplate(template)}
          disabled={isDisabled}
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-65"
          aria-label={`Use ${template.name} template`}
        >
          {isCreating && (
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {isCreating ? "Creating…" : "Use Template"}
        </button>
      </div>
    </article>
  );
}

function LoadingGrid({ wide }) {
  return (
    <div className={`grid gap-3 ${wide ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2"}`} role="status" aria-label="Loading templates">
      {Array.from({ length: wide ? 9 : 6 }, (_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
          <div className="aspect-4/3 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="mt-3 h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-8 rounded bg-slate-100 dark:bg-slate-800/70" />
          <div className="mt-3 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

function TemplateLibraryPanel({
  onUseTemplate,
  onClose,
  wide = false,
  mobile = false,
}) {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingId, setCreatingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    getTemplates().then(
      (result) => {
        if (!isCurrent) return;
        setTemplates(result.templates);
        setCategories(result.categories);
        setError("");
        setIsLoading(false);
      },
      (loadError) => {
        if (!isCurrent) return;
        setError(loadError.message || "Unable to load templates");
        setIsLoading(false);
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  const visibleTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesCategory =
        category === ALL_CATEGORY || template.category === category;
      const matchesSearch =
        !normalizedQuery ||
        template.name.toLowerCase().includes(normalizedQuery) ||
        template.category.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesSearch;
    });
  }, [category, query, templates]);

  const handleUseTemplate = async (template) => {
    if (!onUseTemplate || creatingId) return;
    try {
      setError("");
      setCreatingId(template.id);
      await onUseTemplate(template);
    } catch (err) {
      setError(err.message || "Unable to create a project from this template");
    } finally {
      setCreatingId(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-slate-950">
      <div className={`shrink-0 border-b border-slate-100 dark:border-slate-800 ${wide ? "px-5 py-4" : "p-4"}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className={`${wide ? "text-xl" : "text-base"} font-semibold text-slate-900 dark:text-slate-100`}>
              Templates
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Start with a fully editable design
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="grid size-10 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Close templates"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <label className="relative mt-4 block">
          <span className="sr-only">Search templates</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900"
          />
        </label>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="toolbar" aria-label="Template categories">
          {[ALL_CATEGORY, ...categories].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold transition ${
                category === item
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto ${wide ? "p-5" : "p-3"}`}>
        {error && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" role="alert">
            <span>{error}</span>
            {!templates.length && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setIsLoading(true);
                  setReloadKey((key) => key + 1);
                }}
                className="shrink-0 font-semibold underline underline-offset-2"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <LoadingGrid wide={wide} />
        ) : visibleTemplates.length ? (
          <div className={`grid gap-3 ${wide ? "sm:grid-cols-2 lg:grid-cols-3" : mobile ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
            {visibleTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isCreating={creatingId === template.id}
                isDisabled={Boolean(creatingId)}
                onUseTemplate={handleUseTemplate}
              />
            ))}
          </div>
        ) : (
          <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900/60">
            <div>
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm dark:bg-slate-800">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <path d="M4 4h16v16H4zM4 10h16M10 10v10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">No templates found</p>
              <p className="mt-1 text-xs text-slate-400">Try another search or category.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory(ALL_CATEGORY);
                }}
                className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TemplateLibraryPanel;
