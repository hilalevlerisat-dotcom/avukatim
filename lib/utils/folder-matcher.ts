/**
 * Klasör adından müvekkil eşleştirme yardımcısı.
 * Kullanıcı "Seyyide ŞAHİN" klasörünü sürükleyince,
 * veritabanındaki müvekkil listesiyle akıllıca eşleştirir.
 */

export interface ClientForMatch {
  id: string
  full_name: string
}

// ── Normalizasyon ─────────────────────────────────────────────────────────────

/**
 * Türkçe karakterleri Latin'e dönüştürür, küçültür, noktalama temizler.
 * "Seyyide ŞAHİN" → "seyyide sahin"
 */
export function normalize(text: string): string {
  return text
    .normalize('NFC')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Levenshtein mesafesi ──────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

/** 0–100 arası benzerlik skoru */
function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 100
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return 100
  const dist = levenshtein(na, nb)
  return Math.round((1 - dist / maxLen) * 100)
}

// ── Eşleştirme ────────────────────────────────────────────────────────────────

export interface MatchResult {
  client: ClientForMatch
  score: number           // 0–100
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Klasör adına göre en iyi müvekkil eşleşmesini döndürür.
 * - score >= 85 → high (otomatik onayla)
 * - score >= 60 → medium (kullanıcı onayı iste)
 * - score <  60 → low (eşleşme yok / yeni müvekkil?)
 */
export function matchClientByFolderName(
  folderName: string,
  clients: ClientForMatch[],
): MatchResult | null {
  if (!clients.length) return null

  const normFolder = normalize(folderName)
  const words = normFolder.split(' ')

  let best: MatchResult | null = null

  for (const client of clients) {
    const normClient = normalize(client.full_name)

    // 1. Tam eşleşme
    if (normFolder === normClient) {
      return { client, score: 100, confidence: 'high' }
    }

    // 2. İçerme: klasör adı müvekkil adını içeriyor ya da tam tersi
    const contains =
      normClient.includes(normFolder) || normFolder.includes(normClient)

    // 3. Kelime örtüşmesi
    const clientWords = normClient.split(' ')
    const wordOverlap = words.filter(w => w.length > 1 && clientWords.includes(w)).length
    const wordScore = Math.round((wordOverlap / Math.max(words.length, clientWords.length)) * 100)

    // 4. Levenshtein tabanlı skor
    const levScore = similarity(folderName, client.full_name)

    const score = contains
      ? Math.max(levScore, wordScore, 80)
      : Math.max(levScore, wordScore)

    const confidence: MatchResult['confidence'] =
      score >= 85 ? 'high' : score >= 60 ? 'medium' : 'low'

    if (!best || score > best.score) {
      best = { client, score, confidence }
    }
  }

  // Çok düşük skor → eşleşme yok
  if (best && best.score < 40) return null
  return best
}

// ── Klasör okuma (HTML5 File API) ─────────────────────────────────────────────

export interface FolderFile {
  file: File
  relativePath: string  // klasör içindeki yol
}

/**
 * DataTransferItem'dan dosyaları recursive olarak okur.
 * webkitGetAsEntry() API kullanır.
 */
export async function readDroppedItems(
  dataTransfer: DataTransfer,
): Promise<{ folderName: string | null; files: FolderFile[] }> {
  const files: FolderFile[] = []
  let folderName: string | null = null

  const items = Array.from(dataTransfer.items)
  const entries: FileSystemEntry[] = []

  for (const item of items) {
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry()
      if (entry) entries.push(entry)
    }
  }

  // Tek klasör mü?
  if (entries.length === 1 && entries[0].isDirectory) {
    folderName = entries[0].name
    await readDirectoryEntry(entries[0] as FileSystemDirectoryEntry, '', files)
  } else {
    // Birden fazla dosya ya da karma
    for (const entry of entries) {
      if (entry.isDirectory) {
        await readDirectoryEntry(entry as FileSystemDirectoryEntry, entry.name + '/', files)
      } else {
        const file = await fileFromEntry(entry as FileSystemFileEntry)
        files.push({ file, relativePath: entry.name })
      }
    }
  }

  return { folderName, files }
}

async function readDirectoryEntry(
  dir: FileSystemDirectoryEntry,
  prefix: string,
  out: FolderFile[],
): Promise<void> {
  const reader = dir.createReader()
  const entries = await new Promise<FileSystemEntry[]>((res, rej) => {
    const all: FileSystemEntry[] = []
    function readBatch() {
      reader.readEntries((batch) => {
        if (!batch.length) return res(all)
        all.push(...batch)
        readBatch()
      }, rej)
    }
    readBatch()
  })

  for (const entry of entries) {
    if (entry.isDirectory) {
      await readDirectoryEntry(entry as FileSystemDirectoryEntry, prefix + entry.name + '/', out)
    } else {
      const file = await fileFromEntry(entry as FileSystemFileEntry)
      out.push({ file, relativePath: prefix + entry.name })
    }
  }
}

function fileFromEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((res, rej) => entry.file(res, rej))
}

// ── Dosya uzantısı araçları ───────────────────────────────────────────────────

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export function isPreviewable(filename: string): boolean {
  const ext = getFileExtension(filename)
  return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'tiff', 'tif', 'udf'].includes(ext)
}

/** Dosya adından icon rengi */
export function fileTypeColor(filename: string): string {
  const ext = getFileExtension(filename)
  const map: Record<string, string> = {
    pdf: 'text-red-500', udf: 'text-indigo-500',
    tiff: 'text-violet-500', tif: 'text-violet-500',
    png: 'text-sky-500', jpg: 'text-sky-500', jpeg: 'text-sky-500',
    docx: 'text-blue-600', doc: 'text-blue-600',
    xlsx: 'text-green-600', xls: 'text-green-600',
  }
  return map[ext] ?? 'text-muted-foreground'
}
