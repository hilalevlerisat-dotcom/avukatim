const fs = require('fs');
const JSZip = require('jszip');

async function createTestUdf() {
  const zip = new JSZip();
  
  // Basit UYAP Document XML
  const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<document format="1.0">
  <content>
    <paragraph>
      <text>Bu bir deneme dilekçesidir.</text>
    </paragraph>
  </content>
</document>`;

  zip.file('content.xml', contentXml);
  
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync('test.udf', content);
  console.log('test.udf created');
}

createTestUdf().catch(console.error);
