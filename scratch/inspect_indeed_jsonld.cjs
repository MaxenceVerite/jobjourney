const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('test-fixtures/jobboards/indeed.html', 'utf-8');
const dom = new JSDOM(html);
const doc = dom.window.document;

for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
  try {
    const data = JSON.parse(script.textContent);
    if (data['@type'] === 'JobPosting') {
      console.log('INDEED JOB POSTING JSON-LD:');
      console.log('  title:', data.title);
      console.log('  company:', data.hiringOrganization?.name);
      console.log('  address:', data.jobLocation?.address);
      console.log('  employmentType:', data.employmentType);
      console.log('  salary:', data.baseSalary);
      console.log('  datePosted:', data.datePosted);
      console.log('  description length:', data.description?.length);
    }
  } catch (e) {
    console.log('JSON parse error:', e.message);
  }
}
