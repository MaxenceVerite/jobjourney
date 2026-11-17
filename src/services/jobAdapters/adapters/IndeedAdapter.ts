// src/services/jobAdapters/adapters/IndeedAdapter.ts
import { ExtractedJobData, JobBoardAdapter } from "../JobBoardAdapter";

export class IndeedAdapter implements JobBoardAdapter {
  readonly name = "Indeed";

  matches(url: string, doc: Document): boolean {
    if (url && (url.includes("indeed.com") || url.includes("indeed.fr") || url.includes(".indeed."))) {
      return true;
    }
    const ogUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute("content");
    if (ogUrl && ogUrl.includes("indeed.")) return true;

    const title = doc.querySelector("title")?.textContent || "";
    return title.includes("Indeed.com") || title.includes("Indeed");
  }

  extract(doc: Document, url: string): Partial<ExtractedJobData> {
    const result: Partial<ExtractedJobData> = {
      sourceJobBoard: "Indeed",
      url: url || undefined,
    };

    // 1. Try schema.org JSON-LD JobPosting (Indeed embeds this natively)
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent || "{}");
        if (data["@type"] === "JobPosting") {
          result.title = data.title;
          result.company = data.hiringOrganization?.name;

          if (data.jobLocation?.address) {
            const addr = data.jobLocation.address;
            const parts = [addr.addressLocality, addr.postalCode, addr.addressRegion].filter(Boolean);
            result.location = parts.join(", ");
          }

          if (data.employmentType) {
            const types = Array.isArray(data.employmentType) ? data.employmentType : [data.employmentType];
            const typeStr = types.join(" ").toUpperCase();
            if (typeStr.includes("FULL_TIME")) result.contractType = "CDI";
            else if (typeStr.includes("PART_TIME")) result.contractType = "Temps partiel";
            else if (typeStr.includes("TEMPORARY") || typeStr.includes("CONTRACTOR")) result.contractType = "CDD / Mission";
            else if (typeStr.includes("INTERN")) result.contractType = "Stage";
          }

          if (data.baseSalary?.value) {
            const val = data.baseSalary.value;
            result.salaryMin = val.minValue ?? val.value;
            result.salaryMax = val.maxValue;
            const unit = String(val.unitText || "").toUpperCase();
            if (unit === "HOUR") result.salaryPeriodicity = "Daily";
            else if (unit === "MONTH") result.salaryPeriodicity = "Monthly";
            else if (unit === "YEAR") result.salaryPeriodicity = "Yearly";
          }

          if (data.datePosted) {
            result.publishedAt = data.datePosted;
          }

          if (data.description) {
            result.description = data.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          }

          break;
        }
      } catch {
        // Fall back to DOM / Meta
      }
    }

    // 2. DOM / Meta Fallbacks
    if (!result.title) {
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
      if (ogTitle) {
        // Example: "Tech Lead .NET F/H - Lille (59) - Indeed.com"
        const clean = ogTitle.replace(/\s*-\s*Indeed\.com$/i, "").trim();
        const parts = clean.split(" - ");
        result.title = parts[0]?.trim();
        if (parts.length > 1 && !result.location) {
          result.location = parts.slice(1).join(" - ").trim();
        }
      }
    }

    if (!result.title) {
      result.title =
        doc.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim() ||
        doc.querySelector('[data-testid="simpler-jobTitle"]')?.textContent?.trim() ||
        doc.querySelector("h1")?.textContent?.trim() ||
        "";
    }

    if (!result.company) {
      // In Indeed, meta[property="og:description"] or meta[name="twitter:description"] is the company name!
      const metaComp =
        doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        doc.querySelector('meta[name="twitter:description"]')?.getAttribute("content");
      if (metaComp && metaComp.length < 80) {
        result.company = metaComp.trim();
      } else {
        const compEl =
          doc.querySelector('[data-testid="inlineHeader-companyName"]') ||
          doc.querySelector('a[href*="/cmp/"]') ||
          doc.querySelector(".jobsearch-InlineCompanyHeader-companyName");
        result.company = compEl?.textContent?.trim() || "";
      }
    }

    if (!result.description) {
      const descEl =
        doc.querySelector("#jobDescriptionText") ||
        doc.querySelector('[data-testid="jobDescriptionText"]') ||
        doc.querySelector(".jobsearch-jobDescriptionText");
      if (descEl) {
        result.description = descEl.textContent?.replace(/\s+/g, " ").trim();
      }
    }

    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");
    if (ogImage && !result.logoUrl) {
      result.logoUrl = ogImage;
    }

    const shareUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute("content");
    if (shareUrl && !result.url) {
      result.url = shareUrl;
    }

    return result;
  }
}
