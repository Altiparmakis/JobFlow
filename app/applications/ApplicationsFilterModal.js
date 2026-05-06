"use client";

import { useEffect, useState } from "react";

export const APPLICATION_FILTER_DEFAULTS = {
  orderBy: "updatedAt",
  appliedFrom: "",
  appliedUntil: "",
  roleFilter: "",
  favoritesOnly: false,
  statusFilter: "",
};

export const APPLICATION_ORDER_BY_OPTIONS = [
  { label: "Tracked date", value: "updatedAt" },
  { label: "Title", value: "title" },
  { label: "Created date", value: "createdAt" },
];

const APPLICATION_ROLE_OPTIONS = [
  { label: "All roles", value: "" },
  { label: "Full-time", value: "FULL_TIME" },
  { label: "Part-time", value: "PART_TIME" },
  { label: "Internship", value: "INTERNSHIP" },
];

const APPLICATION_STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Saved", value: "SAVED" },
  { label: "Applied", value: "APPLIED" },
  { label: "Screen", value: "SCREEN" },
  { label: "Interviewing", value: "INTERVIEWING" },
  { label: "Offer", value: "OFFER" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Accepted", value: "ACCEPTED" },
];

const inputClassName =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function getNormalizedApplicationFilters(filters) {
  const orderBy = APPLICATION_ORDER_BY_OPTIONS.some(
    (option) => option.value === filters?.orderBy,
  )
    ? filters.orderBy
    : APPLICATION_FILTER_DEFAULTS.orderBy;
  const roleFilter = APPLICATION_ROLE_OPTIONS.some(
    (option) => option.value === filters?.roleFilter,
  )
    ? filters.roleFilter
    : APPLICATION_FILTER_DEFAULTS.roleFilter;
  const statusFilter = APPLICATION_STATUS_OPTIONS.some(
    (option) => option.value === filters?.statusFilter,
  )
    ? filters.statusFilter
    : APPLICATION_FILTER_DEFAULTS.statusFilter;

  return {
    ...APPLICATION_FILTER_DEFAULTS,
    ...(filters ?? {}),
    orderBy,
    roleFilter,
    favoritesOnly: Boolean(filters?.favoritesOnly),
    statusFilter,
  };
}

export default function ApplicationsFilterModal({
  isOpen,
  filters,
  onClearFilters,
  onClose,
  onSearchApplications,
}) {
  const [draftFilters, setDraftFilters] = useState(() =>
    getNormalizedApplicationFilters(filters),
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function handleFieldChange(event) {
    const { checked, name, type, value } = event.target;

    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleClear() {
    const nextFilters = { ...APPLICATION_FILTER_DEFAULTS };

    setDraftFilters(nextFilters);
    onClearFilters(nextFilters);
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSearchApplications(draftFilters);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-applications-title"
        className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-2">
          <div>
            <h2
              id="filter-applications-title"
              className="text-xl font-semibold text-slate-950 mt-2"
            >
              Filter & Sort Applications
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            aria-label="Close filters"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <label className="block text-sm font-medium text-slate-700">
            Order by
            <select
              name="orderBy"
              value={draftFilters.orderBy}
              onChange={handleFieldChange}
              className={inputClassName}
            >
              {APPLICATION_ORDER_BY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Filter by dates
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Applied from
                <input
                  name="appliedFrom"
                  type="date"
                  value={draftFilters.appliedFrom}
                  onChange={handleFieldChange}
                  className={inputClassName}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Applied until
                <input
                  name="appliedUntil"
                  type="date"
                  value={draftFilters.appliedUntil}
                  onChange={handleFieldChange}
                  className={inputClassName}
                />
              </label>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Filter by role
              <select
                name="roleFilter"
                value={draftFilters.roleFilter}
                onChange={handleFieldChange}
                className={inputClassName}
              >
                {APPLICATION_ROLE_OPTIONS.map((option) => (
                  <option
                    key={option.value || "all-roles"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Filter by status
              <select
                name="statusFilter"
                value={draftFilters.statusFilter}
                onChange={handleFieldChange}
                className={inputClassName}
              >
                {APPLICATION_STATUS_OPTIONS.map((option) => (
                  <option
                    key={option.value || "all-statuses"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4  w-2xs">
            <h3 className="text-sm font-semibold text-slate-700">
              Filter by Favorites
            </h3>
            <label className="mt-2 flex cursor-pointer items-center gap-4 text-sm font-medium text-slate-700">
              <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
                <input
                  name="favoritesOnly"
                  type="checkbox"
                  role="switch"
                  checked={draftFilters.favoritesOnly}
                  onChange={handleFieldChange}
                  aria-checked={draftFilters.favoritesOnly}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-rose-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rose-500"
                />
                <span
                  aria-hidden="true"
                  className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5"
                />
              </span>
              <span>Show only favorites</span>
            </label>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Search Applications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
