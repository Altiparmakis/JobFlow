import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ApplicationsWorkspace from "./ApplicationsWorkspace";

const statuses = [
  { label: "Saved", value: "SAVED" },
  { label: "Applied", value: "APPLIED" },
  { label: "Screen", value: "SCREEN" },
  { label: "Interviewing", value: "INTERVIEWING" },
  { label: "Offer", value: "OFFER" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Accepted", value: "ACCEPTED" },
];

function serializeApplication(application) {
  return {
    ...application,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}

export default async function ApplicationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const applications = await prisma.jobApplication.findMany({
    where: {
      clerkId: userId,
    },
    select: {
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="flex flex-1 bg-slate-50">
      <ApplicationsWorkspace
        statuses={statuses}
        initialApplications={applications.map(serializeApplication)}
      />
    </main>
  );
}
