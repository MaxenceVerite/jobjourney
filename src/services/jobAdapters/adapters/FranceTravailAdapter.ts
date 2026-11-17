// src/services/jobAdapters/adapters/FranceTravailAdapter.ts
import { ExtractedJobData, JobBoardAdapter } from "../JobBoardAdapter";

export class FranceTravailAdapter implements JobBoardAdapter {
  readonly name = "France Travail";

  matches(url: string, doc: Document): boolean {
    if (url && (url.includes("francetravail.fr") || url.includes("pole-emploi.fr"))) {
      return true;
    }
    const title = doc.querySelector("title")?.textContent || "";
    if (title.includes("France Travail") || title.includes("Pôle emploi")) return true;
    return doc.documentElement?.innerHTML?.includes("francetravail.fr") || false;
  }

  extract(doc: Document, url: string): Partial<ExtractedJobData> {
    const result: Partial<ExtractedJobData> = {
      sourceJobBoard: "France Travail",
      url: url || undefined,
    };

    // 1. Check if open in a detail modal
    const modal = doc.querySelector(".modal-details-offre, .modal-details, [role='dialog']");
    if (modal) {
      const modalTitle =
        modal.querySelector(".title, [itemprop='title'], h1, h2, h3, .modal-title")?.textContent?.replace(/\s+/g, " ").trim();
      if (modalTitle && !modalTitle.toLowerCase().includes("service indisponible")) {
        result.title = modalTitle;
      }

      const modalComp =
        modal.querySelector("[itemprop='hiringOrganization'], .company-name, .nom-entreprise")?.textContent?.trim();
      if (modalComp) {
        result.company = modalComp;
      }

      const modalDesc = modal.querySelector(".description, .modal-body, .details-content")?.textContent?.replace(/\s+/g, " ").trim();
      if (modalDesc) {
        result.description = modalDesc;
      }
    }

    // 2. Check offer item in list if not found in modal
    if (!result.title) {
      const firstItem = doc.querySelector(".result-item, [data-id-offre]");
      if (firstItem) {
        const itemTitle = firstItem.querySelector(".heading-title, .titre, h2, h3")?.textContent?.trim();
        if (itemTitle) {
          result.title = itemTitle
            .replace(/Offre déjà vue/gi, "")
            .replace(/\(déjà vu\)/gi, "")
            .replace(/\s+/g, " ")
            .trim();
        }

        const ref = firstItem.getAttribute("data-id-offre");
        if (ref) result.externalReference = ref;

        const compEl = firstItem.querySelector(".sub-title, .entreprise");
        if (compEl) result.company = compEl.textContent?.trim();
      }
    }

    // 3. Fallback to title / h1 / meta
    if (!result.title) {
      const h1 = doc.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim();
      if (h1 && !h1.toLowerCase().includes("offres pour")) {
        result.title = h1;
      } else {
        const docTitle = doc.querySelector("title")?.textContent?.trim() || "";
        const m = docTitle.match(/pour\s+(.*?)\s+(?:-|\|)/i);
        if (m) result.title = m[1].trim();
      }
    }

    // 4. Location & Reference extraction
    const refMatch = (doc.body?.textContent || "").match(/Offre n°\s*([0-9A-Z]+)/i);
    if (refMatch && !result.externalReference) {
      result.externalReference = refMatch[1];
    }

    const locMatch = (doc.querySelector("title")?.textContent || "").match(/-\s*([A-Za-zÀ-ÿ\s'-]+(?:\(\d+\))?)\s*\|/);
    if (locMatch && !result.location) {
      result.location = locMatch[1].trim();
    }

    // 5. Contract detection
    const text = doc.body?.textContent || "";
    if (text.includes("CDI")) result.contractType = "CDI";
    else if (text.includes("CDD")) result.contractType = "CDD";
    else if (text.includes("Intérim") || text.includes("Mission")) result.contractType = "Intérim";
    else if (text.includes("Alternance") || text.includes("Apprentissage")) result.contractType = "Alternance";

    return result;
  }
}
