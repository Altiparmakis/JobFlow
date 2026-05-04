"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { celebrateAcceptedApplication } from "@/lib/confetti";
import { deleteJobApplication, updateJobApplication } from "./actions";
import AddApplicationModal from "./AddApplicationModal";
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

function EditField({ label, required, children }) {
  return (
    <label className="block rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm font-medium text-slate-700">
      {label} {required ? <span className="text-teal-700">*</span> : null}
      {children}
    </label>
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
  onUpdate,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [formValues, setFormValues] = useState(() =>
    getEditFormValues(application),
  );

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !isDeleting && !isSaving) {
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
  }, [isDeleteConfirmOpen, isDeleting, isSaving, onClose]);

  function handleClose() {
    if (!isDeleting && !isSaving && !isDeleteConfirmOpen) {
      onClose();
    }
  }

  function handleEditClick() {
    setFormValues(getEditFormValues(application));
    setSaveError("");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    if (!isSaving) {
      setFormValues(getEditFormValues(application));
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

    if (isSaving) {
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
      celebrateAcceptedApplication();
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
    if (isDeleting || isSaving) {
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
    if (isDeleting || isSaving) {
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
        className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl"
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
                disabled={isDeleting || isSaving}
                className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete Application"}
              </button>

              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting || isSaving}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close application details"
              >
                X
              </button>
            </div>
          </div>

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
                  disabled={isSaving}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
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
                <p className="text-xs font-semibold text-slate-500">Job URL</p>
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
  const [applications, setApplications] = useState(initialApplications);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const totalJobs = applications.length;

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

  return (
    <section className="mx-auto flex w-full max-w-[clamp(80rem,70vw,112rem)] flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-semibold text-slate-950">
            Your Job Tracker
          </h1>

          <AddApplicationModal onApplicationCreated={handleApplicationCreated} />
        </div>

        <div className="flex items-center border-y border-slate-200 py-3">
          <p className="text-sm font-medium text-slate-600 sm:text-base">
            <span className="font-semibold text-slate-950">{totalJobs}</span>{" "}
            total jobs
          </p>
        </div>
      </div>

      <ApplicationsBoard
        statuses={statuses}
        applications={applications}
        onApplicationsChange={setApplications}
        onApplicationSelect={setSelectedApplication}
      />

      {selectedApplication ? (
        <ApplicationDetailsModal
          key={selectedApplication.id}
          application={selectedApplication}
          statuses={statuses}
          onClose={closeApplicationDetails}
          onDelete={handleApplicationDelete}
          onUpdate={handleApplicationUpdate}
        />
      ) : null}
    </section>
  );
}
