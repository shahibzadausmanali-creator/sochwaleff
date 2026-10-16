import React from 'react';
import { Download, ShoppingBag, BookOpen } from 'lucide-react';
import { Book } from '../types.js';

interface BookCardProps {
  book: Book;
  onViewBook: (slug: string) => void;
  onDownloadFree: (book: Book) => void;
  onBuyPaid: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onViewBook,
  onDownloadFree,
  onBuyPaid
}) => {
  return (
    <div className="group flex flex-col bg-white border border-[#E5E5E5] hover:border-[#111111] transition-colors duration-200 overflow-hidden h-full">
      {/* Book Cover Container (Editorial 3:4 Aspect Ratio) */}
      <div
        onClick={() => onViewBook(book.slug)}
        className="relative aspect-[3/4] bg-[#F5F5F5] cursor-pointer overflow-hidden p-6 flex items-center justify-center border-b border-[#E5E5E5]"
      >
        <img
          src={book.coverImage}
          alt={book.title}
          className="w-auto h-full max-h-56 object-contain shadow-md transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        {/* Fallback frame */}
        <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center bg-stone-100 text-stone-400 p-4 text-center">
          <BookOpen className="w-10 h-10 mb-2 opacity-40" />
          <span className="text-xs font-serif">{book.title}</span>
        </div>
      </div>

      {/* Book Details */}
      <div className="flex flex-col flex-1 p-5 justify-between">
        <div>
          {/* Unboxed Metadata: Category & Free/Price */}
          <div className="flex items-center justify-between text-xs text-[#666666] mb-2">
            <span className="font-medium text-[#111111]">{book.category}</span>
            {book.isPaid ? (
              <span className="font-semibold text-[#111111] tabular-nums">
                {book.salePrice ? (
                  <>
                    <span className="line-through text-neutral-400 mr-1.5">{book.price} PKR</span>
                    <span>{book.salePrice} PKR</span>
                  </>
                ) : (
                  <span>{book.price} PKR</span>
                )}
              </span>
            ) : (
              <span className="font-semibold text-emerald-700 tracking-wider uppercase text-[11px]">
                Free PDF
              </span>
            )}
          </div>

          {/* Book Title */}
          <h3
            onClick={() => onViewBook(book.slug)}
            className="text-base font-bold text-[#111111] mb-2 cursor-pointer group-hover:text-neutral-700 transition-colors line-clamp-2"
          >
            {book.title}
          </h3>

          {/* Short Description */}
          {book.shortDescription && (
            <p className="text-xs text-[#666666] line-clamp-3 mb-4 leading-relaxed">
              {book.shortDescription}
            </p>
          )}
        </div>

        {/* Action Button: Download Now for Free, Buy Now for Paid */}
        <div className="pt-3 border-t border-[#F5F5F5] mt-auto">
          {book.isPaid ? (
            <button
              onClick={() => onBuyPaid(book)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs uppercase tracking-wider font-semibold text-white bg-[#111111] hover:bg-neutral-800 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Buy Now</span>
            </button>
          ) : (
            <button
              onClick={() => onDownloadFree(book)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs uppercase tracking-wider font-semibold text-[#111111] border border-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
