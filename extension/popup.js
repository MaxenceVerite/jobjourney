// extension/popup.js

let currentJobData = null;

document.addEventListener("DOMContentLoaded", async () => {
  const sourceTag = document.getElementById("sourceTag");
  const roleTitle = document.getElementById("roleTitle");
  const companyName = document.getElementById("companyName");
  const logoImg = document.getElementById("logoImg");
  const logoFallback = document.getElementById("logoFallback");
  const badgesContainer = document.getElementById("badgesContainer");
  const importBtn = document.getElementById("importBtn");
  const statusMessage = document.getElementById("statusMessage");

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    statusMessage.textContent = "Aucun onglet actif trouvé.";
    return;
  }

  // Inject extractor script
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["extractor.js"],
    });

    // Request extraction
    chrome.tabs.sendMessage(tab.id, { action: "extract_job" }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        statusMessage.textContent = "Impossible d'extraire automatiquement l'offre de cette page.";
        roleTitle.textContent = tab.title || "Page web";
        companyName.textContent = new URL(tab.url).hostname;
        return;
      }

      const job = response.data;
      currentJobData = job;

      // Render Source
      sourceTag.textContent = job.sourceJobBoard || "Web";

      // Render Title & Company
      roleTitle.textContent = job.title || "Titre non détecté";
      companyName.textContent = job.company || "Entreprise non détectée";

      // Render Logo
      if (job.logoUrl) {
        logoImg.src = job.logoUrl;
        logoImg.style.display = "block";
        logoFallback.style.display = "none";
      }

      // Render Badges
      badgesContainer.innerHTML = "";
      if (job.contractType) {
        const b = document.createElement("div");
        b.className = "badge contract";
        b.textContent = job.contractType;
        badgesContainer.appendChild(b);
      }
      if (job.location) {
        const b = document.createElement("div");
        b.className = "badge";
        b.textContent = `📍 ${job.location}`;
        badgesContainer.appendChild(b);
      }
      if (job.skills && job.skills.length > 0) {
        job.skills.slice(0, 3).forEach((s) => {
          const b = document.createElement("div");
          b.className = "badge";
          b.textContent = s;
          badgesContainer.appendChild(b);
        });
      }

      statusMessage.textContent = "Prêt à être importé !";
    });
  } catch (err) {
    statusMessage.textContent = "Erreur: " + err.message;
  }

  // Handle Save
  importBtn.addEventListener("click", async () => {
    if (!currentJobData) {
      statusMessage.textContent = "Aucune donnée à enregistrer.";
      return;
    }

    importBtn.disabled = true;
    importBtn.textContent = "Enregistrement...";

    try {
      // 1. Try direct API post to Job Journey local backend
      const payload = {
        roleTitle: currentJobData.title || tab.title,
        industry: null,
        remoteCondition: currentJobData.remoteCondition || "Office",
        location: currentJobData.location || null,
        startDate: new Date().toISOString(),
        lastUpdateDate: new Date().toISOString(),
        state: "DRAFT",
        freeNotes: currentJobData.description || `Importé depuis ${currentJobData.url}`,
        contractType: currentJobData.contractType || null,
        sourceJobBoard: currentJobData.sourceJobBoard || null,
        companyLogoUrl: currentJobData.logoUrl || null,
        externalReference: currentJobData.externalReference || null,
        skills: currentJobData.skills || [],
        indicativeSalaryRange: currentJobData.salaryMin || currentJobData.salaryMax ? {
          min: currentJobData.salaryMin || currentJobData.salaryMax || 0,
          max: currentJobData.salaryMax || currentJobData.salaryMin || 0,
          periodicity: currentJobData.salaryPeriodicity || "Yearly"
        } : null
      };

      const res = await fetch("http://localhost:5200/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        statusMessage.className = "status success";
        statusMessage.textContent = "✨ Offre importée avec succès !";
        importBtn.textContent = "✅ Enregistré !";
        setTimeout(() => window.close(), 1500);
      } else {
        // Fallback: Open Job Journey app with URL encoded state
        const importParam = encodeURIComponent(JSON.stringify(currentJobData));
        chrome.tabs.create({ url: `http://localhost:5173/opportunities?importData=${importParam}` });
        window.close();
      }
    } catch (err) {
      // If API not directly accessible, open Job Journey frontend
      const importParam = encodeURIComponent(JSON.stringify(currentJobData));
      chrome.tabs.create({ url: `http://localhost:5173/opportunities?importData=${importParam}` });
      window.close();
    }
  });
});
