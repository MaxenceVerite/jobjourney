const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('test-fixtures/jobboards/france_travail.html', 'utf-8');
const dom = new JSDOM(html);
const doc = dom.window.document;

console.log('FRANCE TRAVAIL INSPECTION:');
console.log('  title:', doc.querySelector('title')?.textContent);
console.log('  h1:', doc.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim());

// Check if this fixture is a search results page or a single job offer
const items = doc.querySelectorAll('.result-item, .offre, [data-id-offre], li[data-id]');
console.log('  Found offer items in list:', items.length);

const firstOffer = doc.querySelector('.result-item') || doc.querySelector('[data-id-offre]');
if (firstOffer) {
  console.log('  First offer snippet:', firstOffer.textContent.slice(0, 200).replace(/\s+/g, ' '));
}

// Check if there are modals or open offer details
const modal = doc.querySelector('.modal-details, #zoneAffichageDetail, .zone-details');
console.log('  Modal or detail zone found:', !!modal);

const titleElement = doc.querySelector('.heading-title, .titre, [itemprop="title"]');
console.log('  Title element:', titleElement?.textContent?.trim());
