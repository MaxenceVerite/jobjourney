const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('test-fixtures/jobboards/france_travail.html', 'utf-8');
const dom = new JSDOM(html);
const doc = dom.window.document;

const modal = doc.querySelector('.modal-details-offre');
if (modal) {
  const title = modal.querySelector('h1, [itemprop="title"], .modal-title, .title')?.textContent?.trim();
  const company = modal.querySelector('[itemprop="hiringOrganization"]')?.textContent?.trim() ||
    modal.querySelector('.company-name, .nom-entreprise')?.textContent?.trim();
  console.log('FT Modal Title:', title);
  console.log('FT Modal Company:', company);
  console.log('FT Full Modal Text:', modal.textContent.slice(0, 500).replace(/\s+/g, ' '));
}
