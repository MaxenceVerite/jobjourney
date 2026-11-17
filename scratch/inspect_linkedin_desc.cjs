const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('test-fixtures/jobboards/linkedin.html', 'utf-8');
const dom = new JSDOM(html);
const doc = dom.window.document;

// Look for JSON-LD on LinkedIn
for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
  try {
    const data = JSON.parse(script.textContent);
    console.log('LinkedIn JSON-LD:', data['@type']);
  } catch (e) {}
}

// Find elements with text about the job
const textNodes = [];
const allP = doc.querySelectorAll('p, article, section, div');
for (const el of allP) {
  if (el.textContent.includes('Viveris') && el.textContent.length > 300 && el.textContent.length < 5000) {
    console.log('Found candidate description container tag:', el.tagName, 'class:', el.className, 'id:', el.id, 'len:', el.textContent.length);
    break;
  }
}
