"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";

export function ClerkSignInAction({ className, label = "Log In" }) {
  const button = (
    <button type="button" className={className}>
      {label}
    </button>
  );

  return (
    <SignInButton mode="redirect" forceRedirectUrl="/applications">
      {button}
    </SignInButton>
  );
}

export function ClerkSignUpAction({ className, label = "Join Now" }) {
  const button = (
    <button type="button" className={className}>
      {label}
    </button>
  );

  return (
    <SignUpButton mode="redirect" forceRedirectUrl="/applications">
      {button}
    </SignUpButton>
  );
}
