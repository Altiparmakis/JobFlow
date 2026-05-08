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

const logoDevToken = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();

export function getDomainFromInput(value) {
  const domainCandidate = value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#\s]/)[0];

  return DOMAIN_PATTERN.test(domainCandidate) ? domainCandidate : "";
}

export function getLikelyCompanyDomain(companyName) {
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

export function getLogoUrl(companyName) {
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
