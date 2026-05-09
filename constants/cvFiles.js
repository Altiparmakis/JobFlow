export const CV_FILE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const CV_FILE_SIZE_LABEL = "5MB";

export const CV_FILE_ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const CV_FILE_ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
export const CV_FILE_TYPE_BY_EXTENSION = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export const CV_FILE_ACCEPT = [
  ...CV_FILE_ALLOWED_TYPES,
  ...CV_FILE_ALLOWED_EXTENSIONS,
].join(",");

export const CV_FILE_TYPE_ERROR = "Only PDF, DOC, or DOCX files are allowed.";
export const CV_FILE_SIZE_ERROR = "File size must be under 5MB.";

export const CV_FILE_ALLOWED_TYPE_SET = new Set(CV_FILE_ALLOWED_TYPES);
export const CV_FILE_ALLOWED_EXTENSION_SET = new Set(
  CV_FILE_ALLOWED_EXTENSIONS,
);

export function getCvFileExtension(fileName) {
  const normalizedName = String(fileName ?? "").trim().toLowerCase();
  const extensionStart = normalizedName.lastIndexOf(".");

  return extensionStart >= 0 ? normalizedName.slice(extensionStart) : "";
}

export function formatCvFileSize(sizeInBytes) {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) {
    return "0 KB";
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getCvFileClientValidationMessage(file) {
  if (!file) {
    return "";
  }

  if (file.size > CV_FILE_MAX_SIZE_BYTES) {
    return CV_FILE_SIZE_ERROR;
  }

  const extension = getCvFileExtension(file.name);

  const hasAllowedType = !file.type || CV_FILE_ALLOWED_TYPE_SET.has(file.type);

  if (!hasAllowedType || !CV_FILE_ALLOWED_EXTENSION_SET.has(extension)) {
    return CV_FILE_TYPE_ERROR;
  }

  return "";
}
