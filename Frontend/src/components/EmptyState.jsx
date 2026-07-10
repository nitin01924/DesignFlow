function EmptyState() {
  return (
    <section className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
        +
      </div>
      <h2 className="text-xl font-semibold text-gray-900">No projects yet</h2>
      <p className="mt-2 text-gray-500">Create your first design.</p>
    </section>
  );
}

export default EmptyState;
