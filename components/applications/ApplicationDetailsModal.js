"use client";

import { useEffect, useState } from "react";
import CVFileUpload from "@/components/applications/CVFileUpload";
import CompanyLogo from "@/components/applications/CompanyLogo";
import DeleteApplicationDialog from "@/components/applications/DeleteApplicationDialog";
import NotesPanel from "@/components/applications/NotesPanel";
import { ACCEPTED_STATUS } from "@/constants/applicationStatuses";
import { formatCvFileSize } from "@/constants/cvFiles";
import { JOB_TYPE_OPTIONS } from "@/constants/jobTypes";
import {
  getDisplayValue,
  getEditFormValues,
  getJobTypeLabel,
  getNoteEditValues,
  getSafeExternalUrl,
} from "@/lib/application-utils";
import { celebrateAcceptedApplication } from "@/lib/confetti";
import { formatDate } from "@/lib/date-utils";

const inputClassName =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function DetailItem({ label, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-950">{children}</dd>
    </div>
  );
}

function EditField({ label, required, children }) {
  return (
    <label className="block rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm font-medium text-slate-700">
      {label} {required ? <span className="text-teal-700">*</span> : null}
      {children}
    </label>
  );
}

export default function ApplicationDetailsModal({
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
  const [cvFile, setCvFile] = useState(null);
  const [cvFileError, setCvFileError] = useState("");
  const [removeCvFile, setRemoveCvFile] = useState(false);
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
      if (
        event.key === "Escape" &&
        !isDeleting &&
        !isSaving &&
        !isAnyNoteSaving
      ) {
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

  function resetCvFileState() {
    setCvFile(null);
    setCvFileError("");
    setRemoveCvFile(false);
  }

  function handleEditClick() {
    setFormValues(getEditFormValues(application));
    setNoteEditValues(getNoteEditValues(application.notes));
    setNoteEditErrors({});
    setNoteDeleteError("");
    setSaveError("");
    resetCvFileState();
    setIsEditing(true);
  }

  function handleCancelEdit() {
    if (!isSaving && !isAnyNoteSaving) {
      setFormValues(getEditFormValues(application));
      setNoteEditValues(getNoteEditValues(application.notes));
      setNoteEditErrors({});
      setNoteDeleteError("");
      setSaveError("");
      resetCvFileState();
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

    if (cvFileError) {
      setSaveError(cvFileError);
      return;
    }

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

    if (cvFile) {
      formData.append("cvFile", cvFile);
    }

    if (removeCvFile) {
      formData.append("removeCvFile", "true");
    }

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
        resetCvFileState();
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

    if (
      deletingNoteId ||
      isDeleting ||
      isSaving ||
      isNoteSaving ||
      savingNoteId
    ) {
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
  const jobType = getDisplayValue(getJobTypeLabel(application.jobType));
  const status = getDisplayValue(statusLabel);
  const description = getDisplayValue(application.description);
  const createdDate = getDisplayValue(formatDate(application.createdAt));
  const updatedDate = getDisplayValue(formatDate(application.updatedAt));
  const safeJobUrl = getSafeExternalUrl(application.url);
  const jobUrl = getDisplayValue(application.url);
  const existingCvFile = application.cvFileName
    ? {
        fileName: application.cvFileName,
        fileSize: application.cvFileSize,
        fileType: application.cvFileType,
        viewUrl: `/applications/${application.id}/cv`,
        downloadUrl: `/applications/${application.id}/cv?download=1`,
      }
    : null;

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
              <div className="flex min-w-0 items-start gap-3">
                <CompanyLogo companyName={application.companyName} size="lg" />

                <div className="flex min-w-0 flex-1 items-start gap-2 pt-0.5">
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
                      className="mt-0.5 shrink-0 rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
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
                        {JOB_TYPE_OPTIONS.map((option) => (
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

                    <div className="sm:col-span-2">
                      <CVFileUpload
                        id="edit-application-cv"
                        selectedFile={cvFile}
                        existingFile={existingCvFile}
                        isExistingFileRemoved={removeCvFile}
                        disabled={isSaving || isAnyNoteSaving}
                        errorMessage={cvFileError}
                        onFileSelect={(file) => {
                          setCvFile(file);
                          setRemoveCvFile(false);
                          setSaveError("");
                        }}
                        onFileRemove={() => setCvFile(null)}
                        onExistingFileRemove={() => {
                          setRemoveCvFile(true);
                          setCvFile(null);
                          setSaveError("");
                        }}
                        onExistingFileRestore={() => setRemoveCvFile(false)}
                        onErrorChange={setCvFileError}
                      />
                    </div>

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
                      CV / Resume
                    </p>
                    {existingCvFile ? (
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {existingCvFile.fileName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {[
                              existingCvFile.fileSize
                                ? formatCvFileSize(existingCvFile.fileSize)
                                : "",
                              existingCvFile.fileType,
                            ]
                              .filter(Boolean)
                              .join(" | ")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={existingCvFile.viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                          >
                            View
                          </a>
                          <a
                            href={existingCvFile.downloadUrl}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-700">N/A</p>
                    )}
                  </div>

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

            <NotesPanel
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
          <DeleteApplicationDialog
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
