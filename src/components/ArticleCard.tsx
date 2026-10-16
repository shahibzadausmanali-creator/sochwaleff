import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Article } from '../types.js';

interface ArticleCardProps {
  article: Article;
  onReadMore: (slug: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onReadMore }) => {
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="group flex flex-col bg-white border border-[#E5E5E5] rounded-none hover:border-[#111111] transition-colors duration-200 overflow-hidden h-full">
      {/* Featured Image with subtle zoom on hover */}
      <div className="relative aspect-[16/10] bg-[#F5F5F5] overflow-hidden">
        <img
          src={article.featuredImage}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        {/* Styled CSS fallback container */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-neutral-100 text-neutral-400">
          <BookOpen className="w-8 h-8 opacity-40" />
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col flex-1 p-5 justify-between">
        <div>
          {/* Zero-Pill Unboxed Metadata with · separator */}
          <div className="flex items-center gap-2 text-xs text-[#666666] mb-3">
            <span className="font-medium text-[#111111]">{article.category}</span>
            <span aria-hidden="true">·</span>
            <span>{formattedDate}</span>
          </div>

          {/* Title */}
          <h3
            className={`text-lg font-bold text-[#111111] mb-2 group-hover:text-neutral-800 transition-colors line-clamp-2 ${
              article.isUrdu ? 'font-urdu text-right text-xl leading-relaxed' : 'font-editorial'
            }`}
            dir={article.isUrdu ? 'rtl' : 'ltr'}
          >
            {article.title}
          </h3>

          {/* Excerpt */}
          <p
            className={`text-sm text-[#666666] line-clamp-3 mb-4 leading-relaxed ${
              article.isUrdu ? 'font-urdu text-right text-base' : ''
            }`}
            dir={article.isUrdu ? 'rtl' : 'ltr'}
          >
            {article.excerpt}
          </p>
        </div>

        {/* Read More Action Button */}
        <div className="pt-2 border-t border-[#F5F5F5] mt-auto">
          <button
            onClick={() => onReadMore(article.slug)}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-[#111111] hover:text-neutral-600 transition-colors py-1 group/btn"
          >
            <span>Read Article</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
