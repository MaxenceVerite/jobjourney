const fs = require('fs');

console.log("=== INSPECTING FIXTURES ===");
for (const name of ['apec.html', 'linkedin.html', 'welcometothejungle.html', 'indeed.html', 'france_travail.html']) {
  const p = `test-fixtures/jobboards/${name}`;
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf-8');
    const size = Buffer.byteLength(content, 'utf-8');
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    const ogTitle = content.match(/property="og:title"\s+content="([^"]+)"/i) || content.match(/name="twitter:title"\s+content="([^"]+)"/i);
    console.log(`[${name}] (${size} bytes)`);
    console.log(`  <title>: ${titleMatch ? titleMatch[1] : 'NONE'}`);
    console.log(`  og:title: ${ogTitle ? ogTitle[1] : 'NONE'}`);
  }
}
