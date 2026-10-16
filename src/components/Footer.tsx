import React from 'react';
import { SiteSettings } from '../types.js';

interface FooterProps {
  settings: SiteSettings;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#111111] text-white pt-16 pb-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-neutral-800">
          
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex flex-col">
              <span className="font-editorial text-2xl font-bold tracking-tight text-white">
                {settings.siteName}
              </span>
              <span className="text-xs text-neutral-400 font-medium tracking-wide mt-1">
                {settings.siteSubtitle || 'Achi Soch Achi Zindagi'}
              </span>
            </div>
            <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
              {settings.siteDescription}
            </p>
            <div className="pt-2 text-xs text-neutral-500">
              Official Educational Publishing Platform · Islamabad, Pakistan
            </div>
          </div>

          {/* Navigation Column */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-neutral-300 font-semibold">
              Explore Content
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <button
                  onClick={() => onNavigate('articles')}
                  className="hover:text-white transition-colors"
                >
                  Articles & Essays (Urdu & English)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('videos')}
                  className="hover:text-white transition-colors"
                >
                  Video Lectures & Discussions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('books')}
                  className="hover:text-white transition-colors"
                >
                  Digital Bookstore & PDF Downloads
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors"
                >
                  About Soch Wale & Mission
                </button>
              </li>
            </ul>
          </div>

          {/* Official Social Media Column */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-neutral-300 font-semibold">
              Official Channels
            </h4>
            <p className="text-xs text-neutral-400">
              Join our growing community across all verified social media channels:
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {/* Instagram */}
              <a
                href={settings.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
                aria-label="Soch Wale on Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>

              {/* Facebook */}
              <a
                href={settings.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
                aria-label="Soch Wale on Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
                Facebook
              </a>

              {/* YouTube */}
              <a
                href={settings.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
                aria-label="Soch Wale on YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
                YouTube
              </a>

              {/* TikTok */}
              <a
                href={settings.socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
                aria-label="Soch Wale on TikTok"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                TikTok
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Rights Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>
            © {currentYear} {settings.siteName}. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button onClick={() => onNavigate('privacy')} className="hover:text-neutral-300 transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => onNavigate('terms')} className="hover:text-neutral-300 transition-colors">
              Terms & Conditions
            </button>
            <button onClick={() => onNavigate('purchase-policy')} className="hover:text-neutral-300 transition-colors">
              Digital Purchase & Download Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
