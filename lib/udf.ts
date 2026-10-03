import JSZip from 'jszip'

/**
 * UYAP Doküman Editörü (.udf) üretici.
 * UDF = ZIP içinde `content.xml`. Biçim: <template format_id="1.8"> içinde tek parça
 * <content> metni + <elements> altında her paragrafın startOffset/length bilgisi.
 */

const FONT = 'Times New Roman'
const SIZE = 12

function cleanText(raw: string): string {
  return raw
    .replace(/\r/g, '')
    .replace(/\*\*/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[*•]\s+/gm, '- ')
    .replace(/[ \t]+$/gm, '')
}

const trUpper = (s: string) => s.toLocaleUpperCase('tr-TR')

function isHeading(line: string): boolean {
  const t = line.trim()
  if (!t || t.length > 90) return false
  if (/[a-zçğıöşü]/.test(t)) return false // küçük harf içeriyorsa başlık değil
  return trUpper(t) === t && /[A-ZÇĞİÖŞÜ]/.test(t)
}

function xmlAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

export async function buildUdfBlob(text: string): Promise<Blob> {
  const cleaned = cleanText(text)
  const lines = cleaned.split('\n')
  // Üst üste gelen boş satırları teke indir, baştaki/sondaki boşları at
  const compact: string[] = []
  for (const l of lines) {
    if (l.trim() === '' && (compact.length === 0 || compact[compact.length - 1].trim() === '')) continue
    compact.push(l.trim())
  }
  while (compact.length && compact[compact.length - 1] === '') compact.pop()

  let content = ''
  let elements = ''
  let firstNonEmptySeen = false

  for (const line of compact) {
    const startOffset = content.length
    const piece = line + '\n'
    content += piece

    let align = 0 // 0 sol, 1 ortala, 2 sağa, 3 iki yana
    let bold = false
    if (line !== '') {
      if (!firstNonEmptySeen) {
        // İlk satır: mahkeme adı → ortalı ve kalın
        align = 1
        bold = true
        firstNonEmptySeen = true
      } else if (isHeading(line)) {
        align = 1
        bold = true
      } else if (/^(DAVACI|DAVALI|KONU|DAVA DEĞERİ|VEKİLİ|BORÇLU|ALACAKLI|SANIK|MÜŞTEKİ|İTİRAZ EDEN|CEVAP VEREN)\s*:/.test(line)) {
        bold = false
        align = 0
      } else if (line.length > 90) {
        align = 3
      }
    }

    const boldAttr = bold ? ' bold="true"' : ''
    elements +=
      `<paragraph Alignment="${align}" LeftIndent="0.0" RightIndent="0.0" FirstLineIndent="${align === 3 ? '28.35' : '0.0'}" SpaceAfter="4.0" LineSpacing="0.0">` +
      `<content${boldAttr} family="${FONT}" size="${SIZE}" startOffset="${startOffset}" length="${piece.length}" />` +
      `</paragraph>`
  }

  const safeContent = content.replace(/\]\]>/g, ']]]]><![CDATA[>')

  const xml =
    `<?xml version="1.0" encoding="UTF-8" ?>` +
    `<template format_id="1.8" >` +
    `<content><![CDATA[${safeContent}]]></content>` +
    `<properties><pageFormat mediaSizeName="1" leftMargin="70.875" rightMargin="70.875" topMargin="70.875" bottomMargin="70.875" paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0" /></properties>` +
    `<elements resolver="hvl-default">${elements}</elements>` +
    `<styles><style name="default" description="Geçerli" family="${xmlAttr(FONT)}" size="${SIZE}" bold="false" italic="false" foreground="-13421773" FirstLineIndent="0.0" /><style name="hvl-default" family="${xmlAttr(FONT)}" size="${SIZE}" description="Gövde" /></styles>` +
    `</template>`

  const zip = new JSZip()
  zip.file('content.xml', xml)
  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip', compression: 'DEFLATE' })
}
