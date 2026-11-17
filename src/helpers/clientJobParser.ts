// src/helpers/clientJobParser.ts
import { RemoteCondition } from "../models/opportunities/Opportunity";

export interface ParsedJobSummary {
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriodicity?: "Yearly" | "Monthly" | "Daily";
  remoteCondition?: RemoteCondition;
  contractType?: string;
  email?: string;
  phone?: string;
  detectedTitle?: string;
  detectedCompany?: string;
  detectedLocation?: string;
  detectedSourceUrl?: string;
  keySkills: string[];
}

const COMMON_SKILLS = [
  "C#", ".NET", ".NET Core", "ASP.NET", "Blazor", "Java", "Spring", "Python", "Django", "FastAPI",
  "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js", "Next.js", "Express",
  "SQL", "PostgreSQL", "MySQL", "SQL Server", "MongoDB", "Redis", "NoSQL",
  "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Git",
  "HTML", "CSS", "Sass", "Bootstrap", "Tailwind", "Responsive Design",
  "Agile", "Scrum", "REST", "GraphQL", "Microservices", "TDD", "Anglais"
];

/**
 * STRICT, HONEST client-side parser.
 * RULE: NEVER invent or guess fields based on arbitrary line positions.
 * Only extract what is 100% deterministic (Skills, Contract, Salary, Remote, explicit labels).
 * Leave Title, Company, Location EMPTY if there is no explicit label or unambiguous regex match.
 */
export const parseJobTextClientSide = (text: string): ParsedJobSummary => {
  const result: ParsedJobSummary = {
    keySkills: [],
  };
  if (!text || text.trim().length === 0) return result;

  // 1. Strict Title Detection: ONLY if explicitly prefixed by a label at the start of a line
  // Example: "Poste : Développeur C#" or "Intitulé du poste : Lead Dev"
  const explicitTitleMatch = text.match(/^[ \t]*(?:intitulé du poste|titre du poste|poste)\s*[:=]\s*([^\r\n]+)/im);
  if (explicitTitleMatch) {
    const candidate = explicitTitleMatch[1].trim();
    if (candidate.length > 2 && candidate.length < 100) {
      result.detectedTitle = candidate;
    }
  }

  // 2. Strict Company Detection: ONLY if explicitly labeled or standard markdown link
  const explicitCompanyMatch = text.match(/^[ \t]*(?:entreprise|société|employeur|client)\s*[:=]\s*([^\r\n]+)/im);
  if (explicitCompanyMatch) {
    const candidate = explicitCompanyMatch[1].trim();
    if (candidate.length > 1 && candidate.length < 60) {
      result.detectedCompany = candidate;
    }
  } else {
    // Markdown link: [Company](url) - check only if URL is a company or job link
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const mdMatch = lines[i].match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
      if (mdMatch) {
        const linkText = mdMatch[1].trim();
        const linkUrl = mdMatch[2].trim();
        if (
          !result.detectedCompany &&
          linkText.length < 50 &&
          !/postuler|continuer|postulez|apply|en savoir plus|cliquez/i.test(linkText)
        ) {
          result.detectedCompany = linkText;
        }
        if (!result.detectedSourceUrl && (linkUrl.includes("indeed") || linkUrl.includes("linkedin") || linkUrl.includes("welcometothejungle") || linkUrl.includes("job"))) {
          result.detectedSourceUrl = linkUrl;
        }
        break;
      }
    }
  }

  // 3. Strict Location Detection: ONLY if explicit label, postal code, or "Trouvé sur"
  const explicitLocationMatch = text.match(/^[ \t]*(?:lieu|localisation|ville)\s*[:=]\s*([^\r\n]+)/im);
  if (explicitLocationMatch) {
    const candidate = explicitLocationMatch[1].trim();
    if (candidate.length > 2 && candidate.length < 60) {
      result.detectedLocation = candidate;
    }
  } else {
    // Indeed banner: "Trouvé sur Crespin (59)"
    const indeedLocMatch = text.match(/Trouvé sur\s+([^\r\n,]+)/i);
    if (indeedLocMatch) {
      const candidate = indeedLocMatch[1].trim();
      if (candidate.length < 40) {
        result.detectedLocation = candidate;
      }
    } else {
      // Standard French postal code + city: "59310 Orchies"
      const postalMatch = text.match(/\b(\d{5})\s+([A-Za-zÀ-ÿ-]+)/);
      if (postalMatch) {
        result.detectedLocation = `${postalMatch[1]} ${postalMatch[2].trim()}`;
      }
    }
  }

  // 4. Contract Type (100% deterministic keyword match)
  if (/\bCDI\b/i.test(text) || /\bContrat à durée indéterminée\b/i.test(text)) {
    result.contractType = "CDI";
  } else if (/\bCDD\b/i.test(text) || /\bContrat à durée déterminée\b/i.test(text)) {
    result.contractType = "CDD";
  } else if (/\b(stage|internship)\b/i.test(text)) {
    result.contractType = "Stage";
  } else if (/\b(alternance|apprentissage)\b/i.test(text)) {
    result.contractType = "Alternance";
  } else if (/\b(freelance|indépendant|prestataire)\b/i.test(text)) {
    result.contractType = "Freelance";
  }

  // 5. Remote Condition (100% deterministic keyword match)
  if (/\b(full\s*remote|100%\s*(?:télétravail|remote)|télétravail\s*total)\b/i.test(text)) {
    result.remoteCondition = RemoteCondition.Remote;
  } else if (/\b(hybride|hybrid|\d\s*jours?\s*de\s*télétravail|remote\s*friendly)\b/i.test(text)) {
    result.remoteCondition = RemoteCondition.Hybrid;
  } else if (/\b(sur\s*site|présentiel|pas\s*de\s*télétravail)\b/i.test(text)) {
    result.remoteCondition = RemoteCondition.Office;
  }

  // 6. Salary Detection (Deterministic number & periodicity pattern)
  if (!/aucun\s*salaire/i.test(text)) {
    const rangeMatch = text.match(/(\d{2,3})\s*(?:k|K|000)?\s*(?:€|euros?)?\s*(?:à|-|au)\s*(\d{2,3})\s*(?:k|K|000)?\s*(?:€|euros?|k€)/i);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      if (!isNaN(min)) result.salaryMin = min < 1000 ? min * 1000 : min;
      if (!isNaN(max)) result.salaryMax = max < 1000 ? max * 1000 : max;
      result.salaryPeriodicity = "Yearly";
    } else {
      const singleMatch = text.match(/(?:salaire|rémunération)?\s*[:=]?\s*(\d{2,3})(?:[\s.,](\d{3}))?\s*(?:k€|k|K|€|euros?)(?:\s*(?:brut|net))?(?:\s*(?:\/|par)\s*(an|mois|jour))?/i);
      if (singleMatch) {
        const numStr = singleMatch[1] + (singleMatch[2] ? singleMatch[2] : "");
        const val = parseFloat(numStr);
        if (!isNaN(val)) {
          const isDailyOrMonthly = singleMatch[0].toLowerCase().includes("jour") || singleMatch[0].toLowerCase().includes("mois");
          result.salaryMin = (val < 1000 && !isDailyOrMonthly) ? val * 1000 : val;
          if (singleMatch[3]) {
            const period = singleMatch[3].toLowerCase();
            result.salaryPeriodicity = period === "mois" ? "Monthly" : period === "jour" ? "Daily" : "Yearly";
          } else {
            result.salaryPeriodicity = "Yearly";
          }
        }
      }
    }
  }

  // 7. Tech Skills (100% deterministic lexicon search)
  const detectedSkillsSet = new Set<string>();
  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:[^a-zA-Z0-9#+]|$)`, "i");
    if (regex.test(text)) {
      detectedSkillsSet.add(skill);
    }
  }
  result.keySkills = Array.from(detectedSkillsSet);

  return result;
};
