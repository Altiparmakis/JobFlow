import { APPLICATION_CARD_STYLES_BY_STATUS } from "@/constants/boardStyles";
import CompanyLogo from "@/components/applications/CompanyLogo";

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

export default function ApplicationCard({
  application,
  isDragging,
  isPending,
  onClick,
  onDragStart,
  onDragEnd,
  onFavoriteToggle,
}) {
  const isFavorite = Boolean(application.isFavorite);
  const cardStyle =
    APPLICATION_CARD_STYLES_BY_STATUS[application.status] ??
    APPLICATION_CARD_STYLES_BY_STATUS.SAVED;

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
      className={`relative cursor-grab rounded-lg border p-4 shadow-sm transition hover:shadow-md active:cursor-grabbing ${cardStyle} ${
        isDragging ? "opacity-50 ring-2 ring-teal-500" : ""
      } ${isPending ? "ring-1 ring-inset ring-teal-300" : ""}`}
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

      <div className="min-w-0 pr-10">
        <h3 className="text-sm font-semibold leading-5 text-slate-950">
          {application.title}
        </h3>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
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

        <CompanyLogo companyName={application.companyName} />
      </div>
    </article>
  );
}
