// src/helpers/bookmarkletCode.ts

export const getBookmarkletCode = (originUrl?: string): string => {
  const targetOrigin =
    originUrl ||
    (typeof window !== "undefined" && window.location.origin && !window.location.origin.includes("null")
      ? window.location.origin
      : "https://jobjourney-phi.vercel.app");

  // Pure clean JS IIFE that extracts job posting metadata from Indeed, LinkedIn, or any web page
  const rawJs = `(function(){
  try {
    var title = "";
    var company = "";
    var location = "";
    var url = window.location.href;
    var host = window.location.hostname;

    if (host.includes("linkedin.com")) {
      var tEl = document.querySelector("h1.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24, .job-details-jobs-unified-top-card h1, h1");
      if (tEl) title = tEl.innerText.trim();

      var cEl = document.querySelector(".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .jobs-unified-top-card__subtitle-primary-grouping a, [data-tracking-control-name='public_jobs_topcard-org-name'], .job-details-jobs-unified-top-card a");
      if (cEl) company = cEl.innerText.trim();

      var lEl = document.querySelector(".job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet, .jobs-unified-top-card__workplace-type, .topcard__flavor--bullet");
      if (lEl) location = lEl.innerText.trim();
    } else if (host.includes("indeed.")) {
      var tEl = document.querySelector("h1.jobsearch-JobInfoHeader-title, h1[data-testid='simpler-jobTitle'], h1[data-testid='jobsearch-JobInfoHeader-title'], .jobsearch-JobInfoHeader-title, h1");
      if (tEl) title = tEl.innerText.trim();

      var cEl = document.querySelector("[data-company-name='true'], [data-testid='inlineHeader-companyName'], [data-testid='jobsearch-CompanyInfoContainer'] a, .jobsearch-CompanyInfoContainer a, .jobsearch-JobInfoHeader-companyNameLink, .jobsearch-InlineCompanyRating-companyHeader");
      if (cEl) company = cEl.innerText.trim();

      var lEl = document.querySelector("[data-testid='inlineHeader-companyLocation'], [data-testid='job-location'], #jobLocationText, .jobsearch-JobInfoHeader-companyLocation");
      if (lEl) location = lEl.innerText.trim();
    } else if (host.includes("welcometothejungle.") || host.includes("wttj.co")) {
      var tEl = document.querySelector("h1");
      if (tEl) title = tEl.innerText.trim();

      var cEl = document.querySelector("a[href*='/companies/'] span, [data-testid='job-header-company-name'], h2");
      if (cEl) company = cEl.innerText.trim();

      var lEl = document.querySelector("[data-testid='job-location'], i[name='location'] + span");
      if (lEl) location = lEl.innerText.trim();
    } else {
      title = document.title;
      var cMeta = document.querySelector("meta[property='og:site_name']");
      if (cMeta && cMeta.content) company = cMeta.content;
    }

    if (!title && document.title) {
      title = document.title.split("-")[0].split("|")[0].trim();
    }

    var selectedText = "";
    if (window.getSelection) {
      selectedText = window.getSelection().toString();
    }
    if (!selectedText) {
      var descEl = document.querySelector("#jobDescriptionText, [data-testid='jobDescriptionText'], #job-details, .jobs-description__content");
      if (descEl) selectedText = descEl.innerText.substring(0, 3000);
    }

    var target = "${targetOrigin}/opportunities?import=true"
      + "&title=" + encodeURIComponent(title || "")
      + "&company=" + encodeURIComponent(company || "")
      + "&location=" + encodeURIComponent(location || "")
      + "&sourceUrl=" + encodeURIComponent(url || "");

    if (selectedText && selectedText.length > 20) {
      target += "&text=" + encodeURIComponent(selectedText.substring(0, 2500));
    }

    // Affichage d'un toast visuel avec statut et lien de secours
    var oldToast = document.getElementById("jobjourney-toast");
    if (oldToast) oldToast.remove();

    var toast = document.createElement("div");
    toast.id = "jobjourney-toast";
    toast.style.cssText = "position:fixed;top:24px;right:24px;z-index:99999999;background:#1e293b;color:#f8fafc;padding:16px 22px;border-radius:12px;font-family:sans-serif;box-shadow:0 12px 36px rgba(0,0,0,0.4);font-size:14px;border:2px solid #3b82f6;max-width:380px;line-height:1.5;";
    toast.innerHTML = "<div style='font-weight:700;font-size:15px;margin-bottom:6px;display:flex;align-items:center;gap:8px;'><span style='font-size:18px;'>🚀</span> Offre capturée par JobJourney !</div>"
      + "<div style='color:#cbd5e1;font-size:13px;margin-bottom:10px;'><b>" + (title || "Annonce détectée") + "</b>" + (company ? (" chez " + company) : "") + "</div>"
      + "<a id='jj-link' href='" + target + "' target='_blank' style='display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:600;'>Ouvrir dans JobJourney &rarr;</a>";
    
    document.body.appendChild(toast);

    var popup = window.open(target, "_blank");
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      // Si le popup est bloqué par le navigateur, informer l'utilisateur de cliquer sur le lien
      var link = document.getElementById("jj-link");
      if (link) {
        link.style.background = "#eab308";
        link.innerText = "Pop-up bloqué : Cliquez ici pour ouvrir l'offre";
      }
    }

    setTimeout(function(){
      if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }, 8000);

  } catch (err) {
    alert("JobJourney Bookmarklet : Erreur lors de la capture (" + err.message + ")");
  }
})();`;

  // Return standard encoded javascript: URL without invalid '+' replacements
  return `javascript:${encodeURI(rawJs)}`;
};
