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
  name: string;
  email: string;
  role: 'admin' | 'customer';
  phone?: string;
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

export interface SeoAnalysisResult {
  score: number;
  checks: {
    titleLength: boolean;
    hasMetaDescription: boolean;
    metaDescriptionLength: boolean;
    hasKeyword: boolean;
    keywordInTitle: boolean;
    keywordInDescription: boolean;
    slugClean: boolean;
    contentLength: boolean;
    hasImage: boolean;
    hasHeadings: boolean;
  };
  passedCount: number;
  totalChecks: number;
  suggestions: string[];
}
