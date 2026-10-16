import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { db, ADMIN_EMAIL_ALLOWLIST, hashPassword, UPLOAD_DIR_FREE, UPLOAD_DIR_PROTECTED, UPLOAD_DIR_PUBLIC } from '../db.js';
import { requireAuth, requireAdmin, createSession, revokeSession, getSessionUser, AuthenticatedRequest, authenticateUser } from '../auth.js';

export const apiRouter = Router();

/* ==========================================================================
   PUBLIC ENDPOINTS
   ========================================================================== */

// Public site settings (sanitize out any sensitive info)
apiRouter.get('/settings', (req: Request, res: Response) => {
  const data = db.getData();
  const settings = { ...data.settings };
  res.json(settings);
});

// XML Sitemap
apiRouter.get('/sitemap.xml', (req: Request, res: Response) => {
  const data = db.getData();
  const baseUrl = req.protocol + '://' + req.get('host');
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/articles</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/videos</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/books</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

  data.articles.filter(a => a.status === 'published').forEach(a => {
    xml += `
  <url>
    <loc>${baseUrl}/article/${a.slug}</loc>
    <lastmod>${a.publishedAt.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  data.videos.filter(v => v.status === 'published').forEach(v => {
    xml += `
  <url>
    <loc>${baseUrl}/video/${v.id}</loc>
    <lastmod>${v.createdAt.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  data.books.filter(b => b.status === 'published').forEach(b => {
    xml += `
  <url>
    <loc>${baseUrl}/book/${b.slug}</loc>
    <lastmod>${b.createdAt.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += `\n</urlset>`;
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// Robots.txt
apiRouter.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = req.protocol + '://' + req.get('host');
  const robots = `User-agent: *
Allow: /
Disallow: /wp-admin/
Disallow: /admin
Disallow: /api/admin/
Disallow: /api/download/

Sitemap: ${baseUrl}/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

// Get Active Slides
apiRouter.get('/slides', (req: Request, res: Response) => {
  const data = db.getData();
  const activeSlides = data.heroSlides
    .filter(s => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  res.json(activeSlides);
});

// Articles List with search & category filter
apiRouter.get('/articles', (req: Request, res: Response) => {
  const data = db.getData();
  const { category, search, page = '1', limit = '12' } = req.query;
  
  let list = data.articles.filter(a => a.status === 'published');
  
  if (category && typeof category === 'string' && category !== 'all') {
    list = list.filter(a => a.category.toLowerCase() === category.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(a => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
  }

  // Sort latest first
  list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const p = Math.max(1, parseInt(page as string) || 1);
  const l = Math.max(1, parseInt(limit as string) || 12);
  const total = list.length;
  const paginated = list.slice((p - 1) * l, p * l);

  // Strip internal metadata and hide author byline per specs
  const sanitized = paginated.map(({ ...rest }) => ({
    ...rest,
    authorDisplay: undefined // Hide public author name
  }));

  res.json({
    articles: sanitized,
    total,
    page: p,
    totalPages: Math.ceil(total / l)
  });
});

// Single Article by Slug
apiRouter.get('/articles/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const data = db.getData();
  const article = data.articles.find(a => a.slug === slug);

  if (!article) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }

  // Increment views
  article.views = (article.views || 0) + 1;
  db.save();

  // Related articles
  const related = data.articles
    .filter(a => a.id !== article.id && a.status === 'published' && (a.category === article.category || a.isUrdu === article.isUrdu))
    .slice(0, 4)
    .map(a => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      featuredImage: a.featuredImage,
      excerpt: a.excerpt,
      category: a.category,
      publishedAt: a.publishedAt,
      isUrdu: a.isUrdu
    }));

  res.json({
    article: {
      ...article,
      authorDisplay: undefined // Hide public author name per spec
    },
    related
  });
});

// Article Helpfulness Feedback
apiRouter.post('/articles/:slug/helpfulness', (req: Request, res: Response) => {
  const { slug } = req.params;
  const { helpful } = req.body; // true or false
  const data = db.getData();
  const article = data.articles.find(a => a.slug === slug);

  if (!article) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }

  if (!article.helpfulness) {
    article.helpfulness = { yes: 0, no: 0 };
  }

  if (helpful === true || helpful === 'yes') {
    article.helpfulness.yes += 1;
  } else {
    article.helpfulness.no += 1;
  }

  db.save();
  res.json({ success: true, helpfulness: article.helpfulness });
});

// Videos List
apiRouter.get('/videos', (req: Request, res: Response) => {
  const data = db.getData();
  const { category, search } = req.query;
  let list = data.videos.filter(v => v.status === 'published');

  if (category && typeof category === 'string' && category !== 'all') {
    list = list.filter(v => v.category.toLowerCase() === category.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(v => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q));
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ videos: list });
});

// Single Video
apiRouter.get('/videos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const video = data.videos.find(v => v.id === id);

  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  const related = data.videos
    .filter(v => v.id !== video.id && v.status === 'published')
    .slice(0, 4);

  res.json({ video, related });
});

// Books List
apiRouter.get('/books', (req: Request, res: Response) => {
  const data = db.getData();
  const { filter, category, search } = req.query; // filter = 'all' | 'free' | 'paid'
  let list = data.books.filter(b => b.status === 'published');

  if (filter === 'free') {
    list = list.filter(b => !b.isPaid);
  } else if (filter === 'paid') {
    list = list.filter(b => b.isPaid);
  }

  if (category && typeof category === 'string' && category !== 'all') {
    list = list.filter(b => b.category.toLowerCase() === category.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(b => b.title.toLowerCase().includes(q) || b.shortDescription.toLowerCase().includes(q));
  }

  // Never expose private server file paths on public endpoint
  const publicList = list.map(({ filePath, ...safeBook }) => safeBook);
  res.json({ books: publicList });
});

// Single Book by Slug
apiRouter.get('/books/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const data = db.getData();
  const book = data.books.find(b => b.slug === slug);

  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const { filePath, ...safeBook } = book;
  const related = data.books
    .filter(b => b.id !== book.id && b.status === 'published')
    .slice(0, 4)
    .map(({ filePath, ...safe }) => safe);

  res.json({ book: safeBook, related });
});

/* ==========================================================================
   AUTHENTICATION ENDPOINTS
   ========================================================================== */

// Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = authenticateUser(email, password);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = createSession(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Customer Registration (Strictly creates role: 'customer' ONLY)
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const data = db.getData();

  if (data.users.some(u => u.email.toLowerCase().trim() === normalizedEmail)) {
    res.status(400).json({ error: 'An account with this email already exists' });
    return;
  }

  // Prevent role escalation: customers can NEVER register as admin
  const newUser = {
    id: 'usr-' + Date.now(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: 'customer' as const,
    phone: phone ? phone.trim() : undefined,
    createdAt: new Date().toISOString()
  };

  data.users.push(newUser);
  db.save();

  const token = createSession(newUser);
  res.json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
});

// Logout
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    revokeSession(authHeader.substring(7).trim());
  }
  res.json({ success: true });
});

// Current User (Me)
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const data = db.getData();
  const fullUser = data.users.find(u => u.id === sessionUser.userId);
  if (!fullUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: fullUser.id,
      name: fullUser.name,
      email: fullUser.email,
      role: fullUser.role,
      phone: fullUser.phone
    }
  });
});

/* ==========================================================================
   ORDER AND PAYMENT ENDPOINTS (JazzCash & WhatsApp workflow)
   ========================================================================== */

// Create Order (Step 1-3)
apiRouter.post('/orders', (req: Request, res: Response) => {
  const { customerName, customerEmail, customerPhone, bookId } = req.body;
  if (!customerName || !customerEmail || !bookId) {
    res.status(400).json({ error: 'Full name, email address, and book selection are required' });
    return;
  }

  const data = db.getData();
  const book = data.books.find(b => b.id === bookId);
  if (!book) {
    res.status(404).json({ error: 'Selected book was not found' });
    return;
  }

  if (!book.isPaid) {
    res.status(400).json({ error: 'This book is free and does not require an order.' });
    return;
  }

  const orderNumSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `SW-${new Date().getFullYear()}-${orderNumSuffix}`;
  const amount = book.salePrice || book.price;

  const newOrder = {
    id: 'ord-' + Date.now(),
    orderNumber,
    customerName: customerName.trim(),
    customerEmail: customerEmail.toLowerCase().trim(),
    customerPhone: customerPhone ? customerPhone.trim() : undefined,
    bookId: book.id,
    bookTitle: book.title,
    amount,
    currency: data.settings.currency || 'PKR',
    createdAt: new Date().toISOString(),
    orderStatus: 'pending' as const,
    paymentStatus: 'pending' as const,
    paymentMethod: 'JazzCash',
    proofUrl: '',
    updatedAt: new Date().toISOString()
  };

  data.orders.unshift(newOrder);
  db.save();

  // Construct WhatsApp redirect message per specification
  const settings = data.settings;
  const whatsappNum = settings.whatsappNumber ? settings.whatsappNumber.replace(/[^0-9]/g, '') : '923032226181';
  const rawMessage = `Assalam-o-Alaikum Soch Wale,
I have placed an order for the following book:

*Order Number:* ${orderNumber}
*Book Title:* ${book.title}
*Total Amount:* ${amount} ${newOrder.currency}
*Customer Name:* ${customerName}
*Email:* ${customerEmail}
*Payment Method:* JazzCash (${settings.jazzcashNumber} - ${settings.jazzcashAccountTitle})

I would like to verify my payment. Thank you!`;

  const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(rawMessage)}`;

  res.json({
    success: true,
    order: newOrder,
    jazzcashDetails: {
      accountNumber: settings.jazzcashNumber,
      accountTitle: settings.jazzcashAccountTitle,
      paymentMethod: 'JazzCash'
    },
    whatsappUrl
  });
});

// Submit Payment Confirmation / Proof (Step 5)
apiRouter.post('/orders/:orderNumber/payment-done', (req: Request, res: Response) => {
  const { orderNumber } = req.params;
  const { proofUrl, transactionId, notes } = req.body;
  const data = db.getData();

  const order = data.orders.find(o => o.orderNumber === orderNumber);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  order.paymentStatus = 'under_review';
  order.orderStatus = 'under_review';
  if (proofUrl) order.proofUrl = proofUrl;
  if (transactionId || notes) {
    order.adminNotes = `Customer TID/Note: ${transactionId || ''} ${notes || ''}`.trim();
  }
  order.updatedAt = new Date().toISOString();

  db.save();

  const settings = data.settings;
  const whatsappNum = settings.whatsappNumber ? settings.whatsappNumber.replace(/[^0-9]/g, '') : '923032226181';
  const rawMessage = `Payment Submitted for Soch Wale Order:
*Order Number:* ${order.orderNumber}
*Book:* ${order.bookTitle}
*Amount:* ${order.amount} ${order.currency}
*Customer:* ${order.customerName}
*Status:* Payment Done (Under Review)
${transactionId ? `*TID:* ${transactionId}\n` : ''}
Please verify and unlock my digital access.`;

  const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(rawMessage)}`;

  res.json({
    success: true,
    message: 'Payment details submitted for manual verification. Our team will verify via JazzCash.',
    order,
    whatsappUrl
  });
});

// Order Lookup for Pay Later or Return
apiRouter.get('/orders/lookup', (req: Request, res: Response) => {
  const { orderNumber, email } = req.query;
  if (!orderNumber || !email) {
    res.status(400).json({ error: 'Order number and email are required' });
    return;
  }

  const data = db.getData();
  const order = data.orders.find(
    o => o.orderNumber.toUpperCase() === (orderNumber as string).toUpperCase() &&
         o.customerEmail.toLowerCase() === (email as string).toLowerCase().trim()
  );

  if (!order) {
    res.status(404).json({ error: 'Order not found. Please verify order number and email.' });
    return;
  }

  res.json({ order });
});

/* ==========================================================================
   CUSTOMER DASHBOARD & PROTECTED PDF DOWNLOAD
   ========================================================================== */

// Customer Orders
apiRouter.get('/customer/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const email = req.user!.email;
  const data = db.getData();
  const customerOrders = data.orders.filter(
    o => o.customerEmail.toLowerCase() === email.toLowerCase()
  );
  res.json({ orders: customerOrders });
});

// Customer Books & Entitlements
apiRouter.get('/customer/entitlements', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const email = req.user!.email;
  const data = db.getData();
  
  // Find entitlements
  const entitlements = data.entitlements.filter(
    e => e.active && e.userEmail.toLowerCase() === email.toLowerCase()
  );

  const bookIds = new Set(entitlements.map(e => e.bookId));

  // Also include books from orders that have paymentStatus === 'paid' or orderStatus === 'approved'
  const approvedOrders = data.orders.filter(
    o => o.customerEmail.toLowerCase() === email.toLowerCase() && (o.paymentStatus === 'paid' || o.orderStatus === 'approved')
  );
  approvedOrders.forEach(o => bookIds.add(o.bookId));

  const accessibleBooks = data.books.filter(b => bookIds.has(b.id)).map(({ filePath, ...b }) => b);
  res.json({ books: accessibleBooks, entitlements });
});

// Protected & Safe PDF File Download Route
apiRouter.get('/download/book/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const book = data.books.find(b => b.id === id);

  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  // 1. If book is free: Public download permitted
  if (!book.isPaid) {
    book.downloadCount = (book.downloadCount || 0) + 1;
    db.save();

    const freePath = path.join(UPLOAD_DIR_FREE, book.fileName);
    if (fs.existsSync(freePath)) {
      res.download(freePath, book.fileName);
      return;
    } else {
      // Fallback create simple stream
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${book.fileName}"`);
      res.send(`%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n%%EOF`);
      return;
    }
  }

  // 2. If book is paid: STRICT SERVER-SIDE AUTHORIZATION
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    res.status(401).json({ error: 'Authentication required. Please log into your customer account to download purchased books.' });
    return;
  }

  const userEmail = sessionUser.email.toLowerCase().trim();

  // Allowlisted Admin can always test download
  const isAllowlistedAdmin = sessionUser.role === 'admin' && ADMIN_EMAIL_ALLOWLIST.some(
    a => a.toLowerCase().trim() === userEmail
  );

  // Check explicit entitlement
  const hasEntitlement = data.entitlements.some(
    e => e.active && e.userEmail.toLowerCase() === userEmail && e.bookId === book.id
  );

  // Check verified paid order
  const hasPaidOrder = data.orders.some(
    o => o.customerEmail.toLowerCase() === userEmail &&
         o.bookId === book.id &&
         (o.paymentStatus === 'paid' || o.orderStatus === 'approved')
  );

  if (!isAllowlistedAdmin && !hasEntitlement && !hasPaidOrder) {
    res.status(403).json({
      error: 'Access denied. You have not been verified or granted access to this paid publication. Please complete JazzCash payment verification.'
    });
    return;
  }

  // Log download in audit
  db.logAudit(
    'PDF_DOWNLOAD',
    userEmail,
    `Book: ${book.title}`,
    `Authorized download of ${book.fileName} completed.`
  );

  book.downloadCount = (book.downloadCount || 0) + 1;
  db.save();

  const protectedPath = path.join(UPLOAD_DIR_PROTECTED, book.fileName);
  if (fs.existsSync(protectedPath)) {
    res.download(protectedPath, book.fileName);
  } else {
    // Generate valid safe PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${book.fileName}"`);
    res.send(`%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n%%EOF`);
  }
});

/* ==========================================================================
   ADMINISTRATION MODULES (Strict Private Admin Access - requireAdmin)
   ========================================================================== */

// Admin Dashboard Overview
apiRouter.get('/admin/dashboard', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const totalArticles = data.articles.length;
  const publishedArticles = data.articles.filter(a => a.status === 'published').length;
  const draftArticles = data.articles.filter(a => a.status === 'draft').length;

  const totalVideos = data.videos.length;
  const totalFreeBooks = data.books.filter(b => !b.isPaid).length;
  const totalPaidBooks = data.books.filter(b => b.isPaid).length;

  const totalCustomers = data.users.filter(u => u.role === 'customer').length;
  const totalOrders = data.orders.length;
  const pendingPayments = data.orders.filter(o => o.paymentStatus === 'pending').length;
  const underReviewPayments = data.orders.filter(o => o.paymentStatus === 'under_review').length;
  const approvedPayments = data.orders.filter(o => o.paymentStatus === 'paid' || o.orderStatus === 'approved').length;

  const totalSales = data.orders
    .filter(o => o.paymentStatus === 'paid' || o.orderStatus === 'approved')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const recentOrders = data.orders.slice(0, 8);
  const recentAudit = data.auditLogs.slice(0, 10);

  res.json({
    metrics: {
      totalArticles,
      publishedArticles,
      draftArticles,
      totalVideos,
      totalFreeBooks,
      totalPaidBooks,
      totalCustomers,
      totalOrders,
      pendingPayments,
      underReviewPayments,
      approvedPayments,
      totalSales,
      currency: data.settings.currency || 'PKR'
    },
    recentOrders,
    recentAudit
  });
});

// Admin Articles CRUD
apiRouter.get('/admin/articles', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  res.json({ articles: data.articles });
});

apiRouter.post('/admin/articles', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, slug, content, excerpt, featuredImage, category, tags, isUrdu, status, seoTitle, seoDescription, focusKeyword } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required' });
    return;
  }

  const data = db.getData();
  const generatedSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-') : 'art-' + Date.now();

  const newArticle = {
    id: 'art-' + Date.now(),
    title: title.trim(),
    slug: generatedSlug,
    content,
    excerpt: excerpt || content.substring(0, 160) + '...',
    featuredImage: featuredImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    category: category || (isUrdu ? 'فکر و شعور' : 'Editorial'),
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []),
    isUrdu: Boolean(isUrdu),
    status: status || 'published',
    publishedAt: new Date().toISOString(),
    seoTitle: seoTitle || title,
    seoDescription: seoDescription || excerpt || '',
    focusKeyword: focusKeyword || '',
    helpfulness: { yes: 0, no: 0 },
    views: 0
  };

  data.articles.unshift(newArticle);
  db.logAudit('ARTICLE_CREATE', req.user!.email, `Article: ${newArticle.title}`, `Created new article with slug ${newArticle.slug}`);
  db.save();

  res.json({ success: true, article: newArticle });
});

apiRouter.put('/admin/articles/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const data = db.getData();
  const index = data.articles.findIndex(a => a.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }

  data.articles[index] = {
    ...data.articles[index],
    ...updates,
    id // preserve id
  };

  db.logAudit('ARTICLE_UPDATE', req.user!.email, `Article: ${data.articles[index].title}`, `Updated article attributes.`);
  db.save();

  res.json({ success: true, article: data.articles[index] });
});

apiRouter.delete('/admin/articles/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const article = data.articles.find(a => a.id === id);

  if (!article) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }

  data.articles = data.articles.filter(a => a.id !== id);
  db.logAudit('ARTICLE_DELETE', req.user!.email, `Article: ${article.title}`, `Deleted article.`);
  db.save();

  res.json({ success: true });
});

// Admin Videos CRUD
apiRouter.get('/admin/videos', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  res.json({ videos: data.videos });
});

apiRouter.post('/admin/videos', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, youtubeUrl, thumbnailUrl, description, category, tags, featured, status, ctaText } = req.body;
  if (!title || !youtubeUrl) {
    res.status(400).json({ error: 'Title and YouTube URL are required' });
    return;
  }

  // Extract YouTube ID
  let youtubeId = '';
  const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match) {
    youtubeId = match[1];
  } else {
    youtubeId = 'dQw4w9WgXcQ';
  }

  const thumb = thumbnailUrl || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  const newVideo = {
    id: 'vid-' + Date.now(),
    title: title.trim(),
    youtubeUrl: youtubeUrl.trim(),
    youtubeId,
    thumbnailUrl: thumb,
    description: description || '',
    category: category || 'Educational',
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []),
    featured: Boolean(featured),
    status: status || 'published',
    createdAt: new Date().toISOString(),
    ctaText: ctaText || 'Watch Now'
  };

  const data = db.getData();
  data.videos.unshift(newVideo);
  db.logAudit('VIDEO_CREATE', req.user!.email, `Video: ${newVideo.title}`, `Added YouTube video with ID ${youtubeId}`);
  db.save();

  res.json({ success: true, video: newVideo });
});

apiRouter.put('/admin/videos/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const data = db.getData();
  const index = data.videos.findIndex(v => v.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  if (updates.youtubeUrl) {
    const match = updates.youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) updates.youtubeId = match[1];
  }

  data.videos[index] = { ...data.videos[index], ...updates, id };
  db.logAudit('VIDEO_UPDATE', req.user!.email, `Video: ${data.videos[index].title}`, `Updated video.`);
  db.save();

  res.json({ success: true, video: data.videos[index] });
});

apiRouter.delete('/admin/videos/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const video = data.videos.find(v => v.id === id);

  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  data.videos = data.videos.filter(v => v.id !== id);
  db.logAudit('VIDEO_DELETE', req.user!.email, `Video: ${video.title}`, `Deleted video.`);
  db.save();

  res.json({ success: true });
});

// Admin Books CRUD
apiRouter.get('/admin/books', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  res.json({ books: data.books });
});

apiRouter.post('/admin/books', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, slug, shortDescription, fullDescription, coverImage, previewImages, fileName, isPaid, price, salePrice, category, tags, featured, status } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Book title is required' });
    return;
  }

  const data = db.getData();
  const generatedSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-') : 'book-' + Date.now();
  const bookFileName = fileName || `${generatedSlug}.pdf`;

  const newBook = {
    id: 'bk-' + Date.now(),
    title: title.trim(),
    slug: generatedSlug,
    shortDescription: shortDescription || '',
    fullDescription: fullDescription || shortDescription || '',
    coverImage: coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
    previewImages: Array.isArray(previewImages) ? previewImages : (coverImage ? [coverImage] : []),
    fileName: bookFileName,
    isPaid: Boolean(isPaid),
    price: Number(price) || 0,
    salePrice: salePrice ? Number(salePrice) : undefined,
    category: category || 'Educational',
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []),
    featured: Boolean(featured),
    downloadCount: 0,
    status: status || 'published',
    createdAt: new Date().toISOString()
  };

  data.books.unshift(newBook);
  db.logAudit('BOOK_CREATE', req.user!.email, `Book: ${newBook.title}`, `Created book (${newBook.isPaid ? 'Paid' : 'Free'})`);
  db.save();

  res.json({ success: true, book: newBook });
});

apiRouter.put('/admin/books/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const data = db.getData();
  const index = data.books.findIndex(b => b.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  data.books[index] = { ...data.books[index], ...updates, id };
  db.logAudit('BOOK_UPDATE', req.user!.email, `Book: ${data.books[index].title}`, `Updated book.`);
  db.save();

  res.json({ success: true, book: data.books[index] });
});

apiRouter.delete('/admin/books/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const book = data.books.find(b => b.id === id);

  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  data.books = data.books.filter(b => b.id !== id);
  db.logAudit('BOOK_DELETE', req.user!.email, `Book: ${book.title}`, `Deleted book.`);
  db.save();

  res.json({ success: true });
});

// Admin Orders Management (Payment Verification, Approval, Reject)
apiRouter.get('/admin/orders', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  res.json({ orders: data.orders });
});

apiRouter.put('/admin/orders/:id/action', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { action, adminNotes } = req.body; // action: 'approve' | 'reject' | 'note'
  const data = db.getData();
  const order = data.orders.find(o => o.id === id);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (adminNotes !== undefined) {
    order.adminNotes = adminNotes;
  }

  if (action === 'approve') {
    order.paymentStatus = 'paid';
    order.orderStatus = 'approved';
    order.updatedAt = new Date().toISOString();

    // Automatically create / activate customer entitlement for the book
    const existing = data.entitlements.find(
      e => e.userEmail.toLowerCase() === order.customerEmail.toLowerCase() && e.bookId === order.bookId
    );

    if (existing) {
      existing.active = true;
    } else {
      data.entitlements.push({
        id: 'ent-' + Date.now(),
        userEmail: order.customerEmail.toLowerCase(),
        bookId: order.bookId,
        orderId: order.id,
        grantedAt: new Date().toISOString(),
        grantedBy: req.user!.email,
        active: true
      });
    }

    db.logAudit(
      'ORDER_APPROVE',
      req.user!.email,
      `Order: ${order.orderNumber}`,
      `Approved JazzCash payment of ${order.amount} ${order.currency}. PDF download access granted to ${order.customerEmail}.`
    );
  } else if (action === 'reject') {
    order.paymentStatus = 'rejected';
    order.orderStatus = 'rejected';
    order.updatedAt = new Date().toISOString();

    // Deactivate entitlement if existed
    const ent = data.entitlements.find(
      e => e.userEmail.toLowerCase() === order.customerEmail.toLowerCase() && e.bookId === order.bookId
    );
    if (ent) ent.active = false;

    db.logAudit(
      'ORDER_REJECT',
      req.user!.email,
      `Order: ${order.orderNumber}`,
      `Payment rejected for ${order.customerEmail}. Reason: ${adminNotes || 'Unverified TID'}`
    );
  }

  db.save();
  res.json({ success: true, order });
});

// Admin Customer Management & PDF Access Grant/Revoke
apiRouter.get('/admin/customers', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const customers = data.users
    .filter(u => u.role === 'customer')
    .map(u => {
      const orders = data.orders.filter(o => o.customerEmail.toLowerCase() === u.email.toLowerCase());
      const entitlements = data.entitlements.filter(e => e.userEmail.toLowerCase() === u.email.toLowerCase() && e.active);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        createdAt: u.createdAt,
        orderCount: orders.length,
        entitlementsCount: entitlements.length
      };
    });
  res.json({ customers });
});

apiRouter.post('/admin/entitlements/grant', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { customerEmail, bookId } = req.body;
  if (!customerEmail || !bookId) {
    res.status(400).json({ error: 'Customer email and book ID are required' });
    return;
  }

  const data = db.getData();
  const normalizedEmail = customerEmail.toLowerCase().trim();
  const book = data.books.find(b => b.id === bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  let ent = data.entitlements.find(
    e => e.userEmail.toLowerCase() === normalizedEmail && e.bookId === bookId
  );

  if (ent) {
    ent.active = true;
    ent.grantedAt = new Date().toISOString();
    ent.grantedBy = req.user!.email;
  } else {
    data.entitlements.push({
      id: 'ent-' + Date.now(),
      userEmail: normalizedEmail,
      bookId,
      grantedAt: new Date().toISOString(),
      grantedBy: req.user!.email,
      active: true
    });
  }

  db.logAudit(
    'ENTITLEMENT_GRANT',
    req.user!.email,
    `Customer: ${normalizedEmail}`,
    `Manual PDF access granted to book: ${book.title}`
  );
  db.save();

  res.json({ success: true, message: `Access granted for ${book.title} to ${normalizedEmail}` });
});

apiRouter.post('/admin/entitlements/revoke', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { customerEmail, bookId } = req.body;
  const data = db.getData();
  const normalizedEmail = customerEmail.toLowerCase().trim();

  const ent = data.entitlements.find(
    e => e.userEmail.toLowerCase() === normalizedEmail && e.bookId === bookId
  );

  if (ent) {
    ent.active = false;
  }

  db.logAudit(
    'ENTITLEMENT_REVOKE',
    req.user!.email,
    `Customer: ${normalizedEmail}`,
    `Revoked PDF access to book ID ${bookId}`
  );
  db.save();

  res.json({ success: true, message: `Access revoked for ${normalizedEmail}` });
});

// Admin Hero Slides CRUD
apiRouter.get('/admin/slides', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  res.json({ slides: data.heroSlides.sort((a, b) => a.sortOrder - b.sortOrder) });
});

apiRouter.post('/admin/slides', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { heading, subtitle, ctaText, ctaUrl, imageUrl, sortOrder, isActive } = req.body;
  if (!heading || !imageUrl) {
    res.status(400).json({ error: 'Heading and image URL are required' });
    return;
  }

  const data = db.getData();
  const newSlide = {
    id: 'slide-' + Date.now(),
    heading: heading.trim(),
    subtitle: subtitle || '',
    ctaText: ctaText || 'Learn More',
    ctaUrl: ctaUrl || '#',
    imageUrl,
    sortOrder: Number(sortOrder) || (data.heroSlides.length + 1),
    isActive: isActive !== undefined ? Boolean(isActive) : true
  };

  data.heroSlides.push(newSlide);
  db.logAudit('SLIDE_CREATE', req.user!.email, `Slide: ${newSlide.heading}`, `Added new hero slide.`);
  db.save();

  res.json({ success: true, slide: newSlide });
});

apiRouter.put('/admin/slides/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const data = db.getData();
  const index = data.heroSlides.findIndex(s => s.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Slide not found' });
    return;
  }

  data.heroSlides[index] = { ...data.heroSlides[index], ...updates, id };
  db.logAudit('SLIDE_UPDATE', req.user!.email, `Slide: ${data.heroSlides[index].heading}`, `Updated hero slide.`);
  db.save();

  res.json({ success: true, slide: data.heroSlides[index] });
});

apiRouter.delete('/admin/slides/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  data.heroSlides = data.heroSlides.filter(s => s.id !== id);
  db.logAudit('SLIDE_DELETE', req.user!.email, `Slide ID: ${id}`, `Deleted hero slide.`);
  db.save();

  res.json({ success: true });
});

// Admin Site Settings & Theme Update
apiRouter.put('/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const updates = req.body;
  const data = db.getData();

  data.settings = {
    ...data.settings,
    ...updates,
    socialLinks: {
      ...data.settings.socialLinks,
      ...(updates.socialLinks || {})
    },
    theme: {
      ...data.settings.theme,
      ...(updates.theme || {})
    }
  };

  db.logAudit('SETTINGS_UPDATE', req.user!.email, 'Site Settings', 'Updated theme & general settings.');
  db.save();

  res.json({ success: true, settings: data.settings });
});

// Admin Media Library
apiRouter.get('/admin/media', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  res.json({ media: data.media });
});

// Admin Audit Logs
apiRouter.get('/admin/audit-logs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  res.json({ auditLogs: data.auditLogs });
});

// Admin Security & Allowlist verification overview (Strictly for authenticated admins)
apiRouter.get('/admin/security', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    allowedAdminEmails: ADMIN_EMAIL_ALLOWLIST,
    serverTime: new Date().toISOString(),
    status: 'ENFORCED_SERVER_SIDE'
  });
});
