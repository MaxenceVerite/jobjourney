// src/services/jobAdapters/adapters/ApecAdapter.ts
import { ExtractedJobData, JobBoardAdapter } from "../JobBoardAdapter";

export class ApecAdapter implements JobBoardAdapter {
  readonly name = "Apec";

  matches(url: string, doc: Document): boolean {
    if (url && url.includes("apec.fr")) return true;
    const title = doc.querySelector("title")?.textContent || "";
    if (title.includes("Apec") || title.includes("apec.fr")) return true;
    return doc.documentElement?.innerHTML?.includes("apec-jahia-module") || false;
  }

  extract(doc: Document, url: string): Partial<ExtractedJobData> {
    const result: Partial<ExtractedJobData> = {
      sourceJobBoard: "Apec",
      url: url || undefined,
    };

    // 1. OpenGraph Meta extraction
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
    if (ogTitle) {
      result.title = ogTitle.trim();
    }

    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");
    if (ogImage) {
      result.logoUrl = ogImage.trim();
    }

    const ogUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute("content");
    if (ogUrl) {
      result.url = ogUrl.trim();
      const refMatch = ogUrl.match(/detail-offre\/([A-Za-z0-9]+)/);
      if (refMatch) result.externalReference = refMatch[1];
    }

    // 2. Parse structured fields from og:description
    const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute("content");
    if (ogDesc) {
      result.description = ogDesc.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      // Location: "Où : Paris, France"
      const whereMatch = ogDesc.match(/Où\s*:\s*([^<]+)/i);
      if (whereMatch) {
        result.location = whereMatch[1].trim();
      }

      // Salary: "Pour combien : entre 40kEUR et 50kEUR brut/an" or "entre 40 k€ et 50 k€"
      const salaryMatch = ogDesc.match(/entre\s+([0-9\s]+)(?:k|keur|k€|€|eur)?\s+et\s+([0-9\s]+)(?:k|keur|k€|€|eur)?\s*brut\/([a-zA-Z]+)/i);
      if (salaryMatch) {
        const minVal = parseInt(salaryMatch[1].replace(/\s/g, ""), 10);
        const maxVal = parseInt(salaryMatch[2].replace(/\s/g, ""), 10);
        result.salaryMin = minVal < 1000 ? minVal * 1000 : minVal;
        result.salaryMax = maxVal < 1000 ? maxVal * 1000 : maxVal;
        const per = salaryMatch[3].toLowerCase();
        if (per.includes("an")) result.salaryPeriodicity = "Yearly";
        else if (per.includes("mois")) result.salaryPeriodicity = "Monthly";
      }

      // Contract: "Type de contrat : intérim"
      const contractMatch = ogDesc.match(/Type de contrat\s*:\s*([^<]+)/i);
      if (contractMatch) {
        const ct = contractMatch[1].trim().toLowerCase();
        if (ct.includes("cdi")) result.contractType = "CDI";
        else if (ct.includes("cdd")) result.contractType = "CDD";
        else if (ct.includes("intérim") || ct.includes("interim")) result.contractType = "Intérim";
        else if (ct.includes("stage")) result.contractType = "Stage";
        else if (ct.includes("alternance") || ct.includes("apprentissage")) result.contractType = "Alternance";
        else result.contractType = contractMatch[1].trim();
      }
    }

    // 3. Fallback to Title tag & DOM elements
    if (!result.title) {
      const docTitle = doc.querySelector("title")?.textContent?.trim() || "";
      const match = docTitle.match(/Offre d['`’]emploi\s+(.*?)\s+(?:Paris|\d{2}|France|[-|])/i);
      if (match) {
        result.title = match[1].trim();
      } else {
        result.title = docTitle.replace(/\|\s*Apec$/i, "").trim();
      }
    }

    // Company from DOM or Logo URL
    if (!result.company) {
      const compEl = doc.querySelector(".nom-entreprise, .company-name, .logo-compagnie, a[href*='page-entreprise']");
      if (compEl) {
        result.company = compEl.textContent?.trim();
      } else if (result.logoUrl) {
        // Example: ".../logo_ASAP_TT_778436_1289484.png"
        const logoMatch = result.logoUrl.match(/logo_([A-Za-z0-9_]+?)_\d+/);
        if (logoMatch) {
          result.company = logoMatch[1].replace(/_/g, " ");
        }
      }
    }

    return result;
  }
}
