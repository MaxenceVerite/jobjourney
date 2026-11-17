const fs = require('fs');
const { JSDOM } = require('jsdom');

function analyzeWttj() {
  console.log('\n--- ANALYZING WTTJ ---');
  const html = fs.readFileSync('test-fixtures/jobboards/welcometothejungle.html', 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Check __INITIAL_DATA__
  const scriptData = doc.querySelector('script#wttj-initial-data') || 
    Array.from(doc.querySelectorAll('script')).find(s => s.textContent.includes('window.__INITIAL_DATA__'));
  
  if (scriptData) {
    console.log('Found __INITIAL_DATA__ script!');
    const match = scriptData.textContent.match(/window\.__INITIAL_DATA__\s*=\s*"([^"]+)"/);
    if (match) {
      try {
        const rawJson = JSON.parse(`"${match[1]}"`);
        const parsed = JSON.parse(rawJson);
        const job = parsed.queries?.[0]?.state?.data;
        if (job) {
          console.log('WTTJ Job from INITIAL_DATA:');
          console.log('  Organization:', job.organization?.name);
          console.log('  Logo:', job.organization?.logo?.url);
          console.log('  Location:', job.office?.city, job.office?.zip_code);
          console.log('  Contract:', job.contract_type);
          console.log('  Experience:', job.experience_level);
          console.log('  Tools:', job.tools?.map(t => t.name));
          console.log('  URLs:', job.urls?.[0]?.href);
        }
      } catch (e) {
        console.log('Error parsing __INITIAL_DATA__:', e.message);
      }
    }
  }

  // DOM Fallback
  const h1 = doc.querySelector('h1')?.textContent?.trim();
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const companyMeta = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
  const companyEl = doc.querySelector('a[href*="/companies/"]');
  console.log('DOM Fallback:');
  console.log('  h1:', h1);
  console.log('  og:title:', ogTitle);
  console.log('  companyEl:', companyEl?.textContent?.trim());
}

function analyzeLinkedIn() {
  console.log('\n--- ANALYZING LINKEDIN ---');
  const html = fs.readFileSync('test-fixtures/jobboards/linkedin.html', 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const title = doc.querySelector('h1')?.textContent?.trim() ||
    doc.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim();
  const company = doc.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ||
    doc.querySelector('a[href*="/company/"]')?.textContent?.trim();
  const docTitle = doc.querySelector('title')?.textContent?.trim();
  console.log('  title:', title);
  console.log('  company:', company);
  console.log('  <title>:', docTitle);

  // Parse from document title: "Ingénieur Développement C# / Angular - H/F | Viveris | LinkedIn"
  if (docTitle) {
    const parts = docTitle.split('|').map(s => s.trim());
    console.log('  Title parts:', parts);
  }
}

function analyzeApec() {
  console.log('\n--- ANALYZING APEC ---');
  const html = fs.readFileSync('test-fixtures/jobboards/apec.html', 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  const docTitle = doc.querySelector('title')?.textContent?.trim();
  console.log('  og:title:', ogTitle);
  console.log('  og:description snippet:', ogDesc?.slice(0, 150));
  console.log('  og:image:', ogImage);
  console.log('  <title>:', docTitle);
}

function analyzeIndeed() {
  console.log('\n--- ANALYZING INDEED ---');
  const html = fs.readFileSync('test-fixtures/jobboards/indeed.html', 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const docTitle = doc.querySelector('title')?.textContent?.trim();
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  const h1 = doc.querySelector('h1')?.textContent?.trim();
  const dataTestidTitle = doc.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim() ||
    doc.querySelector('[data-testid="simpler-jobTitle"]')?.textContent?.trim();
  const company = doc.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim() ||
    doc.querySelector('a[href*="/cmp/"]')?.textContent?.trim();

  console.log('  <title>:', docTitle);
  console.log('  og:title:', ogTitle);
  console.log('  og:description (company):', ogDesc);
  console.log('  h1:', h1);
  console.log('  dataTestidTitle:', dataTestidTitle);
  console.log('  company:', company);
}

function analyzeFranceTravail() {
  console.log('\n--- ANALYZING FRANCE TRAVAIL ---');
  const html = fs.readFileSync('test-fixtures/jobboards/france_travail.html', 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const docTitle = doc.querySelector('title')?.textContent?.trim();
  const h1 = doc.querySelector('h1')?.textContent?.trim();
  const modalTitle = doc.querySelector('[itemprop="title"]')?.textContent?.trim();
  console.log('  <title>:', docTitle);
  console.log('  h1:', h1);
  console.log('  modalTitle:', modalTitle);
}

analyzeWttj();
analyzeLinkedIn();
analyzeApec();
analyzeIndeed();
analyzeFranceTravail();
