const fs = require('fs');
const { JSDOM } = require('jsdom');

console.log('=== DEEP EXTRACTION INSPECTION ===\n');

// 1. WTTJ
{
  const html = fs.readFileSync('test-fixtures/jobboards/welcometothejungle.html', 'utf-8');
  // WTTJ stores serialized JSON in window.__INITIAL_DATA__ = "..."
  const idx = html.indexOf('window.__INITIAL_DATA__ = "');
  if (idx !== -1) {
    const start = idx + 'window.__INITIAL_DATA__ = "'.length;
    let end = html.indexOf('"\n', start);
    if (end === -1) end = html.indexOf('";', start);
    if (end !== -1) {
      const rawString = html.slice(start, end);
      try {
        const unescaped = JSON.parse(`"${rawString}"`);
        const data = JSON.parse(unescaped);
        const job = data.queries?.[0]?.state?.data;
        if (job) {
          console.log('[WTTJ Extracted]');
          console.log('  Company:', job.organization?.name);
          console.log('  Role:', job.name || job.profession?.sub_category_name?.fr);
          console.log('  City:', job.office?.city, '(', job.office?.zip_code, ')');
          console.log('  Contract:', job.contract_type);
          console.log('  Tools:', job.tools?.map(t => t.name));
          console.log('  Logo:', job.organization?.logo?.url);
          console.log('  Url:', job.urls?.[0]?.href);
        }
      } catch (e) {
        console.log('WTTJ raw string parsing error:', e.message);
      }
    }
  }
}

// 2. Indeed
{
  const html = fs.readFileSync('test-fixtures/jobboards/indeed.html', 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  // Check schema.org / JSON-LD
  const jsonLd = doc.querySelector('script[type="application/ld+json"]');
  if (jsonLd) {
    console.log('[Indeed JSON-LD found]:', jsonLd.textContent.slice(0, 100));
  }
  
  // Job description container in Indeed
  const descEl = doc.querySelector('#jobDescriptionText') || 
    doc.querySelector('[data-testid="jobDescriptionText"]') ||
    doc.querySelector('.jobsearch-jobDescriptionText');
  console.log('[Indeed Extracted]');
  console.log('  og:title:', doc.querySelector('meta[property="og:title"]')?.getAttribute('content'));
  console.log('  og:description (Company):', doc.querySelector('meta[property="og:description"]')?.getAttribute('content'));
  console.log('  Description length:', descEl?.textContent?.length);
}

// 3. Apec
{
  const html = fs.readFileSync('test-fixtures/jobboards/apec.html', 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  const ogUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute('content');
  
  console.log('\n[Apec Extracted]');
  console.log('  Title:', ogTitle);
  console.log('  Logo:', ogImage);
  console.log('  Url:', ogUrl);
  // Parse description for company, salary, contract
  if (ogDesc) {
    const salaryMatch = ogDesc.match(/entre\s+([0-9kEUR\s]+)\s+brut\/an/i);
    const contractMatch = ogDesc.match(/Type de contrat\s*:\s*([^<]+)/i);
    const whereMatch = ogDesc.match(/Où\s*:\s*([^<]+)/i);
    console.log('  Salary:', salaryMatch ? salaryMatch[1] : null);
    console.log('  Contract:', contractMatch ? contractMatch[1] : null);
    console.log('  Location:', whereMatch ? whereMatch[1] : null);
  }
}

// 4. LinkedIn
{
  const html = fs.readFileSync('test-fixtures/jobboards/linkedin.html', 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  const title = doc.querySelector('title')?.textContent?.trim();
  console.log('\n[LinkedIn Extracted]');
  console.log('  Title raw:', title);
  if (title) {
    const parts = title.split('|').map(s => s.trim());
    console.log('  Title:', parts[0]);
    console.log('  Company:', parts[1]);
  }
  const descEl = doc.querySelector('.jobs-description__content') || 
    doc.querySelector('.jobs-description') ||
    doc.querySelector('#job-details');
  console.log('  Description element found:', !!descEl, 'length:', descEl?.textContent?.length);
}

// 5. France Travail
{
  const html = fs.readFileSync('test-fixtures/jobboards/france_travail.html', 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  console.log('\n[France Travail Extracted]');
  console.log('  <title>:', doc.querySelector('title')?.textContent?.trim());
}
