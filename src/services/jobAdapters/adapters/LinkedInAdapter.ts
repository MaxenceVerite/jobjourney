// src/services/jobAdapters/adapters/LinkedInAdapter.ts
import { ExtractedJobData, JobBoardAdapter } from "../JobBoardAdapter";

export class LinkedInAdapter implements JobBoardAdapter {
  readonly name = "LinkedIn";

  matches(url: string, doc: Document): boolean {
    if (url && (url.includes("linkedin.com") || url.includes("lnkd.in"))) {
      return true;
    }
    const ogUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute("content");
    if (ogUrl && ogUrl.includes("linkedin.com")) return true;

    const title = doc.querySelector("title")?.textContent || "";
    return title.includes("| LinkedIn") || title.includes("- LinkedIn");
  }

  extract(doc: Document, url: string): Partial<ExtractedJobData> {
    const result: Partial<ExtractedJobData> = {
      sourceJobBoard: "LinkedIn",
      url: url || undefined,
    };

    // 1. Precise Title & Company from Document Title
    // LinkedIn format: "Job Title | Company Name | LinkedIn"
    const docTitle = doc.querySelector("title")?.textContent?.trim() || "";
    if (docTitle.includes("|")) {
      const parts = docTitle.split("|").map((p) => p.trim());
      // Filter out "LinkedIn" or notifications like "(4) LinkedIn"
      const meaningfulParts = parts.filter(
        (p) => !p.toLowerCase().includes("linkedin") && !p.toLowerCase().includes("fil d’actualité")
      );
      if (meaningfulParts.length >= 2) {
        result.title = meaningfulParts[0];
        result.company = meaningfulParts[1];
      } else if (meaningfulParts.length === 1) {
        result.title = meaningfulParts[0];
      }
    }

    // 2. DOM Selectors fallback
    if (!result.title) {
      const titleEl =
        doc.querySelector(".job-details-jobs-unified-top-card__job-title") ||
        doc.querySelector(".topcard__title") ||
        doc.querySelector(".top-card-layout__title") ||
        doc.querySelector("h1");
      if (titleEl) result.title = titleEl.textContent?.trim();
    }

    if (!result.company) {
      const compEl =
        doc.querySelector(".job-details-jobs-unified-top-card__company-name") ||
        doc.querySelector(".topcard__flavor--black-link") ||
        doc.querySelector('a[href*="/company/"]');
      if (compEl) result.company = compEl.textContent?.trim();
    }

    // 3. Location & Workplace Type
    const bullets = Array.from(
      doc.querySelectorAll(
        ".job-details-jobs-unified-top-card__bullet, .topcard__flavor--bullet, .job-details-jobs-unified-top-card__workplace-type"
      )
    ).map((el) => el.textContent?.trim() || "");

    for (const b of bullets) {
      const lower = b.toLowerCase();
      if (lower.includes("à distance") || lower.includes("télétravail total") || lower.includes("remote")) {
        result.remoteCondition = "Remote";
      } else if (lower.includes("hybride") || lower.includes("hybrid")) {
        result.remoteCondition = "Hybrid";
      } else if (lower.includes("sur site") || lower.includes("sur place") || lower.includes("on-site")) {
        result.remoteCondition = "Office";
      } else if (b.length > 2 && !result.location && !b.includes("candidats") && !b.includes("postulé")) {
        result.location = b;
      }
    }

    // 4. Contract Type from text snippets
    const bodyText = doc.body?.textContent || "";
    if (bodyText.includes("CDI") || bodyText.includes("Temps plein") || bodyText.includes("Full-time")) {
      result.contractType = "CDI";
    } else if (bodyText.includes("CDD")) {
      result.contractType = "CDD";
    } else if (bodyText.includes("Stage") || bodyText.includes("Internship")) {
      result.contractType = "Stage";
    } else if (bodyText.includes("Alternance") || bodyText.includes("Apprentissage")) {
      result.contractType = "Alternance";
    } else if (bodyText.includes("Freelance") || bodyText.includes("Indépendant")) {
      result.contractType = "Freelance";
    }

    // 5. Company Logo
    const logoImg =
      doc.querySelector('.job-details-jobs-unified-top-card__company-logo img') ||
      doc.querySelector('img[alt*="logo" i]') ||
      doc.querySelector('.artdeco-entity-image img');
    if (logoImg) {
      result.logoUrl = logoImg.getAttribute("src") || undefined;
    }

    // 6. Job Description
    const descContainer =
      doc.querySelector(".jobs-description__content") ||
      doc.querySelector(".jobs-description") ||
      doc.querySelector("#job-details") ||
      doc.querySelector(".show-more-less-html__markup");
    if (descContainer) {
      result.description = descContainer.textContent?.replace(/\s+/g, " ").trim();
    }

    return result;
  }
}
