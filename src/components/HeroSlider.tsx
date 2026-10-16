import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { HeroSlide } from '../types.js';

interface HeroSliderProps {
  slides: HeroSlide[];
  autoSlide?: boolean;
  interval?: number;
  onNavigateUrl?: (url: string) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides,
  autoSlide = true,
  interval = 6000,
  onNavigateUrl
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeSlides = slides.filter(s => s.isActive);

  useEffect(() => {
    if (!autoSlide || isPaused || activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeSlides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [autoSlide, isPaused, activeSlides.length, interval]);

  if (activeSlides.length === 0) return null;

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeSlides.length);
  };

  const handleCtaClick = () => {
    if (onNavigateUrl) {
      onNavigateUrl(currentSlide.ctaUrl);
    } else if (currentSlide.ctaUrl.startsWith('#')) {
      const elem = document.querySelector(currentSlide.ctaUrl);
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = currentSlide.ctaUrl;
    }
  };

  return (
    <section
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Hero Highlights"
    >
      <div className="relative aspect-[16/9] max-h-[480px] w-full bg-[#111111] overflow-hidden border border-[#E5E5E5] flex items-center shadow-sm">
        {/* Full brightness slide image */}
        <div className="absolute inset-0">
          <img
            key={currentSlide.imageUrl}
            src={currentSlide.imageUrl}
            alt={currentSlide.heading}
            className="w-full h-full object-cover transition-opacity duration-700"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 px-6 sm:px-10 md:px-14 py-6 w-full">
          <div className="max-w-xl space-y-3 sm:space-y-4">
            <span className="text-[11px] uppercase tracking-widest text-white font-bold drop-shadow">
              Soch Wale Focus
            </span>

            <h1
              className={`text-xl sm:text-2xl md:text-4xl font-bold leading-tight text-white tracking-tight drop-shadow-md ${
                /[\u0600-\u06FF]/.test(currentSlide.heading) ? 'font-urdu text-2xl sm:text-3xl md:text-4xl leading-relaxed' : 'font-editorial'
              }`}
              dir={/[\u0600-\u06FF]/.test(currentSlide.heading) ? 'rtl' : 'ltr'}
            >
              {currentSlide.heading}
            </h1>

            {currentSlide.subtitle && (
              <p
                className={`text-xs sm:text-sm md:text-base text-white/95 leading-relaxed drop-shadow line-clamp-2 sm:line-clamp-3 ${
                  /[\u0600-\u06FF]/.test(currentSlide.subtitle) ? 'font-urdu text-sm sm:text-base' : ''
                }`}
                dir={/[\u0600-\u06FF]/.test(currentSlide.subtitle) ? 'rtl' : 'ltr'}
              >
                {currentSlide.subtitle}
              </p>
            )}

            <div className="pt-1">
              <button
                onClick={handleCtaClick}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#111111] text-white text-[11px] sm:text-xs uppercase tracking-widest font-bold hover:bg-neutral-800 transition-colors shadow-lg group border border-white/20"
              >
                <span>{currentSlide.ctaText || 'Read More'}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {activeSlides.length > 1 && (
          <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 hidden sm:flex items-center gap-2 z-20">
            <button
              onClick={handlePrev}
              className="p-2 sm:p-2.5 bg-white/90 hover:bg-white text-[#111111] border border-[#E5E5E5] shadow transition-colors focus:outline-none"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 sm:p-2.5 bg-white/90 hover:bg-white text-[#111111] border border-[#E5E5E5] shadow transition-colors focus:outline-none"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Pagination Bar */}
        {activeSlides.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1.5 z-20">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 transition-all duration-300 rounded-full ${
                  idx === currentIndex ? 'w-6 bg-white shadow' : 'w-2.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
