"use client";

import { useEffect, useRef, useState } from "react";
import { updateJobApplicationStatus } from "@/app/applications/actions";
import ApplicationsBoardColumn from "@/components/applications/ApplicationsBoardColumn";
import { ACCEPTED_STATUS } from "@/constants/applicationStatuses";
import {
  AUTO_SCROLL_EDGE_SIZE,
  AUTO_SCROLL_MAX_SPEED,
} from "@/constants/boardStyles";
import { groupApplicationsByStatus } from "@/lib/application-utils";
import { celebrateAcceptedApplication } from "@/lib/confetti";

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

      {statuses.length === 0 ? (
        <div className="flex min-h-[24rem] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            No columns selected.
          </p>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          onDragOver={handleBoardDragOver}
          className="overflow-x-auto pb-4"
        >
          <div className="grid grid-flow-col auto-cols-[minmax(16rem,1fr)] gap-2">
            {statuses.map((status) => (
              <ApplicationsBoardColumn
                key={status.value}
                applications={applicationsByStatus[status.value] ?? []}
                draggingId={draggingId}
                emptyColumnMessage={emptyColumnMessage}
                isActiveDropTarget={activeDropStatus === status.value}
                pendingApplicationIds={pendingApplicationIds}
                status={status}
                onApplicationClick={handleCardClick}
                onApplicationDragEnd={handleDragEnd}
                onApplicationDragStart={handleDragStart}
                onApplicationDrop={handleDrop}
                onApplicationFavoriteToggle={onApplicationFavoriteToggle}
                onDragEnter={setActiveDropStatus}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
