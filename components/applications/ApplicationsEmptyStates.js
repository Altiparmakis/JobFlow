export function EmptyApplicationsState() {
  return (
    <div className="rounded-lg border border-dashed border-teal-200 bg-teal-50/60 px-5 py-5 sm:px-6">
      <p className="text-base font-semibold text-slate-950">
        No applications yet.
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Start tracking your first opportunity.
      </p>
    </div>
  );
}

export function EmptyFilteredApplicationsState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-5 sm:px-6">
      <p className="text-base font-semibold text-slate-950">
        No applications match these filters.
      </p>
    </div>
  );
}
