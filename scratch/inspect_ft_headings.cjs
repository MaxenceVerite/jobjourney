const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('test-fixtures/jobboards/france_travail.html', 'utf-8');
const dom = new JSDOM(html);
const doc = dom.window.document;

const modal = doc.querySelector('.modal-details-offre');
if (modal) {
  const headings = Array.from(modal.querySelectorAll('h2, h3, h4, span.title, p.title, [itemprop="title"], .modal-title, [class*="title"], [class*="titre"]'));
  headings.forEach(h => console.log('Headings:', h.tagName, h.className, '=>', h.textContent.replace(/\s+/g, ' ').trim().slice(0, 100)));
}
