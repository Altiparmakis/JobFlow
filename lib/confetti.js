"use client";

import confetti from "canvas-confetti";

const acceptedConfettiColors = ["#0f766e", "#14b8a6", "#ccfbf1", "#ffffff"];

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function celebrateAcceptedApplication() {
  if (prefersReducedMotion()) {
    return;
  }

  const sharedOptions = {
    colors: acceptedConfettiColors,
    disableForReducedMotion: true,
    origin: { x: 0.5, y: 0.45 },
    ticks: 120,
    zIndex: 70,
  };

  confetti({
    ...sharedOptions,
    particleCount: 70,
    spread: 65,
    startVelocity: 42,
  });

  window.setTimeout(() => {
    confetti({
      ...sharedOptions,
      particleCount: 45,
      scalar: 0.85,
      spread: 95,
      startVelocity: 34,
    });
  }, 250);
}
