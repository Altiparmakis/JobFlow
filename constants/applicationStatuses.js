export const APPLICATION_STATUS = {
  SAVED: "SAVED",
  APPLIED: "APPLIED",
  SCREEN: "SCREEN",
  INTERVIEWING: "INTERVIEWING",
  OFFER: "OFFER",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
};

export const ACCEPTED_STATUS = APPLICATION_STATUS.ACCEPTED;

export const APPLICATION_STATUS_OPTIONS = [
  { label: "Saved", value: APPLICATION_STATUS.SAVED },
  { label: "Applied", value: APPLICATION_STATUS.APPLIED },
  { label: "Screen", value: APPLICATION_STATUS.SCREEN },
  { label: "Interviewing", value: APPLICATION_STATUS.INTERVIEWING },
  { label: "Offer", value: APPLICATION_STATUS.OFFER },
  { label: "Accepted", value: APPLICATION_STATUS.ACCEPTED },
  { label: "Rejected", value: APPLICATION_STATUS.REJECTED },
];

export const APPLICATION_STATUS_FILTER_OPTIONS = [
  { label: "All statuses", value: "" },
  ...APPLICATION_STATUS_OPTIONS,
];

export const APPLICATION_STATUS_VALUES = APPLICATION_STATUS_OPTIONS.map(
  (status) => status.value,
);

export const APPLICATION_STATUS_SET = new Set(APPLICATION_STATUS_VALUES);

export const APPLICATION_STATUS_LABELS = APPLICATION_STATUS_OPTIONS.reduce(
  (labels, status) => {
    labels[status.value] = status.label;

    return labels;
  },
  {},
);
