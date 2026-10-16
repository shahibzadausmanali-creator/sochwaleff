import React, { useState } from 'react';
import { Search, X, BookOpen, Play, FileText, ArrowRight } from 'lucide-react';
import { Article, Video, Book } from '../types.js';

interface SearchModalProps {
  articles: Article[];
  videos: Video[];
  books: Book[];
  onClose: () => void;
  onSelectArticle: (slug: string) => void;
  onSelectVideo: (id: string) => void;
  onSelectBook: (slug: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  articles,
  videos,
  books,
  onClose,
  onSelectArticle,
  onSelectVideo,
  onSelectBook
}) => {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const matchedArticles = q
    ? articles.filter(a => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const matchedVideos = q
    ? videos.filter(v => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q) || v.category.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const matchedBooks = q
    ? books.filter(b => b.title.toLowerCase().includes(q) || b.shortDescription.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const totalResults = matchedArticles.length + matchedVideos.length + matchedBooks.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-16 sm:pt-24">
      <div className="bg-white w-full max-w-2xl border border-[#111111] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E5E5E5] bg-[#F5F5F5]/50">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search articles, video lectures, books, or topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[#111111] focus:outline-none placeholder:text-neutral-400 font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-neutral-400 hover:text-neutral-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-xs uppercase tracking-wider font-semibold text-neutral-500 hover:text-black ml-2">
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-5 space-y-6 flex-1">
          {!q ? (
            <div className="py-8 text-center text-xs text-[#666666]">
              Type keywords to search across all published articles, YouTube video lectures, and PDF books.
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-[#666666]">
              No publications or videos found matching &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <>
              {/* Articles Results */}
              {matchedArticles.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-[#666666] mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Articles ({matchedArticles.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedArticles.map(art => (
                      <button
                        key={art.id}
                        onClick={() => {
                          onSelectArticle(art.slug);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 hover:bg-[#F5F5F5] flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className={`text-sm font-bold text-[#111111] group-hover:text-neutral-700 ${art.isUrdu ? 'font-urdu text-base' : ''}`}>
                            {art.title}
                          </div>
                          <div className="text-[11px] text-[#666666]">{art.category}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos Results */}
              {matchedVideos.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-[#666666] mb-2 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5" />
                    <span>Videos ({matchedVideos.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedVideos.map(vid => (
                      <button
                        key={vid.id}
                        onClick={() => {
                          onSelectVideo(vid.id);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 hover:bg-[#F5F5F5] flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="text-sm font-bold text-[#111111] group-hover:text-neutral-700">
                            {vid.title}
                          </div>
                          <div className="text-[11px] text-[#666666]">{vid.category}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Books Results */}
              {matchedBooks.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-[#666666] mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Books & PDFs ({matchedBooks.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchedBooks.map(bk => (
                      <button
                        key={bk.id}
                        onClick={() => {
                          onSelectBook(bk.slug);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 hover:bg-[#F5F5F5] flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="text-sm font-bold text-[#111111] group-hover:text-neutral-700">
                            {bk.title}
                          </div>
                          <div className="text-[11px] text-[#666666]">
                            {bk.category} · {bk.isPaid ? `${bk.price} PKR` : 'Free'}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
