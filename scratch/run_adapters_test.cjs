const fs = require('fs');
const { JSDOM } = require('jsdom');

// Import built adapters via tsx or dynamic require
// Let's test the registry and all adapters logic directly
const { WttjAdapter } = require('./dist_test/WttjAdapter.cjs');
const { IndeedAdapter } = require('./dist_test/IndeedAdapter.cjs');
const { LinkedInAdapter } = require('./dist_test/LinkedInAdapter.cjs');
const { ApecAdapter } = require('./dist_test/ApecAdapter.cjs');
const { FranceTravailAdapter } = require('./dist_test/FranceTravailAdapter.cjs');

console.log("=== RUNNING SURGICAL ADAPTER TESTS ===\n");

let passed = 0;
let total = 0;

function assert(condition, message) {
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
  console.log("1. Testing Welcome to the Jungle Adapter:");
  const html = fs.readFileSync('test-fixtures/jobboards/welcometothejungle.html', 'utf-8');
  const dom = new JSDOM(html);
  const adapter = new WttjAdapter();
  assert(adapter.matches("https://www.welcometothejungle.com/fr/companies/sopra-steria/jobs/test", dom.window.document), "Matches WTTJ URL");
  
  const data = adapter.extract(dom.window.document, "https://www.welcometothejungle.com/fr/companies/sopra-steria/jobs/test");
  assert(data.company === "Sopra Steria", `Extracted company is Sopra Steria (got: ${data.company})`);
  assert(data.title.includes("C#") || data.title.includes("Développeur"), `Extracted title contains C# / Développeur (got: ${data.title})`);
  assert(data.contractType === "CDI", `Extracted contract is CDI (got: ${data.contractType})`);
  assert(data.location.includes("Villeneuve-d'Ascq"), `Extracted location is Villeneuve-d'Ascq (got: ${data.location})`);
  assert(Array.isArray(data.skills) && data.skills.includes("C#") && data.skills.includes("Angular"), `Extracted skills include C# & Angular (got: ${data.skills?.join(', ')})`);
  assert(data.logoUrl && data.logoUrl.includes("cdn-images"), `Extracted high-res logo URL (got: ${data.logoUrl?.slice(0, 50)}...)`);
}

// 2. Indeed Test
{
  console.log("\n2. Testing Indeed Adapter:");
  const html = fs.readFileSync('test-fixtures/jobboards/indeed.html', 'utf-8');
  const dom = new JSDOM(html);
  const adapter = new IndeedAdapter();
  assert(adapter.matches("https://fr.indeed.com/viewjob?jk=2efc6d0920437da4", dom.window.document), "Matches Indeed URL");
  
  const data = adapter.extract(dom.window.document, "https://fr.indeed.com/viewjob?jk=2efc6d0920437da4");
  assert(data.company === "CGI", `Extracted company is CGI (got: ${data.company})`);
  assert(data.title === "Tech Lead .NET F/H", `Extracted title is Tech Lead .NET F/H (got: ${data.title})`);
  assert(data.contractType === "CDI", `Extracted contract is CDI (got: ${data.contractType})`);
  assert(data.location.includes("Lille"), `Extracted location is Lille (got: ${data.location})`);
  assert(data.description && data.description.length > 500, `Extracted full job description (>500 chars, got: ${data.description?.length})`);
}

// 3. LinkedIn Test
{
  console.log("\n3. Testing LinkedIn Adapter:");
  const html = fs.readFileSync('test-fixtures/jobboards/linkedin.html', 'utf-8');
  const dom = new JSDOM(html);
  const adapter = new LinkedInAdapter();
  assert(adapter.matches("https://www.linkedin.com/jobs/view/12345", dom.window.document), "Matches LinkedIn URL");
  
  const data = adapter.extract(dom.window.document, "https://www.linkedin.com/jobs/view/12345");
  assert(data.company === "Viveris", `Extracted company is Viveris (got: ${data.company})`);
  assert(data.title === "Ingénieur Développement C# / Angular - H/F", `Extracted title is exact (got: ${data.title})`);
  assert(data.contractType === "CDI", `Extracted contract is CDI (got: ${data.contractType})`);
}

// 4. Apec Test
{
  console.log("\n4. Testing Apec Adapter:");
  const html = fs.readFileSync('test-fixtures/jobboards/apec.html', 'utf-8');
  const dom = new JSDOM(html);
  const adapter = new ApecAdapter();
  assert(adapter.matches("https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/179600431W", dom.window.document), "Matches Apec URL");
  
  const data = adapter.extract(dom.window.document, "https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/179600431W");
  assert(data.title === "Développeur .Net F/H", `Extracted title is Développeur .Net F/H (got: ${data.title})`);
  assert(data.salaryMin === 40000 && data.salaryMax === 50000, `Extracted salary is 40k-50k (got: ${data.salaryMin}-${data.salaryMax})`);
  assert(data.contractType === "Intérim", `Extracted contract is Intérim (got: ${data.contractType})`);
  assert(data.location === "Paris, France", `Extracted location is Paris, France (got: ${data.location})`);
  assert(data.logoUrl && data.logoUrl.includes("logo_ASAP_TT"), `Extracted logo URL (got: ${data.logoUrl})`);
}

// 5. France Travail Test
{
  console.log("\n5. Testing France Travail Adapter:");
  const html = fs.readFileSync('test-fixtures/jobboards/france_travail.html', 'utf-8');
  const dom = new JSDOM(html);
  const adapter = new FranceTravailAdapter();
  assert(adapter.matches("https://candidat.francetravail.fr/offres/recherche/detail/8035766", dom.window.document), "Matches France Travail URL");
  
  const data = adapter.extract(dom.window.document, "https://candidat.francetravail.fr/offres/recherche/detail/8035766");
  assert(data.title.includes("Développeur d'Applications C# .NET"), `Extracted title contains Développeur d'Applications C# .NET (got: ${data.title})`);
  assert(data.location && data.location.includes("Arras"), `Extracted location contains Arras (got: ${data.location})`);
}

console.log(`\n========================================`);
console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
console.log(`========================================\n`);

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
