"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { updateJobApplicationStatus } from "./actions";

const AUTO_SCROLL_EDGE_SIZE = 96;
const AUTO_SCROLL_MAX_SPEED = 24;

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

function ApplicationCard({
  application,
  isDragging,
  isUpdating,
  onClick,
  onDragStart,
  onDragEnd,
}) {
  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(event, application);
    }
  }

  return (
    <article
      draggable={!isUpdating}
      role="button"
      tabIndex={isUpdating ? -1 : 0}
      onClick={(event) => onClick(event, application)}
      onKeyDown={handleKeyDown}
      onDragStart={(event) => onDragStart(event, application.id)}
      onDragEnd={onDragEnd}
      className={`cursor-grab rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md active:cursor-grabbing ${
        isDragging ? "opacity-50 ring-2 ring-teal-500" : ""
      } ${isUpdating ? "pointer-events-none opacity-70" : ""}`}
    >
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
  onApplicationsChange,
  onApplicationSelect,
}) {
  const router = useRouter();
  const scrollContainerRef = useRef(null);
  const autoScrollFrameRef = useRef(null);
  const latestDragClientXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastDragEndedAtRef = useRef(null);
  const [draggingId, setDraggingId] = useState("");
  const [activeDropStatus, setActiveDropStatus] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const applicationsByStatus = groupApplicationsByStatus(applications, statuses);

  useEffect(() => {
    return () => {
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

    if (isDraggingRef.current || recentlyDragged || updatingId) {
      return;
    }

    onApplicationSelect(application);
  }

  async function handleDrop(event, nextStatus) {
    event.preventDefault();

    const applicationId =
      event.dataTransfer.getData("text/plain") || draggingId;
    const application = applications.find((item) => item.id === applicationId);
    const currentScrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;

    stopAutoScroll();
    setDraggingId("");
    setActiveDropStatus("");

    if (!application || application.status === nextStatus || updatingId) {
      return;
    }

    const previousApplications = applications;
    const nextApplications = applications.map((item) =>
      item.id === applicationId ? { ...item, status: nextStatus } : item,
    );

    onApplicationsChange(nextApplications);
    setUpdatingId(applicationId);
    setErrorMessage("");

    const result = await updateJobApplicationStatus(applicationId, nextStatus);

    setUpdatingId("");

    if (!result.success) {
      onApplicationsChange(previousApplications);
      setErrorMessage(result.message);
      return;
    }

    if (result.application) {
      onApplicationsChange((currentApplications) =>
        currentApplications.map((item) =>
          item.id === applicationId ? result.application : item,
        ),
      );
    }

    router.refresh();
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = currentScrollLeft;
      }
    });
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
                        isUpdating={updatingId === application.id}
                        onClick={handleCardClick}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))
                  ) : (
                    <div className="flex min-h-40 w-full flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-center">
                      <p className="text-sm text-slate-500">
                        No applications yet
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
