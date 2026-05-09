export const NOTE_SELECT = {
  id: true,
  applicationId: true,
  content: true,
  createdAt: true,
  updatedAt: true,
};

export function getApplicationSelect(userId) {
  return {
    id: true,
    title: true,
    companyName: true,
    description: true,
    url: true,
    location: true,
    jobType: true,
    status: true,
    isFavorite: true,
    cvFileName: true,
    cvFileType: true,
    cvFileSize: true,
    createdAt: true,
    updatedAt: true,
    notes: {
      where: {
        clerkId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: NOTE_SELECT,
    },
  };
}

export function serializeNote(note) {
  return {
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export function serializeApplication(application) {
  const notes = Array.isArray(application.notes)
    ? application.notes.map(serializeNote)
    : application.notes;

  return {
    ...application,
    notes,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}
