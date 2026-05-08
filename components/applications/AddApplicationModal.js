"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createJobApplication } from "@/app/applications/actions";
import { APPLICATION_STATUS_OPTIONS } from "@/constants/applicationStatuses";
import { JOB_TYPE_OPTIONS } from "@/constants/jobTypes";

const inputClassName =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

const labelClassName = "text-sm font-medium text-slate-700";

export default function AddApplicationModal({ onApplicationCreated }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function closeModal() {
    if (!isSubmitting) {
      setIsOpen(false);
      setMessage("");
    }
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
        onClick={() => setIsOpen(true)}
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
                <p className="mt-1 text-sm text-slate-500">
                  Save the role details now and organize it later.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                aria-label="Close modal"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
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
                  onClick={closeModal}
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
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
