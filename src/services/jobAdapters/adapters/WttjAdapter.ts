// src/services/jobAdapters/adapters/WttjAdapter.ts
import { ExtractedJobData, JobBoardAdapter } from "../JobBoardAdapter";

export class WttjAdapter implements JobBoardAdapter {
  readonly name = "Welcome to the Jungle";

  matches(url: string, doc: Document): boolean {
    if (url && (url.includes("welcometothejungle.com") || url.includes("wttj.co"))) {
      return true;
    }
    const ogSite = doc.querySelector('meta[property="og:site_name"]')?.getAttribute("content");
    if (ogSite && ogSite.toLowerCase().includes("welcome to the jungle")) {
      return true;
    }
    return doc.documentElement?.innerHTML?.includes("wttj-front") || false;
  }

  extract(doc: Document, url: string): Partial<ExtractedJobData> {
    const result: Partial<ExtractedJobData> = {
      sourceJobBoard: "Welcome to the Jungle",
      url: url || undefined,
    };

    // 1. Try extraction from window.__INITIAL_DATA__ in script tags
    const html = doc.documentElement?.innerHTML || "";
    const idx = html.indexOf('window.__INITIAL_DATA__ = "');
    if (idx !== -1) {
      const start = idx + 'window.__INITIAL_DATA__ = "'.length;
      let end = html.indexOf('"\n', start);
      if (end === -1) end = html.indexOf('";', start);
      if (end !== -1) {
        try {
          const rawString = html.slice(start, end);
          const unescaped = JSON.parse(`"${rawString}"`);
          const data = JSON.parse(unescaped);
          const job = data.queries?.[0]?.state?.data;

          if (job) {
            result.title = job.name || job.profession?.sub_category_name?.fr;
            result.company = job.organization?.name;
            result.logoUrl = job.organization?.logo?.url || job.organization?.cover_image?.small?.url;

            if (job.office?.city) {
              result.location = job.office?.zip_code
                ? `${job.office.city} (${job.office.zip_code})`
                : job.office.city;
            }

            if (job.contract_type) {
              const ct = String(job.contract_type).toLowerCase();
              if (ct.includes("full_time")) result.contractType = "CDI";
              else if (ct.includes("temporary") || ct.includes("cdd")) result.contractType = "CDD";
              else if (ct.includes("internship")) result.contractType = "Stage";
              else if (ct.includes("apprenticeship")) result.contractType = "Alternance";
              else if (ct.includes("freelance")) result.contractType = "Freelance";
              else result.contractType = job.contract_type;
            }

            if (job.tools && Array.isArray(job.tools)) {
              result.skills = job.tools.map((t: any) => t.name).filter(Boolean);
            }

            if (job.experience_level) {
              const exp = String(job.experience_level);
              if (exp === "0_TO_6_MONTHS") result.experienceLevel = "0 - 6 mois";
              else if (exp === "6_MONTHS_TO_1_YEAR") result.experienceLevel = "6 mois - 1 an";
              else if (exp === "1_TO_2_YEARS") result.experienceLevel = "1 - 2 ans";
              else if (exp === "2_TO_3_YEARS") result.experienceLevel = "2 - 3 ans";
              else if (exp === "3_TO_5_YEARS") result.experienceLevel = "3 - 5 ans";
              else if (exp === "5_TO_7_YEARS") result.experienceLevel = "5 - 7 ans";
              else if (exp === "MORE_THAN_7_YEARS") result.experienceLevel = "7+ ans";
              else result.experienceLevel = exp;
            }

            if (job.remote) {
              const rem = String(job.remote).toLowerCase();
              if (rem.includes("full") || rem.includes("total")) result.remoteCondition = "Remote";
              else if (rem.includes("partial") || rem.includes("hybrid") || rem.includes("some")) result.remoteCondition = "Hybrid";
              else if (rem.includes("no")) result.remoteCondition = "Office";
            }

            if (job.description) {
              result.description = job.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            }

            if (job.reference) {
              result.externalReference = job.reference;
            }

            if (job.urls?.[0]?.href) {
              result.url = job.urls[0].href;
            }
          }
        } catch {
          // Fall back to DOM parsing
        }
      }
    }

    // 2. DOM / Meta Fallbacks
    if (!result.title || !result.company) {
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
      if (ogTitle) {
        // Pattern: "Job Title - Company - Contract à Location"
        const parts = ogTitle.split(" - ").map((p) => p.trim());
        if (parts.length >= 2) {
          if (!result.title) result.title = parts[0];
          if (!result.company) {
            // Find company part
            const companyCandidate = parts.find(
              (p) => !p.toLowerCase().includes("cdi") && !p.toLowerCase().includes("cdd") && !p.includes("Lille") && p !== parts[0]
            );
            result.company = companyCandidate || parts[1];
          }
        } else {
          result.title = ogTitle;
        }
      }

      if (!result.title) {
        result.title = doc.querySelector("h1")?.textContent?.trim() || "";
      }

      if (!result.company) {
        const companyEl = doc.querySelector('a[href*="/companies/"]');
        result.company = companyEl?.textContent?.trim() || "";
      }
    }

    return result;
  }
}
