import {
  createElement,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { writeAssetDragData } from "./assetDrag.js";
import { assetSections, loadAssetSection } from "./assetRegistry.js";

const INITIAL_RESULT_COUNT = 96;
const RESULT_BATCH_SIZE = 96;

function IconPreview({ asset, className = "size-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {asset.node.map(([tagName, attributes], index) =>
        createElement(tagName, {
          ...attributes,
          key: `${asset.id}-${tagName}-${index}`,
        }),
      )}
    </svg>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-4 gap-2 p-4 sm:grid-cols-5 md:grid-cols-4">
      {Array.from({ length: 24 }, (_, index) => (
        <div
          key={index}
          className="aspect-square animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
        />
      ))}
    </div>
  );
}

function AssetLibraryPanel({ onInsertAsset, onClose, mobile = false }) {
  const [activeSection, setActiveSection] = useState(assetSections[0].id);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_RESULT_COUNT);
  const [pendingAssetId, setPendingAssetId] = useState(null);
  const [recentAssetId, setRecentAssetId] = useState(null);
  const deferredQuery = useDeferredValue(query);
  const scrollContainerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const recentTimerRef = useRef(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    let isCurrent = true;

    loadAssetSection(activeSection).then(
      (loadedAssets) => {
        if (!isCurrent) return;
        setAssets(loadedAssets);
        setIsLoading(false);
      },
      () => {
        if (!isCurrent) return;
        setLoadError("The icon library could not be loaded.");
        setIsLoading(false);
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [activeSection]);

  useEffect(
    () => () => {
      window.clearTimeout(recentTimerRef.current);
    },
    [],
  );

  const filteredAssets = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) return assets;
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return assets.filter((asset) =>
      terms.every((term) => asset.searchText.includes(term)),
    );
  }, [assets, deferredQuery]);

  const visibleAssets = filteredAssets.slice(0, visibleCount);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    const root = scrollContainerRef.current;
    if (
      !sentinel ||
      !root ||
      visibleCount >= filteredAssets.length ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) =>
            Math.min(filteredAssets.length, count + RESULT_BATCH_SIZE),
          );
        }
      },
      { root, rootMargin: "240px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredAssets.length, visibleCount]);

  const insertAsset = async (asset) => {
    if (pendingAssetId) return;
    setPendingAssetId(asset.id);
    try {
      const inserted = await onInsertAsset?.({
        id: asset.id,
        type: asset.type,
        sectionId: asset.sectionId,
        label: asset.label,
      });
      if (!inserted) return;
      setRecentAssetId(asset.id);
      window.clearTimeout(recentTimerRef.current);
      recentTimerRef.current = window.setTimeout(
        () => setRecentAssetId(null),
        700,
      );
    } finally {
      setPendingAssetId(null);
    }
  };

  const updateQuery = (event) => {
    setQuery(event.target.value);
    setVisibleCount(INITIAL_RESULT_COUNT);
    scrollContainerRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-slate-950">
      <div className="shrink-0 border-b border-slate-200 px-4 pb-3 pt-4 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Assets
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Add reusable vectors to your design
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close asset library"
            className="grid size-10 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex gap-2" role="tablist" aria-label="Asset categories">
          {assetSections.map((section) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeSection === section.id}
              onClick={() => {
                if (section.id === activeSection) return;
                setActiveSection(section.id);
                setAssets([]);
                setIsLoading(true);
                setLoadError("");
                setVisibleCount(INITIAL_RESULT_COUNT);
              }}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-blue-600 ${
                activeSection === section.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        <label className="relative mt-3 block">
          <span className="sr-only">Search icons</span>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={updateQuery}
            placeholder="Search icons"
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-950"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setVisibleCount(INITIAL_RESULT_COUNT);
              }}
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              aria-label="Clear icon search"
            >
              ×
            </button>
          )}
        </label>

        <p className="mt-2 text-[11px] text-slate-400" aria-live="polite">
          {isLoading
            ? "Loading icons…"
            : `${filteredAssets.length.toLocaleString()} icon${filteredAssets.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <LoadingGrid />
        ) : loadError ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {loadError}
          </div>
        ) : filteredAssets.length ? (
          <>
            <div
              className={`grid gap-2 p-4 ${mobile ? "grid-cols-5" : "grid-cols-4"}`}
              role="group"
              aria-label="Available icons"
            >
              {visibleAssets.map((asset) => {
                const isPending = pendingAssetId === asset.id;
                const wasInserted = recentAssetId === asset.id;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    draggable={!mobile}
                    onDragStart={(event) => {
                      suppressClickRef.current = true;
                      writeAssetDragData(event.dataTransfer, asset);
                    }}
                    onDragEnd={() => {
                      window.setTimeout(() => {
                        suppressClickRef.current = false;
                      }, 0);
                    }}
                    onClick={() => {
                      if (!suppressClickRef.current) void insertAsset(asset);
                    }}
                    disabled={Boolean(pendingAssetId)}
                    title={`Add ${asset.label}`}
                    aria-label={`Add ${asset.label}`}
                    className={`group relative aspect-square touch-manipulation rounded-2xl border bg-white text-slate-700 shadow-sm transition-[transform,border-color,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md active:scale-95 disabled:cursor-wait dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 ${
                      wasInserted
                        ? "scale-95 border-blue-500 bg-blue-50 ring-2 ring-blue-500/25 dark:bg-blue-950/60"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span className="absolute inset-0 grid place-items-center">
                      {isPending ? (
                        <span className="size-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                      ) : (
                        <IconPreview
                          asset={asset}
                          className={mobile ? "size-6" : "size-7"}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {visibleCount < filteredAssets.length ? (
              <div className="px-4 pb-4 text-center">
                <button
                  ref={loadMoreRef}
                  type="button"
                  onClick={() =>
                    setVisibleCount((count) =>
                      Math.min(
                        filteredAssets.length,
                        count + RESULT_BATCH_SIZE,
                      ),
                    )
                  }
                  className="min-h-10 rounded-xl px-4 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-blue-400 dark:hover:bg-blue-950/40"
                >
                  Load more icons
                </button>
              </div>
            ) : (
              <div className="h-4" aria-hidden="true" />
            )}
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-900">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
              No icons found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Try a broader search, such as arrow, user, or shape.
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 px-4 py-2.5 text-center text-[10px] text-slate-400 dark:border-slate-800">
        Lucide Icons · Open-source ISC license
      </div>
    </div>
  );
}

export default AssetLibraryPanel;
