"use client";

/* eslint-disable @next/next/no-img-element -- Direct img loading keeps logo.dev CDN error fallback predictable. */
import { useMemo, useState } from "react";

const DOMAIN_PATTERN = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/;
const COMPANY_SUFFIXES = new Set([
  "ag",
  "bv",
  "co",
  "company",
  "corp",
  "corporation",
  "gmbh",
  "inc",
  "incorporated",
  "llc",
  "limited",
  "ltd",
  "plc",
  "sa",
  "sarl",
  "srl",
]);

// TODO: Set NEXT_PUBLIC_LOGO_DEV_TOKEN to enable browser-side logo.dev requests.
const logoDevToken = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();

function GenericCompanyLogo() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-teal-700"
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

function getDomainFromInput(value) {
  const domainCandidate = value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#\s]/)[0];

  return DOMAIN_PATTERN.test(domainCandidate) ? domainCandidate : "";
}

function getLikelyCompanyDomain(companyName) {
  const trimmedName = companyName?.trim();

  if (!trimmedName) {
    return "";
  }

  const inputDomain = getDomainFromInput(trimmedName);

  if (inputDomain) {
    return inputDomain;
  }

  const nameParts = trimmedName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !COMPANY_SUFFIXES.has(part));

  if (nameParts.length === 0 || nameParts.length > 4) {
    return "";
  }

  const domainBase = nameParts.join("");

  if (
    domainBase.length < 2 ||
    domainBase.length > 48 ||
    !/[a-z]/.test(domainBase)
  ) {
    return "";
  }

  return `${domainBase}.com`;
}

function getLogoUrl(companyName) {
  const trimmedName = companyName?.trim();

  if (!trimmedName || !logoDevToken) {
    return "";
  }

  const params = new URLSearchParams({
    token: logoDevToken,
    size: "64",
    format: "png",
    retina: "true",
    fallback: "404",
  });
  const domain = getLikelyCompanyDomain(trimmedName);

  if (domain) {
    return `https://img.logo.dev/${domain}?${params.toString()}`;
  }

  const normalizedName = trimmedName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!/[a-z0-9]/i.test(normalizedName)) {
    return "";
  }

  return `https://img.logo.dev/name/${encodeURIComponent(
    normalizedName,
  )}?${params.toString()}`;
}

export default function CompanyLogo({ companyName }) {
  const [failedLogoUrl, setFailedLogoUrl] = useState("");
  const logoUrl = useMemo(() => getLogoUrl(companyName), [companyName]);
  const logoAlt = companyName?.trim()
    ? `${companyName.trim()} logo`
    : "Company logo";
  const shouldShowLogo = logoUrl && failedLogoUrl !== logoUrl;

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/85 text-teal-700 shadow-sm ring-1 ring-slate-950/4">
      {shouldShowLogo ? (
        <img
          src={logoUrl}
          alt={logoAlt}
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedLogoUrl(logoUrl)}
          className="h-full w-full object-contain"
        />
      ) : (
        <GenericCompanyLogo />
      )}
    </div>
  );
}
