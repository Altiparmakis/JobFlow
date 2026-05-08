import { load } from "cheerio";
import { isIP } from "node:net";
import { APPLICATION_STATUS } from "@/constants/applicationStatuses";
import { JOB_TYPE } from "@/constants/jobTypes";

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 2_000_000;
const EXTRACTION_FAILURE_MESSAGE =
  "We couldn't find the job details. Please add this application manually.";
const REQUIRED_DETAILS_FAILURE_MESSAGE =
  "We couldn't find the required job details. Please add this application manually.";
const GENERIC_JOB_BOARD_NAMES = new Set([
  "indeed",
  "indeed.com",
  "linkedin",
  "linkedin jobs",
  "glassdoor",
  "monster",
  "ziprecruiter",
  "jobcase",
  "careerbuilder",
]);

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "";
  }

  const strippedValue = normalizeText(load(normalizedValue).text());

  return strippedValue || normalizedValue;
}

function truncateText(value, maxLength) {
  const normalizedValue = normalizeText(value);

  return normalizedValue.length > maxLength
    ? normalizedValue.slice(0, maxLength).trim()
    : normalizedValue;
}

function getContentLength(response) {
  const contentLength = Number(response.headers.get("content-length"));

  return Number.isFinite(contentLength) ? contentLength : 0;
}

function isPrivateIpv4(hostname) {
  const parts = hostname.split(".").map(Number);

  if (parts.length !== 4 || parts.some((part) => part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isPrivateIpv6(hostname) {
  const normalizedHostname = hostname.toLowerCase();

  return (
    normalizedHostname === "::1" ||
    normalizedHostname.startsWith("fc") ||
    normalizedHostname.startsWith("fd") ||
    normalizedHostname.startsWith("fe80:")
  );
}

function isBlockedHostname(hostname) {
  const normalizedHostname = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname.endsWith(".localhost") ||
    normalizedHostname.endsWith(".local") ||
    normalizedHostname.endsWith(".internal")
  ) {
    return true;
  }

  const ipVersion = isIP(normalizedHostname);

  if (ipVersion === 4) {
    return isPrivateIpv4(normalizedHostname);
  }

  if (ipVersion === 6) {
    return isPrivateIpv6(normalizedHostname);
  }

  return false;
}

export function normalizeJobPostingUrl(value) {
  const rawUrl = typeof value === "string" ? value.trim() : "";

  if (!rawUrl) {
    return {
      success: false,
      message: "Please paste a job posting URL.",
    };
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return {
      success: false,
      message: "Please enter a valid URL.",
    };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return {
      success: false,
      message: "Please enter an http or https URL.",
    };
  }

  if (isBlockedHostname(parsedUrl.hostname)) {
    return {
      success: false,
      message: "Please enter a public job posting URL.",
    };
  }

  parsedUrl.hash = "";

  return {
    success: true,
    url: parsedUrl.href,
  };
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent":
          "Mozilla/5.0 (compatible; jobFlow/1.0; job-application-tracker)",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        success: false,
      };
    }

    if (getContentLength(response) > MAX_HTML_BYTES) {
      return {
        success: false,
      };
    }

    const html = await response.text();

    if (!html || html.length > MAX_HTML_BYTES) {
      return {
        success: false,
      };
    }

    return {
      success: true,
      html,
    };
  } catch {
    return {
      success: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function hasJobPostingType(value) {
  const type = value?.["@type"];

  if (Array.isArray(type)) {
    return type.some(
      (item) => typeof item === "string" && item.toLowerCase() === "jobposting",
    );
  }

  return typeof type === "string" && type.toLowerCase() === "jobposting";
}

function findJobPostingJsonLd(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const jobPosting = findJobPostingJsonLd(item);

      if (jobPosting) {
        return jobPosting;
      }
    }

    return null;
  }

  if (hasJobPostingType(value)) {
    return value;
  }

  if (value["@graph"]) {
    return findJobPostingJsonLd(value["@graph"]);
  }

  return null;
}

function getArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getOrganizationName(value) {
  const organization = getArray(value)[0];

  if (typeof organization === "string") {
    return stripHtml(organization);
  }

  return stripHtml(organization?.name);
}

function getCountryName(country) {
  if (typeof country === "string") {
    return country;
  }

  return country?.name ?? "";
}

function getLocationFromAddress(address) {
  if (typeof address === "string") {
    return stripHtml(address);
  }

  const parts = [
    address?.addressLocality,
    address?.addressRegion,
    getCountryName(address?.addressCountry),
  ]
    .map(stripHtml)
    .filter(Boolean);

  return [...new Set(parts)].join(", ");
}

function getJobLocation(value) {
  const locations = getArray(value)
    .map((location) => getLocationFromAddress(location?.address ?? location))
    .filter(Boolean);

  return [...new Set(locations)].join("; ");
}

function getJobTypeFromEmploymentType(value) {
  const employmentTypes = getArray(value)
    .map((item) => normalizeText(String(item)).toUpperCase())
    .filter(Boolean);

  if (employmentTypes.some((item) => item.includes("PART"))) {
    return JOB_TYPE.PART_TIME;
  }

  if (employmentTypes.some((item) => item.includes("INTERN"))) {
    return JOB_TYPE.INTERNSHIP;
  }

  return JOB_TYPE.FULL_TIME;
}

function buildJobDetails(details) {
  const title = truncateText(details.title, 200);
  const companyName = truncateText(details.companyName, 200);

  if (!title || !companyName) {
    return {
      success: false,
      message: REQUIRED_DETAILS_FAILURE_MESSAGE,
    };
  }

  return {
    success: true,
    application: {
      title,
      companyName,
      location: truncateText(details.location, 300),
      description: truncateText(details.description, 8000),
      url: details.url,
      jobType: details.jobType || JOB_TYPE.FULL_TIME,
      status: APPLICATION_STATUS.APPLIED,
      descriptionMayBeLimited: Boolean(details.descriptionMayBeLimited),
    },
  };
}

function extractFromJsonLd($, url) {
  const scripts = $('script[type="application/ld+json"]').toArray();

  for (const script of scripts) {
    const scriptContent = $(script).contents().text();

    if (!scriptContent) {
      continue;
    }

    try {
      const parsedJson = JSON.parse(scriptContent);
      const jobPosting = findJobPostingJsonLd(parsedJson);

      if (!jobPosting) {
        continue;
      }

      return buildJobDetails({
        title: stripHtml(jobPosting.title),
        companyName: getOrganizationName(jobPosting.hiringOrganization),
        location: getJobLocation(jobPosting.jobLocation),
        description: stripHtml(jobPosting.description),
        url,
        jobType: getJobTypeFromEmploymentType(jobPosting.employmentType),
      });
    } catch {
      continue;
    }
  }

  return {
    success: false,
  };
}

function getMetaContent($, selector) {
  return normalizeText($(selector).first().attr("content"));
}

function cleanCompanyName(value) {
  const companyName = normalizeText(value)
    .replace(/\b(careers?|jobs?|job openings?|open roles?)\b/gi, "")
    .replace(/\s+[-|]\s*$/g, "")
    .trim();

  return companyName;
}

function isGenericSiteName(value) {
  const siteName = cleanCompanyName(value).toLowerCase();

  return !siteName || GENERIC_JOB_BOARD_NAMES.has(siteName);
}

function isLinkedInUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase().includes("linkedin.com");
  } catch {
    return false;
  }
}

function removeLinkedInTitleSuffix(value) {
  return normalizeText(value).replace(
    /\s+(?:\||-|\u2013|\u2014)\s*LinkedIn\s*$/i,
    "",
  );
}

function splitLinkedInHiringTitle(rawTitle, url) {
  if (!isLinkedInUrl(url)) {
    return null;
  }

  const title = removeLinkedInTitleSuffix(rawTitle);
  const hiringMarker = " hiring ";
  const hiringIndex = title.toLowerCase().indexOf(hiringMarker);

  if (hiringIndex <= 0) {
    return null;
  }

  const companyName = cleanCompanyName(title.slice(0, hiringIndex));
  const jobAndLocation = normalizeText(
    title.slice(hiringIndex + hiringMarker.length),
  );
  const locationMarker = " in ";
  const locationIndex = jobAndLocation.toLowerCase().lastIndexOf(locationMarker);

  if (!companyName || !jobAndLocation) {
    return null;
  }

  if (locationIndex > 0) {
    const jobTitle = normalizeText(jobAndLocation.slice(0, locationIndex));
    const location = normalizeText(
      jobAndLocation.slice(locationIndex + locationMarker.length),
    );

    if (jobTitle && location) {
      return {
        title: jobTitle,
        companyName,
        location,
      };
    }
  }

  return {
    title: jobAndLocation,
    companyName,
    location: "",
  };
}

function splitTitleAndCompany(rawTitle, rawSiteName) {
  const title = normalizeText(rawTitle);
  const siteName = cleanCompanyName(rawSiteName);

  if (!title) {
    return {
      title: "",
      companyName: "",
    };
  }

  const atMatch = title.match(/^(.+?)\s+(?:at|@)\s+(.+?)(?:\s+[|-]\s+.*)?$/i);

  if (atMatch) {
    return {
      title: normalizeText(atMatch[1]),
      companyName: cleanCompanyName(atMatch[2]),
    };
  }

  if (!isGenericSiteName(siteName)) {
    return {
      title,
      companyName: siteName,
    };
  }

  const parts = title
    .split(/\s+(?:[|-]|–|—)\s+/)
    .map(normalizeText)
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      title: parts[0],
      companyName: cleanCompanyName(parts[1]),
    };
  }

  return {
    title,
    companyName: "",
  };
}

export function getStructuredFieldsFromMetadata(metadata) {
  const linkedInFields = splitLinkedInHiringTitle(metadata.title, metadata.url);

  if (linkedInFields) {
    return {
      ...linkedInFields,
      description: stripHtml(metadata.description),
      url: metadata.url,
      jobType: JOB_TYPE.FULL_TIME,
      descriptionMayBeLimited: Boolean(metadata.description),
    };
  }

  const { title, companyName } = splitTitleAndCompany(
    metadata.title,
    metadata.siteName,
  );

  return {
    title,
    companyName,
    location: "",
    description: stripHtml(metadata.description),
    url: metadata.url,
    jobType: JOB_TYPE.FULL_TIME,
    descriptionMayBeLimited: false,
  };
}

function extractFromMetadata($, url) {
  const metadata = {
    url,
    title:
      getMetaContent($, 'meta[property="og:title"]') ||
      getMetaContent($, 'meta[name="twitter:title"]') ||
      normalizeText($("title").first().text()),
    description:
      getMetaContent($, 'meta[property="og:description"]') ||
      getMetaContent($, 'meta[name="twitter:description"]') ||
      getMetaContent($, 'meta[name="description"]'),
    siteName:
      getMetaContent($, 'meta[property="og:site_name"]') ||
      getMetaContent($, 'meta[name="application-name"]'),
  };

  return buildJobDetails(getStructuredFieldsFromMetadata(metadata));
}

export async function extractJobDetailsFromJobUrl(value) {
  const normalizedUrl = normalizeJobPostingUrl(value);

  if (!normalizedUrl.success) {
    return normalizedUrl;
  }

  const htmlResult = await fetchHtml(normalizedUrl.url);

  if (!htmlResult.success) {
    return {
      success: false,
      message: EXTRACTION_FAILURE_MESSAGE,
    };
  }

  const $ = load(htmlResult.html);
  const jsonLdResult = extractFromJsonLd($, normalizedUrl.url);

  if (jsonLdResult.success) {
    return jsonLdResult;
  }

  const metadataResult = extractFromMetadata($, normalizedUrl.url);

  if (metadataResult.success) {
    return metadataResult;
  }

  return {
    success: false,
    message: EXTRACTION_FAILURE_MESSAGE,
  };
}

export { EXTRACTION_FAILURE_MESSAGE, REQUIRED_DETAILS_FAILURE_MESSAGE };
