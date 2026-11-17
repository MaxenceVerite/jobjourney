const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('test-fixtures/jobboards/france_travail.html', 'utf-8');
const dom = new JSDOM(html);
const doc = dom.window.document;

const modal = doc.querySelector('.modal-details') || doc.querySelector('[role="dialog"]') || doc.querySelector('.modal-content');
console.log('Modal element:', modal?.className);
if (modal) {
  console.log('Modal text:', modal.textContent.slice(0, 300).replace(/\s+/g, ' '));
}

// Check first item link / details
const item = doc.querySelector('.result-item') || doc.querySelector('[data-id-offre]');
if (item) {
  console.log('Item HTML snippet:', item.outerHTML.slice(0, 400));
}
