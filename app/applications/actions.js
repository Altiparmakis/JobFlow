"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { APPLICATION_STATUS_SET } from "@/constants/applicationStatuses";
import { JOB_TYPE_SET } from "@/constants/jobTypes";
import {
  NOTE_SELECT,
  getApplicationSelect,
  serializeApplication,
  serializeNote,
} from "@/lib/application-records";
import {
  deleteCvFile,
  getCvFileFromFormData,
  shouldRemoveCvFile,
  uploadCvFile,
} from "@/lib/cv-file-storage";
import {
  extractJobDetailsFromJobUrl,
  normalizeJobPostingUrl,
} from "@/lib/job-url-extraction";
import prisma from "@/lib/prisma";

const noteContentMaxLength = 4000;

function getString(formData, name) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function getDraftString(draft, name) {
  const value = draft?.[name];

  return typeof value === "string" ? value.trim() : "";
}

function getPayloadString(payload, name) {
  return typeof payload?.get === "function"
    ? getString(payload, name)
    : getDraftString(payload, name);
}

async function uploadOptionalCvFile(formData, userId) {
  if (typeof formData?.get !== "function") {
    return {
      success: true,
      metadata: {},
    };
  }

  const cvFile = getCvFileFromFormData(formData);

  if (!cvFile) {
    return {
      success: true,
      metadata: {},
    };
  }

  return uploadCvFile({
    file: cvFile,
    userId,
  });
}

async function deleteCvFileQuietly(cvFileUrl) {
  if (!cvFileUrl) {
    return;
  }

  const result = await deleteCvFile(cvFileUrl);

  if (!result.success) {
    console.error(result.message);
  }
}

export async function createJobApplication(formData) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "You must be signed in to add an application.",
    };
  }

  const title = getString(formData, "title");
  const companyName = getString(formData, "companyName");
  const description = getString(formData, "description");
  const url = getString(formData, "url");
  const location = getString(formData, "location");
  const jobType = getString(formData, "jobType");
  const status = getString(formData, "status");

  if (!title || !companyName || !jobType || !status) {
    return {
      success: false,
      message: "Please fill in all required fields.",
    };
  }

  if (!JOB_TYPE_SET.has(jobType) || !APPLICATION_STATUS_SET.has(status)) {
    return {
      success: false,
      message: "Please choose valid job type and status values.",
    };
  }

  const cvUpload = await uploadOptionalCvFile(formData, userId);

  if (!cvUpload.success) {
    return {
      success: false,
      message: cvUpload.message,
    };
  }

  let application;

  try {
    application = await prisma.jobApplication.create({
      data: {
        clerkId: userId,
        title,
        companyName,
        description: description || null,
        url: url || null,
        location: location || null,
        jobType,
        status,
        ...cvUpload.metadata,
      },
      select: getApplicationSelect(userId),
    });
  } catch (error) {
    await deleteCvFileQuietly(cvUpload.metadata?.cvFileUrl);
    console.error("Application creation failed:", error);

    return {
      success: false,
      message: "Application could not be saved.",
    };
  }

  revalidatePath("/applications");

  return {
    success: true,
    message: "Application saved.",
    application: serializeApplication(application),
  };
}

export async function extractJobApplicationFromUrl(url) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "You must be signed in to extract job details.",
    };
  }

  return extractJobDetailsFromJobUrl(url);
}

export async function importExtractedJobApplication(applicationDraft) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "You must be signed in to import an application.",
    };
  }

  const title = getPayloadString(applicationDraft, "title");
  const companyName = getPayloadString(applicationDraft, "companyName");
  const description = getPayloadString(applicationDraft, "description");
  const location = getPayloadString(applicationDraft, "location");
  const url = getPayloadString(applicationDraft, "url");
  const jobType = getPayloadString(applicationDraft, "jobType");
  const status = getPayloadString(applicationDraft, "status");

  if (!title || !companyName || !jobType || !status) {
    return {
      success: false,
      message: "Please fill in all required fields before importing.",
    };
  }

  if (!JOB_TYPE_SET.has(jobType) || !APPLICATION_STATUS_SET.has(status)) {
    return {
      success: false,
      message: "Please choose valid job type and status values.",
    };
  }

  const normalizedUrl = url
    ? normalizeJobPostingUrl(url)
    : {
        success: true,
        url: "",
      };

  if (url && !normalizedUrl.success) {
    return {
      success: false,
      message: normalizedUrl.message || "Please enter a valid job URL.",
    };
  }

  const cvUpload = await uploadOptionalCvFile(applicationDraft, userId);

  if (!cvUpload.success) {
    return {
      success: false,
      message: cvUpload.message,
    };
  }

  let application;

  try {
    application = await prisma.jobApplication.create({
      data: {
        clerkId: userId,
        title,
        companyName,
        description: description || null,
        url: normalizedUrl.url || null,
        location: location || null,
        jobType,
        status,
        ...cvUpload.metadata,
      },
      select: getApplicationSelect(userId),
    });
  } catch (error) {
    await deleteCvFileQuietly(cvUpload.metadata?.cvFileUrl);
    console.error("Application import failed:", error);

    return {
      success: false,
      message: "Application could not be imported.",
    };
  }

  revalidatePath("/applications");

  return {
    success: true,
    message: "Application imported.",
    application: serializeApplication(application),
  };
}

export async function updateJobApplicationStatus(applicationId, status) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "You must be signed in to update an application.",
    };
  }

  if (!applicationId || !APPLICATION_STATUS_SET.has(status)) {
    return {
      success: false,
      message: "Please choose a valid status.",
    };
  }

  const result = await prisma.jobApplication.updateMany({
    where: {
      id: applicationId,
      clerkId: userId,
    },
    data: {
      status,
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      message: "Application could not be updated.",
    };
  }

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      clerkId: userId,
    },
    select: getApplicationSelect(userId),
  });

  if (!application) {
    return {
      success: false,
      message: "Application could not be loaded after the update.",
    };
  }

  revalidatePath("/applications");

  return {
    success: true,
    message: "Application updated.",
    application: serializeApplication(application),
  };
}

export async function updateJobApplicationFavorite(applicationId, isFavorite) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "You must be signed in to update an application.",
    };
  }

  if (!applicationId || typeof isFavorite !== "boolean") {
    return {
      success: false,
      message: "Favorite status could not be updated.",
    };
  }

  const result = await prisma.jobApplication.updateMany({
    where: {
      id: applicationId,
      clerkId: userId,
    },
    data: {
      isFavorite,
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      message: "Application could not be updated.",
    };
  }

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      clerkId: userId,
    },
    select: getApplicationSelect(userId),
  });

  if (!application) {
    return {
      success: false,
      message: "Application could not be loaded after the update.",
    };
  }

  revalidatePath("/applications");

  return {
    success: true,
    message: "Application updated.",
    application: serializeApplication(application),
  };
}

export async function updateJobApplication(applicationId, formData) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "You must be signed in to update an application.",
    };
  }

  if (!applicationId) {
    return {
      success: false,
      message: "Application could not be updated.",
    };
  }

  const title = getString(formData, "title");
  const companyName = getString(formData, "companyName");
  const description = getString(formData, "description");
  const url = getString(formData, "url");
  const location = getString(formData, "location");
  const jobType = getString(formData, "jobType");
  const status = getString(formData, "status");

  if (!title || !companyName || !jobType || !status) {
    return {
      success: false,
      message: "Please fill in all required fields.",
    };
  }

  if (!JOB_TYPE_SET.has(jobType) || !APPLICATION_STATUS_SET.has(status)) {
    return {
      success: false,
      message: "Please choose valid job type and status values.",
    };
  }

  const existingApplication = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      clerkId: userId,
    },
    select: {
      id: true,
      cvFileUrl: true,
    },
  });

  if (!existingApplication) {
    return {
      success: false,
      message: "Application could not be updated.",
    };
  }

  const cvFile = getCvFileFromFormData(formData);
  const removeCvFile = shouldRemoveCvFile(formData);
  const cvData = {};
  let uploadedCvFileUrl = "";

  if (cvFile) {
    const cvUpload = await uploadCvFile({
      file: cvFile,
      userId,
    });

    if (!cvUpload.success) {
      return {
        success: false,
        message: cvUpload.message,
      };
    }

    Object.assign(cvData, cvUpload.metadata);
    uploadedCvFileUrl = cvUpload.metadata.cvFileUrl;
  } else if (removeCvFile) {
    Object.assign(cvData, {
      cvFileUrl: null,
      cvFileName: null,
      cvFileType: null,
      cvFileSize: null,
    });
  }

  try {
    await prisma.jobApplication.update({
      where: {
        id: applicationId,
      },
      data: {
        title,
        companyName,
        description: description || null,
        url: url || null,
        location: location || null,
        jobType,
        status,
        ...cvData,
      },
    });
  } catch (error) {
    await deleteCvFileQuietly(uploadedCvFileUrl);
    console.error("Application update failed:", error);

    return {
      success: false,
      message: "Application could not be updated.",
    };
  }

  if ((cvFile || removeCvFile) && existingApplication.cvFileUrl) {
    await deleteCvFileQuietly(existingApplication.cvFileUrl);
  }

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      clerkId: userId,
    },
    select: getApplicationSelect(userId),
  });

  if (!application) {
    return {
      success: false,
      message: "Application could not be loaded after the update.",
    };
  }

  revalidatePath("/applications");

  return {
    success: true,
    message: "Application updated.",
    application: serializeApplication(application),
  };
}

export async function createApplicationNote(applicationId, content) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "You must be signed in to add a note.",
    };
  }

  const noteContent = typeof content === "string" ? content.trim() : "";

  if (!applicationId || !noteContent) {
    return {
      success: false,
      message: "Please write a note before saving.",
    };
  }

  if (noteContent.length > noteContentMaxLength) {
    return {
      success: false,
      message: `Notes must be ${noteContentMaxLength} characters or fewer.`,
    };
  }

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      clerkId: userId,
    },
    select: {
      id: true,
    },
  });

  if (!application) {
    return {
      success: false,
      message: "Application could not be found.",
    };
  }

  const note = await prisma.applicationNote.create({
    data: {
      applicationId,
      clerkId: userId,
      content: noteContent,
    },
    select: NOTE_SELECT,
  });

  revalidatePath("/applications");

  return {
    success: true,
    message: "Note added.",
    note: serializeNote(note),
  };
}

export async function updateApplicationNote(noteId, content) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "You must be signed in to update a note.",
    };
  }

  const noteContent = typeof content === "string" ? content.trim() : "";

  if (!noteId || !noteContent) {
    return {
      success: false,
      message: "Notes cannot be empty.",
    };
  }

  if (noteContent.length > noteContentMaxLength) {
    return {
      success: false,
      message: `Notes must be ${noteContentMaxLength} characters or fewer.`,
    };
  }

  const existingNote = await prisma.applicationNote.findFirst({
    where: {
      id: noteId,
      clerkId: userId,
      application: {
        clerkId: userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!existingNote) {
    return {
      success: false,
      message: "Note could not be found.",
    };
  }

  const note = await prisma.applicationNote.update({
    where: {
      id: noteId,
    },
    data: {
      content: noteContent,
    },
    select: NOTE_SELECT,
  });

  revalidatePath("/applications");

  return {
    success: true,
    message: "Note updated.",
    note: serializeNote(note),
  };
}

export async function deleteApplicationNote(noteId) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "You must be signed in to delete a note.",
    };
  }

  if (!noteId) {
    return {
      success: false,
      message: "Note could not be deleted.",
    };
  }

  const existingNote = await prisma.applicationNote.findFirst({
    where: {
      id: noteId,
      clerkId: userId,
      application: {
        clerkId: userId,
      },
    },
    select: {
      id: true,
      applicationId: true,
    },
  });

  if (!existingNote) {
    return {
      success: false,
      message: "Note could not be found.",
    };
  }

  await prisma.applicationNote.delete({
    where: {
      id: noteId,
    },
  });

  revalidatePath("/applications");

  return {
    success: true,
    message: "Note deleted.",
    noteId,
    applicationId: existingNote.applicationId,
  };
}

export async function deleteJobApplication(applicationId) {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "You must be signed in to delete an application.",
    };
  }

  if (!applicationId) {
    return {
      success: false,
      message: "Application could not be deleted.",
    };
  }

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      clerkId: userId,
    },
    select: {
      id: true,
      cvFileUrl: true,
    },
  });

  if (!application) {
    return {
      success: false,
      message: "Application could not be deleted.",
    };
  }

  await prisma.jobApplication.delete({
    where: {
      id: application.id,
    },
  });

  await deleteCvFileQuietly(application.cvFileUrl);

  revalidatePath("/applications");

  return {
    success: true,
    message: "Application deleted.",
    applicationId,
  };
}
