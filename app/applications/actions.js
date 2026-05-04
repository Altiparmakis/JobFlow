"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

const jobTypes = new Set(["INTERNSHIP", "FULL_TIME", "PART_TIME"]);
const statuses = new Set([
  "SAVED",
  "APPLIED",
  "SCREEN",
  "INTERVIEWING",
  "OFFER",
  "REJECTED",
  "ACCEPTED",
]);

const applicationSelect = {
  id: true,
  title: true,
  companyName: true,
  description: true,
  url: true,
  location: true,
  jobType: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

function getString(formData, name) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function serializeApplication(application) {
  return {
    ...application,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
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

  if (!jobTypes.has(jobType) || !statuses.has(status)) {
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
    select: applicationSelect,
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

  if (!applicationId || !statuses.has(status)) {
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
    select: applicationSelect,
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

  if (!jobTypes.has(jobType) || !statuses.has(status)) {
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
    select: applicationSelect,
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
