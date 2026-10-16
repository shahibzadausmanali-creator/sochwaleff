import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Play } from 'lucide-react';
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
  interval = 3000, // 3-second animation cycle
  onNavigateUrl
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const activeSlides = slides.filter(s => s.isActive);

  // 3-second animation timer
  useEffect(() => {
    if (!autoSlide || isPaused || activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeSlides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [autoSlide, isPaused, activeSlides.length, interval]);

  if (activeSlides.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeSlides.length);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 35;
    const isRightSwipe = distance < -35;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleExploreClick = () => {
    if (onNavigateUrl) {
      onNavigateUrl('#articles');
    } else {
      const elem = document.querySelector('#articles') || document.querySelector('#books');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleWatchNowClick = () => {
    if (onNavigateUrl) {
      onNavigateUrl('#videos');
    } else {
      const elem = document.querySelector('#videos');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Hero Highlights"
    >
      {/* 16:9 Aspect Ratio Slider Container */}
      <div className="relative aspect-[16/9] min-h-[190px] sm:min-h-[260px] max-h-[460px] w-full bg-[#111111] overflow-hidden border border-[#E5E5E5] flex items-center shadow-sm select-none">
        
        {/* Smooth 3-Second Crossfade Slides (Full brightness, NO dark shade/overlay) */}
        <div className="absolute inset-0 overflow-hidden">
          {activeSlides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <img
                src={slide.imageUrl}
                alt={`Hero Slide ${idx + 1}`}
                className="w-full h-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>

        {/* CTA Actions Only: "Explore" and "Watch Now" (Subtitle and Heading removed) */}
        <div className="absolute bottom-3 sm:bottom-8 left-3 sm:left-8 z-20 flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleExploreClick}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-6 py-1.5 sm:py-2.5 bg-[#111111] text-white text-[10px] sm:text-xs uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all shadow-xl active:scale-95 border border-white/20"
          >
            <span>Explore</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          <button
            onClick={handleWatchNowClick}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-6 py-1.5 sm:py-2.5 bg-white text-[#111111] text-[10px] sm:text-xs uppercase tracking-widest font-bold hover:bg-neutral-100 transition-all shadow-xl active:scale-95 border border-[#E5E5E5]"
          >
            <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
            <span>Watch Now</span>
          </button>
        </div>

        {/* Navigation Arrows (Visible & touch-friendly on both mobile and desktop) */}
        {activeSlides.length > 1 && (
          <div className="absolute right-2.5 sm:right-6 bottom-3 sm:bottom-8 flex items-center gap-1.5 sm:gap-2 z-20">
            <button
              onClick={handlePrev}
              className="p-1.5 sm:p-2.5 bg-white/90 hover:bg-white text-[#111111] border border-[#E5E5E5] shadow transition-colors focus:outline-none rounded-sm active:scale-95"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 sm:p-2.5 bg-white/90 hover:bg-white text-[#111111] border border-[#E5E5E5] shadow transition-colors focus:outline-none rounded-sm active:scale-95"
              aria-label="Next slide"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {/* 3-Second Animated Progress Bar & Pagination */}
        {activeSlides.length > 1 && (
          <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-6 flex items-center gap-1.5 z-20 bg-black/50 backdrop-blur-sm px-2 sm:px-2.5 py-1 rounded-full">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
                style={{ width: idx === currentIndex ? '24px' : '6px' }}
                aria-label={`Slide ${idx + 1}`}
              >
                <div className="absolute inset-0 bg-white/30" />
                {idx === currentIndex && (
                  <div
                    key={currentIndex}
                    className="absolute inset-0 bg-white"
                    style={{
                      animation: `sliderProgress ${interval}ms linear forwards`
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes sliderProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </section>
  );
};
