import TemplateLibraryPanel from "./TemplateLibraryPanel.jsx";

function TemplateGalleryModal({ isOpen, onClose, onUseTemplate }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Choose a DesignFlow template"
        className="h-[min(92dvh,54rem)] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950"
      >
        <TemplateLibraryPanel
          wide
          mobile
          onClose={onClose}
          onUseTemplate={onUseTemplate}
        />
      </section>
    </div>
  );
}

export default TemplateGalleryModal;
