const fs = require('fs')
const html = fs.readFileSync(process.argv[2], 'utf8')
const body = html.slice(html.indexOf('<body'))
// başlıklar ve linkler sırası
const re = /<(h[1-4])[^>]*>([\s\S]*?)<\/\1>|<a [^>]*href="(https:\/\/hukukcularevi\.com\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/g
let m, out = [], count = 0
const strip = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#8217;/g, "'").replace(/\s+/g, ' ').trim()
while ((m = re.exec(body))) {
  if (m[1]) out.push('## ' + m[1] + ' ' + strip(m[2]))
  else { out.push('   ' + m[3] + ' | ' + strip(m[4]).slice(0, 80)); count++ }
}
fs.writeFileSync(process.argv[3], out.join('\n'))
console.log('links', count, 'lines', out.length)
