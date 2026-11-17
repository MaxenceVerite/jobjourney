// extension/extractor.js
// Surgical DOM Extraction logic for Job Journey Extension

function extractJobFromPage() {
  const url = window.location.href;
  const doc = document;
  const result = {
    url: url,
    sourceJobBoard: "Web",
    title: "",
    company: "",
    location: "",
    contractType: "",
    salaryMin: null,
    salaryMax: null,
    salaryPeriodicity: "Yearly",
    remoteCondition: "Office",
    skills: [],
    logoUrl: "",
    description: "",
    externalReference: "",
    experienceLevel: "",
    publishedAt: ""
  };

  // 1. WELCOME TO THE JUNGLE
  if (url.includes("welcometothejungle.com") || url.includes("wttj.co")) {
    result.sourceJobBoard = "Welcome to the Jungle";

    // Try __INITIAL_DATA__
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
            result.title = job.name || job.profession?.sub_category_name?.fr || "";
            result.company = job.organization?.name || "";
            result.logoUrl = job.organization?.logo?.url || "";
            if (job.office?.city) {
              result.location = job.office?.zip_code ? `${job.office.city} (${job.office.zip_code})` : job.office.city;
            }
            if (job.contract_type) {
              const ct = String(job.contract_type).toLowerCase();
              if (ct.includes("full_time")) result.contractType = "CDI";
              else if (ct.includes("cdd")) result.contractType = "CDD";
              else if (ct.includes("internship")) result.contractType = "Stage";
              else if (ct.includes("apprenticeship")) result.contractType = "Alternance";
              else if (ct.includes("freelance")) result.contractType = "Freelance";
            }
            if (job.tools) {
              result.skills = job.tools.map(t => t.name).filter(Boolean);
            }
            if (job.description) {
              result.description = job.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            }
            if (job.reference) {
              result.externalReference = job.reference;
            }
          }
        } catch (e) {}
      }
    }

    if (!result.title) {
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
      if (ogTitle) {
        const parts = ogTitle.split(" - ");
        result.title = parts[0]?.trim();
        if (parts.length > 1) result.company = parts[1]?.trim();
      }
    }
    return result;
  }

  // 2. INDEED
  if (url.includes("indeed.com") || url.includes("indeed.fr") || url.includes(".indeed.")) {
    result.sourceJobBoard = "Indeed";

    for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(script.textContent || "{}");
        if (data["@type"] === "JobPosting") {
          result.title = data.title || "";
          result.company = data.hiringOrganization?.name || "";
          if (data.jobLocation?.address) {
            const addr = data.jobLocation.address;
            result.location = [addr.addressLocality, addr.postalCode, addr.addressRegion].filter(Boolean).join(", ");
          }
          if (data.employmentType) {
            const types = Array.isArray(data.employmentType) ? data.employmentType.join(" ") : String(data.employmentType);
            if (types.includes("FULL_TIME")) result.contractType = "CDI";
            else if (types.includes("PART_TIME")) result.contractType = "Temps partiel";
          }
          if (data.description) {
            result.description = data.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          }
          break;
        }
      } catch (e) {}
    }

    if (!result.title) {
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
      if (ogTitle) {
        result.title = ogTitle.replace(/\s*-\s*Indeed\.com$/i, "").split(" - ")[0]?.trim() || "";
      }
    }
    if (!result.company) {
      const metaComp = doc.querySelector('meta[property="og:description"]')?.getAttribute("content");
      if (metaComp && metaComp.length < 80) result.company = metaComp.trim();
    }
    return result;
  }

  // 3. LINKEDIN
  if (url.includes("linkedin.com")) {
    result.sourceJobBoard = "LinkedIn";

    const titleEl = doc.querySelector(".job-details-jobs-unified-top-card__job-title") ||
      doc.querySelector(".top-card-layout__title") ||
      doc.querySelector("h1");
    if (titleEl) result.title = titleEl.textContent?.trim() || "";

    const docTitle = doc.querySelector("title")?.textContent?.trim() || "";
    if (!result.title && docTitle.includes("|")) {
      const parts = docTitle.split("|").map(p => p.trim()).filter(p => !p.toLowerCase().includes("linkedin"));
      if (parts.length >= 1) result.title = parts[0];
      if (parts.length >= 2 && !result.company) result.company = parts[1];
    }

    const compEl = doc.querySelector(".job-details-jobs-unified-top-card__company-name") ||
      doc.querySelector('a[href*="/company/"]');
    if (compEl && !result.company) result.company = compEl.textContent?.trim() || "";

    const descEl = doc.querySelector(".jobs-description__content") || doc.querySelector("#job-details");
    if (descEl) result.description = descEl.textContent?.replace(/\s+/g, " ").trim() || "";

    const logoEl = doc.querySelector(".job-details-jobs-unified-top-card__company-logo img");
    if (logoEl) result.logoUrl = logoEl.getAttribute("src") || "";

    return result;
  }

  // 4. APEC
  if (url.includes("apec.fr")) {
    result.sourceJobBoard = "Apec";

    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
    if (ogTitle) result.title = ogTitle.trim();

    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");
    if (ogImage) result.logoUrl = ogImage.trim();

    const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute("content");
    if (ogDesc) {
      result.description = ogDesc.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const whereMatch = ogDesc.match(/Où\s*:\s*([^<]+)/i);
      if (whereMatch) result.location = whereMatch[1].trim();

      const salaryMatch = ogDesc.match(/entre\s+([0-9\s]+)(?:k|keur|k€|€|eur)?\s+et\s+([0-9\s]+)(?:k|keur|k€|€|eur)?\s*brut\/([a-zA-Z]+)/i);
      if (salaryMatch) {
        const minVal = parseInt(salaryMatch[1].replace(/\s/g, ""), 10);
        const maxVal = parseInt(salaryMatch[2].replace(/\s/g, ""), 10);
        result.salaryMin = minVal < 1000 ? minVal * 1000 : minVal;
        result.salaryMax = maxVal < 1000 ? maxVal * 1000 : maxVal;
      }

      const contractMatch = ogDesc.match(/Type de contrat\s*:\s*([^<]+)/i);
      if (contractMatch) result.contractType = contractMatch[1].trim();
    }

    if (!result.company && result.logoUrl) {
      const match = result.logoUrl.match(/logo_([A-Za-z0-9_]+?)_\d+/);
      if (match) result.company = match[1].replace(/_/g, " ");
    }
    return result;
  }

  // 5. FRANCE TRAVAIL
  if (url.includes("francetravail.fr") || url.includes("pole-emploi.fr")) {
    result.sourceJobBoard = "France Travail";

    const modal = doc.querySelector(".modal-details-offre");
    if (modal) {
      const title = modal.querySelector(".title, [itemprop='title'], h1, h2, .modal-title")?.textContent?.replace(/\s+/g, " ").trim();
      if (title && !title.toLowerCase().includes("service indisponible")) result.title = title;
      const comp = modal.querySelector(".company-name, .nom-entreprise")?.textContent?.trim();
      if (comp) result.company = comp;
      const desc = modal.querySelector(".description, .modal-body")?.textContent?.replace(/\s+/g, " ").trim();
      if (desc) result.description = desc;
    }

    if (!result.title) {
      const firstItem = doc.querySelector(".result-item, [data-id-offre]");
      if (firstItem) {
        const itemTitle = firstItem.querySelector(".heading-title, .titre, h2, h3")?.textContent?.trim();
        if (itemTitle) {
          result.title = itemTitle.replace(/Offre déjà vue/gi, "").replace(/\(déjà vu\)/gi, "").replace(/\s+/g, " ").trim();
        }
      }
    }
    return result;
  }

  // Generic fallback: Schema.org or OpenGraph
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
  result.title = ogTitle || doc.querySelector("h1")?.textContent?.trim() || "";
  result.company = doc.querySelector('meta[property="og:site_name"]')?.getAttribute("content") || "";

  return result;
}

// Listen for messages from extension popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract_job") {
    try {
      const data = extractJobFromPage();
      sendResponse({ success: true, data: data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true;
});
