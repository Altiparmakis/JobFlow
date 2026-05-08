import {
  APPLICATION_FILTER_DEFAULTS,
  APPLICATION_ORDER_BY_OPTIONS,
} from "@/constants/applicationFilters";
import {
  APPLICATION_STATUS_FILTER_OPTIONS,
  APPLICATION_STATUS_LABELS,
} from "@/constants/applicationStatuses";
import {
  JOB_TYPE_FILTER_OPTIONS,
  JOB_TYPE_LABELS,
} from "@/constants/jobTypes";
import { getDateBoundary, getTimestamp } from "@/lib/date-utils";

export function getDisplayValue(value) {
  if (typeof value === "string") {
    return value.trim() || "N/A";
  }

  return value ?? "N/A";
}

export function getSafeExternalUrl(url) {
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

export function getApplicationStatusLabel(status) {
  return APPLICATION_STATUS_LABELS[status] ?? status;
}

export function getJobTypeLabel(jobType) {
  return JOB_TYPE_LABELS[jobType] ?? jobType;
}

export function getEditFormValues(application) {
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

export function getNoteEditValues(notes) {
  return (notes ?? []).reduce((values, note) => {
    values[note.id] = note.content ?? "";

    return values;
  }, {});
}

export function groupApplicationsByStatus(applications, statuses) {
  return statuses.reduce((groups, status) => {
    groups[status.value] = applications.filter(
      (application) => application.status === status.value,
    );

    return groups;
  }, {});
}

export function getNormalizedApplicationFilters(filters) {
  const orderBy = APPLICATION_ORDER_BY_OPTIONS.some(
    (option) => option.value === filters?.orderBy,
  )
    ? filters.orderBy
    : APPLICATION_FILTER_DEFAULTS.orderBy;
  const roleFilter = JOB_TYPE_FILTER_OPTIONS.some(
    (option) => option.value === filters?.roleFilter,
  )
    ? filters.roleFilter
    : APPLICATION_FILTER_DEFAULTS.roleFilter;
  const statusFilter = APPLICATION_STATUS_FILTER_OPTIONS.some(
    (option) => option.value === filters?.statusFilter,
  )
    ? filters.statusFilter
    : APPLICATION_FILTER_DEFAULTS.statusFilter;

  return {
    ...APPLICATION_FILTER_DEFAULTS,
    ...(filters ?? {}),
    orderBy,
    roleFilter,
    favoritesOnly: Boolean(filters?.favoritesOnly),
    statusFilter,
  };
}

function compareText(firstValue, secondValue) {
  return String(firstValue ?? "")
    .trim()
    .localeCompare(String(secondValue ?? "").trim(), "en", {
      sensitivity: "base",
      numeric: true,
    });
}

function compareDateDescending(firstValue, secondValue) {
  return getTimestamp(secondValue) - getTimestamp(firstValue);
}

export function compareApplications(
  firstApplication,
  secondApplication,
  orderBy,
) {
  if (orderBy === "title") {
    return (
      compareText(firstApplication.title, secondApplication.title) ||
      compareDateDescending(
        firstApplication.updatedAt,
        secondApplication.updatedAt,
      ) ||
      compareText(firstApplication.id, secondApplication.id)
    );
  }

  const dateField = orderBy === "createdAt" ? "createdAt" : "updatedAt";

  return (
    compareDateDescending(
      firstApplication[dateField],
      secondApplication[dateField],
    ) ||
    compareText(firstApplication.title, secondApplication.title) ||
    compareText(firstApplication.id, secondApplication.id)
  );
}

export function getVisibleApplications(applications, filters) {
  const normalizedFilters = getNormalizedApplicationFilters(filters);
  const fromTime = getDateBoundary(normalizedFilters.appliedFrom, "start");
  const untilTime = getDateBoundary(normalizedFilters.appliedUntil, "end");

  return applications
    .filter((application) => {
      const createdTime = getTimestamp(application.createdAt);

      if (
        normalizedFilters.roleFilter &&
        application.jobType !== normalizedFilters.roleFilter
      ) {
        return false;
      }

      if (
        normalizedFilters.statusFilter &&
        application.status !== normalizedFilters.statusFilter
      ) {
        return false;
      }

      if (normalizedFilters.favoritesOnly && !application.isFavorite) {
        return false;
      }

      if (fromTime !== null && createdTime < fromTime) {
        return false;
      }

      if (untilTime !== null && createdTime > untilTime) {
        return false;
      }

      return true;
    })
    .slice()
    .sort((firstApplication, secondApplication) =>
      compareApplications(
        firstApplication,
        secondApplication,
        normalizedFilters.orderBy,
      ),
    );
}

export function hasActiveDateFilters(filters) {
  return Boolean(filters.appliedFrom || filters.appliedUntil);
}

export function hasActiveRoleOrStatusFilters(filters) {
  return Boolean(filters.roleFilter || filters.statusFilter);
}

export function hasActiveFavoriteFilter(filters) {
  return Boolean(filters.favoritesOnly);
}

export function hasActiveFilterOptions(filters) {
  return (
    filters.orderBy !== APPLICATION_FILTER_DEFAULTS.orderBy ||
    hasActiveDateFilters(filters) ||
    hasActiveRoleOrStatusFilters(filters) ||
    hasActiveFavoriteFilter(filters)
  );
}
