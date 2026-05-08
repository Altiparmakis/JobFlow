"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createJobApplication,
  extractJobApplicationFromUrl,
  importExtractedJobApplication,
} from "@/app/applications/actions";
import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_OPTIONS,
} from "@/constants/applicationStatuses";
import { JOB_TYPE, JOB_TYPE_OPTIONS } from "@/constants/jobTypes";

const APPLICATION_ADD_MODES = {
  MANUAL: "manual",
  URL: "url",
};

const URL_EXTRACTION_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  FAILURE: "failure",
};

const inputClassName =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

const labelClassName = "text-sm font-medium text-slate-700";

function getEditableApplicationDraft(application, fallbackUrl) {
  return {
    title: application?.title ?? "",
    companyName: application?.companyName ?? "",
    location: application?.location ?? "",
    description: application?.description ?? "",
    url: application?.url || fallbackUrl.trim(),
    jobType: application?.jobType || JOB_TYPE.FULL_TIME,
    status: application?.status || APPLICATION_STATUS.APPLIED,
    descriptionMayBeLimited: Boolean(application?.descriptionMayBeLimited),
  };
}

function ModeSelector({ selectedMode, onModeChange }) {
  const modes = [
    { label: "Manual", value: APPLICATION_ADD_MODES.MANUAL },
    { label: "Via URL", value: APPLICATION_ADD_MODES.URL },
  ];

  return (
    <div
      role="tablist"
      aria-label="Application add mode"
      className="mt-4 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1 sm:max-w-sm"
    >
      {modes.map((mode) => {
        const isSelected = selectedMode === mode.value;

        return (
          <button
            key={mode.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onModeChange(mode.value)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              isSelected
                ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
            }`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

function ManualApplicationForm({
  isActive,
  isSubmitting,
  message,
  onClose,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="px-6 py-6">
      <fieldset disabled={!isActive} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>
            Job title <span className="text-teal-700">*</span>
            <input
              name="title"
              required
              type="text"
              placeholder="Software Engineer"
              className={inputClassName}
            />
          </label>

          <label className={labelClassName}>
            Company name <span className="text-teal-700">*</span>
            <input
              name="companyName"
              required
              type="text"
              placeholder="Microsoft"
              className={inputClassName}
            />
          </label>
        </div>

        <label className={labelClassName}>
          Description
          <textarea
            name="description"
            rows={4}
            placeholder="Notes about the role, team, or application process"
            className={inputClassName}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>
            Job URL
            <input
              name="url"
              type="url"
              placeholder="https://example.com/job"
              className={inputClassName}
            />
          </label>

          <label className={labelClassName}>
            Location
            <input
              name="location"
              type="text"
              placeholder="Remote, Athens, Thessaloniki"
              className={inputClassName}
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClassName}>
            Job type <span className="text-teal-700">*</span>
            <select
              name="jobType"
              required
              defaultValue="FULL_TIME"
              className={inputClassName}
            >
              {JOB_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Status <span className="text-teal-700">*</span>
            <select
              name="status"
              required
              defaultValue="APPLIED"
              className={inputClassName}
            >
              {APPLICATION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {message ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-teal-900/50"
          >
            {isSubmitting ? "Saving..." : "Save Application"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}

function ExtractedApplicationPreview({ application, onChange }) {
  function handleFieldChange(event) {
    const { name, value } = event.target;

    onChange(name, value);
  }

  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-normal text-teal-700">
          Review extracted details
        </p>
        <p className="text-sm text-slate-600">
          Make any edits before importing this application.
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Title <span className="text-teal-700">*</span>
          <input
            name="title"
            type="text"
            value={application.title}
            onChange={handleFieldChange}
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Company name <span className="text-teal-700">*</span>
          <input
            name="companyName"
            type="text"
            value={application.companyName}
            onChange={handleFieldChange}
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Location
          <input
            name="location"
            type="text"
            value={application.location}
            onChange={handleFieldChange}
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Job type <span className="text-teal-700">*</span>
          <select
            name="jobType"
            value={application.jobType}
            onChange={handleFieldChange}
            className={inputClassName}
          >
            {JOB_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          Status <span className="text-teal-700">*</span>
          <select
            name="status"
            value={application.status}
            onChange={handleFieldChange}
            className={inputClassName}
          >
            {APPLICATION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          URL
          <input
            name="url"
            type="url"
            value={application.url}
            onChange={handleFieldChange}
            className={inputClassName}
          />
        </label>
      </div>

      <label className={`${labelClassName} mt-4 block`}>
        Description
        <textarea
          name="description"
          rows={6}
          value={application.description}
          onChange={handleFieldChange}
          placeholder="Add notes from the job posting"
          className={`${inputClassName} leading-6`}
        />
      </label>

      {application.descriptionMayBeLimited ? (
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Description preview may be limited for LinkedIn jobs.
        </p>
      ) : null}
    </div>
  );
}

function ViaUrlForm({
  isActive,
  onApplicationImported,
  onClose,
  onPendingChange,
  onSwitchToManual,
}) {
  const [jobUrl, setJobUrl] = useState("");
  const [extractionStatus, setExtractionStatus] = useState(
    URL_EXTRACTION_STATUS.IDLE,
  );
  const [extractionMessage, setExtractionMessage] = useState("");
  const [extractedApplication, setExtractedApplication] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const isExtracting = extractionStatus === URL_EXTRACTION_STATUS.LOADING;

  function resetExtractionState() {
    setExtractionStatus(URL_EXTRACTION_STATUS.IDLE);
    setExtractionMessage("");
    setExtractedApplication(null);
    setImportError("");
  }

  function handleUrlChange(event) {
    setJobUrl(event.target.value);
    resetExtractionState();
  }

  async function handleExtractSubmit(event) {
    event.preventDefault();

    if (!jobUrl.trim()) {
      setExtractionStatus(URL_EXTRACTION_STATUS.FAILURE);
      setExtractionMessage("Please paste a job posting URL.");
      setExtractedApplication(null);
      return;
    }

    setExtractionStatus(URL_EXTRACTION_STATUS.LOADING);
    setExtractionMessage("");
    setExtractedApplication(null);
    setImportError("");
    onPendingChange(true);

    try {
      const result = await extractJobApplicationFromUrl(jobUrl);

      if (result.success) {
        setExtractedApplication(
          getEditableApplicationDraft(result.application, jobUrl),
        );
        setExtractionStatus(URL_EXTRACTION_STATUS.SUCCESS);
        return;
      }

      setExtractionStatus(URL_EXTRACTION_STATUS.FAILURE);
      setExtractionMessage(
        result.message ||
          "We couldn't find the job details. Please add this application manually.",
      );
    } catch {
      setExtractionStatus(URL_EXTRACTION_STATUS.FAILURE);
      setExtractionMessage(
        "We couldn't find the job details. Please add this application manually.",
      );
    } finally {
      onPendingChange(false);
    }
  }

  function handleExtractedFieldChange(name, value) {
    setExtractedApplication((currentApplication) =>
      currentApplication
        ? {
            ...currentApplication,
            [name]: value,
          }
        : currentApplication,
    );
    setImportError("");
  }

  async function handleImport() {
    if (!extractedApplication || isImporting) {
      return;
    }

    const requiredValues = [
      extractedApplication.title,
      extractedApplication.companyName,
      extractedApplication.jobType,
      extractedApplication.status,
    ];

    if (requiredValues.some((value) => !String(value ?? "").trim())) {
      setImportError("Please fill in all required fields before importing.");
      return;
    }

    setIsImporting(true);
    setImportError("");
    onPendingChange(true);

    try {
      const result = await importExtractedJobApplication(extractedApplication);

      if (result.success) {
        onApplicationImported(result.application);
        return;
      }

      setImportError(result.message || "Application could not be imported.");
    } catch {
      setImportError("Application could not be imported.");
    } finally {
      setIsImporting(false);
      onPendingChange(false);
    }
  }

  return (
    <form onSubmit={handleExtractSubmit} noValidate className="px-6 py-6">
      <fieldset disabled={!isActive} className="space-y-5">
        <label className={labelClassName}>
          Job URL
          <input
            name="jobUrl"
            type="url"
            value={jobUrl}
            onChange={handleUrlChange}
            placeholder="Paste a job posting URL"
            className={inputClassName}
          />
        </label>

        {isExtracting ? (
          <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">
            Extracting job details...
          </p>
        ) : null}

        {extractionStatus === URL_EXTRACTION_STATUS.SUCCESS &&
        extractedApplication ? (
          <ExtractedApplicationPreview
            application={extractedApplication}
            onChange={handleExtractedFieldChange}
          />
        ) : null}

        {extractionStatus === URL_EXTRACTION_STATUS.FAILURE ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3">
            <p className="text-sm font-medium text-amber-900">
              {extractionMessage ||
                "We couldn't find the job details. Please add this application manually."}
            </p>
            <button
              type="button"
              onClick={onSwitchToManual}
              className="mt-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Switch to Manual
            </button>
          </div>
        ) : null}

        {importError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {importError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isExtracting || isImporting}
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isExtracting || isImporting}
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExtracting ? "Extracting..." : "Extract Details"}
          </button>
          {extractedApplication ? (
            <button
              type="button"
              onClick={handleImport}
              disabled={isExtracting || isImporting}
              className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-teal-900/50"
            >
              {isImporting ? "Importing..." : "Import Application"}
            </button>
          ) : null}
        </div>
      </fieldset>
    </form>
  );
}

export default function AddApplicationModal({ onApplicationCreated }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState(
    APPLICATION_ADD_MODES.MANUAL,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUrlActionPending, setIsUrlActionPending] = useState(false);
  const [message, setMessage] = useState("");

  function openModal() {
    setSelectedMode(APPLICATION_ADD_MODES.MANUAL);
    setMessage("");
    setIsOpen(true);
  }

  function closeModal() {
    if (!isSubmitting && !isUrlActionPending) {
      setIsOpen(false);
      setSelectedMode(APPLICATION_ADD_MODES.MANUAL);
      setMessage("");
    }
  }

  function handleUrlApplicationImported(application) {
    setIsOpen(false);
    setSelectedMode(APPLICATION_ADD_MODES.MANUAL);
    setMessage("");
    onApplicationCreated?.(application);
    router.refresh();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setMessage("");

    const result = await createJobApplication(formData);

    setIsSubmitting(false);

    if (result.success) {
      form.reset();
      setIsOpen(false);
      setSelectedMode(APPLICATION_ADD_MODES.MANUAL);
      onApplicationCreated?.(result.application);
      router.refresh();
      return;
    }

    setMessage(result.message);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex w-full items-center justify-center rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:w-auto"
      >
        + Add Application
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-application-title"
            className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="add-application-title"
                  className="text-xl font-semibold text-slate-950"
                >
                  Add New Application
                </h2>
                <ModeSelector
                  selectedMode={selectedMode}
                  onModeChange={setSelectedMode}
                />
                <p className="mt-1 text-sm text-slate-500">
                  Save the role details now and organize it later.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting || isUrlActionPending}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close modal"
              >
                X
              </button>
            </div>

            <div className="overflow-hidden">
              <div
                aria-hidden={selectedMode !== APPLICATION_ADD_MODES.MANUAL}
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  selectedMode === APPLICATION_ADD_MODES.MANUAL
                    ? "max-h-[52rem] translate-x-0 opacity-100"
                    : "max-h-0 -translate-x-6 opacity-0"
                }`}
              >
                <ManualApplicationForm
                  isActive={selectedMode === APPLICATION_ADD_MODES.MANUAL}
                  isSubmitting={isSubmitting}
                  message={message}
                  onClose={closeModal}
                  onSubmit={handleSubmit}
                />
              </div>

              <div
                aria-hidden={selectedMode !== APPLICATION_ADD_MODES.URL}
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  selectedMode === APPLICATION_ADD_MODES.URL
                    ? "max-h-[52rem] translate-x-0 opacity-100"
                    : "max-h-0 translate-x-6 opacity-0"
                }`}
              >
                <ViaUrlForm
                  isActive={selectedMode === APPLICATION_ADD_MODES.URL}
                  onApplicationImported={handleUrlApplicationImported}
                  onClose={closeModal}
                  onPendingChange={setIsUrlActionPending}
                  onSwitchToManual={() =>
                    setSelectedMode(APPLICATION_ADD_MODES.MANUAL)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
