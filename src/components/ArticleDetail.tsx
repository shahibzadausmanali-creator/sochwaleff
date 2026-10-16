import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Calendar,
  Clock
} from 'lucide-react';
import { Article } from '../types.js';
import { api } from '../services/api.js';

interface ArticleDetailProps {
  article: Article;
  relatedArticles: Article[];
  onBack: () => void;
  onSelectArticle: (slug: string) => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  article,
  relatedArticles,
  onBack,
  onSelectArticle
}) => {
  // Reader text-size control state (100% default, min 80%, max 160%)
  const [textSizePercent, setTextSizePercent] = useState<number>(100);
  
  // Helpfulness feedback state
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [currentHelpful, setCurrentHelpful] = useState<{ yes: number; no: number }>(article.helpfulness || { yes: 0, no: 0 });
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate estimated reading time
  const wordCount = article.content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleTextSizeChange = (delta: number) => {
    setTextSizePercent(prev => Math.min(160, Math.max(80, prev + delta)));
  };

  const handleResetTextSize = () => {
    setTextSizePercent(100);
  };

  const handleFeedback = async (isHelpful: boolean) => {
    if (feedbackSubmitted) return;
    try {
      const res = await api.submitArticleFeedback(article.slug, isHelpful);
      if (res.success && res.helpfulness) {
        setCurrentHelpful(res.helpfulness);
      } else {
        setCurrentHelpful(prev => ({
          yes: isHelpful ? prev.yes + 1 : prev.yes,
          no: !isHelpful ? prev.no + 1 : prev.no
        }));
      }
      setFeedbackSubmitted(true);
    } catch {
      setFeedbackSubmitted(true);
    }
  };

  const articleUrl = typeof window !== 'undefined' ? window.location.href : `https://sochwale.com/article/${article.slug}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(articleUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: articleUrl
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  // Social Share URLs
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(article.title);
  const shareWhatsApp = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
  const shareFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const shareTwitter = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;

  return (
    <article className="min-h-screen bg-white pb-24">
      {/* Top Breadcrumb Navigation */}
      <div className="border-b border-[#E5E5E5] bg-[#F5F5F5]/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#111111] hover:text-neutral-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Articles</span>
          </button>

          {/* Reader Text-Size Adjustment Toolbar */}
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E5E5] p-1 rounded-md text-xs">
            <span className="text-[11px] text-[#666666] font-medium px-2 hidden sm:inline">Text Size:</span>
            <button
              onClick={() => handleTextSizeChange(-10)}
              className="px-2 py-1 hover:bg-[#F5F5F5] rounded text-neutral-800 font-bold"
              title="Decrease text size (A-)"
              aria-label="Decrease text size"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetTextSize}
              className="px-2 py-1 hover:bg-[#F5F5F5] rounded text-[11px] font-mono text-neutral-600"
              title="Reset text size"
              aria-label="Reset text size"
            >
              {textSizePercent}%
            </button>
            <button
              onClick={() => handleTextSizeChange(10)}
              className="px-2 py-1 hover:bg-[#F5F5F5] rounded text-neutral-800 font-bold"
              title="Increase text size (A+)"
              aria-label="Increase text size"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Article Header */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-8">
        {/* Unboxed Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] mb-4">
          <span className="font-semibold text-[#111111]">{article.category}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {readTime} min read
          </span>
        </div>

        {/* Title */}
        <h1
          className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] leading-tight mb-6 ${
            article.isUrdu ? 'font-urdu text-right text-4xl sm:text-5xl leading-relaxed' : 'font-editorial'
          }`}
          dir={article.isUrdu ? 'rtl' : 'ltr'}
        >
          {article.title}
        </h1>

        {/* Excerpt / Deck */}
        {article.excerpt && (
          <p
            className={`text-lg sm:text-xl text-[#666666] leading-relaxed border-l-2 sm:border-l-0 pl-4 sm:pl-0 border-neutral-300 ${
              article.isUrdu ? 'font-urdu text-right text-xl leading-loose' : 'font-light italic'
            }`}
            dir={article.isUrdu ? 'rtl' : 'ltr'}
          >
            {article.excerpt}
          </p>
        )}
      </header>

      {/* Featured Image */}
      {article.featuredImage && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-12">
          <div className="relative aspect-[16/9] bg-[#F5F5F5] overflow-hidden border border-[#E5E5E5]">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Article Body Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div
          style={{ fontSize: `${textSizePercent}%` }}
          className={`transition-all duration-150 text-[#111111] space-y-6 ${
            article.isUrdu ? 'font-urdu text-right text-xl leading-[2.2]' : 'text-base sm:text-lg leading-relaxed font-sans-editorial'
          }`}
          dir={article.isUrdu ? 'rtl' : 'ltr'}
        >
          {article.content.split('\n\n').map((paragraph, idx) => {
            if (!paragraph.trim()) return null;
            return (
              <p key={idx} className="leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-6 border-t border-[#E5E5E5] flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#666666] font-semibold mr-2">Topics:</span>
            {article.tags.map(tag => (
              <span key={tag} className="text-xs text-[#111111] bg-[#F5F5F5] px-2.5 py-1 rounded-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Article Helpfulness Feedback Section */}
        <section className="mt-12 p-6 sm:p-8 bg-[#F5F5F5] border border-[#E5E5E5] rounded-none">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-[#111111] mb-1">
                Was this article helpful?
              </h4>
              <p className="text-xs text-[#666666]">
                Your feedback helps us continuously improve our educational content.
              </p>
            </div>

            {feedbackSubmitted ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded">
                <Check className="w-4 h-4" />
                <span>Thank you for your feedback!</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleFeedback(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#111111] bg-white border border-[#E5E5E5] hover:border-[#111111] transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Yes ({currentHelpful.yes})</span>
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#111111] bg-white border border-[#E5E5E5] hover:border-[#111111] transition-colors"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>No ({currentHelpful.no})</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Article Sharing Section */}
        <section className="mt-8 pt-6 border-t border-[#E5E5E5]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#111111]">
              <Share2 className="w-4 h-4" />
              <span>Share this article</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* WhatsApp */}
              <a
                href={shareWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium text-neutral-800 bg-[#F5F5F5] hover:bg-neutral-200 rounded transition-colors"
              >
                WhatsApp
              </a>

              {/* Facebook */}
              <a
                href={shareFacebook}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium text-neutral-800 bg-[#F5F5F5] hover:bg-neutral-200 rounded transition-colors"
              >
                Facebook
              </a>

              {/* X / Twitter */}
              <a
                href={shareTwitter}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium text-neutral-800 bg-[#F5F5F5] hover:bg-neutral-200 rounded transition-colors"
              >
                X (Twitter)
              </a>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#111111] hover:bg-neutral-800 rounded transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Related Articles Section */}
      {relatedArticles && relatedArticles.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-20 pt-12 border-t border-[#E5E5E5]">
          <h3 className="text-xl font-bold font-editorial text-[#111111] mb-6">
            Related Articles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedArticles.slice(0, 3).map(rel => (
              <div
                key={rel.id}
                onClick={() => onSelectArticle(rel.slug)}
                className="group cursor-pointer border border-[#E5E5E5] hover:border-[#111111] transition-colors bg-white overflow-hidden p-4"
              >
                <div className="aspect-[16/10] bg-[#F5F5F5] overflow-hidden mb-3">
                  <img
                    src={rel.featuredImage}
                    alt={rel.title}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="text-[11px] text-[#666666] mb-1 font-medium">{rel.category}</div>
                <h4
                  className={`text-sm font-bold text-[#111111] line-clamp-2 ${
                    rel.isUrdu ? 'font-urdu text-right text-base' : ''
                  }`}
                  dir={rel.isUrdu ? 'rtl' : 'ltr'}
                >
                  {rel.title}
                </h4>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
