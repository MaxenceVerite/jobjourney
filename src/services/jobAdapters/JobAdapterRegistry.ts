// src/services/jobAdapters/JobAdapterRegistry.ts
import { ExtractedJobData, JobBoardAdapter } from "./JobBoardAdapter";
import { WttjAdapter } from "./adapters/WttjAdapter";
import { IndeedAdapter } from "./adapters/IndeedAdapter";
import { LinkedInAdapter } from "./adapters/LinkedInAdapter";
import { ApecAdapter } from "./adapters/ApecAdapter";
import { FranceTravailAdapter } from "./adapters/FranceTravailAdapter";

class GenericSemanticAdapter implements JobBoardAdapter {
  readonly name = "Generic Semantic";

  matches(): boolean {
    return true; // Fallback
  }

  extract(doc: Document, url: string): Partial<ExtractedJobData> {
    const result: Partial<ExtractedJobData> = {
      sourceJobBoard: "Web",
      url: url || undefined,
    };

    // 1. Check Schema.org JobPosting
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const s of jsonLdScripts) {
      try {
        const data = JSON.parse(s.textContent || "{}");
        if (data["@type"] === "JobPosting") {
          result.title = data.title;
          result.company = data.hiringOrganization?.name;
          result.description = data.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          return result;
        }
      } catch {}
    }

    // 2. OpenGraph Fallback
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
    const ogSite = doc.querySelector('meta[property="og:site_name"]')?.getAttribute("content");
    const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute("content");
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");

    result.title = ogTitle || doc.querySelector("h1")?.textContent?.trim() || "";
    result.company = ogSite || "";
    result.description = ogDesc || "";
    result.logoUrl = ogImage || undefined;

    return result;
  }
}

export class JobAdapterRegistry {
  private static adapters: JobBoardAdapter[] = [
    new WttjAdapter(),
    new IndeedAdapter(),
    new LinkedInAdapter(),
    new ApecAdapter(),
    new FranceTravailAdapter(),
  ];

  private static fallbackAdapter = new GenericSemanticAdapter();

  /**
   * Find the first adapter that matches the given URL or Document
   */
  static findAdapter(url: string, doc: Document): JobBoardAdapter {
    for (const adapter of this.adapters) {
      if (adapter.matches(url, doc)) {
        return adapter;
      }
    }
    return this.fallbackAdapter;
  }

  /**
   * Extract job data from a document and optional URL
   */
  static extract(doc: Document, url: string = ""): ExtractedJobData {
    const adapter = this.findAdapter(url, doc);
    const partial = adapter.extract(doc, url);

    return {
      title: partial.title || "",
      company: partial.company || "",
      location: partial.location,
      salaryMin: partial.salaryMin,
      salaryMax: partial.salaryMax,
      salaryPeriodicity: partial.salaryPeriodicity,
      contractType: partial.contractType,
      remoteCondition: partial.remoteCondition,
      description: partial.description,
      url: partial.url || url,
      logoUrl: partial.logoUrl,
      skills: partial.skills,
      externalReference: partial.externalReference,
      experienceLevel: partial.experienceLevel,
      publishedAt: partial.publishedAt,
      sourceJobBoard: partial.sourceJobBoard || adapter.name,
    };
  }
}
