const fs = require('fs');

const lines = fs.readFileSync('scripts/dilekce_links_all.txt', 'utf8').split('\n');

const templates = [];
let currentCategory = 'Genel';
let started = false;

for (let line of lines) {
  line = line.trim();
  if (!line) continue;
  
  if (line.includes('Dilekçe Örnekleri:') || line.includes('432 Hazır Dilekçe Şablonu')) {
      started = true;
      continue;
  }
  
  if (!started) continue;

  // If we hit footer links, we can stop
  if (line.includes('## h2 Sık Sorulan Sorular') || line.includes('/kategori/')) {
    started = false; 
    continue;
  }

  if (line.startsWith('## h2')) {
    // Regex to remove the ## h2 and any emojis and parenthesis at the end
    let cat = line.replace('## h2', '').replace(/\(.*?dilekçe\)/g, '').trim();
    // Remove emojis
    cat = cat.replace(/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F030}-\u{1F09F}\u{1F200}-\u{1F2FF}\u{200D}\u{FE0F}]/gu, '').trim();
    currentCategory = cat;
  } else if (line.startsWith('https://')) {
    const parts = line.split(' | ');
    if (parts.length === 2) {
      let url = parts[0].trim();
      let title = parts[1].trim();
      
      templates.push({
          category: currentCategory,
          title: title,
          url: url
      });
    }
  }
}

// Write to JSON
fs.writeFileSync('scripts/dilekce_templates.json', JSON.stringify(templates, null, 2));
console.log('Parsed', templates.length, 'templates.');
