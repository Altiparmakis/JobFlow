"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  createApplicationNote,
  deleteApplicationNote,
  deleteJobApplication,
  updateApplicationNote,
  updateJobApplication,
  updateJobApplicationFavorite,
} from "@/app/applications/actions";
import ApplicationDetailsModal from "@/components/applications/ApplicationDetailsModal";
import ApplicationsBoard from "@/components/applications/ApplicationsBoard";
import {
  EmptyApplicationsState,
  EmptyFilteredApplicationsState,
} from "@/components/applications/ApplicationsEmptyStates";
import ApplicationsFilterModal from "@/components/applications/ApplicationsFilterModal";
import ApplicationsWorkspaceHeader from "@/components/applications/ApplicationsWorkspaceHeader";
import VisibleColumnsModal from "@/components/applications/VisibleColumnsModal";
import { APPLICATION_FILTER_DEFAULTS } from "@/constants/applicationFilters";
import {
  getNormalizedApplicationFilters,
  getVisibleApplications,
  hasActiveFilterOptions,
} from "@/lib/application-utils";

export default function ApplicationsWorkspace({ statuses, initialApplications }) {
  const router = useRouter();
  const favoriteRequestIdsRef = useRef({});
  const [applications, setApplications] = useState(initialApplications);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filters, setFilters] = useState({
    ...APPLICATION_FILTER_DEFAULTS,
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isVisibleColumnsModalOpen, setIsVisibleColumnsModalOpen] =
    useState(false);
  const [visibleStatusValues, setVisibleStatusValues] = useState(() =>
    statuses.map((status) => status.value),
  );
  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState("");
  const visibleApplications = useMemo(
    () => getVisibleApplications(applications, filters),
    [applications, filters],
  );
  const visibleBoardStatuses = useMemo(() => {
    const visibleStatusSet = new Set(visibleStatusValues);

    return statuses.filter((status) => visibleStatusSet.has(status.value));
  }, [statuses, visibleStatusValues]);
  const totalJobs = applications.length;
  const visibleJobs = visibleApplications.length;
  const hasActiveFilters = hasActiveFilterOptions(filters);
  const hasHiddenColumns = visibleBoardStatuses.length < statuses.length;
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
      const result = await updateJobApplicationFavorite(
        applicationId,
        isFavorite,
      );

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

  function openVisibleColumnsModal() {
    setIsVisibleColumnsModalOpen(true);
  }

  function closeVisibleColumnsModal() {
    setIsVisibleColumnsModalOpen(false);
  }

  function handleVisibleStatusToggle(statusValue) {
    setVisibleStatusValues((currentValues) => {
      if (currentValues.includes(statusValue)) {
        return currentValues.filter((value) => value !== statusValue);
      }

      return [...currentValues, statusValue];
    });
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
      <ApplicationsWorkspaceHeader
        hasActiveFilters={hasActiveFilters}
        hasHiddenColumns={hasHiddenColumns}
        totalJobs={totalJobs}
        visibleJobs={visibleJobs}
        onApplicationCreated={handleApplicationCreated}
        onOpenFilters={openFilterModal}
        onOpenVisibleColumns={openVisibleColumnsModal}
      />

      {hasNoApplications ? <EmptyApplicationsState /> : null}
      {hasNoVisibleApplications ? <EmptyFilteredApplicationsState /> : null}
      {favoriteErrorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {favoriteErrorMessage}
        </p>
      ) : null}

      <ApplicationsBoard
        statuses={visibleBoardStatuses}
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

      <VisibleColumnsModal
        isOpen={isVisibleColumnsModalOpen}
        statuses={statuses}
        visibleStatuses={visibleStatusValues}
        onClose={closeVisibleColumnsModal}
        onToggleStatus={handleVisibleStatusToggle}
      />
    </section>
  );
}
