import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/api.js';
import { db, UPLOAD_DIR_PUBLIC, UPLOAD_DIR_PROTECTED, UPLOAD_DIR_FREE } from './server/db.js';
import { requireAdmin, AuthenticatedRequest } from './server/auth.js';

const app = express();
const PORT = 3000;

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directories exist
[UPLOAD_DIR_PUBLIC, UPLOAD_DIR_PROTECTED, UPLOAD_DIR_FREE].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Configure Multer for Public Media Uploads (Images, thumbnails, etc.)
const publicStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR_PUBLIC);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e4);
    cb(null, `${base}-${unique}${ext}`);
  }
});

const uploadPublic = multer({
  storage: publicStorage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

// Serve public uploads statically
app.use('/uploads', express.static(UPLOAD_DIR_PUBLIC));

// File upload endpoints
// 1. Admin media upload (for images, covers, slides)
app.post('/api/admin/media/upload', requireAdmin, uploadPublic.single('file'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const mediaItem = {
    id: 'med-' + Date.now(),
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    uploadedAt: new Date().toISOString()
  };

  const data = db.getData();
  data.media.unshift(mediaItem);
  db.logAudit(
    'MEDIA_UPLOAD',
    req.user!.email,
    req.file.originalname,
    `Uploaded media file of size ${(req.file.size / 1024).toFixed(1)} KB`
  );
  db.save();

  res.json({ success: true, media: mediaItem, url: mediaItem.url });
});

// 2. Customer payment proof upload
app.post('/api/upload/proof', uploadPublic.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// Forward root robots.txt and sitemap.xml to SEO generators
app.get('/robots.txt', (req, res) => {
  res.redirect('/api/robots.txt');
});
app.get('/sitemap.xml', (req, res) => {
  res.redirect('/api/sitemap.xml');
});

// Mount API routes
app.use('/api', apiRouter);

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Soch Wale Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
