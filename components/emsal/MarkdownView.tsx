'use client'

import React from 'react'

/** Basit, bağımlılıksız Markdown görüntüleyici: başlık, kalın/italik, liste, tablo, alıntı, link, ayraç. */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    const key = `${keyPrefix}-${i++}`
    if (tok.startsWith('**')) {
      nodes.push(<strong key={key} className="font-bold text-foreground">{tok.slice(2, -2)}</strong>)
    } else if (tok.startsWith('[')) {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok)!
      nodes.push(
        <a key={key} href={mm[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80 break-all">
          {mm[1]}
        </a>
      )
    } else if (tok.startsWith('`')) {
      nodes.push(<code key={key} className="px-1.5 py-0.5 rounded bg-muted font-mono text-[0.85em]">{tok.slice(1, -1)}</code>)
    } else {
      nodes.push(<em key={key}>{tok.slice(1, -1)}</em>)
    }
    last = m.index + tok.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

const splitRow = (line: string) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())

export default function MarkdownView({ content }: { content: string }) {
  // Modelin yanlışlıkla yazdığı "## ###" gibi çift başlık işaretlerini temizle
  const lines = content.replace(/\r/g, '').replace(/^(#{1,6})\s+#{1,6}\s+/gm, '$1 ').split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let k = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { i++; continue }

    // Ayraç
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(<hr key={k++} className="my-5 border-border/60" />)
      i++
      continue
    }

    // Başlık
    const h = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (h) {
      const level = h[1].length
      const cls =
        level <= 2
          ? 'text-base font-bold text-foreground mt-6 mb-2 pb-1.5 border-b border-emerald-500/30'
          : 'text-sm font-bold text-foreground mt-4 mb-1.5'
      blocks.push(<div key={k++} className={cls}>{renderInline(h[2].replace(/\*\*/g, ''), `h${k}`)}</div>)
      i++
      continue
    }

    // Alıntı
    if (trimmed.startsWith('>')) {
      const buf: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buf.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      blocks.push(
        <div key={k++} className="my-3 px-4 py-3 rounded-xl border-l-4 border-emerald-500/60 bg-emerald-500/10 text-xs leading-relaxed">
          {renderInline(buf.join(' '), `q${k}`)}
        </div>
      )
      continue
    }

    // Tablo
    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const head = splitRow(lines[i])
      i += 2
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]))
        i++
      }
      blocks.push(
        <div key={k++} className="my-3 overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-xs">
            <thead className="bg-muted/60">
              <tr>{head.map((c, ci) => <th key={ci} className="text-left font-bold px-3 py-2 border-b border-border/60">{renderInline(c, `th${k}-${ci}`)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="odd:bg-transparent even:bg-muted/20 align-top">
                  {r.map((c, ci) => <td key={ci} className="px-3 py-2 border-b border-border/40">{renderInline(c, `td${k}-${ri}-${ci}`)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // Liste (madde işaretli / numaralı), girintili alt maddeler dahil
    if (/^(\s*)([*\-+]|\d+\.)\s+/.test(line)) {
      const items: { indent: number; ordered: boolean; text: string }[] = []
      while (i < lines.length && /^(\s*)([*\-+]|\d+\.)\s+/.test(lines[i])) {
        const mm = /^(\s*)([*\-+]|\d+\.)\s+(.*)$/.exec(lines[i])!
        items.push({ indent: mm[1].length, ordered: /\d/.test(mm[2]), text: mm[3] })
        i++
      }
      blocks.push(
        <ul key={k++} className="my-2 space-y-1.5">
          {items.map((it, ii) => (
            <li key={ii} className="flex gap-2 leading-relaxed" style={{ marginLeft: Math.min(it.indent, 8) * 6 }}>
              <span className="text-emerald-500 font-bold flex-shrink-0 mt-px">{it.ordered ? '▸' : '•'}</span>
              <span className="min-w-0">{renderInline(it.text, `li${k}-${ii}`)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Paragraf
    const buf: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|>|\||(\s*)([*\-+]|\d+\.)\s+|-{3,}$)/.test(lines[i].trim())
    ) {
      buf.push(lines[i].trim())
      i++
    }
    if (buf.length === 0) { buf.push(trimmed); i++ }
    blocks.push(<p key={k++} className="my-2 leading-relaxed">{renderInline(buf.join(' '), `p${k}`)}</p>)
  }

  return <div className="text-sm text-foreground/90 font-sans">{blocks}</div>
}
