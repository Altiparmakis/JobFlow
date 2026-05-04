"use client";

import { ClerkSignInAction, ClerkSignUpAction } from "./ClerkActionButtons";
import useIsClient from "./useIsClient";

const joinFreeLabel = "Join Now \u2014 It\u2019s Free";

export default function LandingAuthActions() {
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <div
        aria-hidden="true"
        className="mt-9 flex h-12 flex-col items-center justify-center gap-3 sm:flex-row"
      />
    );
  }

  return (
    <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <ClerkSignUpAction
        label={joinFreeLabel}
        className="w-full rounded-md bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:w-auto"
      />
      {/* <ClerkSignInAction
        className="w-full rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:w-auto"
      /> */}
    </div>
  );
}
