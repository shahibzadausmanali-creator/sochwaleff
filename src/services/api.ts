import { SiteSettings, Article, Video, Book, Order, HeroSlide, MediaItem, AuditLog, User } from '../types.js';

const TOKEN_KEY = 'sw_auth_token';
const USER_KEY = 'sw_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await res.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Public
  getSettings: () => request<SiteSettings>('/api/settings'),
  getSlides: () => request<HeroSlide[]>('/api/slides'),
  getArticles: (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return request<{ articles: Article[]; total: number; page: number; totalPages: number }>(`/api/articles?${query}`);
  },
  getArticle: (slug: string) => request<{ article: Article; related: Article[] }>(`/api/articles/${slug}`),
  submitArticleFeedback: (slug: string, helpful: boolean) => 
    request<{ success: boolean; helpfulness: { yes: number; no: number } }>(`/api/articles/${slug}/helpfulness`, {
      method: 'POST',
      body: JSON.stringify({ helpful })
    }),
  getVideos: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    return request<{ videos: Video[] }>(`/api/videos?${query}`);
  },
  getVideo: (id: string) => request<{ video: Video; related: Video[] }>(`/api/videos/${id}`),
  getBooks: (params?: { filter?: string; category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.filter) query.set('filter', params.filter);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    return request<{ books: Book[] }>(`/api/books?${query}`);
  },
  getBook: (slug: string) => request<{ book: Book; related: Book[] }>(`/api/books/${slug}`),

  // Orders
  createOrder: (payload: { customerName: string; customerEmail: string; customerPhone?: string; bookId: string }) =>
    request<{ success: boolean; order: Order; jazzcashDetails: any; whatsappUrl: string }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  submitPaymentDone: (orderNumber: string, payload: { proofUrl?: string; transactionId?: string; notes?: string }) =>
    request<{ success: boolean; message: string; order: Order; whatsappUrl: string }>(`/api/orders/${orderNumber}/payment-done`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  lookupOrder: (orderNumber: string, email: string) =>
    request<{ order: Order }>(`/api/orders/lookup?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`),
  uploadPaymentProof: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ success: boolean; url: string }>('/api/upload/proof', {
      method: 'POST',
      body: formData
    });
  },

  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  register: (payload: { name: string; email: string; password: string; phone?: string }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  getMe: () => request<{ user: User }>('/api/auth/me'),

  // Customer
  getCustomerOrders: () => request<{ orders: Order[] }>('/api/customer/orders'),
  getCustomerEntitlements: () => request<{ books: Book[]; entitlements: any[] }>('/api/customer/entitlements'),

  // Admin
  getAdminDashboard: () => request<any>('/api/admin/dashboard'),
  getAdminArticles: () => request<{ articles: Article[] }>('/api/admin/articles'),
  createArticle: (article: Partial<Article>) => request<{ success: boolean; article: Article }>('/api/admin/articles', {
    method: 'POST',
    body: JSON.stringify(article)
  }),
  updateArticle: (id: string, updates: Partial<Article>) => request<{ success: boolean; article: Article }>(`/api/admin/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  deleteArticle: (id: string) => request<{ success: boolean }>(`/api/admin/articles/${id}`, { method: 'DELETE' }),

  getAdminVideos: () => request<{ videos: Video[] }>('/api/admin/videos'),
  createVideo: (video: Partial<Video>) => request<{ success: boolean; video: Video }>('/api/admin/videos', {
    method: 'POST',
    body: JSON.stringify(video)
  }),
  updateVideo: (id: string, updates: Partial<Video>) => request<{ success: boolean; video: Video }>(`/api/admin/videos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  deleteVideo: (id: string) => request<{ success: boolean }>(`/api/admin/videos/${id}`, { method: 'DELETE' }),

  getAdminBooks: () => request<{ books: Book[] }>('/api/admin/books'),
  createBook: (book: Partial<Book>) => request<{ success: boolean; book: Book }>('/api/admin/books', {
    method: 'POST',
    body: JSON.stringify(book)
  }),
  updateBook: (id: string, updates: Partial<Book>) => request<{ success: boolean; book: Book }>(`/api/admin/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  deleteBook: (id: string) => request<{ success: boolean }>(`/api/admin/books/${id}`, { method: 'DELETE' }),

  getAdminOrders: () => request<{ orders: Order[] }>('/api/admin/orders'),
  updateOrderStatus: (id: string, payload: { action: 'approve' | 'reject' | 'note'; adminNotes?: string }) =>
    request<{ success: boolean; order: Order }>(`/api/admin/orders/${id}/action`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  getAdminCustomers: () => request<{ customers: any[] }>('/api/admin/customers'),
  grantEntitlement: (customerEmail: string, bookId: string) =>
    request<{ success: boolean; message: string }>('/api/admin/entitlements/grant', {
      method: 'POST',
      body: JSON.stringify({ customerEmail, bookId })
    }),
  revokeEntitlement: (customerEmail: string, bookId: string) =>
    request<{ success: boolean; message: string }>('/api/admin/entitlements/revoke', {
      method: 'POST',
      body: JSON.stringify({ customerEmail, bookId })
    }),

  getAdminSlides: () => request<{ slides: HeroSlide[] }>('/api/admin/slides'),
  createSlide: (slide: Partial<HeroSlide>) => request<{ success: boolean; slide: HeroSlide }>('/api/admin/slides', {
    method: 'POST',
    body: JSON.stringify(slide)
  }),
  updateSlide: (id: string, updates: Partial<HeroSlide>) => request<{ success: boolean; slide: HeroSlide }>(`/api/admin/slides/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  deleteSlide: (id: string) => request<{ success: boolean }>(`/api/admin/slides/${id}`, { method: 'DELETE' }),

  updateSettings: (settings: Partial<SiteSettings>) => request<{ success: boolean; settings: SiteSettings }>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  }),

  getAdminMedia: () => request<{ media: MediaItem[] }>('/api/admin/media'),
  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ success: boolean; media: MediaItem; url: string }>('/api/admin/media/upload', {
      method: 'POST',
      body: formData
    });
  },

  getAdminAuditLogs: () => request<{ auditLogs: AuditLog[] }>('/api/admin/audit-logs'),
  getAdminSecurity: () => request<{ allowedAdminEmails: string[]; serverTime: string; status: string }>('/api/admin/security')
};
