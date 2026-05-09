"use client";

import { useRef, useState } from "react";
import {
  CV_FILE_ACCEPT,
  CV_FILE_SIZE_LABEL,
  formatCvFileSize,
  getCvFileClientValidationMessage,
} from "@/constants/cvFiles";

function FileIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-teal-700"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 3.75H7.75A1.75 1.75 0 0 0 6 5.5v13a1.75 1.75 0 0 0 1.75 1.75h8.5A1.75 1.75 0 0 0 18 18.5V7.5l-3.75-3.75Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 3.75V7.5H18M9 12.25h6M9 15.25h4"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.75V4.75m0 0-4 4m4-4 4 4M5.75 15.75v2.5a2 2 0 0 0 2 2h8.5a2 2 0 0 0 2-2v-2.5"
      />
    </svg>
  );
}

function FileSummary({ fileName, fileSize, fileType }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-slate-950">
        {fileName}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        {[fileSize ? formatCvFileSize(fileSize) : "", fileType]
          .filter(Boolean)
          .join(" | ")}
      </p>
    </div>
  );
}

export default function CVFileUpload({
  id,
  selectedFile,
  existingFile,
  isExistingFileRemoved = false,
  disabled = false,
  errorMessage = "",
  onFileSelect,
  onFileRemove,
  onExistingFileRemove,
  onExistingFileRestore,
  onErrorChange,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasExistingFile = Boolean(existingFile?.fileName);
  const showExistingFile =
    hasExistingFile && !selectedFile && !isExistingFileRemoved;

  function openFilePicker() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  function resetInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFile(file) {
    if (!file || disabled) {
      return;
    }

    const validationMessage = getCvFileClientValidationMessage(file);

    if (validationMessage) {
      onFileSelect?.(null);
      onErrorChange?.(validationMessage);
      resetInput();
      return;
    }

    onErrorChange?.("");
    onFileSelect?.(file);
  }

  function handleInputChange(event) {
    handleFile(event.target.files?.[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
    }
  }

  function handleRemoveSelectedFile() {
    onFileRemove?.();
    onErrorChange?.("");
    resetInput();
  }

  function handleRemoveExistingFile() {
    onExistingFileRemove?.();
    onFileRemove?.();
    onErrorChange?.("");
    resetInput();
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-slate-700">
          CV / Resume used for this application
        </p>
        <p className="text-xs text-slate-500">
          Optional. Upload the CV or resume file you used for this job.
        </p>
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={CV_FILE_ACCEPT}
        disabled={disabled}
        onChange={handleInputChange}
        className="sr-only"
      />

      {showExistingFile ? (
        <div className="mt-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-50">
                <FileIcon />
              </span>
              <FileSummary
                fileName={existingFile.fileName}
                fileSize={existingFile.fileSize}
                fileType={existingFile.fileType}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={existingFile.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                View
              </a>
              <a
                href={existingFile.downloadUrl}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                Download
              </a>
              <button
                type="button"
                onClick={openFilePicker}
                disabled={disabled}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemoveExistingFile}
                disabled={disabled}
                className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedFile ? (
        <div className="mt-2 rounded-md border border-teal-200 bg-white p-2 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-50">
                <FileIcon />
              </span>
              <div className="min-w-0">
                <FileSummary
                  fileName={selectedFile.name}
                  fileSize={selectedFile.size}
                  fileType={selectedFile.type}
                />
                {hasExistingFile ? (
                  <p className="mt-1 text-xs font-medium text-teal-700">
                    This file will replace the current CV when you save.
                  </p>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveSelectedFile}
              disabled={disabled}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Remove file
            </button>
          </div>
        </div>
      ) : null}

      {isExistingFileRemoved && !selectedFile ? (
        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          The current CV will be removed when you save.
          <button
            type="button"
            onClick={onExistingFileRestore}
            disabled={disabled}
            className="ml-2 font-semibold text-teal-700 transition hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep it
          </button>
        </div>
      ) : null}

      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mt-2 rounded-md border border-dashed bg-white px-3 py-3 text-center transition ${
            isDragging
              ? "border-teal-500 bg-teal-50"
              : "border-slate-300 hover:border-teal-400 hover:bg-slate-50"
          } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <div className="mx-auto flex max-w-lg flex-col items-center gap-2 sm:flex-row sm:justify-between sm:text-left">
            <div className="flex min-w-0 items-center gap-2">
              <UploadIcon />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700">
                  Drop a PDF, DOC, or DOCX file here
                </p>
                <p className="text-xs text-slate-500">
                  File size must be under {CV_FILE_SIZE_LABEL}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openFilePicker}
              disabled={disabled}
              className="shrink-0 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Choose file
            </button>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
