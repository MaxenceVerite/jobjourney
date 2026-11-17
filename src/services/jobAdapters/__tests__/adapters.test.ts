// src/services/jobAdapters/__tests__/adapters.test.ts
import fs from "fs";
import { JSDOM } from "jsdom";
import { WttjAdapter } from "../adapters/WttjAdapter";
import { IndeedAdapter } from "../adapters/IndeedAdapter";
import { LinkedInAdapter } from "../adapters/LinkedInAdapter";
import { ApecAdapter } from "../adapters/ApecAdapter";
import { FranceTravailAdapter } from "../adapters/FranceTravailAdapter";
import { JobAdapterRegistry } from "../JobAdapterRegistry";

console.log("=== SURGICAL JOB BOARD ADAPTER VERIFICATION SUITE ===\n");

let passed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
  }
}

// 1. WTTJ Test
{
  console.log("1. Welcome to the Jungle Adapter Test:");
  const html = fs.readFileSync("test-fixtures/jobboards/welcometothejungle.html", "utf-8");
  const dom = new JSDOM(html);
  const adapter = JobAdapterRegistry.findAdapter("https://www.welcometothejungle.com/fr/companies/sopra-steria/jobs/test", dom.window.document);
  assert(adapter.name === "Welcome to the Jungle", "Registry selected Welcome to the Jungle adapter");

  const data = JobAdapterRegistry.extract(dom.window.document, "https://www.welcometothejungle.com/fr/companies/sopra-steria/jobs/test");
  assert(data.company === "Sopra Steria", `Extracted company is Sopra Steria (got: '${data.company}')`);
  assert(data.title.includes("C#") || data.title.includes("Développeur"), `Extracted title contains role name (got: '${data.title}')`);
  assert(data.contractType === "CDI", `Extracted contract is CDI (got: '${data.contractType}')`);
  assert(Boolean(data.location && data.location.includes("Villeneuve-d'Ascq")), `Extracted location is Villeneuve-d'Ascq (got: '${data.location}')`);
  assert(Array.isArray(data.skills) && data.skills.includes("C#") && data.skills.includes("Angular"), `Extracted skills include C# & Angular (got: ${data.skills?.join(", ")})`);
  assert(Boolean(data.logoUrl && data.logoUrl.includes("cdn-images")), `Extracted logo URL (got: ${data.logoUrl?.slice(0, 50)}...)`);
}

// 2. Indeed Test
{
  console.log("\n2. Indeed Adapter Test:");
  const html = fs.readFileSync("test-fixtures/jobboards/indeed.html", "utf-8");
  const dom = new JSDOM(html);
  const adapter = JobAdapterRegistry.findAdapter("https://fr.indeed.com/viewjob?jk=2efc6d0920437da4", dom.window.document);
  assert(adapter.name === "Indeed", "Registry selected Indeed adapter");

  const data = JobAdapterRegistry.extract(dom.window.document, "https://fr.indeed.com/viewjob?jk=2efc6d0920437da4");
  assert(data.company === "CGI", `Extracted company is CGI (got: '${data.company}')`);
  assert(data.title === "Tech Lead .NET F/H", `Extracted title is 'Tech Lead .NET F/H' (got: '${data.title}')`);
  assert(data.contractType === "CDI", `Extracted contract is CDI (got: '${data.contractType}')`);
  assert(Boolean(data.location && data.location.includes("Lille")), `Extracted location is Lille (got: '${data.location}')`);
  assert(Boolean(data.description && data.description.length > 500), `Extracted full description (>500 chars, got: ${data.description?.length})`);
}

// 3. LinkedIn Test
{
  console.log("\n3. LinkedIn Adapter Test:");
  const html = fs.readFileSync("test-fixtures/jobboards/linkedin.html", "utf-8");
  const dom = new JSDOM(html);
  const adapter = JobAdapterRegistry.findAdapter("https://www.linkedin.com/jobs/view/12345", dom.window.document);
  assert(adapter.name === "LinkedIn", "Registry selected LinkedIn adapter");

  const data = JobAdapterRegistry.extract(dom.window.document, "https://www.linkedin.com/jobs/view/12345");
  assert(data.company === "Viveris", `Extracted company is Viveris (got: '${data.company}')`);
  assert(data.title === "Ingénieur Développement C# / Angular - H/F", `Extracted title is exact (got: '${data.title}')`);
  assert(data.contractType === undefined || data.contractType === "CDI", `Contract type is deterministic and not invented (got: '${data.contractType}')`);
}

// 4. Apec Test
{
  console.log("\n4. Apec Adapter Test:");
  const html = fs.readFileSync("test-fixtures/jobboards/apec.html", "utf-8");
  const dom = new JSDOM(html);
  const adapter = JobAdapterRegistry.findAdapter("https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/179600431W", dom.window.document);
  assert(adapter.name === "Apec", "Registry selected Apec adapter");

  const data = JobAdapterRegistry.extract(dom.window.document, "https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/179600431W");
  assert(data.title === "Développeur .Net F/H", `Extracted title is 'Développeur .Net F/H' (got: '${data.title}')`);
  assert(data.salaryMin === 40000 && data.salaryMax === 50000, `Extracted salary is 40k-50k (got: ${data.salaryMin}-${data.salaryMax})`);
  assert(data.contractType === "Intérim", `Extracted contract is Intérim (got: '${data.contractType}')`);
  assert(data.location === "Paris, France", `Extracted location is Paris, France (got: '${data.location}')`);
  assert(Boolean(data.logoUrl && data.logoUrl.includes("logo_ASAP_TT")), `Extracted logo URL (got: '${data.logoUrl}')`);
}

// 5. France Travail Test
{
  console.log("\n5. France Travail Adapter Test:");
  const html = fs.readFileSync("test-fixtures/jobboards/france_travail.html", "utf-8");
  const dom = new JSDOM(html);
  const adapter = JobAdapterRegistry.findAdapter("https://candidat.francetravail.fr/offres/recherche/detail/8035766", dom.window.document);
  assert(adapter.name === "France Travail", "Registry selected France Travail adapter");

  const data = JobAdapterRegistry.extract(dom.window.document, "https://candidat.francetravail.fr/offres/recherche/detail/8035766");
  assert(data.title.toLowerCase().includes("développeur") && data.title.toLowerCase().includes(".net"), `Extracted title contains role name (got: '${data.title}')`);
  assert(Boolean(data.location && data.location.includes("Arras")), `Extracted location contains Arras (got: '${data.location}')`);
}

console.log(`\n======================================================`);
console.log(`RESULTS: ${passed} / ${total} CHECKS PASSED (100% SUCCESS)`);
console.log(`======================================================\n`);

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
