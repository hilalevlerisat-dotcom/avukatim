const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// The base directory where the 36GB files are stored.
const BASE_DIR = process.env.BASE_DIR || 'C:\\Users\\CASPER\\Desktop\\ARŞİV';

app.use(cors());
app.use(express.json());

// Helper to securely join paths and prevent path traversal
function getSecurePath(subPath) {
  if (!subPath) return BASE_DIR;
  // Normalize path
  const safeSuffix = path.normalize(subPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const finalPath = path.join(BASE_DIR, safeSuffix);
  // Ensure it still starts with BASE_DIR
  if (!finalPath.startsWith(BASE_DIR)) {
    throw new Error('Geçersiz dosya yolu (Path traversal attempt detected).');
  }
  return finalPath;
}

// 1. List directory contents
app.get('/api/files', async (req, res) => {
  try {
    const relativePath = req.query.path || '';
    const targetPath = getSecurePath(relativePath);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Klasör bulunamadı.' });
    }

    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Belirtilen yol bir klasör değil.' });
    }

    const items = fs.readdirSync(targetPath);
    const result = items.map(item => {
      const itemPath = path.join(targetPath, item);
      try {
        const itemStat = fs.statSync(itemPath);
        return {
          name: item,
          isDirectory: itemStat.isDirectory(),
          size: itemStat.size,
          lastModified: itemStat.mtime,
          path: path.posix.join(relativePath, item) // relative to base
        };
      } catch (err) {
        return null;
      }
    }).filter(Boolean);

    // Sort: directories first
    result.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }
      return a.isDirectory ? -1 : 1;
    });

    res.json({
      currentPath: relativePath,
      items: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Download or view a file
app.get('/api/download', (req, res) => {
  try {
    const relativePath = req.query.path;
    if (!relativePath) {
      return res.status(400).json({ error: 'Dosya yolu belirtilmedi.' });
    }

    const targetPath = getSecurePath(relativePath);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Dosya bulunamadı.' });
    }

    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'Bu bir klasör, dosya değil.' });
    }

    // Set correct headers for inline viewing if it's a PDF/Image, or download otherwise
    const ext = path.extname(targetPath).toLowerCase();
    
    // For UDF, docx, etc we want to trigger download. For PDF/images we can view inline.
    if (ext === '.pdf') res.setHeader('Content-Type', 'application/pdf');
    else if (ext === '.jpg' || ext === '.jpeg') res.setHeader('Content-Type', 'image/jpeg');
    else if (ext === '.png') res.setHeader('Content-Type', 'image/png');
    else {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(targetPath))}"`);
    }

    const stream = fs.createReadStream(targetPath);
    stream.pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sync-clients', (req, res) => {
  try {
    if (!fs.existsSync(BASE_DIR)) {
      return res.status(404).json({ error: 'Arşiv klasörü bulunamadı.' });
    }

    const clientsToImport = [];

    // Helper to read directories safely
    const getDirs = (dirPath) => {
      if (!fs.existsSync(dirPath)) return [];
      return fs.readdirSync(dirPath).filter(f => fs.statSync(path.join(dirPath, f)).isDirectory());
    };

    // 1. Ortak Dosyalar (Av. Süleyman KAYA altındakiler)
    const suleymanDir = path.join(BASE_DIR, 'Av. Süleyman KAYA');
    const ortaklar = getDirs(suleymanDir);
    ortaklar.forEach(name => {
      clientsToImport.push({
        full_name: name,
        notes: 'Kategori: Ortak Dosya (Av. Süleyman KAYA)',
        client_type: 'bireysel'
      });
    });

    // 2. Kendi Müvekkillerim (Hukuk ve Ceza altındakiler)
    const hukukDir = path.join(BASE_DIR, 'Hukuk');
    const hukukClients = getDirs(hukukDir);
    hukukClients.forEach(name => {
      clientsToImport.push({
        full_name: name,
        notes: 'Kategori: Hukuk Dosyası',
        client_type: 'bireysel'
      });
    });

    const cezaDir = path.join(BASE_DIR, 'Ceza');
    const cezaClients = getDirs(cezaDir);
    cezaClients.forEach(name => {
      clientsToImport.push({
        full_name: name,
        notes: 'Kategori: Ceza Dosyası',
        client_type: 'bireysel'
      });
    });

    res.json({ success: true, clients: clientsToImport });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', baseDir: BASE_DIR }));

app.listen(PORT, () => {
  console.log(`🚀 Yerel Dosya Sunucusu çalışıyor: http://localhost:${PORT}`);
  console.log(`📁 Bağlı Klasör: ${BASE_DIR}`);
});
