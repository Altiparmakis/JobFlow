"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { celebrateAcceptedApplication } from "@/lib/confetti";
import {
  createApplicationNote,
  deleteApplicationNote,
  deleteJobApplication,
  updateJobApplicationFavorite,
  updateApplicationNote,
  updateJobApplication,
} from "./actions";
import AddApplicationModal from "./AddApplicationModal";
import ApplicationsFilterModal, {
  APPLICATION_FILTER_DEFAULTS,
  getNormalizedApplicationFilters,
} from "./ApplicationsFilterModal";
import ApplicationsBoard from "./ApplicationsBoard";

const ACCEPTED_STATUS = "ACCEPTED";

const jobTypeLabels = {
  INTERNSHIP: "Internship",
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
};

const jobTypeOptions = [
  { label: "Internship", value: "INTERNSHIP" },
  { label: "Full-time", value: "FULL_TIME" },
  { label: "Part-time", value: "PART_TIME" },
];

const inputClassName =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSafeExternalUrl(url) {
  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.href;
    }
  } catch {
    return "";
  }

  return "";
}

function getDisplayValue(value) {
  if (typeof value === "string") {
    return value.trim() || "N/A";
  }

  return value ?? "N/A";
}

function DetailItem({ label, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-950">{children}</dd>
    </div>
  );
}

function getEditFormValues(application) {
  return {
    title: application.title ?? "",
    companyName: application.companyName ?? "",
    location: application.location ?? "",
    jobType: application.jobType ?? "FULL_TIME",
    status: application.status ?? "SAVED",
    description: application.description ?? "",
    url: application.url ?? "",
  };
}

function getNoteEditValues(notes) {
  return (notes ?? []).reduce((values, note) => {
    values[note.id] = note.content ?? "";

    return values;
  }, {});
}

function EditField({ label, required, children }) {
  return (
    <label className="block rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm font-medium text-slate-700">
      {label} {required ? <span className="text-teal-700">*</span> : null}
      {children}
    </label>
  );
}

function EmptyApplicationsState() {
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

function EmptyFilteredApplicationsState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-5 sm:px-6">
      <p className="text-base font-semibold text-slate-950">
        No applications match these filters.
      </p>
    </div>
  );
}

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

function getDateBoundary(value, boundary) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date =
    boundary === "end"
      ? new Date(year, month - 1, day, 23, 59, 59, 999)
      : new Date(year, month - 1, day);
  const time = date.getTime();

  return Number.isNaN(time) ? null : time;
}

function getTimestamp(value) {
  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

function compareText(firstValue, secondValue) {
  return String(firstValue ?? "")
    .trim()
    .localeCompare(String(secondValue ?? "").trim(), "en", {
      sensitivity: "base",
      numeric: true,
    });
}

function compareDateDescending(firstValue, secondValue) {
  return getTimestamp(secondValue) - getTimestamp(firstValue);
}

function compareApplications(firstApplication, secondApplication, orderBy) {
  if (orderBy === "title") {
    return (
      compareText(firstApplication.title, secondApplication.title) ||
      compareDateDescending(
        firstApplication.updatedAt,
        secondApplication.updatedAt,
      ) ||
      compareText(firstApplication.id, secondApplication.id)
    );
  }

  const dateField = orderBy === "createdAt" ? "createdAt" : "updatedAt";

  return (
    compareDateDescending(
      firstApplication[dateField],
      secondApplication[dateField],
    ) ||
    compareText(firstApplication.title, secondApplication.title) ||
    compareText(firstApplication.id, secondApplication.id)
  );
}

function getVisibleApplications(applications, filters) {
  const normalizedFilters = getNormalizedApplicationFilters(filters);
  const fromTime = getDateBoundary(normalizedFilters.appliedFrom, "start");
  const untilTime = getDateBoundary(normalizedFilters.appliedUntil, "end");

  return applications
    .filter((application) => {
      const createdTime = getTimestamp(application.createdAt);

      if (
        normalizedFilters.roleFilter &&
        application.jobType !== normalizedFilters.roleFilter
      ) {
        return false;
      }

      if (
        normalizedFilters.statusFilter &&
        application.status !== normalizedFilters.statusFilter
      ) {
        return false;
      }

      if (normalizedFilters.favoritesOnly && !application.isFavorite) {
        return false;
      }

      if (fromTime !== null && createdTime < fromTime) {
        return false;
      }

      if (untilTime !== null && createdTime > untilTime) {
        return false;
      }

      return true;
    })
    .slice()
    .sort((firstApplication, secondApplication) =>
      compareApplications(
        firstApplication,
        secondApplication,
        normalizedFilters.orderBy,
      ),
    );
}

function hasActiveDateFilters(filters) {
  return Boolean(filters.appliedFrom || filters.appliedUntil);
}

function hasActiveRoleOrStatusFilters(filters) {
  return Boolean(filters.roleFilter || filters.statusFilter);
}

function hasActiveFavoriteFilter(filters) {
  return Boolean(filters.favoritesOnly);
}

function hasActiveFilterOptions(filters) {
  return (
    filters.orderBy !== APPLICATION_FILTER_DEFAULTS.orderBy ||
    hasActiveDateFilters(filters) ||
    hasActiveRoleOrStatusFilters(filters) ||
    hasActiveFavoriteFilter(filters)
  );
}

function ApplicationNotesPanel({
  notes,
  noteContent,
  isEditing,
  isSaving,
  noteEditValues = {},
  noteErrors = {},
  deletingNoteId,
  savingNoteId,
  errorMessage,
  deleteErrorMessage,
  onContentChange,
  onNoteDelete,
  onNoteEditCancel,
  onNoteEditChange,
  onNoteEditSave,
  onSave,
}) {
  const safeNotes = Array.isArray(notes) ? notes : [];
  const isNoteActionPending =
    isSaving || Boolean(savingNoteId) || Boolean(deletingNoteId);

  return (
    <aside className="border-t border-slate-200 bg-slate-50/60 px-6 py-6 lg:border-l lg:border-t-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">Notes</h3>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
          {safeNotes.length}
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label
          htmlFor="application-note-content"
          className="text-xs font-semibold text-slate-500"
        >
          New note
        </label>
        <textarea
          id="application-note-content"
          value={noteContent}
          onChange={(event) => onContentChange(event.target.value)}
          disabled={isNoteActionPending}
          rows={5}
          placeholder="Add a quick update..."
          className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        />

        {errorMessage ? (
          <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={isNoteActionPending || !noteContent.trim()}
            className="rounded-md bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-teal-900/50"
          >
            {isSaving ? "Saving..." : "Add Note"}
          </button>
        </div>
      </div>

      {deleteErrorMessage ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteErrorMessage}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {safeNotes.length > 0 ? (
          safeNotes.map((note) => {
            const editValue = noteEditValues[note.id] ?? note.content ?? "";
            const hasChanged = editValue.trim() !== (note.content ?? "").trim();
            const isNoteSaving = savingNoteId === note.id;
            const isNoteDeleting = deletingNoteId === note.id;
            const isOtherNoteActionPending =
              isSaving ||
              (Boolean(savingNoteId) && !isNoteSaving) ||
              (Boolean(deletingNoteId) && !isNoteDeleting);

            return (
              <article
                key={note.id}
                className="relative rounded-lg border border-slate-200 bg-white p-4 pr-11 shadow-sm"
              >
                <button
                  type="button"
                  onClick={(event) => onNoteDelete(event, note.id)}
                  disabled={
                    isSaving ||
                    Boolean(savingNoteId) ||
                    Boolean(deletingNoteId)
                  }
                  aria-label="Delete note"
                  className="absolute right-2 top-2 rounded-md px-2 py-1 text-sm font-semibold leading-none text-slate-400 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  X
                </button>

                {isEditing ? (
                  <>
                    <textarea
                      value={editValue}
                      onChange={(event) =>
                        onNoteEditChange(note.id, event.target.value)
                      }
                      disabled={isNoteSaving || isOtherNoteActionPending}
                      rows={4}
                      className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    />

                    {noteErrors[note.id] ? (
                      <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {noteErrors[note.id]}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onNoteEditCancel(note.id)}
                        disabled={
                          isNoteSaving ||
                          isOtherNoteActionPending ||
                          !hasChanged
                        }
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => onNoteEditSave(note)}
                        disabled={
                          isNoteSaving ||
                          isOtherNoteActionPending ||
                          !hasChanged ||
                          !editValue.trim()
                        }
                        className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-teal-900/50"
                      >
                        {isNoteSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {note.content}
                  </p>
                )}

                <time className="mt-3 block text-xs font-medium text-slate-500">
                  {formatDate(note.createdAt)}
                </time>
              </article>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              No notes yet. Add your first note.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

function DeleteConfirmationModal({
  isDeleting,
  errorMessage,
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 py-6"
      onClick={(event) => {
        event.stopPropagation();
        onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-application-title"
        aria-describedby="delete-application-message"
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-5">
          <h3
            id="delete-application-title"
            className="text-xl font-semibold text-slate-950"
          >
            Delete application?
          </h3>
          <p
            id="delete-application-message"
            className="mt-2 text-sm leading-6 text-slate-600"
          >
            Are you sure you want to delete this application? This action cannot
            be undone.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {errorMessage ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="rounded-md bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:bg-red-900/50"
            >
              {isDeleting ? "Deleting..." : "Delete Application"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationDetailsModal({
  application,
  statuses,
  onClose,
  onDelete,
  onNoteCreate,
  onNoteDelete,
  onNoteUpdate,
  onUpdate,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteDeleteError, setNoteDeleteError] = useState("");
  const [deletingNoteId, setDeletingNoteId] = useState("");
  const [savingNoteId, setSavingNoteId] = useState("");
  const [noteEditErrors, setNoteEditErrors] = useState({});
  const [noteEditValues, setNoteEditValues] = useState(() =>
    getNoteEditValues(application.notes),
  );
  const [formValues, setFormValues] = useState(() =>
    getEditFormValues(application),
  );
  const isAnyNoteSaving =
    isNoteSaving || Boolean(savingNoteId) || Boolean(deletingNoteId);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !isDeleting && !isSaving && !isAnyNoteSaving) {
        if (isDeleteConfirmOpen) {
          setIsDeleteConfirmOpen(false);
          return;
        }

        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAnyNoteSaving, isDeleteConfirmOpen, isDeleting, isSaving, onClose]);

  function handleClose() {
    if (!isDeleting && !isSaving && !isAnyNoteSaving && !isDeleteConfirmOpen) {
      onClose();
    }
  }

  function handleEditClick() {
    setFormValues(getEditFormValues(application));
    setNoteEditValues(getNoteEditValues(application.notes));
    setNoteEditErrors({});
    setNoteDeleteError("");
    setSaveError("");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    if (!isSaving && !isAnyNoteSaving) {
      setFormValues(getEditFormValues(application));
      setNoteEditValues(getNoteEditValues(application.notes));
      setNoteEditErrors({});
      setNoteDeleteError("");
      setSaveError("");
      setIsEditing(false);
    }
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    if (isSaving || isAnyNoteSaving) {
      return;
    }

    const nextValues = {
      title: formValues.title.trim(),
      companyName: formValues.companyName.trim(),
      location: formValues.location.trim(),
      jobType: formValues.jobType,
      status: formValues.status,
      description: formValues.description.trim(),
      url: formValues.url.trim(),
    };

    if (
      !nextValues.title ||
      !nextValues.companyName ||
      !nextValues.jobType ||
      !nextValues.status
    ) {
      setSaveError("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    Object.entries(nextValues).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const previousStatus = application.status;
    const shouldCelebrateAccepted =
      previousStatus !== ACCEPTED_STATUS &&
      nextValues.status === ACCEPTED_STATUS;

    setIsSaving(true);
    setSaveError("");

    if (shouldCelebrateAccepted) {
      await celebrateAcceptedApplication();
    }

    try {
      const result = await onUpdate(application.id, formData);

      if (result.success) {
        setFormValues(getEditFormValues(result.application));
        setIsEditing(false);
        return;
      }

      setSaveError(result.message);
    } catch {
      setSaveError("Application could not be updated.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (isDeleting || isSaving || isAnyNoteSaving) {
      return;
    }

    setDeleteError("");
    setIsDeleteConfirmOpen(true);
  }

  function handleCancelDelete() {
    if (isDeleting) {
      return;
    }

    setIsDeleteConfirmOpen(false);
  }

  async function handleConfirmDelete() {
    if (isDeleting || isSaving || isAnyNoteSaving) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const result = await onDelete(application.id);

      if (!result.success) {
        setIsDeleting(false);
        setDeleteError(result.message);
      }
    } catch {
      setIsDeleting(false);
      setDeleteError("Application could not be deleted.");
    }
  }

  async function handleNoteSave() {
    if (isAnyNoteSaving || isDeleting) {
      return;
    }

    const nextContent = noteContent.trim();

    if (!nextContent) {
      setNoteError("Please write a note before saving.");
      return;
    }

    setIsNoteSaving(true);
    setNoteError("");
    setNoteDeleteError("");

    try {
      const result = await onNoteCreate(application.id, nextContent);

      if (result.success) {
        setNoteContent("");
        return;
      }

      setNoteError(result.message);
    } catch {
      setNoteError("Note could not be saved.");
    } finally {
      setIsNoteSaving(false);
    }
  }

  function handleNoteEditChange(noteId, content) {
    setNoteEditValues((currentValues) => ({
      ...currentValues,
      [noteId]: content,
    }));
    setNoteEditErrors((currentErrors) => {
      if (!currentErrors[noteId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[noteId];

      return nextErrors;
    });
  }

  function handleNoteEditCancel(noteId) {
    const note = application.notes?.find((item) => item.id === noteId);

    if (!note || savingNoteId === noteId) {
      return;
    }

    setNoteEditValues((currentValues) => ({
      ...currentValues,
      [noteId]: note.content ?? "",
    }));
    setNoteEditErrors((currentErrors) => {
      if (!currentErrors[noteId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[noteId];

      return nextErrors;
    });
  }

  async function handleNoteEditSave(note) {
    if (savingNoteId || isNoteSaving || isDeleting) {
      return;
    }

    const nextContent = (noteEditValues[note.id] ?? "").trim();

    if (!nextContent) {
      setNoteEditErrors((currentErrors) => ({
        ...currentErrors,
        [note.id]: "Notes cannot be empty.",
      }));
      return;
    }

    setSavingNoteId(note.id);
    setNoteDeleteError("");
    setNoteEditErrors((currentErrors) => {
      if (!currentErrors[note.id]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[note.id];

      return nextErrors;
    });

    try {
      const result = await onNoteUpdate(note.id, nextContent);

      if (result.success) {
        setNoteEditValues((currentValues) => ({
          ...currentValues,
          [note.id]: result.note.content,
        }));
        return;
      }

      setNoteEditErrors((currentErrors) => ({
        ...currentErrors,
        [note.id]: result.message,
      }));
    } catch {
      setNoteEditErrors((currentErrors) => ({
        ...currentErrors,
        [note.id]: "Note could not be saved.",
      }));
    } finally {
      setSavingNoteId("");
    }
  }

  async function handleNoteDelete(event, noteId) {
    event.stopPropagation();

    if (deletingNoteId || isDeleting || isSaving || isNoteSaving || savingNoteId) {
      return;
    }

    setDeletingNoteId(noteId);
    setNoteDeleteError("");
    setNoteEditValues((currentValues) => {
      if (!(noteId in currentValues)) {
        return currentValues;
      }

      const nextValues = { ...currentValues };
      delete nextValues[noteId];

      return nextValues;
    });
    setNoteEditErrors((currentErrors) => {
      if (!currentErrors[noteId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[noteId];

      return nextErrors;
    });

    try {
      const result = await onNoteDelete(application.id, noteId);

      if (!result.success) {
        setNoteDeleteError(result.message);
      }
    } catch {
      setNoteDeleteError("Note could not be deleted.");
    } finally {
      setDeletingNoteId("");
    }
  }

  const statusLabel =
    statuses.find((status) => status.value === application.status)?.label ??
    application.status;
  const title = getDisplayValue(application.title);
  const companyName = getDisplayValue(application.companyName);
  const location = getDisplayValue(application.location);
  const jobType = getDisplayValue(
    jobTypeLabels[application.jobType] ?? application.jobType,
  );
  const status = getDisplayValue(statusLabel);
  const description = getDisplayValue(application.description);
  const createdDate = getDisplayValue(formatDate(application.createdAt));
  const updatedDate = getDisplayValue(formatDate(application.updatedAt));
  const safeJobUrl = getSafeExternalUrl(application.url);
  const jobUrl = getDisplayValue(application.url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-details-title"
        className="max-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-teal-700">
                Application details
              </p>
              <div className="mt-1 flex items-start gap-2">
                {isEditing ? (
                  <input
                    id="application-details-title"
                    name="title"
                    type="text"
                    required
                    value={formValues.title}
                    onChange={handleFieldChange}
                    disabled={isSaving}
                    className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xl font-semibold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:text-2xl"
                  />
                ) : (
                  <h2
                    id="application-details-title"
                    className="min-w-0 break-words text-2xl font-semibold text-slate-950"
                  >
                    {title}
                  </h2>
                )}

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={handleEditClick}
                    aria-label="Edit application"
                    className="mt-0.5 rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  >
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
                        d="m16.86 4.49 2.65 2.65M5 19h3.15L18.28 8.87a1.87 1.87 0 0 0 0-2.65l-.5-.5a1.87 1.87 0 0 0-2.65 0L5 15.85V19Z"
                      />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving || isAnyNoteSaving}
                className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete Application"}
              </button>

              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting || isSaving || isAnyNoteSaving}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close application details"
              >
                X
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0">
              {isEditing ? (
                <div className="space-y-5 px-6 py-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <EditField label="Company name" required>
                      <input
                        name="companyName"
                        type="text"
                        required
                        value={formValues.companyName}
                        onChange={handleFieldChange}
                        disabled={isSaving}
                        className={inputClassName}
                      />
                    </EditField>

                    <EditField label="Location">
                      <input
                        name="location"
                        type="text"
                        value={formValues.location}
                        onChange={handleFieldChange}
                        disabled={isSaving}
                        className={inputClassName}
                      />
                    </EditField>

                    <EditField label="Job type" required>
                      <select
                        name="jobType"
                        required
                        value={formValues.jobType}
                        onChange={handleFieldChange}
                        disabled={isSaving}
                        className={inputClassName}
                      >
                        {jobTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </EditField>

                    <EditField label="Status" required>
                      <select
                        name="status"
                        required
                        value={formValues.status}
                        onChange={handleFieldChange}
                        disabled={isSaving}
                        className={inputClassName}
                      >
                        {statuses.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </EditField>

                    <DetailItem label="Created date">{createdDate}</DetailItem>

                    <DetailItem label="Updated date">{updatedDate}</DetailItem>
                  </div>

                  <EditField label="Description">
                    <textarea
                      name="description"
                      rows={5}
                      value={formValues.description}
                      onChange={handleFieldChange}
                      disabled={isSaving}
                      className={inputClassName}
                    />
                  </EditField>

                  <EditField label="Job URL">
                    <input
                      name="url"
                      type="url"
                      value={formValues.url}
                      onChange={handleFieldChange}
                      disabled={isSaving}
                      className={inputClassName}
                    />
                  </EditField>

                  {saveError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {saveError}
                    </p>
                  ) : null}

                  {deleteError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {deleteError}
                    </p>
                  ) : null}

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSaving || isAnyNoteSaving}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || isAnyNoteSaving}
                      className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-teal-900/50"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 px-6 py-6">
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <DetailItem label="Company name">{companyName}</DetailItem>

                    <DetailItem label="Location">{location}</DetailItem>

                    <DetailItem label="Job type">{jobType}</DetailItem>

                    <DetailItem label="Status">{status}</DetailItem>

                    <DetailItem label="Created date">{createdDate}</DetailItem>

                    <DetailItem label="Updated date">{updatedDate}</DetailItem>
                  </dl>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      Description
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {description}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      Job URL
                    </p>
                    {safeJobUrl ? (
                      <a
                        href={safeJobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block break-all text-sm font-medium text-teal-700 transition hover:text-teal-800"
                      >
                        {jobUrl}
                      </a>
                    ) : (
                      <p className="mt-2 break-all text-sm text-slate-700">
                        {jobUrl}
                      </p>
                    )}
                  </div>

                  {deleteError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {deleteError}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            <ApplicationNotesPanel
              notes={application.notes}
              noteContent={noteContent}
              isEditing={isEditing}
              isSaving={isNoteSaving}
              noteEditValues={noteEditValues}
              noteErrors={noteEditErrors}
              deletingNoteId={deletingNoteId}
              savingNoteId={savingNoteId}
              errorMessage={noteError}
              deleteErrorMessage={noteDeleteError}
              onContentChange={setNoteContent}
              onNoteDelete={handleNoteDelete}
              onNoteEditCancel={handleNoteEditCancel}
              onNoteEditChange={handleNoteEditChange}
              onNoteEditSave={handleNoteEditSave}
              onSave={handleNoteSave}
            />
          </div>
        </form>

        {isDeleteConfirmOpen ? (
          <DeleteConfirmationModal
            isDeleting={isDeleting}
            errorMessage={deleteError}
            onCancel={handleCancelDelete}
            onConfirm={handleConfirmDelete}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function ApplicationsWorkspace({ statuses, initialApplications }) {
  const router = useRouter();
  const favoriteRequestIdsRef = useRef({});
  const [applications, setApplications] = useState(initialApplications);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filters, setFilters] = useState({
    ...APPLICATION_FILTER_DEFAULTS,
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState("");
  const visibleApplications = useMemo(
    () => getVisibleApplications(applications, filters),
    [applications, filters],
  );
  const totalJobs = applications.length;
  const visibleJobs = visibleApplications.length;
  const hasActiveFilters = hasActiveFilterOptions(filters);
  const hasNoApplications = totalJobs === 0;
  const hasNoVisibleApplications =
    totalJobs > 0 && visibleJobs === 0 && hasActiveFilters;

  function handleApplicationCreated(application) {
    if (!application) {
      return;
    }

    setApplications((currentApplications) => [
      application,
      ...currentApplications,
    ]);
  }

  function closeApplicationDetails() {
    setSelectedApplication(null);
  }

  function handleApplicationsChange(nextApplications) {
    setApplications((currentApplications) => {
      const nextApplicationsById = new Map(
        nextApplications.map((application) => [application.id, application]),
      );

      return currentApplications.map(
        (application) => nextApplicationsById.get(application.id) ?? application,
      );
    });
    setSelectedApplication((currentApplication) => {
      if (!currentApplication) {
        return currentApplication;
      }

      return (
        nextApplications.find(
          (application) => application.id === currentApplication.id,
        ) ?? currentApplication
      );
    });
  }

  async function handleApplicationFavoriteToggle(application, isFavorite) {
    if (!application?.id) {
      return {
        success: false,
        message: "Favorite status could not be updated.",
      };
    }

    const applicationId = application.id;
    const previousApplication =
      applications.find((item) => item.id === applicationId) ?? application;
    const requestId = (favoriteRequestIdsRef.current[applicationId] ?? 0) + 1;

    favoriteRequestIdsRef.current[applicationId] = requestId;
    setFavoriteErrorMessage("");
    setApplications((currentApplications) =>
      currentApplications.map((item) =>
        item.id === applicationId ? { ...item, isFavorite } : item,
      ),
    );
    setSelectedApplication((currentApplication) =>
      currentApplication?.id === applicationId
        ? { ...currentApplication, isFavorite }
        : currentApplication,
    );

    try {
      const result = await updateJobApplicationFavorite(applicationId, isFavorite);

      if (favoriteRequestIdsRef.current[applicationId] !== requestId) {
        return result;
      }

      if (result.success) {
        const savedApplication =
          result.application ?? { ...previousApplication, isFavorite };

        setApplications((currentApplications) =>
          currentApplications.map((item) =>
            item.id === applicationId ? savedApplication : item,
          ),
        );
        setSelectedApplication((currentApplication) =>
          currentApplication?.id === applicationId
            ? savedApplication
            : currentApplication,
        );
        return result;
      }

      setApplications((currentApplications) =>
        currentApplications.map((item) =>
          item.id === applicationId ? previousApplication : item,
        ),
      );
      setSelectedApplication((currentApplication) =>
        currentApplication?.id === applicationId
          ? previousApplication
          : currentApplication,
      );
      setFavoriteErrorMessage(
        result.message || "Favorite status could not be updated.",
      );

      return result;
    } catch {
      if (favoriteRequestIdsRef.current[applicationId] === requestId) {
        setApplications((currentApplications) =>
          currentApplications.map((item) =>
            item.id === applicationId ? previousApplication : item,
          ),
        );
        setSelectedApplication((currentApplication) =>
          currentApplication?.id === applicationId
            ? previousApplication
            : currentApplication,
        );
        setFavoriteErrorMessage("Favorite status could not be updated.");
      }

      return {
        success: false,
        message: "Favorite status could not be updated.",
      };
    } finally {
      if (favoriteRequestIdsRef.current[applicationId] === requestId) {
        delete favoriteRequestIdsRef.current[applicationId];
      }
    }
  }

  function openFilterModal() {
    setIsFilterModalOpen(true);
  }

  function closeFilterModal() {
    setIsFilterModalOpen(false);
  }

  function handleClearFilters(
    nextFilters = { ...APPLICATION_FILTER_DEFAULTS },
  ) {
    setFilters(getNormalizedApplicationFilters(nextFilters));
  }

  function handleSearchApplications(nextFilters) {
    setFilters(getNormalizedApplicationFilters(nextFilters));
    setIsFilterModalOpen(false);
  }

  async function handleApplicationUpdate(applicationId, formData) {
    const result = await updateJobApplication(applicationId, formData);

    if (result.success) {
      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === result.application.id
            ? result.application
            : application,
        ),
      );
      setSelectedApplication(result.application);
      router.refresh();
    }

    return result;
  }

  async function handleApplicationDelete(applicationId) {
    const result = await deleteJobApplication(applicationId);

    if (result.success) {
      setApplications((currentApplications) =>
        currentApplications.filter(
          (application) => application.id !== result.applicationId,
        ),
      );
      setSelectedApplication(null);
      router.refresh();
    }

    return result;
  }

  async function handleApplicationNoteCreate(applicationId, content) {
    const result = await createApplicationNote(applicationId, content);

    if (result.success) {
      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                notes: [result.note, ...(application.notes ?? [])],
              }
            : application,
        ),
      );
      setSelectedApplication((currentApplication) =>
        currentApplication?.id === applicationId
          ? {
              ...currentApplication,
              notes: [result.note, ...(currentApplication.notes ?? [])],
            }
          : currentApplication,
      );
    }

    return result;
  }

  async function handleApplicationNoteUpdate(noteId, content) {
    const result = await updateApplicationNote(noteId, content);

    if (result.success) {
      const replaceNote = (application) => ({
        ...application,
        notes: (application.notes ?? []).map((note) =>
          note.id === noteId ? result.note : note,
        ),
      });

      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === result.note.applicationId
            ? replaceNote(application)
            : application,
        ),
      );
      setSelectedApplication((currentApplication) =>
        currentApplication?.id === result.note.applicationId
          ? replaceNote(currentApplication)
          : currentApplication,
      );
    }

    return result;
  }

  async function handleApplicationNoteDelete(applicationId, noteId) {
    const previousApplications = applications;
    const previousSelectedApplication = selectedApplication;

    const removeNote = (application) => ({
      ...application,
      notes: (application.notes ?? []).filter((note) => note.id !== noteId),
    });

    setApplications((currentApplications) =>
      currentApplications.map((application) =>
        application.id === applicationId ? removeNote(application) : application,
      ),
    );
    setSelectedApplication((currentApplication) =>
      currentApplication?.id === applicationId
        ? removeNote(currentApplication)
        : currentApplication,
    );

    const result = await deleteApplicationNote(noteId);

    if (!result.success) {
      setApplications(previousApplications);
      setSelectedApplication(previousSelectedApplication);
    }

    return result;
  }

  return (
    <section className="mx-auto flex w-full max-w-[clamp(80rem,70vw,112rem)] flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-semibold text-slate-950">
            Your Job Tracker
          </h1>

          <AddApplicationModal onApplicationCreated={handleApplicationCreated} />
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

          <button
            type="button"
            onClick={openFilterModal}
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

      {hasNoApplications ? <EmptyApplicationsState /> : null}
      {hasNoVisibleApplications ? <EmptyFilteredApplicationsState /> : null}
      {favoriteErrorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {favoriteErrorMessage}
        </p>
      ) : null}

      <ApplicationsBoard
        statuses={statuses}
        applications={visibleApplications}
        emptyColumnMessage={
          hasActiveFilters ? "No matches" : "No applications yet"
        }
        onApplicationsChange={handleApplicationsChange}
        onApplicationFavoriteToggle={handleApplicationFavoriteToggle}
        onApplicationSelect={setSelectedApplication}
      />

      {selectedApplication ? (
        <ApplicationDetailsModal
          key={selectedApplication.id}
          application={selectedApplication}
          statuses={statuses}
          onClose={closeApplicationDetails}
          onDelete={handleApplicationDelete}
          onNoteCreate={handleApplicationNoteCreate}
          onNoteDelete={handleApplicationNoteDelete}
          onNoteUpdate={handleApplicationNoteUpdate}
          onUpdate={handleApplicationUpdate}
        />
      ) : null}

      {isFilterModalOpen ? (
        <ApplicationsFilterModal
          isOpen={isFilterModalOpen}
          filters={filters}
          onClearFilters={handleClearFilters}
          onClose={closeFilterModal}
          onSearchApplications={handleSearchApplications}
        />
      ) : null}
    </section>
  );
}
