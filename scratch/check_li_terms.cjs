const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('test-fixtures/jobboards/linkedin.html', 'utf-8');
const dom = new JSDOM(html);
const text = dom.window.document.body.textContent;
console.log("Contains CDI:", text.includes("CDI"));
console.log("Contains Temps plein:", text.includes("Temps plein"));
console.log("Contains À plein temps:", text.includes("À plein temps"));
console.log("Contains CDD:", text.includes("CDD"));
