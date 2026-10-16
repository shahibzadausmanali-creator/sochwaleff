import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const ADMIN_EMAIL_ALLOWLIST = [
  'shahibzadausmanali@gmail.com',
  'sochwale.official@gmail.com'
];

export interface SiteSettings {
  siteName: string;
  siteSubtitle?: string;
  siteDescription: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  whatsappNumber: string;
  jazzcashNumber: string;
  jazzcashAccountTitle: string;
  currency: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    youtube: string;
    tiktok: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    heroAutoSlide: boolean;
    heroInterval: number;
    showFeaturedArticles: boolean;
    showLatestArticles: boolean;
    showFeaturedVideos: boolean;
    showLatestVideos: boolean;
    showFeaturedBooks: boolean;
    showLatestBooks: boolean;
    itemsPerPage: number;
    allowPaymentProofUpload: boolean;
    urduFont: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'customer';
  phone?: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  tags: string[];
  isUrdu: boolean;
  status: 'published' | 'draft' | 'scheduled';
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  helpfulness: {
    yes: number;
    no: number;
  };
  views: number;
  authorDisplay?: string; // intentionally empty by default to hide personal names
}

export interface Video {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  description: string;
  category: string;
  tags: string[];
  featured: boolean;
  status: 'published' | 'draft';
  createdAt: string;
  ctaText?: string;
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  previewImages: string[];
  filePath?: string; // private path on server
  fileName: string;
  isPaid: boolean;
  price: number;
  salePrice?: number;
  category: string;
  tags: string[];
  featured: boolean;
  downloadCount: number;
  status: 'published' | 'draft';
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  bookId: string;
  bookTitle: string;
  amount: number;
  currency: string;
  createdAt: string;
  orderStatus: 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
  paymentStatus: 'pending' | 'under_review' | 'paid' | 'rejected';
  paymentMethod: string;
  proofUrl?: string;
  adminNotes?: string;
  updatedAt: string;
}

export interface CustomerEntitlement {
  id: string;
  userEmail: string;
  bookId: string;
  orderId?: string;
  grantedAt: string;
  grantedBy: string;
  active: boolean;
}

export interface HeroSlide {
  id: string;
  heading: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MediaItem {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorEmail: string;
  target: string;
  timestamp: string;
  details: string;
}

export interface DatabaseSchema {
  settings: SiteSettings;
  users: User[];
  articles: Article[];
  videos: Video[];
  books: Book[];
  orders: Order[];
  entitlements: CustomerEntitlement[];
  heroSlides: HeroSlide[];
  media: MediaItem[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
export const UPLOAD_DIR_PUBLIC = path.join(DATA_DIR, 'uploads', 'public');
export const UPLOAD_DIR_PROTECTED = path.join(DATA_DIR, 'uploads', 'protected');
export const UPLOAD_DIR_FREE = path.join(DATA_DIR, 'uploads', 'free');

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR_PUBLIC)) fs.mkdirSync(UPLOAD_DIR_PUBLIC, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR_PROTECTED)) fs.mkdirSync(UPLOAD_DIR_PROTECTED, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR_FREE)) fs.mkdirSync(UPLOAD_DIR_FREE, { recursive: true });
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_sochwale_secure_salt_2026').digest('hex');
}

function getDefaultDatabase(): DatabaseSchema {
  const adminPasswordHash = hashPassword('SochWaleAdmin2026!');
  const customerPasswordHash = hashPassword('reader123');

  return {
    settings: {
      siteName: 'Soch Wale',
      siteSubtitle: 'Achi Soch Achi Zindagi',
      siteDescription: 'Educational and digital publishing platform dedicated to thought leadership, critical awareness, and digital resources.',
      logoUrl: '/logo.svg',
      faviconUrl: '/favicon.svg',
      contactEmail: 'contact@sochwale.com',
      whatsappNumber: '+923032226181',
      jazzcashNumber: '03032226181',
      jazzcashAccountTitle: 'Usman Ali',
      currency: 'PKR',
      defaultSeoTitle: 'Soch Wale — Digital Publishing Platform & Bookstore',
      defaultSeoDescription: 'Read high-impact Urdu and English articles, watch educational videos, and download free and paid educational books with manual JazzCash payment verification.',
      socialLinks: {
        instagram: 'https://www.instagram.com/sochwale.official/',
        facebook: 'https://www.facebook.com/profile.php?id=61594587364213',
        youtube: 'https://www.youtube.com/@SochWale',
        tiktok: 'https://www.tiktok.com/@sochwale'
      },
      theme: {
        primaryColor: '#FFFFFF',
        secondaryColor: '#111111',
        heroAutoSlide: true,
        heroInterval: 3000,
        showFeaturedArticles: true,
        showLatestArticles: true,
        showFeaturedVideos: true,
        showLatestVideos: true,
        showFeaturedBooks: true,
        showLatestBooks: true,
        itemsPerPage: 12,
        allowPaymentProofUpload: true,
        urduFont: 'Jameel Noori Nastaleeq'
      }
    },
    users: [
      {
        id: 'usr-admin-1',
        email: 'shahibzadausmanali@gmail.com',
        name: 'Administrator',
        passwordHash: adminPasswordHash,
        role: 'admin',
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'usr-admin-2',
        email: 'sochwale.official@gmail.com',
        name: 'Soch Wale Official',
        passwordHash: adminPasswordHash,
        role: 'admin',
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 'usr-cust-1',
        email: 'reader@example.com',
        name: 'Tariq Mehmood',
        passwordHash: customerPasswordHash,
        role: 'customer',
        phone: '03001234567',
        createdAt: '2026-02-15T10:00:00.000Z'
      }
    ],
    articles: [
      {
        id: 'art-urdu-1',
        title: 'شعور کی بیداری اور جدید فکری تحریک کا آغاز',
        slug: 'shaoor-ki-baidari-fikri-tehreek',
        content: `انسانی تاریخ گواہ ہے کہ جب بھی کسی معاشرے میں فکری جمود طاری ہوا، وہاں تبدیلی کا آغاز شعور کی بیداری سے ہی ممکن ہوا۔ سوچ والے پلیٹ فارم کا بنیادی مقصد ہر فرد میں تنقیدی سوچ، علم کی جستجو اور خود شناسی کا جذبہ پیدا کرنا ہے۔

جب تک ہم اپنے روایتی تعصبات سے بالاتر ہو کر حقائق کی روشنی میں سوچنے کا سلیقہ نہیں سیکھتے، ہم وقت کی رفتار کے ساتھ قدم نہیں ملا سکتے۔ علم محض معلومات کا ذخیرہ نہیں بلکہ بصیرت کا وہ چراغ ہے جو اندھیروں میں راستے واضح کرتا ہے۔

ہمیں اپنی نسل نو کو سوال پوچھنے کی آزادی دینی ہوگی۔ سوال ہی وہ کنجی ہے جو علم کے بند دروازے کھولتی ہے اور فکر کو جلا بخشتی ہے۔ سوچ والے کا عزم ہے کہ وہ ہر طالب علم، استاد اور عام قاری تک وہ معیاری مواد پہنچائے جو اس کے ذہن کو وسعت اور عمل کو جہت دے۔`,
        excerpt: 'معاشرتی تبدیلی کا بنیادی ستون شعور کی بیداری اور سوال پوچھنے کا ہنر ہے۔ سوچ والے فکری رہنمائی کا سفر۔',
        featuredImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
        category: 'فکر و شعور',
        tags: ['شعور', 'فلسفہ', 'تعلیم', 'فکری انقلاب'],
        isUrdu: true,
        status: 'published',
        publishedAt: '2026-10-12T08:30:00.000Z',
        seoTitle: 'شعور کی بیداری اور جدید فکری تحریک | سوچ والے',
        seoDescription: 'انسانی تاریخ میں شعور کی بیداری اور تنقیدی سوچ کی اہمیت پر ایک بصیرت افروز تجزیہ۔ سوچ والے کے ساتھ فکر کا سفر۔',
        focusKeyword: 'شعور کی بیداری',
        helpfulness: { yes: 48, no: 2 },
        views: 420
      },
      {
        id: 'art-urdu-2',
        title: 'مطالعہ کتب کی عادت اور ذہن سازی کے بنیادی اصول',
        slug: 'motalea-kutub-ki-aadat-zehan-sazi',
        content: `کتابیں انسان کی بہترین دوست ہیں، لیکن جدید ڈیجیٹل دور میں سکرین کی کشش نے گہرے مطالعے کی روایت کو ماند کر دیا ہے۔ مطالعہ صرف وقت گزاری کا ذریعہ نہیں بلکہ شخصیت کی تعمیر اور ذہنی تربیت کا نام ہے۔

ایک اچھی کتاب پڑھنا ایک عظیم مفکر کے ساتھ گھنٹوں گفتگو کرنے کے برابر ہے۔ جب آپ ورق پلٹتے ہیں تو درحقیقت آپ ایک نئے جہاں کی سیر کر رہے ہوتے ہیں۔

اگر آپ مطالعہ کی عادت اپنانا چاہتے ہیں تو روزانہ صرف بیس منٹ سے آغاز کریں۔ کسی دلچسپ موضوع کا انتخاب کریں اور مسلسل مطالعہ جاری رکھیں۔ جلد ہی آپ محسوس کریں گے کہ آپ کے خیالات میں گہرائی اور زبان میں اثر پذیری پیدا ہو رہی ہے۔`,
        excerpt: 'ڈیجیٹل دور میں کتب بینی کی اہمیت اور روزمرہ زندگی میں گہرے مطالعے کی عادت ڈالنے کے عملی طریقے اور اثرات۔',
        featuredImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
        category: 'کتب و مطالعہ',
        tags: ['کتب بینی', 'مطالعہ', 'شخصیت', 'تعلیم'],
        isUrdu: true,
        status: 'published',
        publishedAt: '2026-10-10T11:15:00.000Z',
        seoTitle: 'مطالعہ کتب کی عادت اور ذہن سازی | سوچ والے',
        seoDescription: 'روزمرہ زندگی میں مطالعہ کتب کی پختہ عادت بنانے کے عملی رہنما اصول اور ذہنی نشوونما پر ان کے مثبت اثرات۔',
        focusKeyword: 'مطالعہ کتب',
        helpfulness: { yes: 35, no: 1 },
        views: 290
      },
      {
        id: 'art-eng-1',
        title: 'The Architecture of Critical Thinking in the Digital Age',
        slug: 'architecture-of-critical-thinking-digital-age',
        content: `In an era defined by hyper-information and algorithmic curation, the capacity for rigorous independent thought is becoming humanity's rarest cognitive commodity. We are bombarded with conclusions before we have evaluated premises.

True critical thinking requires deliberate friction. It demands that we pause between stimulus and reaction, questioning not merely the source of data, but the psychological predispositions that make us eager to accept or dismiss it.

At Soch Wale, our publishing philosophy rests upon three pillars: epistemic humility, structured inquiry, and ethical discourse. When we examine issues through multi-dimensional lenses rather than polarizing binaries, clarity naturally emerges.`,
        excerpt: 'How to cultivate disciplined reasoning, epistemic humility, and intellectual clarity amidst information overload.',
        featuredImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        category: 'Philosophy & Logic',
        tags: ['Critical Thinking', 'Education', 'Digital Culture'],
        isUrdu: false,
        status: 'published',
        publishedAt: '2026-10-08T09:00:00.000Z',
        seoTitle: 'The Architecture of Critical Thinking in the Digital Age | Soch Wale',
        seoDescription: 'Explore the foundations of critical thinking and how intellectual discipline combats algorithmic echo chambers in contemporary publishing.',
        focusKeyword: 'critical thinking',
        helpfulness: { yes: 62, no: 3 },
        views: 512
      },
      {
        id: 'art-eng-2',
        title: 'Self-Education: The Ultimate Superpower of the 21st Century',
        slug: 'self-education-ultimate-superpower',
        content: `Formal education awards degrees, but self-education generates mastery. The democratization of global knowledge networks means that anyone with curiosity, internet access, and cognitive stamina can master any discipline.

Yet, most learners falter not from a scarcity of resources, but from an absence of meta-learning systems. To build effective self-directed learning habits:
1. Define clear learning objectives with measurable milestones.
2. Synthesize concepts by teaching or writing about them.
3. Apply active recall and spaced repetition.
4. Surround your thinking with primary source material rather than third-party summaries.`,
        excerpt: 'Why autodidactic mastery is surpassing conventional schooling and the frameworks to accelerate your personal learning curve.',
        featuredImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
        category: 'Learning & Mastery',
        tags: ['Self Learning', 'Productivity', 'Books'],
        isUrdu: false,
        status: 'published',
        publishedAt: '2026-10-05T14:20:00.000Z',
        seoTitle: 'Self-Education: The Ultimate Superpower | Soch Wale',
        seoDescription: 'A comprehensive guide to autodidactic learning, cognitive frameworks, and self-mastery in modern digital society.',
        focusKeyword: 'self education',
        helpfulness: { yes: 41, no: 0 },
        views: 388
      }
    ],
    videos: [
      {
        id: 'vid-1',
        title: 'تنقیدی سوچ کیسے پیدا کی جائے؟ — مکمل فکری رہنمائی',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        thumbnailUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=80',
        description: 'اس خصوصی لیکچر میں ہم روزمرہ زندگی میں حقائق کو جانچنے اور جذباتی فیصلوں کے بجائے منطقی تجزیہ کرنے کی تکنیکوں پر گفتگو کریں گے۔',
        category: 'فکر و رہنمائی',
        tags: ['تنقیدی سوچ', 'لیکچر', 'سوچ والے'],
        featured: true,
        status: 'published',
        createdAt: '2026-10-11T12:00:00.000Z',
        ctaText: 'یوٹیوب پر دیکھیں'
      },
      {
        id: 'vid-2',
        title: 'کتابوں کے انتخاب کا درست طریقہ اور موثر مطالعہ',
        youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
        youtubeId: 'ysz5S6PUM-U',
        thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
        description: 'کون سی کتابیں آپ کی زندگی بدل سکتی ہیں؟ اور مطالعہ کرتے ہوئے اہم نوٹس کیسے بنائیں؟ تفصیلات اس ویڈیو میں۔',
        category: 'کتب بینی',
        tags: ['کتب', 'مطالعہ', 'تعلیم'],
        featured: true,
        status: 'published',
        createdAt: '2026-10-09T15:30:00.000Z',
        ctaText: 'ابھی دیکھیں'
      },
      {
        id: 'vid-3',
        title: 'Mastering the Art of Deep Focus and Intellectual Clarity',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        youtubeId: 'jNQXAC9IVRw',
        thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
        description: 'How modern thinkers cultivate uninterrupted focus amidst pervasive digital interruptions and attention fragmentation.',
        category: 'Focus & Productivity',
        tags: ['Productivity', 'Focus', 'Mindset'],
        featured: false,
        status: 'published',
        createdAt: '2026-10-07T10:00:00.000Z',
        ctaText: 'Watch Session'
      },
      {
        id: 'vid-4',
        title: 'تاریخ کے اہم فکری موڑ: ارسطو سے دور حاضر تک',
        youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        youtubeId: 'kJQP7kiw5Fk',
        thumbnailUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80',
        description: 'فلسفے کے اہم مکاتب فکر اور انسانی تمدن پر ان کے گہرے اثرات کا جامع تعارف۔ سوچ والے خصوصی سیریز۔',
        category: 'تاریخ و فلسفہ',
        tags: ['فلسفہ', 'تاریخ', 'فکر'],
        featured: false,
        status: 'published',
        createdAt: '2026-10-04T16:00:00.000Z',
        ctaText: 'مکمل قسط دیکھیں'
      }
    ],
    books: [
      {
        id: 'bk-free-1',
        title: 'شعور کا سفر — ابتدائی فکری رہنما کتابچہ',
        slug: 'shaoor-ka-safar-guide',
        shortDescription: 'نوجوانوں اور طالب علموں کے لیے تنقیدی شعور اور خود آگاہی کا بنیادی رہنما کتابچہ (مفت پی ڈی ایف)۔',
        fullDescription: 'یہ کتابچہ ان تمام افراد کے لیے مرتب کیا گیا ہے جو فکری جمود سے نکل کر آزادانہ سوچ کا آغاز کرنا چاہتے ہیں۔ اس میں عام فہم زبان اور روزمرہ مثالوں کے ساتھ منطقی مغالطوں اور ان سے بچنے کی عملی تراکیب بیان کی گئی ہیں۔ آپ اسے بلا معاوضہ ڈاؤن لوڈ کر کے اپنے حلقہ احباب میں بھی شیئر کر سکتے ہیں۔',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
        previewImages: [
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'
        ],
        fileName: 'shaoor-ka-safar-guide.pdf',
        isPaid: false,
        price: 0,
        category: 'فکر و تربیت',
        tags: ['مفت پی ڈی ایف', 'شعور', 'تربیت'],
        featured: true,
        downloadCount: 1420,
        status: 'published',
        createdAt: '2026-09-20T10:00:00.000Z'
      },
      {
        id: 'bk-free-2',
        title: 'The Art of Intellectual Discipline — Primer',
        slug: 'art-of-intellectual-discipline-primer',
        shortDescription: 'A concise handbook outlining core mental models for rigorous inquiry and bias reduction (Free PDF).',
        fullDescription: 'Synthesizing foundational insights from epistemic theory and behavioral psychology, this primer guides students and researchers toward disciplined cognitive habits. Downloadable at zero cost.',
        coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
        previewImages: [
          'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80'
        ],
        fileName: 'intellectual-discipline-primer.pdf',
        isPaid: false,
        price: 0,
        category: 'Education & Logic',
        tags: ['Free Download', 'Handbook', 'Logic'],
        featured: true,
        downloadCount: 980,
        status: 'published',
        createdAt: '2026-09-25T11:00:00.000Z'
      },
      {
        id: 'bk-paid-1',
        title: 'جہانِ فکر و عمل — جدید فکری انقلاب کی جامع دستاویز',
        slug: 'jahan-e-fikr-o-amal-comprehensive',
        shortDescription: 'سوچ والے کی خصوصی تحقیقی تصنیف۔ عصری چیلنجز اور نظریاتی رہنمائی پر مشتمل تفصیلی کتاب۔',
        fullDescription: 'سوچ والے اکیڈمک ریسرچ ونگ کی سالہا سال کی محنت کا ثمر۔ اس تفصیلی کتاب میں مشرقی و مغربی فکر کے تقابلی جائزے کے ساتھ ساتھ معاصر مسلم دنیا میں تعلیمی و سماجی بحرانوں کے حل پیش کیے گئے ہیں۔ خریدنے کے بعد جاز کیش کی تصدیق پر کسٹمر ڈیش بورڈ میں مکمل پی ڈی ایف فوری مہیا کی جاتی ہے۔',
        coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
        previewImages: [
          'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80'
        ],
        fileName: 'jahan-e-fikr-o-amal.pdf',
        isPaid: true,
        price: 950,
        salePrice: 750,
        category: 'تحقیق و فکر',
        tags: ['پریمیم کتاب', 'تحقیق', 'فکر و عمل'],
        featured: true,
        downloadCount: 310,
        status: 'published',
        createdAt: '2026-10-01T14:00:00.000Z'
      },
      {
        id: 'bk-paid-2',
        title: 'Mastering Mindset: Psychological Resilience & Purpose',
        slug: 'mastering-mindset-resilience-purpose',
        shortDescription: 'In-depth manual on cognitive clarity, emotional endurance, and purposeful personal leadership.',
        fullDescription: 'This comprehensive digital volume provides structured exercises, behavioral blueprints, and reflective frameworks for ambitious professionals seeking unshakable clarity under pressure. Secure download provided immediately upon JazzCash manual order verification.',
        coverImage: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=800&q=80',
        previewImages: [
          'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=800&q=80'
        ],
        fileName: 'mastering-mindset.pdf',
        isPaid: true,
        price: 1200,
        salePrice: 900,
        category: 'Personal Leadership',
        tags: ['Premium Book', 'Psychology', 'Leadership'],
        featured: true,
        downloadCount: 185,
        status: 'published',
        createdAt: '2026-10-03T16:00:00.000Z'
      }
    ],
    orders: [
      {
        id: 'ord-1001',
        orderNumber: 'SW-2026-1001',
        customerName: 'Tariq Mehmood',
        customerEmail: 'reader@example.com',
        customerPhone: '03001234567',
        bookId: 'bk-paid-1',
        bookTitle: 'جہانِ فکر و عمل — جدید فکری انقلاب کی جامع دستاویز',
        amount: 750,
        currency: 'PKR',
        createdAt: '2026-10-14T09:30:00.000Z',
        orderStatus: 'approved',
        paymentStatus: 'paid',
        paymentMethod: 'JazzCash',
        proofUrl: '',
        adminNotes: 'JazzCash payment TID #894523 confirmed manually.',
        updatedAt: '2026-10-14T10:15:00.000Z'
      },
      {
        id: 'ord-1002',
        orderNumber: 'SW-2026-1002',
        customerName: 'Hamza Khan',
        customerEmail: 'hamza.k@gmail.com',
        customerPhone: '03219876543',
        bookId: 'bk-paid-2',
        bookTitle: 'Mastering Mindset: Psychological Resilience & Purpose',
        amount: 900,
        currency: 'PKR',
        createdAt: '2026-10-15T18:45:00.000Z',
        orderStatus: 'under_review',
        paymentStatus: 'under_review',
        paymentMethod: 'JazzCash',
        proofUrl: '',
        adminNotes: 'Customer sent TID on WhatsApp, awaiting verification.',
        updatedAt: '2026-10-15T19:00:00.000Z'
      }
    ],
    entitlements: [
      {
        id: 'ent-1',
        userEmail: 'reader@example.com',
        bookId: 'bk-paid-1',
        orderId: 'ord-1001',
        grantedAt: '2026-10-14T10:15:00.000Z',
        grantedBy: 'shahibzadausmanali@gmail.com',
        active: true
      }
    ],
    heroSlides: [
      {
        id: 'slide-1',
        heading: 'فکر کی آزادی اور شعور کی نئی راہیں',
        subtitle: 'سوچ والے کے ساتھ جدید علمی مباحث، تنقیدی مضامین اور فکری کتابوں کی دنیا میں قدم رکھیں۔',
        ctaText: 'تازہ مضامین پڑھیں',
        ctaUrl: '#articles',
        imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1600&q=80',
        sortOrder: 1,
        isActive: true
      },
      {
        id: 'slide-2',
        heading: 'معیاری کتب اور ڈیجیٹل کتب خانہ',
        subtitle: 'مفت اور پریمیم پی ڈی ایف کتابیں، باآسانی جاز کیش ادائیگی اور محفوظ ذاتی لائبریری۔',
        ctaText: 'کتب خانہ دیکھیں',
        ctaUrl: '#books',
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=80',
        sortOrder: 2,
        isActive: true
      },
      {
        id: 'slide-3',
        heading: 'Rigorous Thinking. Timeless Wisdom.',
        subtitle: 'Educational video lectures, intellectual essays, and curated research publications.',
        ctaText: 'Explore Media',
        ctaUrl: '#videos',
        imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80',
        sortOrder: 3,
        isActive: true
      }
    ],
    media: [
      {
        id: 'med-1',
        fileName: 'brand-logo.svg',
        originalName: 'soch-wale-monogram.svg',
        mimeType: 'image/svg+xml',
        size: 1420,
        url: '/logo.svg',
        uploadedAt: '2026-10-01T00:00:00.000Z'
      }
    ],
    auditLogs: [
      {
        id: 'aud-1',
        action: 'SYSTEM_INIT',
        actorEmail: 'system',
        target: 'System',
        timestamp: '2026-10-01T00:00:00.000Z',
        details: 'Soch Wale CMS initialized with strict admin allowlist and core tables.'
      },
      {
        id: 'aud-2',
        action: 'ORDER_APPROVED',
        actorEmail: 'shahibzadausmanali@gmail.com',
        target: 'Order #SW-2026-1001',
        timestamp: '2026-10-14T10:15:00.000Z',
        details: 'Payment verified manually via JazzCash and customer entitlement granted.'
      }
    ]
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    ensureDirectories();
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading database file, using defaults', e);
    }
    const defaults = getDefaultDatabase();
    this.save(defaults);
    return defaults;
  }

  public save(newData?: DatabaseSchema): void {
    if (newData) {
      this.data = newData;
    }
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (e) {
      console.error('Failed to write database file', e);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public logAudit(action: string, actorEmail: string, target: string, details: string) {
    const log: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      action,
      actorEmail,
      target,
      timestamp: new Date().toISOString(),
      details
    };
    this.data.auditLogs.unshift(log);
    // keep last 500 logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
  }
}

export const db = new Database();
