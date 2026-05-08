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
import prisma from "@/lib/prisma";

const noteContentMaxLength = 4000;

function getString(formData, name) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
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

  const application = await prisma.jobApplication.create({
    data: {
      clerkId: userId,
      title,
      companyName,
      description: description || null,
      url: url || null,
      location: location || null,
      jobType,
      status,
    },
    select: getApplicationSelect(userId),
  });

  revalidatePath("/applications");

  return {
    success: true,
    message: "Application saved.",
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

  const result = await prisma.jobApplication.updateMany({
    where: {
      id: applicationId,
      clerkId: userId,
    },
    data: {
      title,
      companyName,
      description: description || null,
      url: url || null,
      location: location || null,
      jobType,
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

  const result = await prisma.jobApplication.deleteMany({
    where: {
      id: applicationId,
      clerkId: userId,
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      message: "Application could not be deleted.",
    };
  }

  revalidatePath("/applications");

  return {
    success: true,
    message: "Application deleted.",
    applicationId,
  };
}
