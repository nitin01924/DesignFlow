function CanvasArea() {
  return (
    <section
      className="flex min-h-96 min-w-0 items-center justify-center overflow-auto bg-slate-100 p-6 sm:p-10"
      aria-label="Design canvas workspace"
    >
      <div className="flex aspect-4/3 w-full max-w-3xl flex-col items-center justify-center border border-slate-200 bg-white p-8 text-center shadow-[0_20px_50px_rgba(15,23,42,0.10)]">
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 4h16v16H4zM8 2v4m8-4v4M8 18v4m8-4v4M2 8h4m-4 8h4m12-8h4m-4 8h4" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Canvas Area</h2>
        <p className="mt-2 text-sm text-slate-400">Image editing coming soon</p>
      </div>
    </section>
  );
}

export default CanvasArea;
