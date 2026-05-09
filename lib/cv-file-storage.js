import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";
import {
  CV_FILE_ALLOWED_EXTENSION_SET,
  CV_FILE_ALLOWED_TYPE_SET,
  CV_FILE_MAX_SIZE_BYTES,
  CV_FILE_SIZE_ERROR,
  CV_FILE_TYPE_BY_EXTENSION,
  CV_FILE_TYPE_ERROR,
  getCvFileExtension,
} from "@/constants/cvFiles";

const cvBlobFolder = "jobflow/application-cvs";
const blobConfigurationMessage =
  "CV file storage is not configured. Add BLOB_READ_WRITE_TOKEN locally and in Vercel.";

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function getBlobErrorMessage(error, fallbackMessage) {
  const name = String(error?.name ?? "");
  const message = String(error?.message ?? "");

  if (message.includes("No token found")) {
    return blobConfigurationMessage;
  }

  if (name === "BlobAccessError") {
    return "Vercel Blob rejected the configured token. Check BLOB_READ_WRITE_TOKEN locally and in Vercel.";
  }

  if (name === "BlobStoreNotFoundError") {
    return "Vercel Blob store could not be found for the configured token.";
  }

  if (name === "BlobFileTooLargeError") {
    return CV_FILE_SIZE_ERROR;
  }

  if (name === "BlobContentTypeNotAllowedError") {
    return CV_FILE_TYPE_ERROR;
  }

  return fallbackMessage;
}

function isFileLike(value) {
  return (
    value &&
    typeof value !== "string" &&
    typeof value.name === "string" &&
    typeof value.size === "number" &&
    typeof value.arrayBuffer === "function"
  );
}

export function getCvFileFromFormData(formData) {
  const file = formData.get("cvFile");

  if (!isFileLike(file) || !file.name) {
    return null;
  }

  return file;
}

export function shouldRemoveCvFile(formData) {
  return formData.get("removeCvFile") === "true";
}

function getSafeBlobFileName(fileName) {
  const extension = getCvFileExtension(fileName);
  const rawName = String(fileName ?? "cv-file");
  const nameWithoutExtension = extension
    ? rawName.slice(0, -extension.length)
    : rawName;
  const baseName = nameWithoutExtension
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "cv-file"}${extension || ".pdf"}`;
}

function hasBytes(bytes, signature) {
  return signature.every((byte, index) => bytes[index] === byte);
}

async function hasAllowedFileSignature(file, extension) {
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());

  if (extension === ".pdf") {
    return hasBytes(bytes, [0x25, 0x50, 0x44, 0x46]);
  }

  if (extension === ".doc") {
    return hasBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  }

  if (extension === ".docx") {
    return (
      hasBytes(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
      hasBytes(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
      hasBytes(bytes, [0x50, 0x4b, 0x07, 0x08])
    );
  }

  return false;
}

async function validateCvFile(file) {
  if (!file) {
    return {
      success: true,
    };
  }

  const extension = getCvFileExtension(file.name);
  const hasAllowedType = !file.type || CV_FILE_ALLOWED_TYPE_SET.has(file.type);

  if (!hasAllowedType || !CV_FILE_ALLOWED_EXTENSION_SET.has(extension)) {
    return {
      success: false,
      message: CV_FILE_TYPE_ERROR,
    };
  }

  if (file.size > CV_FILE_MAX_SIZE_BYTES) {
    return {
      success: false,
      message: CV_FILE_SIZE_ERROR,
    };
  }

  const hasAllowedSignature = await hasAllowedFileSignature(file, extension);

  if (!hasAllowedSignature) {
    return {
      success: false,
      message: CV_FILE_TYPE_ERROR,
    };
  }

  if (!hasBlobToken()) {
    return {
      success: false,
      message: blobConfigurationMessage,
    };
  }

  return {
    success: true,
  };
}

export async function uploadCvFile({ file, userId }) {
  const validation = await validateCvFile(file);

  if (!validation.success) {
    return validation;
  }

  if (!file) {
    return {
      success: true,
      metadata: {},
    };
  }

  const pathname = [
    cvBlobFolder,
    userId,
    `${randomUUID()}-${getSafeBlobFileName(file.name)}`,
  ].join("/");
  const extension = getCvFileExtension(file.name);
  const contentType = file.type || CV_FILE_TYPE_BY_EXTENSION[extension];

  try {
    const blob = await put(pathname, file, {
      access: "private",
      contentType,
    });

    return {
      success: true,
      metadata: {
        cvFileUrl: blob.url,
        cvFileName: file.name,
        cvFileType: contentType,
        cvFileSize: file.size,
      },
    };
  } catch (error) {
    console.error("CV file upload failed:", error);

    return {
      success: false,
      message: getBlobErrorMessage(
        error,
        "CV file could not be uploaded. Please try again.",
      ),
    };
  }
}

export async function deleteCvFile(cvFileUrl) {
  if (!cvFileUrl) {
    return {
      success: true,
    };
  }

  if (!hasBlobToken()) {
    return {
      success: false,
      message: blobConfigurationMessage,
    };
  }

  try {
    await del(cvFileUrl);

    return {
      success: true,
    };
  } catch (error) {
    console.error("CV file deletion failed:", error);

    return {
      success: false,
      message: getBlobErrorMessage(
        error,
        "CV file could not be removed from storage.",
      ),
    };
  }
}
