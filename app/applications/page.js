import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ApplicationsWorkspace from "@/components/applications/ApplicationsWorkspace";
import { APPLICATION_STATUS_OPTIONS } from "@/constants/applicationStatuses";
import {
  getApplicationSelect,
  serializeApplication,
} from "@/lib/application-records";
import prisma from "@/lib/prisma";

export default async function ApplicationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const applications = await prisma.jobApplication.findMany({
    where: {
      clerkId: userId,
    },
    select: getApplicationSelect(userId),
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="flex flex-1 bg-slate-50">
      <ApplicationsWorkspace
        statuses={APPLICATION_STATUS_OPTIONS}
        initialApplications={applications.map(serializeApplication)}
      />
    </main>
  );
}
