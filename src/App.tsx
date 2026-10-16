import React, { useState, useEffect } from 'react';
import { 
  SiteSettings, 
  Article, 
  Video, 
  Book, 
  HeroSlide, 
  User, 
  Order 
} from './types.js';
import { api, getStoredUser, clearStoredAuth } from './services/api.js';

import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { HeroSlider } from './components/HeroSlider.js';
import { ArticleCard } from './components/ArticleCard.js';
import { VideoCard } from './components/VideoCard.js';
import { BookCard } from './components/BookCard.js';
import { ArticleDetail } from './components/ArticleDetail.js';
import { VideoDetail } from './components/VideoDetail.js';
import { BookDetail } from './components/BookDetail.js';
import { OrderModal } from './components/OrderModal.js';
import { AuthModal } from './components/AuthModal.js';
import { CustomerDashboard } from './components/CustomerDashboard.js';
import { SearchModal } from './components/SearchModal.js';
import { AdminDashboard } from './components/AdminDashboard.js';

import { ArrowRight, BookOpen, Sparkles, Shield, CheckCircle } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  // Navigation & View state
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedBookSlug, setSelectedBookSlug] = useState<string | null>(null);

  // Active Detail Objects
  const [activeArticle, setActiveArticle] = useState<{ article: Article; related: Article[] } | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ video: Video; related: Video[] } | null>(null);
  const [activeBook, setActiveBook] = useState<{ book: Book; related: Book[] } | null>(null);

  // Modals
  const [orderModalBook, setOrderModalBook] = useState<Book | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);

  // Archive filters
  const [articleCategory, setArticleCategory] = useState<string>('all');
  const [bookFilter, setBookFilter] = useState<string>('all'); // all, free, paid

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial Load & Route check
  useEffect(() => {
    loadInitialData();

    // Check if initial hash is #admin or #wp-admin
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.includes('wp-admin') || hash === '#admin' || hash === '#wp-admin') {
      setCurrentView('admin');
    }

    // Check current auth token with server
    api.getMe()
      .then(res => {
        if (res.user) setCurrentUser(res.user);
      })
      .catch(() => {
        // invalid or expired token
        clearStoredAuth();
        setCurrentUser(null);
      });
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [setRes, slRes, artRes, vidRes, bkRes] = await Promise.all([
        api.getSettings(),
        api.getSlides(),
        api.getArticles({ limit: 16 }),
        api.getVideos(),
        api.getBooks()
      ]);
      setSettings(setRes);
      setSlides(slRes);
      setArticles(artRes.articles);
      setVideos(vidRes.videos);
      setBooks(bkRes.books);
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (view: string, param?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView(view);

    if (view === 'article-detail' && param) {
      setSelectedArticleSlug(param);
      api.getArticle(param).then(setActiveArticle).catch(console.error);
    } else if (view === 'video-detail' && param) {
      setSelectedVideoId(param);
      api.getVideo(param).then(setActiveVideo).catch(console.error);
    } else if (view === 'book-detail' && param) {
      setSelectedBookSlug(param);
      api.getBook(param).then(setActiveBook).catch(console.error);
    }
  };

  const handleLogout = () => {
    api.logout().catch(() => {});
    clearStoredAuth();
    setCurrentUser(null);
    if (currentView === 'admin' || currentView === 'customer-account') {
      setCurrentView('home');
    }
  };

  const handleDownloadFree = async (book: Book) => {
    try {
      const res = await fetch(`/api/download/book/${book.id}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = book.fileName || `${book.slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not download publication. Please try again.');
    }
  };

  const handleBuyPaid = (book: Book) => {
    setOrderModalBook(book);
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="font-editorial text-xl font-bold tracking-tight text-[#111111]">
            Soch Wale
          </div>
          <div className="text-xs uppercase tracking-widest text-[#666666]">
            Loading publishing platform...
          </div>
        </div>
      </div>
    );
  }

  // If view is Admin Dashboard
  if (currentView === 'admin') {
    if (!currentUser || currentUser.role !== 'admin') {
      return (
        <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-black border border-neutral-800 p-8 text-center space-y-6">
            <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-serif text-lg font-bold mx-auto">
              SW
            </div>
            <div>
              <h2 className="text-xl font-bold font-editorial">Administrator Authentication Required</h2>
              <p className="text-xs text-neutral-400 mt-2">
                This administration interface is strictly restricted to authorized emails via server-side allowlist.
              </p>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 bg-white text-black text-xs uppercase tracking-widest font-bold hover:bg-neutral-200 transition-colors"
            >
              Sign In as Administrator
            </button>
            <div>
              <button
                onClick={() => setCurrentView('home')}
                className="text-xs text-neutral-500 hover:text-white transition-colors"
              >
                ← Return to Public Website
              </button>
            </div>
          </div>

          {authModalOpen && (
            <AuthModal
              onClose={() => setAuthModalOpen(false)}
              onSuccess={(user) => {
                setCurrentUser(user);
                if (user.role === 'admin') {
                  setCurrentView('admin');
                }
              }}
            />
          )}
        </div>
      );
    }

    return (
      <AdminDashboard
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigatePublic={handleNavigate}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111111]">
      
      {/* Universal Top Header */}
      <Header
        settings={settings}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        currentView={currentView}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">

        {/* VIEW 1: HOME PAGE */}
        {currentView === 'home' && (
          <div>
            {/* Hero Carousel */}
            <HeroSlider
              slides={slides}
              autoSlide={settings.theme.heroAutoSlide}
              interval={settings.theme.heroInterval}
              onNavigateUrl={(url) => {
                if (url === '#articles') handleNavigate('articles');
                else if (url === '#videos') handleNavigate('videos');
                else if (url === '#books') handleNavigate('books');
                else window.location.href = url;
              }}
            />

            {/* SECTION 1: Featured & Latest Articles */}
            {settings.theme.showFeaturedArticles && (
              <section id="articles" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 border-b border-[#E5E5E5]">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-[#E5E5E5] gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#666666] font-semibold">
                      Thought Leadership & Editorial
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-[#111111] mt-1">
                      Articles & In-Depth Essays
                    </h2>
                  </div>
                  <button
                    onClick={() => handleNavigate('articles')}
                    className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-[#111111] hover:text-neutral-600 transition-colors"
                  >
                    <span>View All Articles</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Responsive Grid: 4 Desktop / 3 Tablet / 1 Mobile (Section 10) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {articles.slice(0, 8).map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onReadMore={(slug) => handleNavigate('article-detail', slug)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 2: Featured & Latest Videos */}
            {settings.theme.showFeaturedVideos && (
              <section id="videos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 border-b border-[#E5E5E5] bg-[#F5F5F5]/40">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-[#E5E5E5] gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#666666] font-semibold">
                      Visual Discourse
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-[#111111] mt-1">
                      YouTube Video Lectures
                    </h2>
                  </div>
                  <button
                    onClick={() => handleNavigate('videos')}
                    className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-[#111111] hover:text-neutral-600 transition-colors"
                  >
                    <span>View All Videos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Responsive Grid: 4 Desktop / 3 Tablet / 1 Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {videos.slice(0, 4).map(video => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onWatch={(id) => handleNavigate('video-detail', id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 3: Featured Books & PDFs */}
            {settings.theme.showFeaturedBooks && (
              <section id="books" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 border-b border-[#E5E5E5]">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-[#E5E5E5] gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-[#666666] font-semibold">
                      Digital Publications & Books
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-[#111111] mt-1">
                      Curated Digital Bookstore
                    </h2>
                  </div>
                  <button
                    onClick={() => handleNavigate('books')}
                    className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-[#111111] hover:text-neutral-600 transition-colors"
                  >
                    <span>View All Publications</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Responsive Grid: 4 Desktop / 3 Tablet / 1 Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {books.slice(0, 4).map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onViewBook={(slug) => handleNavigate('book-detail', slug)}
                      onDownloadFree={handleDownloadFree}
                      onBuyPaid={handleBuyPaid}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 4: Mission & Educational Values Banner */}
            <section className="bg-white py-16 md:py-24">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
                <span className="text-xs uppercase tracking-widest text-[#666666] font-semibold">
                  About Our Educational Philosophy
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold font-editorial text-[#111111] leading-tight">
                  Democratizing Rigorous Knowledge & Critical Awareness
                </h2>
                <p className="text-sm sm:text-base text-[#666666] leading-relaxed max-w-2xl mx-auto">
                  Soch Wale provides accessible educational discourse, bilingual research papers, and curated books designed to foster intellectual independence and philosophical inquiry in our contemporary world.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => handleNavigate('about')}
                    className="px-6 py-3 bg-[#111111] text-white text-xs uppercase tracking-widest font-bold hover:bg-neutral-800 transition-colors"
                  >
                    Read Our Mission Statement
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: ARTICLE DETAIL PAGE */}
        {currentView === 'article-detail' && activeArticle && (
          <ArticleDetail
            article={activeArticle.article}
            relatedArticles={activeArticle.related}
            onBack={() => handleNavigate('articles')}
            onSelectArticle={(slug) => handleNavigate('article-detail', slug)}
          />
        )}

        {/* VIEW 3: VIDEO DETAIL PAGE */}
        {currentView === 'video-detail' && activeVideo && (
          <VideoDetail
            video={activeVideo.video}
            relatedVideos={activeVideo.related}
            onBack={() => handleNavigate('videos')}
            onSelectVideo={(id) => handleNavigate('video-detail', id)}
          />
        )}

        {/* VIEW 4: BOOK DETAIL PAGE */}
        {currentView === 'book-detail' && activeBook && (
          <BookDetail
            book={activeBook.book}
            relatedBooks={activeBook.related}
            onBack={() => handleNavigate('books')}
            onDownloadFree={handleDownloadFree}
            onBuyPaid={handleBuyPaid}
            onSelectBook={(slug) => handleNavigate('book-detail', slug)}
          />
        )}

        {/* VIEW 5: ARTICLES ARCHIVE */}
        {currentView === 'articles' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="pb-8 border-b border-[#E5E5E5] mb-10">
              <span className="text-xs uppercase tracking-widest text-[#666666] font-semibold">
                Archival Publications
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-[#111111] mt-1 mb-3">
                All Articles & Essays
              </h1>
              <p className="text-sm text-[#666666] max-w-2xl">
                Bilingual collection of essays on philosophy, self-education, and social awareness in Urdu and English.
              </p>
            </div>

            {/* Responsive Grid: 4 Desktop / 3 Tablet / 1 Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {articles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onReadMore={(slug) => handleNavigate('article-detail', slug)}
                />
              ))}
            </div>
          </div>
        )}

        {/* VIEW 6: VIDEOS ARCHIVE */}
        {currentView === 'videos' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="pb-8 border-b border-[#E5E5E5] mb-10">
              <span className="text-xs uppercase tracking-widest text-[#666666] font-semibold">
                Visual Lectures & Podcasts
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-[#111111] mt-1 mb-3">
                Video Library
              </h1>
              <p className="text-sm text-[#666666] max-w-2xl">
                Watch curated discussions, lectures, and educational series hosted on YouTube.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {videos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onWatch={(id) => handleNavigate('video-detail', id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* VIEW 7: BOOKS ARCHIVE */}
        {currentView === 'books' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="pb-8 border-b border-[#E5E5E5] mb-8">
              <span className="text-xs uppercase tracking-widest text-[#666666] font-semibold">
                Digital Bookstore & Library
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-[#111111] mt-1 mb-3">
                Educational Books & PDFs
              </h1>
              <p className="text-sm text-[#666666] max-w-2xl">
                Download free primers or purchase premium research volumes via simple JazzCash verification.
              </p>
            </div>

            {/* Filter buttons (Interactive segmented controls) */}
            <div className="flex items-center gap-2 mb-8">
              <button
                onClick={() => setBookFilter('all')}
                className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                  bookFilter === 'all' ? 'bg-[#111111] text-white' : 'bg-[#F5F5F5] text-[#111111] hover:bg-neutral-200'
                }`}
              >
                All Publications
              </button>
              <button
                onClick={() => setBookFilter('free')}
                className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                  bookFilter === 'free' ? 'bg-[#111111] text-white' : 'bg-[#F5F5F5] text-[#111111] hover:bg-neutral-200'
                }`}
              >
                Free PDFs Only
              </button>
              <button
                onClick={() => setBookFilter('paid')}
                className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                  bookFilter === 'paid' ? 'bg-[#111111] text-white' : 'bg-[#F5F5F5] text-[#111111] hover:bg-neutral-200'
                }`}
              >
                Paid Books (JazzCash)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {books
                .filter(b => bookFilter === 'all' ? true : bookFilter === 'free' ? !b.isPaid : b.isPaid)
                .map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onViewBook={(slug) => handleNavigate('book-detail', slug)}
                    onDownloadFree={handleDownloadFree}
                    onBuyPaid={handleBuyPaid}
                  />
                ))}
            </div>
          </div>
        )}

        {/* VIEW 8: ABOUT PAGE */}
        {currentView === 'about' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-8">
            <span className="text-xs uppercase tracking-widest text-[#666666] font-semibold">
              About Soch Wale
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold font-editorial text-[#111111] leading-tight">
              A Movement Dedicated to Critical Thinking & Knowledge
            </h1>
            <div className="space-y-6 text-base text-[#111111] leading-relaxed">
              <p>
                <strong>Soch Wale</strong> is an independent digital publishing and educational platform founded to cultivate rigorous intellectual curiosity, critical thinking, and disciplined reading habits across Pakistan and the Urdu-speaking diaspora.
              </p>
              <p>
                We believe that societal transformation begins with the emancipation of individual consciousness. In an era overwhelmed by superficial media and polarization, Soch Wale provides a calm sanctuary of thoughtful discourse, in-depth essays, video seminars, and carefully authored educational books.
              </p>
              <h3 className="text-2xl font-bold font-editorial pt-4">Our Core Commitments</h3>
              <ul className="list-disc list-inside space-y-2 text-[#666666]">
                <li><strong>Bilingual Excellence:</strong> Championing high-standard Urdu Nastaleeq typography alongside English scholarship.</li>
                <li><strong>Intellectual Integrity:</strong> Refusing sensationalism in favor of research, nuanced perspective, and epistemic honesty.</li>
                <li><strong>Accessible Learning:</strong> Providing high-quality free PDF resources for students alongside sustainably priced premium editions.</li>
              </ul>
            </div>
          </div>
        )}

        {/* VIEW 9: CUSTOMER DASHBOARD / ACCOUNT */}
        {currentView === 'customer-account' && (
          <CustomerDashboard
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        )}

        {/* VIEW 10: LEGAL POLICIES */}
        {(currentView === 'privacy' || currentView === 'terms' || currentView === 'purchase-policy') && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-6">
            <h1 className="text-3xl font-bold font-editorial text-[#111111]">
              {currentView === 'privacy' ? 'Privacy Policy' : currentView === 'terms' ? 'Terms & Conditions' : 'Digital Purchase & Download Policy'}
            </h1>
            <p className="text-sm text-[#666666] leading-relaxed">
              {currentView === 'purchase-policy' ? (
                <>
                  All paid publications on Soch Wale are delivered in digital PDF format. Once your manual JazzCash payment is confirmed by our administrators, your digital entitlement is bound to your account and remains permanently downloadable through your customer library. We ensure protected access and personalized customer support.
                </>
              ) : (
                <>
                  Soch Wale respects your privacy and adheres to high standards of data protection. We only collect essential customer details (name and email) required to process orders and deliver your purchased digital publications. No payment secrets or credit card numbers are stored on our servers.
                </>
              )}
            </p>
          </div>
        )}

      </main>

      {/* Universal Footer */}
      <Footer
        settings={settings}
        onNavigate={handleNavigate}
      />

      {/* MODALS */}
      {orderModalBook && (
        <OrderModal
          book={orderModalBook}
          settings={settings}
          onClose={() => setOrderModalBook(null)}
          onOrderComplete={(order) => {
            // refresh data
            loadInitialData();
          }}
        />
      )}

      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            if (user.role === 'admin') {
              setCurrentView('admin');
            } else {
              setCurrentView('customer-account');
            }
          }}
        />
      )}

      {searchModalOpen && (
        <SearchModal
          articles={articles}
          videos={videos}
          books={books}
          onClose={() => setSearchModalOpen(false)}
          onSelectArticle={(slug) => handleNavigate('article-detail', slug)}
          onSelectVideo={(id) => handleNavigate('video-detail', id)}
          onSelectBook={(slug) => handleNavigate('book-detail', slug)}
        />
      )}

    </div>
  );
}
