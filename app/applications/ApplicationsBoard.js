"use client";

import { useEffect, useRef, useState } from "react";
import { celebrateAcceptedApplication } from "@/lib/confetti";
import { updateJobApplicationStatus } from "./actions";

const AUTO_SCROLL_EDGE_SIZE = 96;
const AUTO_SCROLL_MAX_SPEED = 24;
const ACCEPTED_STATUS = "ACCEPTED";

function BuildingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.75 20.25h14.5M6.75 20.25V5.75A2 2 0 0 1 8.75 3.75h6.5a2 2 0 0 1 2 2v14.5M9.25 8.25h1.5M13.25 8.25h1.5M9.25 11.75h1.5M13.25 11.75h1.5M9.25 15.25h1.5M13.25 15.25h1.5"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.25s6.25-5.59 6.25-10.25A6.25 6.25 0 1 0 5.75 10C5.75 14.66 12 20.25 12 20.25Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 12.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
      />
    </svg>
  );
}

function HeartIcon({ isFavorite }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill={isFavorite ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.1 5.9a5.35 5.35 0 0 0-7.57 0L12 6.43l-.53-.53A5.35 5.35 0 1 0 3.9 13.47L12 21.25l8.1-7.78a5.35 5.35 0 0 0 0-7.57Z"
      />
    </svg>
  );
}

function ApplicationCard({
  application,
  isDragging,
  isPending,
  onClick,
  onDragStart,
  onDragEnd,
  onFavoriteToggle,
}) {
  const isFavorite = Boolean(application.isFavorite);

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(event, application);
    }
  }

  function handleFavoriteClick(event) {
    event.preventDefault();
    event.stopPropagation();
    onFavoriteToggle(application, !isFavorite);
  }

  return (
    <article
      draggable
      role="button"
      tabIndex={0}
      onClick={(event) => onClick(event, application)}
      onKeyDown={handleKeyDown}
      onDragStart={(event) => onDragStart(event, application.id)}
      onDragEnd={onDragEnd}
      className={`relative cursor-grab rounded-lg border border-slate-200 bg-white p-4 pr-12 shadow-sm transition hover:border-slate-300 hover:shadow-md active:cursor-grabbing ${
        isDragging ? "opacity-50 ring-2 ring-teal-500" : ""
      } ${isPending ? "border-teal-200 bg-teal-50/30" : ""}`}
    >
      {isPending ? (
        <span
          aria-label="Saving status"
          className="absolute right-12 top-5 h-2 w-2 rounded-full bg-teal-500"
        />
      ) : null}

      <button
        type="button"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={isFavorite}
        draggable={false}
        onClick={handleFavoriteClick}
        onKeyDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onDragStart={(event) => event.stopPropagation()}
        className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 ${
          isFavorite
            ? "text-rose-500 hover:text-rose-600"
            : "text-slate-400 hover:text-rose-500"
        }`}
      >
        <HeartIcon isFavorite={isFavorite} />
      </button>

      <h3 className="text-sm font-semibold leading-5 text-slate-950">
        {application.title}
      </h3>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <BuildingIcon />
          <span className="min-w-0 truncate">{application.companyName}</span>
        </div>

        {application.location ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <LocationIcon />
            <span className="min-w-0 truncate">{application.location}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function groupApplicationsByStatus(applications, statuses) {
  return statuses.reduce((groups, status) => {
    groups[status.value] = applications.filter(
      (application) => application.status === status.value,
    );

    return groups;
  }, {});
}

export default function ApplicationsBoard({
  statuses,
  applications,
  emptyColumnMessage = "No applications yet",
  onApplicationsChange,
  onApplicationFavoriteToggle,
  onApplicationSelect,
}) {
  const scrollContainerRef = useRef(null);
  const autoScrollFrameRef = useRef(null);
  const applicationsRef = useRef(applications);
  const pendingStatusUpdatesRef = useRef({});
  const isMountedRef = useRef(true);
  const latestDragClientXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastDragEndedAtRef = useRef(null);
  const [boardApplications, setBoardApplications] = useState(applications);
  const [draggingId, setDraggingId] = useState("");
  const [activeDropStatus, setActiveDropStatus] = useState("");
  const [pendingApplicationIds, setPendingApplicationIds] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const applicationsByStatus = groupApplicationsByStatus(
    boardApplications,
    statuses,
  );

  useEffect(() => {
    const currentById = new Map(
      applicationsRef.current.map((application) => [
        application.id,
        application,
      ]),
    );
    const nextApplications = applications.map((application) => {
      const currentApplication = currentById.get(application.id);
      const pendingStatusUpdate =
        pendingStatusUpdatesRef.current[application.id];

      if (pendingStatusUpdate && currentApplication) {
        return {
          ...application,
          status: currentApplication.status,
        };
      }

      return application;
    });

    applicationsRef.current = nextApplications;
    setBoardApplications(nextApplications);
  }, [applications]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      if (autoScrollFrameRef.current) {
        cancelAnimationFrame(autoScrollFrameRef.current);
      }
    };
  }, []);

  function getAutoScrollSpeed(container) {
    const rect = container.getBoundingClientRect();
    const distanceFromLeft = latestDragClientXRef.current - rect.left;
    const distanceFromRight = rect.right - latestDragClientXRef.current;

    if (distanceFromLeft < AUTO_SCROLL_EDGE_SIZE) {
      const intensity =
        (AUTO_SCROLL_EDGE_SIZE - distanceFromLeft) / AUTO_SCROLL_EDGE_SIZE;

      return -Math.ceil(intensity * AUTO_SCROLL_MAX_SPEED);
    }

    if (distanceFromRight < AUTO_SCROLL_EDGE_SIZE) {
      const intensity =
        (AUTO_SCROLL_EDGE_SIZE - distanceFromRight) / AUTO_SCROLL_EDGE_SIZE;

      return Math.ceil(intensity * AUTO_SCROLL_MAX_SPEED);
    }

    return 0;
  }

  function restoreBoardScroll(scrollLeft) {
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollLeft;
      }
    });
  }

  function applyApplications(nextApplications) {
    applicationsRef.current = nextApplications;

    if (!isMountedRef.current) {
      return;
    }

    setBoardApplications(nextApplications);
    onApplicationsChange(nextApplications);
  }

  function setApplicationPending(applicationId, isPending) {
    if (!isMountedRef.current) {
      return;
    }

    setPendingApplicationIds((currentPendingIds) => {
      if (isPending) {
        return currentPendingIds[applicationId]
          ? currentPendingIds
          : { ...currentPendingIds, [applicationId]: true };
      }

      if (!currentPendingIds[applicationId]) {
        return currentPendingIds;
      }

      const nextPendingIds = { ...currentPendingIds };
      delete nextPendingIds[applicationId];

      return nextPendingIds;
    });
  }

  function updateApplicationInBoard(applicationId, getNextApplication) {
    const nextApplications = applicationsRef.current.map((application) =>
      application.id === applicationId
        ? getNextApplication(application)
        : application,
    );

    applyApplications(nextApplications);
  }

  async function syncPendingStatus(applicationId) {
    const pendingStatusUpdate = pendingStatusUpdatesRef.current[applicationId];

    if (!pendingStatusUpdate || pendingStatusUpdate.inFlight) {
      return;
    }

    if (
      pendingStatusUpdate.confirmedApplication.status ===
      pendingStatusUpdate.desiredStatus
    ) {
      delete pendingStatusUpdatesRef.current[applicationId];
      setApplicationPending(applicationId, false);
      return;
    }

    pendingStatusUpdate.inFlight = true;

    const requestedStatus = pendingStatusUpdate.desiredStatus;
    const currentScrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;

    try {
      const result = await updateJobApplicationStatus(
        applicationId,
        requestedStatus,
      );
      const latestStatusUpdate =
        pendingStatusUpdatesRef.current[applicationId];

      if (!latestStatusUpdate) {
        return;
      }

      if (result.success) {
        const savedApplication =
          result.application ?? {
            ...latestStatusUpdate.confirmedApplication,
            status: requestedStatus,
          };

        latestStatusUpdate.confirmedApplication = savedApplication;

        updateApplicationInBoard(applicationId, (currentApplication) => {
          if (currentApplication.status === requestedStatus) {
            return savedApplication;
          }

          return {
            ...savedApplication,
            status: currentApplication.status,
          };
        });
      } else if (latestStatusUpdate.desiredStatus === requestedStatus) {
        updateApplicationInBoard(
          applicationId,
          () => latestStatusUpdate.confirmedApplication,
        );
        setErrorMessage(result.message || "Application could not be updated.");
        delete pendingStatusUpdatesRef.current[applicationId];
        setApplicationPending(applicationId, false);
        restoreBoardScroll(currentScrollLeft);
        return;
      }
    } catch {
      const latestStatusUpdate =
        pendingStatusUpdatesRef.current[applicationId];

      if (
        latestStatusUpdate &&
        latestStatusUpdate.desiredStatus === requestedStatus
      ) {
        updateApplicationInBoard(
          applicationId,
          () => latestStatusUpdate.confirmedApplication,
        );
        setErrorMessage("Application could not be updated.");
        delete pendingStatusUpdatesRef.current[applicationId];
        setApplicationPending(applicationId, false);
        restoreBoardScroll(currentScrollLeft);
        return;
      }
    } finally {
      const latestStatusUpdate =
        pendingStatusUpdatesRef.current[applicationId];

      if (!latestStatusUpdate) {
        restoreBoardScroll(currentScrollLeft);
        return;
      }

      latestStatusUpdate.inFlight = false;

      if (
        latestStatusUpdate.confirmedApplication.status ===
        latestStatusUpdate.desiredStatus
      ) {
        delete pendingStatusUpdatesRef.current[applicationId];
        setApplicationPending(applicationId, false);
        restoreBoardScroll(currentScrollLeft);
        return;
      }

      restoreBoardScroll(currentScrollLeft);
      void syncPendingStatus(applicationId);
    }
  }

  function stopAutoScroll() {
    isDraggingRef.current = false;

    if (autoScrollFrameRef.current) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  }

  function startAutoScroll() {
    if (autoScrollFrameRef.current) {
      return;
    }

    const tick = () => {
      if (!isDraggingRef.current) {
        autoScrollFrameRef.current = null;
        return;
      }

      const container = scrollContainerRef.current;

      if (container) {
        container.scrollLeft += getAutoScrollSpeed(container);
      }

      autoScrollFrameRef.current = requestAnimationFrame(tick);
    };

    autoScrollFrameRef.current = requestAnimationFrame(tick);
  }

  function handleBoardDragOver(event) {
    if (!isDraggingRef.current) {
      return;
    }

    latestDragClientXRef.current = event.clientX;
    startAutoScroll();
  }

  function handleDragStart(event, applicationId) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", applicationId);
    latestDragClientXRef.current = event.clientX;
    isDraggingRef.current = true;
    startAutoScroll();
    setDraggingId(applicationId);
    setErrorMessage("");
  }

  function handleDragEnd(event) {
    stopAutoScroll();
    lastDragEndedAtRef.current = event.timeStamp;
    setDraggingId("");
    setActiveDropStatus("");
  }

  function handleCardClick(event, application) {
    const recentlyDragged =
      lastDragEndedAtRef.current !== null &&
      event.timeStamp - lastDragEndedAtRef.current < 250;

    if (isDraggingRef.current || recentlyDragged) {
      return;
    }

    onApplicationSelect(application);
  }

  async function handleDrop(event, nextStatus) {
    event.preventDefault();

    const applicationId =
      event.dataTransfer.getData("text/plain") || draggingId;
    const application = applicationsRef.current.find(
      (item) => item.id === applicationId,
    );
    const currentScrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;

    stopAutoScroll();
    setDraggingId("");
    setActiveDropStatus("");

    if (!application || application.status === nextStatus) {
      return;
    }

    const previousStatus = application.status;
    const shouldCelebrateAccepted =
      previousStatus !== ACCEPTED_STATUS && nextStatus === ACCEPTED_STATUS;
    const nextApplications = applicationsRef.current.map((item) =>
      item.id === applicationId ? { ...item, status: nextStatus } : item,
    );
    const pendingStatusUpdate = pendingStatusUpdatesRef.current[applicationId];

    pendingStatusUpdatesRef.current[applicationId] = {
      confirmedApplication:
        pendingStatusUpdate?.confirmedApplication ?? application,
      desiredStatus: nextStatus,
      inFlight: pendingStatusUpdate?.inFlight ?? false,
    };

    applyApplications(nextApplications);
    setApplicationPending(applicationId, true);
    setErrorMessage("");
    restoreBoardScroll(currentScrollLeft);

    if (shouldCelebrateAccepted) {
      void celebrateAcceptedApplication();
    }

    if (!pendingStatusUpdatesRef.current[applicationId].inFlight) {
      void syncPendingStatus(applicationId);
    }
  }

  return (
    <div className="space-y-3">
      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div
        ref={scrollContainerRef}
        onDragOver={handleBoardDragOver}
        className="overflow-x-auto pb-4"
      >
        <div className="grid min-w-[1840px] grid-cols-7 gap-2">
          {statuses.map((status) => {
            const statusApplications = applicationsByStatus[status.value];
            const isActiveDropTarget = activeDropStatus === status.value;

            return (
              <section
                key={status.value}
                onDragOver={(event) => event.preventDefault()}
                onDragEnter={() => setActiveDropStatus(status.value)}
                onDrop={(event) => handleDrop(event, status.value)}
                className={`flex min-h-[32rem] flex-col rounded-xl border bg-white shadow-sm transition ${
                  isActiveDropTarget
                    ? "border-teal-300 ring-2 ring-teal-100"
                    : "border-slate-200"
                }`}
              >
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-950">
                    {status.label}{" "}
                    <span className="font-medium text-slate-500">
                      ({statusApplications.length})
                    </span>
                  </h2>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  {statusApplications.length > 0 ? (
                    statusApplications.map((application) => (
                      <ApplicationCard
                        key={application.id}
                        application={application}
                        isDragging={draggingId === application.id}
                        isPending={Boolean(pendingApplicationIds[application.id])}
                        onClick={handleCardClick}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onFavoriteToggle={onApplicationFavoriteToggle}
                      />
                    ))
                  ) : (
                    <div className="flex min-h-40 w-full flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-center">
                      <p className="text-sm text-slate-500">
                        {emptyColumnMessage}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
