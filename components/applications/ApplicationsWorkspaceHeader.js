import AddApplicationModal from "@/components/applications/AddApplicationModal";

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.75 6.75h14.5M7.75 12h8.5M10.25 17.25h3.5"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.75 12s3.5-6.25 9.25-6.25S21.25 12 21.25 12s-3.5 6.25-9.25 6.25S2.75 12 2.75 12Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z"
      />
    </svg>
  );
}

export default function ApplicationsWorkspaceHeader({
  hasActiveFilters,
  hasHiddenColumns,
  totalJobs,
  visibleJobs,
  onApplicationCreated,
  onOpenFilters,
  onOpenVisibleColumns,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold text-slate-950">
          Your Job Tracker
        </h1>

        <AddApplicationModal onApplicationCreated={onApplicationCreated} />
      </div>

      <div className="flex items-center justify-between gap-3 border-y border-slate-200 py-3">
        <p className="text-sm font-medium text-slate-600 sm:text-base">
          <span className="font-semibold text-slate-950">{visibleJobs}</span>{" "}
          {hasActiveFilters ? "visible jobs" : "total jobs"}
          {hasActiveFilters ? (
            <span className="ml-2 text-sm text-slate-500">
              of {totalJobs} total
            </span>
          ) : null}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenVisibleColumns}
            aria-label="Manage visible columns"
            className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              hasHiddenColumns
                ? "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <EyeIcon />
            {hasHiddenColumns ? (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-teal-600"
              />
            ) : null}
          </button>

          <button
            type="button"
            onClick={onOpenFilters}
            aria-label="Open filters"
            className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              hasActiveFilters
                ? "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <FilterIcon />
            {hasActiveFilters ? (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-teal-600"
              />
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
}
