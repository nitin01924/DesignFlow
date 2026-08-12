import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getImageAssets } from "../../../services/imageLibraryService.js";
import { writeAssetDragData } from "../assets/assetDrag.js";
import {
  IMAGE_UPLOAD_ACCEPT,
  validateImageFile,
} from "./imageValidation.js";

const PAGE_SIZE = 60;

const toAssetDescriptor = (asset) => ({
  id: asset.id,
  type: "image",
  sectionId: "uploads",
  label: asset.name || "Image",
  sourceUrl: asset.secureUrl,
  width: asset.width,
  height: asset.height,
  originalFilename: asset.originalFilename,
});

function ImageSkeletons({ mobile }) {
  return (
    <div className={`grid gap-2 p-4 ${mobile ? "grid-cols-3" : "grid-cols-2"}`}>
      {Array.from({ length: 12 }, (_, index) => (
        <div
          key={index}
          className="aspect-square animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
        />
      ))}
    </div>
  );
}

function EmptyLibrary({ onUpload }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-7 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
        <svg
          viewBox="0 0 24 24"
          className="size-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <path d="M4 5h16v14H4zM4 16l4-4 3 3 3-3 6 6M16 9h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
        No uploaded images yet
      </h3>
      <p className="mt-1 max-w-52 text-xs leading-5 text-slate-400">
        Upload an image to start building your reusable library.
      </p>
      <button
        type="button"
        onClick={onUpload}
        className="mt-5 min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
      >
        Upload image
      </button>
    </div>
  );
}

function ImageLibraryPanel({
  onUploadImage,
  onInsertAsset,
  onClose,
  isUploading = false,
  mobile = false,
}) {
  const fileInputRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [assets, setAssets] = useState([]);
  const [query, setQuery] = useState("");
  const [serverQuery, setServerQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLocalUploadPending, setIsLocalUploadPending] = useState(false);
  const [pendingAssetId, setPendingAssetId] = useState(null);
  const [brokenAssetIds, setBrokenAssetIds] = useState(() => new Set());
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    hasMore: false,
    nextCursor: null,
  });
  const [reloadKey, setReloadKey] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const uploadPending = isUploading || isLocalUploadPending;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setServerQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let isCurrent = true;

    getImageAssets({ limit: PAGE_SIZE, search: serverQuery }).then(
      (result) => {
        if (!isCurrent) return;
        setAssets(result.assets);
        setPagination(result.pagination);
        setError("");
        setIsLoading(false);
      },
      (loadError) => {
        if (!isCurrent) return;
        setError(loadError.message || "Unable to load your images.");
        setIsLoading(false);
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [reloadKey, serverQuery]);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) return assets;
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return assets.filter((asset) => {
      const searchableText = `${asset.name || ""} ${asset.originalFilename || ""}`.toLowerCase();
      return terms.every((term) => searchableText.includes(term));
    });
  }, [assets, deferredQuery]);

  const chooseFile = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const [file] = event.target.files;
    event.target.value = "";
    if (!file || uploadPending) return;

    try {
      validateImageFile(file);
      setError("");
      setIsLocalUploadPending(true);
      const asset = await onUploadImage?.(file);
      if (!asset) throw new Error("The image could not be added to your library.");
      setAssets((current) => [
        asset,
        ...current.filter((item) => item.id !== asset.id),
      ]);
      setQuery("");
    } catch (uploadError) {
      setError(uploadError.message || "Unable to upload this image.");
    } finally {
      setIsLocalUploadPending(false);
    }
  };

  const insertImage = async (asset) => {
    if (pendingAssetId || brokenAssetIds.has(asset.id)) return;
    setPendingAssetId(asset.id);
    setError("");
    try {
      const inserted = await onInsertAsset?.(toAssetDescriptor(asset));
      if (!inserted) {
        throw new Error("Unable to insert this image into the canvas.");
      }
    } catch (insertError) {
      setError(insertError.message || "Unable to insert this image.");
    } finally {
      setPendingAssetId(null);
    }
  };

  const loadMore = async () => {
    if (!pagination.hasMore || !pagination.nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setError("");
    try {
      const result = await getImageAssets({
        before: pagination.nextCursor,
        limit: PAGE_SIZE,
        search: serverQuery,
      });
      setAssets((current) => {
        const knownIds = new Set(current.map((asset) => asset.id));
        return [
          ...current,
          ...result.assets.filter((asset) => !knownIds.has(asset.id)),
        ];
      });
      setPagination(result.pagination);
    } catch (loadError) {
      setError(loadError.message || "Unable to load more images.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const markImageBroken = (assetId) => {
    setBrokenAssetIds((current) => {
      const next = new Set(current);
      next.add(assetId);
      return next;
    });
  };

  return (
    <section
      className="flex h-full min-h-0 flex-col bg-white dark:bg-slate-950"
      aria-label="Images library"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        onChange={(event) => void handleFileChange(event)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="shrink-0 border-b border-slate-200 px-4 pb-4 pt-4 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Images
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Reuse your uploads in any design
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close images library"
            className="grid size-10 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <label className="relative mt-4 block">
          <span className="sr-only">Search images</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search images..."
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-950"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              aria-label="Clear image search"
            >
              ×
            </button>
          )}
        </label>

        <button
          type="button"
          onClick={chooseFile}
          disabled={uploadPending}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-65"
        >
          {uploadPending ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 16V4m0 0L7 9m5-5 5 5M5 14v5h14v-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {uploadPending ? "Uploading..." : "Upload image"}
        </button>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" role="alert">
            <div className="flex items-start justify-between gap-2">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} className="shrink-0 font-semibold" aria-label="Dismiss error">×</button>
            </div>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <ImageSkeletons mobile={mobile} />
        ) : !assets.length && error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Your images could not be loaded
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setError("");
                setReloadKey((key) => key + 1);
              }}
              className="mt-4 min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-blue-600 dark:border-slate-700 dark:text-blue-400"
            >
              Try again
            </button>
          </div>
        ) : !assets.length && !query ? (
          <EmptyLibrary onUpload={chooseFile} />
        ) : !filteredAssets.length || !assets.length ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              No images match “{query}”
            </p>
            <p className="mt-1 text-xs text-slate-400">Try a broader filename.</p>
          </div>
        ) : (
          <>
            <div className="px-4 pb-1 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Your uploads
                </h3>
                <span className="text-[11px] text-slate-400">
                  {filteredAssets.length}
                </span>
              </div>
            </div>
            <div className={`grid gap-2 p-4 pt-2 ${mobile ? "grid-cols-3" : "grid-cols-2"}`} role="group" aria-label="Uploaded images">
              {filteredAssets.map((asset) => {
                const descriptor = toAssetDescriptor(asset);
                const isBroken = brokenAssetIds.has(asset.id);
                const isPending = pendingAssetId === asset.id;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    draggable={!mobile && !isBroken}
                    disabled={Boolean(pendingAssetId) || isBroken}
                    onDragStart={(event) => {
                      suppressClickRef.current = true;
                      writeAssetDragData(event.dataTransfer, descriptor);
                    }}
                    onDragEnd={() => {
                      window.setTimeout(() => {
                        suppressClickRef.current = false;
                      }, 0);
                    }}
                    onClick={() => {
                      if (!suppressClickRef.current) void insertImage(asset);
                    }}
                    className="group relative min-w-0 touch-manipulation overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900"
                    title={isBroken ? `${asset.originalFilename} is unavailable` : `Add ${asset.originalFilename}`}
                    aria-label={isBroken ? `${asset.originalFilename} is unavailable` : `Add ${asset.originalFilename}`}
                  >
                    <span className="relative block aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {isBroken ? (
                        <span className="absolute inset-0 grid place-items-center p-3 text-center text-[10px] font-medium text-slate-400">
                          Image unavailable
                        </span>
                      ) : (
                        <img
                          src={asset.thumbnailUrl || asset.secureUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          onError={() => markImageBroken(asset.id)}
                          className="size-full object-cover transition duration-200 group-hover:scale-105"
                        />
                      )}
                      <span className="absolute inset-0 bg-slate-950/0 transition group-hover:bg-slate-950/10" />
                      <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 text-blue-600 opacity-0 shadow-sm transition group-hover:opacity-100 dark:bg-slate-950/90">
                        {isPending ? (
                          <span className="size-3.5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                        ) : (
                          <span className="text-lg leading-none" aria-hidden="true">+</span>
                        )}
                      </span>
                    </span>
                    <span className="block truncate bg-white px-2.5 py-2 text-[11px] font-medium text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                      {asset.name || asset.originalFilename}
                    </span>
                  </button>
                );
              })}
            </div>
            {pagination.hasMore && (
              <div className="px-4 pb-5 text-center">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={isLoadingMore}
                  className="min-h-10 rounded-xl px-4 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60 dark:text-blue-400 dark:hover:bg-blue-950/40"
                >
                  {isLoadingMore ? "Loading..." : "Load more images"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 px-4 py-2.5 text-center text-[10px] text-slate-400 dark:border-slate-800">
        JPG, PNG or WEBP · Maximum 10 MB
      </div>
    </section>
  );
}

export default ImageLibraryPanel;
