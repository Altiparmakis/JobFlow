"use client";

import { useEffect } from "react";

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 12.5 4.5 4.5L19 7"
      />
    </svg>
  );
}

export default function VisibleColumnsModal({
  isOpen,
  onClose,
  onToggleStatus,
  statuses,
  visibleStatuses,
}) {
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

  const visibleStatusSet = new Set(visibleStatuses);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="visible-columns-title"
        aria-describedby="visible-columns-description"
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="visible-columns-title"
              className="text-xl font-semibold text-slate-950"
            >
              Board columns
            </h2>
            <p
              id="visible-columns-description"
              className="mt-1 text-sm text-slate-500"
            >
              Choose which categories you want to see on your board.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            aria-label="Close column visibility"
          >
            X
          </button>
        </div>

        <div className="space-y-2 px-6 py-5">
          {statuses.map((status) => {
            const isSelected = visibleStatusSet.has(status.value);

            return (
              <button
                key={status.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggleStatus(status.value)}
                className={`flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                  isSelected
                    ? "border-teal-200 bg-teal-50/70 text-slate-950 hover:bg-teal-50"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="text-sm font-semibold">{status.label}</span>
                <span
                  aria-hidden="true"
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${
                    isSelected
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  {isSelected ? <CheckIcon /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
