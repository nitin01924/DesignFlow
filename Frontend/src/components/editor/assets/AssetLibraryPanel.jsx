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

const framePreviewPaths = {
  rectangle: <rect x="3" y="5" width="18" height="14" rx="1" />,
  roundedRectangle: <rect x="3" y="5" width="18" height="14" rx="4" />,
  circle: <circle cx="12" cy="12" r="8.5" />,
  ellipse: <ellipse cx="12" cy="12" rx="9" ry="6.5" />,
  triangle: <path d="M12 3 22 20H2Z" strokeLinejoin="round" />,
  hexagon: <path d="m7 3 10 0 5 9-5 9H7l-5-9Z" strokeLinejoin="round" />,
  blob: <path d="M19.5 6.2c2.2 3.4 1.8 8.5-1.2 11.3-3 2.7-8.7 3.1-12 .6C3 15.6 2 10.3 4.4 6.8 6.8 3.3 10.7 2 14 3c2 .5 4.2 1.5 5.5 3.2Z" />,
  phone: <><rect x="6.5" y="2" width="11" height="20" rx="2.7" /><path d="M10 4h4M11 19.5h2" /></>,
  laptop: <><rect x="4" y="4" width="16" height="12" rx="1.5" /><path d="m2 19 2-3h16l2 3H2Z" /></>,
  browser: <><rect x="2.5" y="4" width="19" height="16" rx="2" /><path d="M3 8h18M6 6h.01M9 6h.01" /></>,
};

function FramePreview({ asset, className = "size-8" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      fillOpacity="0.08"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      {framePreviewPaths[asset.kind] || framePreviewPaths.rectangle}
    </svg>
  );
}

const shapePreviewPaths = {
  rectangle: <rect x="3" y="5" width="18" height="14" />,
  roundedRectangle: <rect x="3" y="5" width="18" height="14" rx="4" />,
  circle: <circle cx="12" cy="12" r="8" />,
  ellipse: <ellipse cx="12" cy="12" rx="9" ry="6" />,
  triangle: <path d="M12 3 22 20H2Z" />,
  line: <path d="M3 17 21 7" />,
  arrow: <path d="M3 12h15m-5-5 5 5-5 5" />,
  star: <path d="m12 2.7 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9Z" />,
  hexagon: <path d="m7 3 10 0 5 9-5 9H7l-5-9Z" />,
  diamond: <path d="m12 2 9 10-9 10-9-10Z" />,
};

function ShapePreview({ asset, className = "size-9" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      fillOpacity={asset.kind === "line" || asset.kind === "arrow" ? "0" : "0.14"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shapePreviewPaths[asset.kind] || shapePreviewPaths.rectangle}
    </svg>
  );
}

function AssetPreview({ asset, className }) {
  return asset.type === "shape" ? (
    <ShapePreview asset={asset} className={className} />
  ) : asset.type === "frame" ? (
    <FramePreview asset={asset} className={className} />
  ) : (
    <IconPreview asset={asset} className={className} />
  );
}

const getPreviewClassName = (asset, mobile) => {
  if (asset.type === "shape") return mobile ? "size-9" : "size-10";
  if (asset.type === "frame") return mobile ? "size-8" : "size-10";
  return mobile ? "size-6" : "size-7";
};

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

function AssetLibraryPanel({
  onInsertAsset,
  onClose,
  mobile = false,
  initialSection,
  sectionId,
}) {
  const availableSections = useMemo(
    () =>
      sectionId
        ? assetSections.filter((section) => section.id === sectionId)
        : assetSections,
    [sectionId],
  );
  const [activeSection, setActiveSection] = useState(
    sectionId || initialSection || availableSections[0]?.id || assetSections[0].id,
  );
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
        setLoadError("The asset library could not be loaded.");
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
  const activeSectionDetails = assetSections.find(
    (section) => section.id === activeSection,
  );
  const assetNoun = activeSectionDetails?.assetType || "asset";
  const showsShapeNames = activeSectionDetails?.assetType === "shape";

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
              {sectionId ? activeSectionDetails?.label : "Assets"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {sectionId
                ? activeSectionDetails?.description
                : "Add reusable vectors to your design"}
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

        {availableSections.length > 1 && (
          <div
            className="mt-4 flex gap-2"
            role="tablist"
            aria-label="Asset categories"
          >
            {availableSections.map((section) => (
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
        )}

        <label className="relative mt-3 block">
          <span className="sr-only">Search {assetNoun}s</span>
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
            placeholder={`Search ${assetNoun}s`}
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
              aria-label={`Clear ${assetNoun} search`}
            >
              ×
            </button>
          )}
        </label>

        <p className="mt-2 text-[11px] text-slate-400" aria-live="polite">
          {isLoading
            ? `Loading ${assetNoun}s…`
            : `${filteredAssets.length.toLocaleString()} ${assetNoun}${filteredAssets.length === 1 ? "" : "s"}`}
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
              className={`grid gap-2 p-4 ${
                showsShapeNames
                  ? "grid-cols-2"
                  : mobile
                    ? "grid-cols-5"
                    : "grid-cols-4"
              }`}
              role="group"
              aria-label={`Available ${assetNoun}s`}
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
                    className={`group relative touch-manipulation rounded-2xl border bg-white text-slate-700 shadow-sm transition-[transform,border-color,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md active:scale-95 disabled:cursor-wait dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 ${
                      showsShapeNames ? "min-h-24 px-2 pb-2 pt-3" : "aspect-square"
                    } ${
                      wasInserted
                        ? "scale-95 border-blue-500 bg-blue-50 ring-2 ring-blue-500/25 dark:bg-blue-950/60"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span
                      className={`grid place-items-center ${
                        showsShapeNames ? "h-14" : "absolute inset-0"
                      }`}
                    >
                      {isPending ? (
                        <span className="size-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                      ) : (
                        <AssetPreview
                          asset={asset}
                          className={getPreviewClassName(asset, mobile)}
                        />
                      )}
                    </span>
                    {showsShapeNames && (
                      <span className="block truncate text-center text-[11px] font-semibold leading-4">
                        {asset.label}
                      </span>
                    )}
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
                  Load more {assetNoun}s
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
              No {assetNoun}s found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Try a broader search term.
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 px-4 py-2.5 text-center text-[10px] text-slate-400 dark:border-slate-800">
        {activeSection === "icons"
          ? "Lucide Icons · Open-source ISC license"
          : activeSection === "frames"
            ? "DesignFlow Frames · Non-destructive image containers"
            : "DesignFlow Shapes · Editable Fabric vectors"}
      </div>
    </div>
  );
}

export default AssetLibraryPanel;
