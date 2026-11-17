const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('test-fixtures/jobboards/france_travail.html', 'utf-8');
const dom = new JSDOM(html);
const doc = dom.window.document;

// In task-805 earlier, we saw:
// FT Modal Title: Développeur d'Applications C# .NET - Édition de Logiciels Financiers (H/F)
const modal = doc.querySelector('.modal-details-offre');
console.log('modal element found:', !!modal);
if (modal) {
  const h1s = Array.from(modal.querySelectorAll('h1'));
  console.log('modal h1 count:', h1s.length);
  h1s.forEach((h, i) => console.log(`  h1[${i}]:`, h.textContent.replace(/\s+/g, ' ').trim()));
}
