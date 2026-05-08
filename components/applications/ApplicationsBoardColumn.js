import ApplicationCard from "@/components/applications/ApplicationCard";

export default function ApplicationsBoardColumn({
  applications,
  draggingId,
  emptyColumnMessage,
  isActiveDropTarget,
  pendingApplicationIds,
  status,
  onApplicationClick,
  onApplicationDragEnd,
  onApplicationDragStart,
  onApplicationDrop,
  onApplicationFavoriteToggle,
  onDragEnter,
}) {
  return (
    <section
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={() => onDragEnter(status.value)}
      onDrop={(event) => onApplicationDrop(event, status.value)}
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
            ({applications.length})
          </span>
        </h2>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {applications.length > 0 ? (
          applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              isDragging={draggingId === application.id}
              isPending={Boolean(pendingApplicationIds[application.id])}
              onClick={onApplicationClick}
              onDragStart={onApplicationDragStart}
              onDragEnd={onApplicationDragEnd}
              onFavoriteToggle={onApplicationFavoriteToggle}
            />
          ))
        ) : (
          <div className="flex min-h-40 w-full flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-center">
            <p className="text-sm text-slate-500">{emptyColumnMessage}</p>
          </div>
        )}
      </div>
    </section>
  );
}
