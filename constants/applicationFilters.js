export const APPLICATION_FILTER_DEFAULTS = {
  orderBy: "updatedAt",
  appliedFrom: "",
  appliedUntil: "",
  roleFilter: "",
  favoritesOnly: false,
  statusFilter: "",
};

export const APPLICATION_ORDER_BY_OPTIONS = [
  { label: "Tracked date", value: "updatedAt" },
  { label: "Title", value: "title" },
  { label: "Created date", value: "createdAt" },
];
