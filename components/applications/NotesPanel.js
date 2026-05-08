import { formatDate } from "@/lib/date-utils";

export default function NotesPanel({
  notes,
  noteContent,
  isEditing,
  isSaving,
  noteEditValues = {},
  noteErrors = {},
  deletingNoteId,
  savingNoteId,
  errorMessage,
  deleteErrorMessage,
  onContentChange,
  onNoteDelete,
  onNoteEditCancel,
  onNoteEditChange,
  onNoteEditSave,
  onSave,
}) {
  const safeNotes = Array.isArray(notes) ? notes : [];
  const isNoteActionPending =
    isSaving || Boolean(savingNoteId) || Boolean(deletingNoteId);

  return (
    <aside className="border-t border-slate-200 bg-slate-50/60 px-6 py-6 lg:border-l lg:border-t-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">Notes</h3>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
          {safeNotes.length}
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label
          htmlFor="application-note-content"
          className="text-xs font-semibold text-slate-500"
        >
          New note
        </label>
        <textarea
          id="application-note-content"
          value={noteContent}
          onChange={(event) => onContentChange(event.target.value)}
          disabled={isNoteActionPending}
          rows={5}
          placeholder="Add a quick update..."
          className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        />

        {errorMessage ? (
          <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={isNoteActionPending || !noteContent.trim()}
            className="rounded-md bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-teal-900/50"
          >
            {isSaving ? "Saving..." : "Add Note"}
          </button>
        </div>
      </div>

      {deleteErrorMessage ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteErrorMessage}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {safeNotes.length > 0 ? (
          safeNotes.map((note) => {
            const editValue = noteEditValues[note.id] ?? note.content ?? "";
            const hasChanged = editValue.trim() !== (note.content ?? "").trim();
            const isNoteSaving = savingNoteId === note.id;
            const isNoteDeleting = deletingNoteId === note.id;
            const isOtherNoteActionPending =
              isSaving ||
              (Boolean(savingNoteId) && !isNoteSaving) ||
              (Boolean(deletingNoteId) && !isNoteDeleting);

            return (
              <article
                key={note.id}
                className="relative rounded-lg border border-slate-200 bg-white p-4 pr-11 shadow-sm"
              >
                <button
                  type="button"
                  onClick={(event) => onNoteDelete(event, note.id)}
                  disabled={
                    isSaving ||
                    Boolean(savingNoteId) ||
                    Boolean(deletingNoteId)
                  }
                  aria-label="Delete note"
                  className="absolute right-2 top-2 rounded-md px-2 py-1 text-sm font-semibold leading-none text-slate-400 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  X
                </button>

                {isEditing ? (
                  <>
                    <textarea
                      value={editValue}
                      onChange={(event) =>
                        onNoteEditChange(note.id, event.target.value)
                      }
                      disabled={isNoteSaving || isOtherNoteActionPending}
                      rows={4}
                      className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    />

                    {noteErrors[note.id] ? (
                      <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {noteErrors[note.id]}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onNoteEditCancel(note.id)}
                        disabled={
                          isNoteSaving ||
                          isOtherNoteActionPending ||
                          !hasChanged
                        }
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => onNoteEditSave(note)}
                        disabled={
                          isNoteSaving ||
                          isOtherNoteActionPending ||
                          !hasChanged ||
                          !editValue.trim()
                        }
                        className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-teal-900/50"
                      >
                        {isNoteSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {note.content}
                  </p>
                )}

                <time className="mt-3 block text-xs font-medium text-slate-500">
                  {formatDate(note.createdAt)}
                </time>
              </article>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              No notes yet. Add your first note.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
