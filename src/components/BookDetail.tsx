import React, { useState } from 'react';
import { ArrowLeft, Download, ShoppingBag, ShieldCheck, Check, BookOpen } from 'lucide-react';
import { Book } from '../types.js';

interface BookDetailProps {
  book: Book;
  relatedBooks: Book[];
  onBack: () => void;
  onDownloadFree: (book: Book) => void;
  onBuyPaid: (book: Book) => void;
  onSelectBook: (slug: string) => void;
}

export const BookDetail: React.FC<BookDetailProps> = ({
  book,
  relatedBooks,
  onBack,
  onDownloadFree,
  onBuyPaid,
  onSelectBook
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(book.coverImage);

  const images = [book.coverImage, ...(book.previewImages || [])].filter((img, idx, arr) => arr.indexOf(img) === idx);

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Top Nav */}
      <div className="border-b border-[#E5E5E5] bg-[#F5F5F5]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#111111] hover:text-neutral-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Bookstore</span>
          </button>
          <span className="text-xs text-[#666666] font-medium">{book.category}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Left Column: Cover & Preview Gallery */}
          <div className="md:col-span-5 space-y-4">
            <div className="aspect-[3/4] bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center p-8 overflow-hidden shadow-sm">
              <img
                src={selectedImage || book.coverImage}
                alt={book.title}
                className="w-auto h-full max-h-[460px] object-contain shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Thumbnail Preview Selector */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-20 bg-[#F5F5F5] border p-1 shrink-0 transition-colors ${
                      selectedImage === img ? 'border-[#111111] ring-1 ring-[#111111]' : 'border-[#E5E5E5] hover:border-neutral-400'
                    }`}
                  >
                    <img src={img} alt="preview" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Book Information & Purchase/Download Box */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-xs text-[#666666] mb-3">
                <span className="font-semibold text-[#111111] uppercase tracking-wider">{book.category}</span>
                <span aria-hidden="true">·</span>
                <span>Digital PDF Publication</span>
                {book.downloadCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{book.downloadCount} Downloads</span>
                  </>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-[#111111] leading-tight mb-4">
                {book.title}
              </h1>

              {/* Price / Status Banner */}
              <div className="p-4 bg-[#F5F5F5] border border-[#E5E5E5] my-6 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#666666] uppercase tracking-wider font-semibold">Pricing</div>
                  {book.isPaid ? (
                    <div className="text-2xl font-bold text-[#111111] mt-1 tabular-nums">
                      {book.salePrice ? (
                        <>
                          <span className="line-through text-neutral-400 text-lg mr-2 font-normal">{book.price} PKR</span>
                          <span>{book.salePrice} PKR</span>
                        </>
                      ) : (
                        <span>{book.price} PKR</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-emerald-700 mt-1 uppercase tracking-wider">
                      Free Digital Resource
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                {book.isPaid ? (
                  <button
                    onClick={() => onBuyPaid(book)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-widest font-bold transition-colors shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Buy Now (JazzCash)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onDownloadFree(book)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-widest font-bold transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                )}
              </div>

              {/* Security / Delivery Notice */}
              <div className="flex items-start gap-3 p-3 bg-white border border-[#E5E5E5] text-xs text-[#666666] mb-6">
                <ShieldCheck className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111111]">Secure Verification & Protected PDF Access:</span>
                  <p className="mt-0.5 leading-relaxed">
                    {book.isPaid
                      ? 'Simple manual JazzCash verification. Once confirmed, download access is automatically unlocked in your customer account forever.'
                      : 'Free educational download provided by Soch Wale for students and scholars worldwide.'}
                  </p>
                </div>
              </div>

              {/* Short & Full Description */}
              <div className="space-y-4 text-sm sm:text-base text-[#111111] leading-relaxed">
                <h3 className="text-base font-bold text-[#111111] uppercase tracking-wider pt-2 border-t border-[#E5E5E5]">
                  Publication Overview
                </h3>
                <p className="whitespace-pre-line text-[#666666]">
                  {book.fullDescription || book.shortDescription}
                </p>
              </div>

              {/* Tags */}
              {book.tags && book.tags.length > 0 && (
                <div className="pt-6 mt-6 border-t border-[#E5E5E5] flex flex-wrap gap-2">
                  {book.tags.map(t => (
                    <span key={t} className="text-xs text-[#666666] bg-[#F5F5F5] px-2.5 py-1">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Related Books */}
        {relatedBooks && relatedBooks.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[#E5E5E5]">
            <h3 className="text-xl font-bold font-editorial text-[#111111] mb-6">
              More Publications & Resources
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedBooks.map(rel => (
                <div
                  key={rel.id}
                  onClick={() => onSelectBook(rel.slug)}
                  className="group cursor-pointer border border-[#E5E5E5] hover:border-[#111111] transition-colors p-4 bg-white"
                >
                  <div className="aspect-[3/4] bg-[#F5F5F5] overflow-hidden mb-3 p-4 flex items-center justify-center">
                    <img
                      src={rel.coverImage}
                      alt={rel.title}
                      className="w-auto h-full max-h-40 object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="text-[11px] text-[#666666] mb-1 font-medium">{rel.category}</div>
                  <h4 className="text-sm font-bold text-[#111111] line-clamp-2 mb-2">
                    {rel.title}
                  </h4>
                  <div className="text-xs font-semibold text-[#111111]">
                    {rel.isPaid ? `${rel.price} PKR` : 'Free'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
