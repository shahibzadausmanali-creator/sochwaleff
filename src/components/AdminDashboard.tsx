import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Video as VideoIcon, 
  BookOpen, 
  ShoppingBag, 
  Users, 
  Sliders, 
  Palette, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  ShieldCheck, 
  LogOut, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Upload, 
  Eye, 
  Search,
  ExternalLink,
  DollarSign,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  SiteSettings, 
  Article, 
  Video, 
  Book, 
  Order, 
  HeroSlide, 
  MediaItem, 
  AuditLog, 
  User 
} from '../types.js';
import { api } from '../services/api.js';
import { calculateSeoScore } from '../utils/seoAnalyzer.js';

interface AdminDashboardProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigatePublic: (view: string, param?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onLogout,
  onNavigatePublic
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityData, setSecurityData] = useState<any>(null);

  // Editor Modal / Form States
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [editingVideo, setEditingVideo] = useState<Partial<Video> | null>(null);
  const [editingBook, setEditingBook] = useState<Partial<Book> | null>(null);
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState<boolean>(false);
  const [mediaPickerCallback, setMediaPickerCallback] = useState<((url: string) => void) | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Order notes / TID modal
  const [orderActionNote, setOrderActionNote] = useState<{ id: string; action: 'approve' | 'reject'; note: string } | null>(null);

  // Manual Grant Modal
  const [grantModal, setGrantModal] = useState<{ customerEmail: string; bookId: string } | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [
        dashRes,
        artRes,
        vidRes,
        bkRes,
        ordRes,
        custRes,
        slRes,
        medRes,
        setRes,
        audRes,
        secRes
      ] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminArticles(),
        api.getAdminVideos(),
        api.getAdminBooks(),
        api.getAdminOrders(),
        api.getAdminCustomers(),
        api.getAdminSlides(),
        api.getAdminMedia(),
        api.getSettings(),
        api.getAdminAuditLogs(),
        api.getAdminSecurity()
      ]);

      setMetrics(dashRes.metrics);
      setArticles(artRes.articles);
      setVideos(vidRes.videos);
      setBooks(bkRes.books);
      setOrders(ordRes.orders);
      setCustomers(custRes.customers);
      setSlides(slRes.slides);
      setMedia(medRes.media);
      setSettings(setRes);
      setAuditLogs(audRes.auditLogs);
      setSecurityData(secRes);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to load CMS data');
    } finally {
      setIsLoading(false);
    }
  };

  // Upload file to media library
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, onComplete?: (url: string) => void) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      const res = await api.uploadMedia(file);
      if (res.success && res.url) {
        showNotification('success', `Uploaded ${file.name}`);
        // refresh media
        const medRes = await api.getAdminMedia();
        setMedia(medRes.media);
        if (onComplete) onComplete(res.url);
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  /* ARTICLE ACTIONS */
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editingArticle.title || !editingArticle.content) {
      showNotification('error', 'Title and content are required');
      return;
    }
    try {
      if (editingArticle.id) {
        await api.updateArticle(editingArticle.id, editingArticle);
        showNotification('success', 'Article updated successfully');
      } else {
        await api.createArticle(editingArticle);
        showNotification('success', 'Article published successfully');
      }
      setEditingArticle(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await api.deleteArticle(id);
      showNotification('success', 'Article removed');
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  /* VIDEO ACTIONS */
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo || !editingVideo.title || !editingVideo.youtubeUrl) {
      showNotification('error', 'Title and YouTube URL are required');
      return;
    }
    try {
      if (editingVideo.id) {
        await api.updateVideo(editingVideo.id, editingVideo);
        showNotification('success', 'Video updated successfully');
      } else {
        await api.createVideo(editingVideo);
        showNotification('success', 'Video added to library');
      }
      setEditingVideo(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      await api.deleteVideo(id);
      showNotification('success', 'Video removed');
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  /* BOOK ACTIONS */
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook || !editingBook.title) {
      showNotification('error', 'Book title is required');
      return;
    }
    try {
      if (editingBook.id) {
        await api.updateBook(editingBook.id, editingBook);
        showNotification('success', 'Book publication updated');
      } else {
        await api.createBook(editingBook);
        showNotification('success', 'Book added to catalog');
      }
      setEditingBook(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Delete this book?')) return;
    try {
      await api.deleteBook(id);
      showNotification('success', 'Book removed');
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  /* ORDER ACTIONS */
  const handleProcessOrderAction = async () => {
    if (!orderActionNote) return;
    try {
      await api.updateOrderStatus(orderActionNote.id, {
        action: orderActionNote.action,
        adminNotes: orderActionNote.note
      });
      showNotification(
        'success',
        orderActionNote.action === 'approve'
          ? 'Payment approved and digital PDF access granted to customer!'
          : 'Order rejected.'
      );
      setOrderActionNote(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  /* ENTITLEMENT ACTIONS */
  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantModal || !grantModal.customerEmail || !grantModal.bookId) return;
    try {
      await api.grantEntitlement(grantModal.customerEmail, grantModal.bookId);
      showNotification('success', `PDF download access granted to ${grantModal.customerEmail}`);
      setGrantModal(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleRevokeAccess = async (customerEmail: string, bookId: string) => {
    if (!confirm(`Revoke access to this book for ${customerEmail}?`)) return;
    try {
      await api.revokeEntitlement(customerEmail, bookId);
      showNotification('success', `Access revoked for ${customerEmail}`);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  /* HERO SLIDE ACTIONS */
  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide || !editingSlide.imageUrl) {
      showNotification('error', 'Slide image URL or file upload is required');
      return;
    }
    const slideToSave = {
      ...editingSlide,
      heading: editingSlide.heading || 'Hero Slide',
      subtitle: '',
      ctaText: 'Explore',
      ctaUrl: editingSlide.ctaUrl || '#articles'
    };
    try {
      if (editingSlide.id) {
        await api.updateSlide(editingSlide.id, slideToSave);
        showNotification('success', 'Slide updated successfully');
      } else {
        await api.createSlide(slideToSave);
        showNotification('success', 'Hero slide uploaded with Explore & Watch Now CTAs');
      }
      setEditingSlide(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Delete slide?')) return;
    try {
      await api.deleteSlide(id);
      showNotification('success', 'Slide deleted');
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  /* SETTINGS SAVE */
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      showNotification('success', 'Settings updated and saved to database');
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const openMediaPicker = (cb: (url: string) => void) => {
    setMediaPickerCallback(() => cb);
    setMediaPickerOpen(true);
  };

  // Live SEO Score calculation for Article Editor
  const currentSeoScore = editingArticle ? calculateSeoScore({
    title: editingArticle.title || '',
    slug: editingArticle.slug || '',
    content: editingArticle.content || '',
    seoTitle: editingArticle.seoTitle,
    seoDescription: editingArticle.seoDescription,
    focusKeyword: editingArticle.focusKeyword,
    featuredImage: editingArticle.featuredImage
  }) : null;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Top Admin Bar (WordPress Dark Style) */}
      <div className="bg-[#111111] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold tracking-wider">
            <span className="w-5 h-5 bg-white text-black rounded-full flex items-center justify-center font-serif text-[10px] font-bold">
              SW
            </span>
            <span>Soch Wale CMS</span>
          </div>
          <button
            onClick={() => onNavigatePublic('home')}
            className="text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Visit Live Website</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-neutral-400 hidden sm:block">
            Signed in as <span className="text-white font-medium">{currentUser?.email}</span> (Admin)
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main CMS Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-[#111111] text-neutral-300 p-4 border-r border-neutral-800 shrink-0">
          <div className="text-[11px] uppercase tracking-widest text-neutral-500 font-semibold px-3 mb-3">
            Administration
          </div>
          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-left ${
                activeTab === 'dashboard' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('articles')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-left ${
                activeTab === 'articles' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Articles & SEO</span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-left ${
                activeTab === 'videos' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <VideoIcon className="w-4 h-4" />
              <span>YouTube Video Library</span>
            </button>

            <button
              onClick={() => setActiveTab('books')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-left ${
                activeTab === 'books' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Books & PDFs</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded transition-colors text-left ${
                activeTab === 'orders' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders & JazzCash</span>
              </div>
              {orders.filter(o => o.paymentStatus === 'under_review').length > 0 && (
                <span className="bg-amber-500 text-black px-1.5 py-0.2 text-[10px] font-bold rounded-full">
                  {orders.filter(o => o.paymentStatus === 'under_review').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-left ${
                activeTab === 'customers' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers & PDF Access</span>
            </button>

            <div className="pt-3 pb-1 text-[11px] uppercase tracking-widest text-neutral-500 font-semibold px-3">
              Design & Layout
            </div>

            <button
              onClick={() => setActiveTab('slider')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-left ${
                activeTab === 'slider' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Hero Slider Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('theme')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-left ${
                activeTab === 'theme' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Theme & Branding</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-left ${
                activeTab === 'settings' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Social & Payment Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-left ${
                activeTab === 'media' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Media Library</span>
            </button>

            <div className="pt-3 pb-1 text-[11px] uppercase tracking-widest text-neutral-500 font-semibold px-3">
              Security & Audit
            </div>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-left ${
                activeTab === 'security' ? 'bg-white text-black font-bold' : 'hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Allowlist & Audit</span>
            </button>
          </nav>
        </aside>

        {/* Content View Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          
          {/* Notification banner */}
          {notification && (
            <div
              className={`mb-6 p-4 text-xs font-semibold flex items-center justify-between border ${
                notification.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{notification.message}</span>
              </div>
              <button onClick={() => setNotification(null)} className="p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && metrics && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold font-editorial text-[#111111]">
                  WordPress Administration Overview
                </h2>
                <p className="text-xs text-[#666666] mt-1">
                  Live operational statistics and digital publishing telemetry for Soch Wale.
                </p>
              </div>

              {/* KPI Cards Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 border border-[#E5E5E5] shadow-sm">
                  <div className="text-[11px] uppercase tracking-wider text-[#666666] font-semibold">Total Articles</div>
                  <div className="text-2xl font-bold text-[#111111] mt-1 tabular-nums">{metrics.totalArticles}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    {metrics.publishedArticles} published · {metrics.draftArticles} draft
                  </div>
                </div>

                <div className="bg-white p-5 border border-[#E5E5E5] shadow-sm">
                  <div className="text-[11px] uppercase tracking-wider text-[#666666] font-semibold">Videos</div>
                  <div className="text-2xl font-bold text-[#111111] mt-1 tabular-nums">{metrics.totalVideos}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">YouTube library</div>
                </div>

                <div className="bg-white p-5 border border-[#E5E5E5] shadow-sm">
                  <div className="text-[11px] uppercase tracking-wider text-[#666666] font-semibold">Digital Books</div>
                  <div className="text-2xl font-bold text-[#111111] mt-1 tabular-nums">{metrics.totalFreeBooks + metrics.totalPaidBooks}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    {metrics.totalFreeBooks} free · {metrics.totalPaidBooks} paid
                  </div>
                </div>

                <div className="bg-white p-5 border border-[#E5E5E5] shadow-sm">
                  <div className="text-[11px] uppercase tracking-wider text-[#666666] font-semibold">Total Customers</div>
                  <div className="text-2xl font-bold text-[#111111] mt-1 tabular-nums">{metrics.totalCustomers}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">Registered readers</div>
                </div>

                <div className="bg-white p-5 border border-[#E5E5E5] shadow-sm">
                  <div className="text-[11px] uppercase tracking-wider text-[#666666] font-semibold">Verified Sales</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                    {metrics.totalSales} {metrics.currency}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">{metrics.approvedPayments} paid orders</div>
                </div>

                <div className="bg-white p-5 border border-amber-300 shadow-sm">
                  <div className="text-[11px] uppercase tracking-wider text-amber-700 font-semibold">Pending / Under Review</div>
                  <div className="text-2xl font-bold text-amber-800 mt-1 tabular-nums">
                    {metrics.underReviewPayments} review · {metrics.pendingPayments} pending
                  </div>
                  <div className="text-[11px] text-amber-600 mt-1">Manual JazzCash verification</div>
                </div>
              </div>

              {/* Recent Orders Section */}
              <div className="bg-white border border-[#E5E5E5] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#111111]">Recent Orders & Submissions</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs font-semibold text-black hover:underline">
                    View All Orders →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F5F5] border-b border-[#E5E5E5] text-[#111111]">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Book</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Payment Status</th>
                        <th className="py-2.5 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5]">
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-black">{o.orderNumber}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-black">{o.customerName}</div>
                            <div className="text-[10px] text-neutral-500">{o.customerEmail}</div>
                          </td>
                          <td className="py-2.5 px-3 max-w-xs truncate">{o.bookTitle}</td>
                          <td className="py-2.5 px-3 font-bold tabular-nums">{o.amount} PKR</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                                o.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : o.paymentStatus === 'under_review'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-neutral-100 text-neutral-800'
                              }`}
                            >
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => {
                                setActiveTab('orders');
                              }}
                              className="text-xs font-semibold text-black hover:underline"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARTICLES & LIVE SEO SCORING */}
          {activeTab === 'articles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-editorial text-[#111111]">Articles & Publishing</h2>
                  <p className="text-xs text-[#666666]">
                    Create, edit, preview, and analyze on-page SEO scores before publishing.
                  </p>
                </div>
                <button
                  onClick={() => setEditingArticle({
                    title: '',
                    slug: '',
                    content: '',
                    excerpt: '',
                    category: 'فکر و شعور',
                    tags: [],
                    isUrdu: true,
                    status: 'published',
                    seoTitle: '',
                    seoDescription: '',
                    focusKeyword: '',
                    featuredImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80'
                  })}
                  className="flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-wider font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Article</span>
                </button>
              </div>

              {/* Article List Table */}
              <div className="bg-white border border-[#E5E5E5] shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F5F5] border-b border-[#E5E5E5] text-[#111111]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Title</th>
                      <th className="py-3 px-4 font-semibold">Language</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Views</th>
                      <th className="py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {articles.map(art => (
                      <tr key={art.id} className="hover:bg-neutral-50/50">
                        <td className="py-3 px-4">
                          <div className={`font-bold text-black ${art.isUrdu ? 'font-urdu text-base' : ''}`}>
                            {art.title}
                          </div>
                          <div className="text-[11px] text-[#666666]">/article/{art.slug}</div>
                        </td>
                        <td className="py-3 px-4">
                          {art.isUrdu ? (
                            <span className="font-semibold text-emerald-700">Urdu (Nastaleeq)</span>
                          ) : (
                            <span className="font-semibold text-blue-700">English</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#666666]">{art.category}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-bold uppercase">
                            {art.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 tabular-nums">{art.views}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingArticle(art)}
                              className="p-1.5 text-neutral-700 hover:text-black border border-neutral-300 hover:border-black rounded"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(art.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 border border-red-200 hover:border-red-600 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: VIDEOS */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-editorial text-[#111111]">YouTube Video Library</h2>
                  <p className="text-xs text-[#666666]">
                    Manage YouTube videos (including unlisted links) and custom thumbnails.
                  </p>
                </div>
                <button
                  onClick={() => setEditingVideo({
                    title: '',
                    youtubeUrl: '',
                    thumbnailUrl: '',
                    description: '',
                    category: 'فکر و رہنمائی',
                    tags: [],
                    featured: false,
                    status: 'published'
                  })}
                  className="flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-wider font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Video</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map(v => (
                  <div key={v.id} className="bg-white border border-[#E5E5E5] p-4 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="aspect-video bg-neutral-900 mb-3 overflow-hidden relative">
                        <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[11px] text-[#666666] font-medium">{v.category}</div>
                      <h4 className="text-sm font-bold text-[#111111] line-clamp-2 mt-1 mb-2">{v.title}</h4>
                      <p className="text-xs text-[#666666] line-clamp-2">{v.description}</p>
                    </div>

                    <div className="pt-4 border-t border-[#F5F5F5] mt-4 flex items-center justify-between">
                      <a href={v.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-red-600 font-semibold hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> YouTube
                      </a>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingVideo(v)} className="p-1 border border-neutral-300 hover:border-black rounded">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteVideo(v.id)} className="p-1 border border-red-200 text-red-600 hover:border-red-600 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BOOKS & PDFS */}
          {activeTab === 'books' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-editorial text-[#111111]">Books & PDF Management</h2>
                  <p className="text-xs text-[#666666]">
                    Configure free and paid digital publications, prices, cover galleries, and files.
                  </p>
                </div>
                <button
                  onClick={() => setEditingBook({
                    title: '',
                    slug: '',
                    shortDescription: '',
                    fullDescription: '',
                    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
                    previewImages: [],
                    fileName: 'book.pdf',
                    isPaid: true,
                    price: 950,
                    salePrice: 750,
                    category: 'تحقیق و فکر',
                    tags: [],
                    featured: true,
                    status: 'published'
                  })}
                  className="flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-wider font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Book</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {books.map(b => (
                  <div key={b.id} className="bg-white border border-[#E5E5E5] p-4 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="aspect-[3/4] bg-[#F5F5F5] p-3 flex items-center justify-center mb-3 border border-[#E5E5E5]">
                        <img src={b.coverImage} alt={b.title} className="w-auto h-full max-h-36 object-contain" />
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-neutral-600">{b.category}</span>
                        <span className={`font-bold ${b.isPaid ? 'text-black' : 'text-emerald-700'}`}>
                          {b.isPaid ? `${b.salePrice || b.price} PKR` : 'FREE'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-black line-clamp-2 mb-1">{b.title}</h4>
                      <div className="text-[11px] text-neutral-500">{b.downloadCount} Downloads</div>
                    </div>

                    <div className="pt-3 border-t border-[#F5F5F5] mt-4 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono text-neutral-400 truncate max-w-[120px]">
                        {b.fileName}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingBook(b)} className="p-1 border border-neutral-300 hover:border-black rounded">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteBook(b.id)} className="p-1 border border-red-200 text-red-600 hover:border-red-600 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ORDERS & JAZZCASH VERIFICATION */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-editorial text-[#111111]">
                  Orders & Manual JazzCash Verification
                </h2>
                <p className="text-xs text-[#666666]">
                  Review customer transaction IDs, inspect payment screenshots, approve payments, and grant instant digital PDF access.
                </p>
              </div>

              <div className="bg-white border border-[#E5E5E5] shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F5F5] border-b border-[#E5E5E5] text-[#111111] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Order #</th>
                      <th className="py-3 px-4 font-semibold">Customer Details</th>
                      <th className="py-3 px-4 font-semibold">Publication</th>
                      <th className="py-3 px-4 font-semibold">Amount</th>
                      <th className="py-3 px-4 font-semibold">Proof / TID</th>
                      <th className="py-3 px-4 font-semibold">Payment Status</th>
                      <th className="py-3 px-4 font-semibold">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-neutral-50/50">
                        <td className="py-3 px-4 font-mono font-bold text-black">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-black">{order.customerName}</div>
                          <div className="text-[#666666]">{order.customerEmail}</div>
                          {order.customerPhone && <div className="text-neutral-500">{order.customerPhone}</div>}
                        </td>
                        <td className="py-3 px-4 font-medium text-black max-w-xs truncate">
                          {order.bookTitle}
                        </td>
                        <td className="py-3 px-4 font-bold tabular-nums">
                          {order.amount} {order.currency}
                        </td>
                        <td className="py-3 px-4">
                          {order.proofUrl ? (
                            <a
                              href={order.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Eye className="w-3 h-3" /> View Screenshot
                            </a>
                          ) : (
                            <span className="text-[11px] text-neutral-400">None</span>
                          )}
                          {order.adminNotes && (
                            <div className="text-[11px] text-neutral-600 italic mt-0.5 max-w-xs truncate">
                              {order.adminNotes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                              order.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.paymentStatus === 'under_review'
                                ? 'bg-amber-100 text-amber-800'
                                : order.paymentStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {order.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => setOrderActionNote({ id: order.id, action: 'approve', note: order.adminNotes || 'JazzCash payment verified manually.' })}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-[11px]"
                              >
                                Approve Payment
                              </button>
                            )}
                            {order.paymentStatus !== 'rejected' && (
                              <button
                                onClick={() => setOrderActionNote({ id: order.id, action: 'reject', note: 'Invalid TID or unverified transfer.' })}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-[11px]"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMERS & PDF ACCESS MANAGEMENT */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-editorial text-[#111111]">
                    Customer Accounts & Protected PDF Access
                  </h2>
                  <p className="text-xs text-[#666666]">
                    Inspect customer accounts, verify order history, and grant or revoke digital PDF download entitlements.
                  </p>
                </div>
                <button
                  onClick={() => setGrantModal({ customerEmail: '', bookId: books[0]?.id || '' })}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-wider font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Grant Manual Access</span>
                </button>
              </div>

              <div className="bg-white border border-[#E5E5E5] shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F5F5] border-b border-[#E5E5E5] text-[#111111] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Customer Name</th>
                      <th className="py-3 px-4 font-semibold">Email</th>
                      <th className="py-3 px-4 font-semibold">Phone</th>
                      <th className="py-3 px-4 font-semibold">Orders Count</th>
                      <th className="py-3 px-4 font-semibold">Active Book Access</th>
                      <th className="py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {customers.map(cust => (
                      <tr key={cust.id} className="hover:bg-neutral-50/50">
                        <td className="py-3 px-4 font-bold text-black">{cust.name}</td>
                        <td className="py-3 px-4 font-mono text-[#111111]">{cust.email}</td>
                        <td className="py-3 px-4 text-neutral-500">{cust.phone || '—'}</td>
                        <td className="py-3 px-4 tabular-nums">{cust.orderCount}</td>
                        <td className="py-3 px-4 tabular-nums font-semibold text-emerald-700">
                          {cust.entitlementsCount} Books
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setGrantModal({ customerEmail: cust.email, bookId: books[0]?.id || '' })}
                            className="text-xs font-semibold text-black hover:underline"
                          >
                            Assign Book Access
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: HERO SLIDER EDITOR */}
          {activeTab === 'slider' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-editorial text-[#111111]">Hero Slider Editor</h2>
                  <p className="text-xs text-[#666666]">
                    Upload 16:9 carousel slides with 3-second cycle animation and Explore &amp; Watch Now CTAs.
                  </p>
                </div>
                <button
                  onClick={() => setEditingSlide({
                    heading: '',
                    subtitle: '',
                    ctaText: 'Explore',
                    ctaUrl: '#articles',
                    imageUrl: '',
                    sortOrder: slides.length + 1,
                    isActive: true
                  })}
                  className="flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-wider font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload New Slide</span>
                </button>
              </div>

              <div className="space-y-4">
                {slides.map(slide => (
                  <div key={slide.id} className="bg-white border border-[#E5E5E5] p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                    <img
                      src={slide.imageUrl}
                      alt="Slide preview"
                      className="w-full md:w-56 aspect-[16/9] object-cover border border-[#E5E5E5] bg-neutral-900"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[#666666] mb-1">
                        <span className="font-mono">Order: #{slide.sortOrder}</span>
                        <span>·</span>
                        <span className={slide.isActive ? 'text-emerald-700 font-semibold' : 'text-neutral-400'}>
                          {slide.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-black flex items-center gap-2">
                        <span>Slide #{slide.sortOrder}</span>
                        <span className="text-xs font-normal text-neutral-500">(16:9 Full Brightness)</span>
                      </div>
                      <div className="text-xs text-neutral-600 mt-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-neutral-100 border text-[11px] font-bold">CTA: Explore</span>
                        <span className="px-2 py-0.5 bg-neutral-100 border text-[11px] font-bold">CTA: Watch Now</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingSlide(slide)} className="p-2 border border-neutral-300 hover:border-black rounded" title="Edit slide">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteSlide(slide.id)} className="p-2 border border-red-200 text-red-600 hover:border-red-600 rounded" title="Delete slide">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: THEME & BRANDING */}
          {activeTab === 'theme' && settings && (
            <div className="bg-white border border-[#E5E5E5] p-6 sm:p-8 max-w-3xl shadow-sm">
              <h2 className="text-xl font-bold font-editorial text-[#111111] mb-2">
                Theme & Layout Customization
              </h2>
              <p className="text-xs text-[#666666] mb-6">
                Adjust brand name, logo, typography, and section visibility.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                      Website Brand Name
                    </label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                      Brand Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Achi Soch Achi Zindagi"
                      value={settings.siteSubtitle || ''}
                      onChange={(e) => setSettings({ ...settings, siteSubtitle: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                      Logo Asset URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.logoUrl}
                        onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => openMediaPicker((url) => setSettings({ ...settings, logoUrl: url }))}
                        className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold border"
                      >
                        Browse
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                    Site Description & Mission
                  </label>
                  <textarea
                    rows={3}
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-[#E5E5E5]">
                  <h4 className="text-xs font-bold uppercase text-black mb-3">Homepage Section Visibility</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.theme.showFeaturedArticles}
                        onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, showFeaturedArticles: e.target.checked } })}
                      />
                      <span>Featured Articles Section</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.theme.showLatestArticles}
                        onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, showLatestArticles: e.target.checked } })}
                      />
                      <span>Latest Articles Section</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.theme.showFeaturedVideos}
                        onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, showFeaturedVideos: e.target.checked } })}
                      />
                      <span>Featured Videos Section</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.theme.showFeaturedBooks}
                        onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, showFeaturedBooks: e.target.checked } })}
                      />
                      <span>Bookstore & PDFs Section</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-widest font-bold"
                  >
                    Save Theme Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 9: SOCIAL & PAYMENT SETTINGS */}
          {activeTab === 'settings' && settings && (
            <div className="bg-white border border-[#E5E5E5] p-6 sm:p-8 max-w-3xl shadow-sm">
              <h2 className="text-xl font-bold font-editorial text-[#111111] mb-2">
                Official Channels & Payment Details
              </h2>
              <p className="text-xs text-[#666666] mb-6">
                Configure your JazzCash merchant/account details and official social URLs.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="p-4 bg-[#F5F5F5] border border-[#E5E5E5] space-y-4">
                  <h4 className="text-xs font-bold uppercase text-black">JazzCash Payment Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                        JazzCash Mobile / Account Number
                      </label>
                      <input
                        type="text"
                        value={settings.jazzcashNumber}
                        onChange={(e) => setSettings({ ...settings, jazzcashNumber: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-[#E5E5E5] bg-white font-mono focus:border-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                        Account Holder / Title
                      </label>
                      <input
                        type="text"
                        value={settings.jazzcashAccountTitle}
                        onChange={(e) => setSettings({ ...settings, jazzcashAccountTitle: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-[#E5E5E5] bg-white focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                      Verification WhatsApp Number (International format)
                    </label>
                    <input
                      type="text"
                      value={settings.whatsappNumber}
                      onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] bg-white font-mono focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-black">Official Social Media Channels</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Instagram URL</label>
                    <input
                      type="url"
                      value={settings.socialLinks.instagram}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, instagram: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Facebook URL</label>
                    <input
                      type="url"
                      value={settings.socialLinks.facebook}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, facebook: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">YouTube URL</label>
                    <input
                      type="url"
                      value={settings.socialLinks.youtube}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, youtube: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">TikTok URL</label>
                    <input
                      type="url"
                      value={settings.socialLinks.tiktok}
                      onChange={(e) => setSettings({
                        ...settings,
                        socialLinks: { ...settings.socialLinks, tiktok: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-widest font-bold"
                  >
                    Save All Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 10: MEDIA LIBRARY */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-editorial text-[#111111]">WordPress Media Library</h2>
                  <p className="text-xs text-[#666666]">
                    Upload and manage featured images, book covers, slides, and logos from your local computer.
                  </p>
                </div>

                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-wider font-semibold transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Choose Image / Upload Local File</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e)}
                  />
                </label>
              </div>

              {isUploading && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  Uploading media asset to server...
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {media.map(item => (
                  <div key={item.id} className="bg-white border border-[#E5E5E5] p-2 flex flex-col justify-between shadow-sm">
                    <div className="aspect-square bg-[#F5F5F5] flex items-center justify-center overflow-hidden mb-2">
                      <img src={item.url} alt={item.originalName} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[10px] text-neutral-600 truncate font-mono">{item.originalName}</div>
                    <div className="text-[9px] text-neutral-400 tabular-nums">{(item.size / 1024).toFixed(1)} KB</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: SECURITY & AUDIT LOGS */}
          {activeTab === 'security' && (
            <div className="space-y-8 max-w-4xl">
              <div>
                <h2 className="text-2xl font-bold font-editorial text-[#111111]">
                  Strict Private Administrator Access
                </h2>
                <p className="text-xs text-[#666666]">
                  Strict server-side email allowlist validation and privileged action audit logging.
                </p>
              </div>

              {/* Allowlist Card */}
              <div className="bg-white border border-[#111111] p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-emerald-800 mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enforced Server-Side Allowlist</span>
                </div>
                <p className="text-xs text-[#666666] mb-4">
                  Only the following two accounts are authorized to hold administrator privileges or access administrative endpoints:
                </p>
                <div className="space-y-2">
                  {securityData?.allowedAdminEmails?.map((em: string) => (
                    <div key={em} className="p-3 bg-[#F5F5F5] border border-[#E5E5E5] font-mono text-xs font-bold text-[#111111] flex items-center justify-between">
                      <span>{em}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 uppercase font-sans">
                        Authorized Administrator
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Log Table */}
              <div className="bg-white border border-[#E5E5E5] p-6 shadow-sm">
                <h3 className="text-base font-bold text-[#111111] mb-4">Privileged Audit Log</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F5F5] border-b border-[#E5E5E5] text-[#111111] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Actor</th>
                        <th className="py-2.5 px-3">Target</th>
                        <th className="py-2.5 px-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5]">
                      {auditLogs.slice(0, 20).map(log => (
                        <tr key={log.id} className="hover:bg-neutral-50/50">
                          <td className="py-2 px-3 text-neutral-500 font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-3 font-bold text-black font-mono text-[11px]">{log.action}</td>
                          <td className="py-2 px-3 text-neutral-700">{log.actorEmail}</td>
                          <td className="py-2 px-3 font-semibold text-black">{log.target}</td>
                          <td className="py-2 px-3 text-neutral-600">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: ARTICLE EDITOR WITH REAL-TIME SEO ANALYZER */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl border border-[#111111] shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5] mb-6">
              <h3 className="text-xl font-bold font-editorial text-black">
                {editingArticle.id ? 'Edit Article & SEO' : 'New Article Publication'}
              </h3>
              <button onClick={() => setEditingArticle(null)} className="p-1 text-neutral-500 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-6">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Article Title</label>
                  <input
                    type="text"
                    required
                    value={editingArticle.title || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none"
                    placeholder="Enter article headline..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={editingArticle.slug || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none font-mono"
                    placeholder="e.g. shaoor-ki-baidari"
                  />
                </div>
              </div>

              {/* Language & Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Language Script</label>
                  <select
                    value={editingArticle.isUrdu ? 'urdu' : 'english'}
                    onChange={(e) => setEditingArticle({ ...editingArticle, isUrdu: e.target.value === 'urdu' })}
                    className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                  >
                    <option value="urdu">Urdu (Jameel Noori Nastaleeq RTL)</option>
                    <option value="english">English (Latin Script LTR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingArticle.category || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Publication Status</label>
                  <select
                    value={editingArticle.status || 'published'}
                    onChange={(e) => setEditingArticle({ ...editingArticle, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              {/* Featured Image with local upload button */}
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Featured Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingArticle.featuredImage || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, featuredImage: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                  />
                  <label className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border text-xs font-semibold cursor-pointer shrink-0">
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (url) => setEditingArticle({ ...editingArticle, featuredImage: url }))}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => openMediaPicker((url) => setEditingArticle({ ...editingArticle, featuredImage: url }))}
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border text-xs font-semibold shrink-0"
                  >
                    Media Library
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Article Body Content</label>
                <textarea
                  rows={8}
                  required
                  value={editingArticle.content || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none ${
                    editingArticle.isUrdu ? 'font-urdu text-right text-lg leading-loose' : ''
                  }`}
                  dir={editingArticle.isUrdu ? 'rtl' : 'ltr'}
                  placeholder="Write article content here..."
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Short Excerpt / Deck</label>
                <textarea
                  rows={2}
                  value={editingArticle.excerpt || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, excerpt: e.target.value })}
                  className={`w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none ${
                    editingArticle.isUrdu ? 'font-urdu text-right' : ''
                  }`}
                  dir={editingArticle.isUrdu ? 'rtl' : 'ltr'}
                />
              </div>

              {/* LIVE SEO SCORE ANALYZER (SECTION 4 OF SPECIFICATION) */}
              <div className="p-5 bg-[#F5F5F5] border border-[#111111] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#111111]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-black">
                      Live Estimated On-Page SEO Score
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono tabular-nums text-black">
                      {currentSeoScore?.score}/100
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        (currentSeoScore?.score || 0) >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : (currentSeoScore?.score || 0) >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {(currentSeoScore?.score || 0) >= 80 ? 'Good' : (currentSeoScore?.score || 0) >= 50 ? 'Needs Work' : 'Poor'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Focus Keyword</label>
                    <input
                      type="text"
                      placeholder="e.g. شعور کی بیداری or critical thinking"
                      value={editingArticle.focusKeyword || ''}
                      onChange={(e) => setEditingArticle({ ...editingArticle, focusKeyword: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-[#E5E5E5] bg-white focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">SEO Title Tag</label>
                    <input
                      type="text"
                      placeholder="Custom title for Google search..."
                      value={editingArticle.seoTitle || ''}
                      onChange={(e) => setEditingArticle({ ...editingArticle, seoTitle: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-[#E5E5E5] bg-white focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Meta Description</label>
                  <textarea
                    rows={2}
                    placeholder="Search snippet summary (aim for 80-160 characters)..."
                    value={editingArticle.seoDescription || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, seoDescription: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-[#E5E5E5] bg-white focus:border-black focus:outline-none"
                  />
                </div>

                {/* SEO Suggestions */}
                {currentSeoScore && currentSeoScore.suggestions.length > 0 && (
                  <div className="pt-2 border-t border-[#E5E5E5]">
                    <div className="text-[11px] font-bold text-neutral-700 uppercase mb-1">SEO Actionable Suggestions:</div>
                    <ul className="space-y-1 text-xs text-neutral-600 list-disc list-inside">
                      {currentSeoScore.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 border text-xs font-semibold hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-widest font-bold"
                >
                  Save & Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIDEO EDITOR */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg border border-[#111111] shadow-2xl p-6 sm:p-8">
            <h3 className="text-xl font-bold font-editorial text-black mb-4">
              {editingVideo.id ? 'Edit Video' : 'Add YouTube Video'}
            </h3>
            <form onSubmit={handleSaveVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Video Title</label>
                <input
                  type="text"
                  required
                  value={editingVideo.title || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">
                  YouTube URL (Supports Unlisted Links)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={editingVideo.youtubeUrl || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, youtubeUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Custom Thumbnail URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingVideo.thumbnailUrl || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, thumbnailUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => openMediaPicker((url) => setEditingVideo({ ...editingVideo, thumbnailUrl: url }))}
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border text-xs font-semibold shrink-0"
                  >
                    Browse
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editingVideo.category || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingVideo.description || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingVideo(null)} className="px-4 py-2 border text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-[#111111] text-white text-xs uppercase tracking-wider font-bold">
                  Save Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BOOK EDITOR */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl border border-[#111111] shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold font-editorial text-black mb-4">
              {editingBook.id ? 'Edit Book Publication' : 'Upload Digital Book / PDF'}
            </h3>
            <form onSubmit={handleSaveBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Book Title</label>
                <input
                  type="text"
                  required
                  value={editingBook.title || ''}
                  onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Free or Paid</label>
                  <select
                    value={editingBook.isPaid ? 'paid' : 'free'}
                    onChange={(e) => setEditingBook({ ...editingBook, isPaid: e.target.value === 'paid' })}
                    className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none font-bold"
                  >
                    <option value="free">Free PDF (Downloadable Immediately)</option>
                    <option value="paid">Paid Book (Requires JazzCash Verification)</option>
                  </select>
                </div>
                {editingBook.isPaid && (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Price (PKR)</label>
                    <input
                      type="number"
                      value={editingBook.price || 0}
                      onChange={(e) => setEditingBook({ ...editingBook, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-black focus:outline-none tabular-nums"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Cover Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingBook.coverImage || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, coverImage: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                  />
                  <label className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border text-xs font-semibold cursor-pointer shrink-0">
                    Upload Cover
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (url) => setEditingBook({ ...editingBook, coverImage: url }))}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={editingBook.shortDescription || ''}
                  onChange={(e) => setEditingBook({ ...editingBook, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Full Description</label>
                <textarea
                  rows={4}
                  value={editingBook.fullDescription || ''}
                  onChange={(e) => setEditingBook({ ...editingBook, fullDescription: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingBook(null)} className="px-4 py-2 border text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-[#111111] text-white text-xs uppercase tracking-wider font-bold">
                  Save Publication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HERO SLIDE EDITOR (Subtitle & Heading removed per user request) */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg border border-[#111111] shadow-2xl p-6 sm:p-8">
            <h3 className="text-xl font-bold font-editorial text-black mb-1">
              {editingSlide.id ? 'Edit Hero Slide' : 'Upload Hero Slide'}
            </h3>
            <p className="text-xs text-[#666666] mb-5">
              Upload slide background image. Headings &amp; subtitles are omitted, keeping only Explore &amp; Watch Now CTAs.
            </p>

            <form onSubmit={handleSaveSlide} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Slide Image (16:9 recommended)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter image URL or upload file..."
                    value={editingSlide.imageUrl || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                  />
                  <label className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border text-xs font-semibold cursor-pointer shrink-0">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (url) => setEditingSlide({ ...editingSlide, imageUrl: url }))}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => openMediaPicker((url) => setEditingSlide({ ...editingSlide, imageUrl: url }))}
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border text-xs font-semibold shrink-0"
                  >
                    Media
                  </button>
                </div>
              </div>

              {editingSlide.imageUrl && (
                <div className="relative aspect-[16/9] w-full bg-neutral-900 border border-[#E5E5E5] overflow-hidden">
                  <img
                    src={editingSlide.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-wider">
                      Explore
                    </span>
                    <span className="px-2.5 py-1 bg-white text-black text-[10px] font-bold uppercase tracking-wider">
                      Watch Now
                    </span>
                  </div>
                </div>
              )}

              {/* CTAs Info */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs space-y-1">
                <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Only CTA Actions Displayed:</span>
                </div>
                <div className="text-neutral-600 text-[11px] pl-5">
                  • <strong>Explore</strong>: Navigates to Articles / Bookstore<br />
                  • <strong>Watch Now</strong>: Navigates to YouTube Video Library
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingSlide.sortOrder || 1}
                    onChange={(e) => setEditingSlide({ ...editingSlide, sortOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-700 mb-1">Status</label>
                  <select
                    value={editingSlide.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingSlide({ ...editingSlide, isActive: e.target.value === 'active' })}
                    className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingSlide(null)} className="px-4 py-2 border text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-[#111111] text-white text-xs uppercase tracking-wider font-bold hover:bg-neutral-800 transition-colors">
                  Save Hero Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ORDER ACTION (APPROVE / REJECT) */}
      {orderActionNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md border border-[#111111] shadow-2xl p-6">
            <h3 className="text-lg font-bold text-black mb-2">
              {orderActionNote.action === 'approve' ? 'Approve JazzCash Payment' : 'Reject Order'}
            </h3>
            <p className="text-xs text-[#666666] mb-4">
              {orderActionNote.action === 'approve'
                ? 'Approving payment will record the verification in audit logs and immediately unlock protected PDF access for the customer.'
                : 'Rejecting this order will inform the customer and revoke any temporary access.'}
            </p>
            <textarea
              rows={3}
              placeholder="Admin verification note (e.g. JazzCash TID #9812 verified)..."
              value={orderActionNote.note}
              onChange={(e) => setOrderActionNote({ ...orderActionNote, note: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E5] mb-4 focus:border-black focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOrderActionNote(null)} className="px-4 py-2 border text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={handleProcessOrderAction}
                className={`px-5 py-2 text-white text-xs font-bold uppercase tracking-wider ${
                  orderActionNote.action === 'approve' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {orderActionNote.action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL GRANT ENTITLEMENT */}
      {grantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md border border-[#111111] shadow-2xl p-6">
            <h3 className="text-lg font-bold text-black mb-3">Grant Protected PDF Access</h3>
            <form onSubmit={handleGrantAccess} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Customer Email</label>
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={grantModal.customerEmail}
                  onChange={(e) => setGrantModal({ ...grantModal, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Select Publication</label>
                <select
                  value={grantModal.bookId}
                  onChange={(e) => setGrantModal({ ...grantModal, bookId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E5E5E5] focus:border-black focus:outline-none"
                >
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.isPaid ? 'Paid' : 'Free'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setGrantModal(null)} className="px-4 py-2 border text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider">
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MEDIA PICKER */}
      {mediaPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-3xl border border-[#111111] shadow-2xl p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="text-base font-bold text-black">Select Image from Media Library</h3>
              <button onClick={() => setMediaPickerOpen(false)} className="p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-1">
              {media.map(m => (
                <div
                  key={m.id}
                  onClick={() => {
                    if (mediaPickerCallback) mediaPickerCallback(m.url);
                    setMediaPickerOpen(false);
                  }}
                  className="cursor-pointer border hover:border-black p-1 bg-neutral-50 group transition-colors"
                >
                  <img src={m.url} alt={m.originalName} className="w-full aspect-square object-cover mb-1" />
                  <div className="text-[10px] text-neutral-600 truncate">{m.originalName}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
