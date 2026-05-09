"use client";

/* eslint-disable @next/next/no-img-element -- Direct img loading keeps logo.dev CDN error fallback predictable. */
import { useMemo, useState } from "react";
import { getLogoUrl } from "@/lib/logo-utils";

function GenericCompanyLogo({ className = "h-5 w-5" }) {
  return (
    <svg
      aria-hidden="true"
      className={`${className} text-teal-700`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.75 20.25h14.5M6.75 20.25V5.75A2 2 0 0 1 8.75 3.75h6.5a2 2 0 0 1 2 2v14.5M9.25 8.25h1.5M13.25 8.25h1.5M9.25 11.75h1.5M13.25 11.75h1.5M9.25 15.25h1.5M13.25 15.25h1.5"
      />
    </svg>
  );
}

export default function CompanyLogo({ companyName, size = "md" }) {
  const [failedLogoUrl, setFailedLogoUrl] = useState("");
  const logoUrl = useMemo(() => getLogoUrl(companyName), [companyName]);
  const logoAlt = companyName?.trim()
    ? `${companyName.trim()} logo`
    : "Company logo";
  const shouldShowLogo = logoUrl && failedLogoUrl !== logoUrl;
  const logoSizeClassName = size === "lg" ? "h-10 w-10" : "h-9 w-9";
  const fallbackIconSizeClassName = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const imageSize = size === "lg" ? 40 : 40;

  return (
    <div
      className={`flex ${logoSizeClassName} shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/85 text-teal-700 shadow-sm ring-1 ring-slate-950/4`}
    >
      {shouldShowLogo ? (
        <img
          src={logoUrl}
          alt={logoAlt}
          width={imageSize}
          height={imageSize}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedLogoUrl(logoUrl)}
          className="h-full w-full object-contain"
        />
      ) : (
        <GenericCompanyLogo className={fallbackIconSizeClassName} />
      )}
    </div>
  );
}
