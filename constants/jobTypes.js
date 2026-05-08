export const JOB_TYPE = {
  INTERNSHIP: "INTERNSHIP",
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
};

export const JOB_TYPE_OPTIONS = [
  { label: "Internship", value: JOB_TYPE.INTERNSHIP },
  { label: "Full-time", value: JOB_TYPE.FULL_TIME },
  { label: "Part-time", value: JOB_TYPE.PART_TIME },
];

export const JOB_TYPE_FILTER_OPTIONS = [
  { label: "All roles", value: "" },
  { label: "Full-time", value: JOB_TYPE.FULL_TIME },
  { label: "Part-time", value: JOB_TYPE.PART_TIME },
  { label: "Internship", value: JOB_TYPE.INTERNSHIP },
];

export const JOB_TYPE_VALUES = JOB_TYPE_OPTIONS.map((jobType) => jobType.value);

export const JOB_TYPE_SET = new Set(JOB_TYPE_VALUES);

export const JOB_TYPE_LABELS = JOB_TYPE_OPTIONS.reduce((labels, jobType) => {
  labels[jobType.value] = jobType.label;

  return labels;
}, {});
