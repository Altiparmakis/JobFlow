"use client";

import {
  ClerkLoaded,
  ClerkLoading,
  Show,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { ClerkSignInAction, ClerkSignUpAction } from "./ClerkActionButtons";

function NavbarGreeting() {
  const { user } = useUser();

  const firstName = user?.firstName?.trim();
  const greeting = firstName
    ? `${firstName}, Ready to apply?`
    : "Ready to apply?";

  return (
    <span className="hidden max-w-56 truncate text-sm font-medium text-slate-600 sm:block">
      {greeting}
    </span>
  );
}

export default function NavbarAuth() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
      <ClerkLoading>
        <div aria-hidden="true" className="h-10 w-36" />
      </ClerkLoading>
      <ClerkLoaded>
        <Show when="signed-in">
          <div className="flex items-center gap-3">
            <NavbarGreeting />
            <UserButton />
          </div>
        </Show>
        <Show when="signed-out">
          <ClerkSignInAction className="rounded-md px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" />
          <ClerkSignUpAction className="rounded-md bg-teal-700 px-4 py-2 text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700" />
        </Show>
      </ClerkLoaded>
    </div>
  );
}
