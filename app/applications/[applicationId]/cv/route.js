import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

function getContentDisposition(type, fileName) {
  const fallbackName = String(fileName || "cv-file").replace(
    /[^\x20-\x7E]|["\\\r\n]/g,
    "_",
  );
  const encodedName = encodeURIComponent(fileName || "cv-file")
    .replace(/['()]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    )
    .replace(/\*/g, "%2A");

  return `${type}; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`;
}

export async function GET(request, context) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { applicationId } = await context.params;

  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      clerkId: userId,
    },
    select: {
      cvFileUrl: true,
      cvFileName: true,
      cvFileType: true,
      cvFileSize: true,
    },
  });

  if (!application?.cvFileUrl) {
    return new Response("CV file not found.", { status: 404 });
  }

  let blob;

  try {
    blob = await get(application.cvFileUrl, {
      access: "private",
    });
  } catch (error) {
    console.error("CV file load failed:", error);

    return new Response("CV file could not be loaded.", { status: 500 });
  }

  if (!blob || blob.statusCode !== 200) {
    return new Response("CV file not found.", { status: 404 });
  }

  const url = new URL(request.url);
  const dispositionType =
    url.searchParams.get("download") === "1" ? "attachment" : "inline";
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "Content-Disposition": getContentDisposition(
      dispositionType,
      application.cvFileName,
    ),
    "Content-Type":
      application.cvFileType || blob.blob.contentType || "application/octet-stream",
  });
  const contentLength = application.cvFileSize || blob.blob.size;

  if (contentLength) {
    headers.set("Content-Length", String(contentLength));
  }

  return new Response(blob.stream, {
    headers,
  });
}
