import React, { useState } from 'react';
import { Search, User, Menu, X, LogIn, LogOut, ShieldCheck, BookOpen } from 'lucide-react';
import { SiteSettings, User as UserType } from '../types.js';

interface HeaderProps {
  settings: SiteSettings;
  currentUser: UserType | null;
  onNavigate: (view: string, param?: string) => void;
  currentView: string;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  onNavigate,
  currentView,
  onOpenAuth,
  onLogout,
  onOpenSearch
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', view: 'home' },
    { label: 'Articles', view: 'articles' },
    { label: 'Videos', view: 'videos' },
    { label: 'Books', view: 'books' },
    { label: 'About', view: 'about' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-20">
          
          {/* Zone 1: Brand Wordmark (Clean typography, logo removed) */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center text-left group focus:outline-none"
            >
              <div className="flex flex-col">
                <span className="font-editorial text-2xl font-bold tracking-tight text-[#111111] leading-none">
                  {settings.siteName}
                </span>
                <span className="text-[11px] tracking-wide text-[#666666] font-medium mt-1">
                  {settings.siteSubtitle || 'Achi Soch Achi Zindagi'}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4–5 single-line clean text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#111111]/80">
            {navLinks.map((link) => {
              const isActive = currentView === link.view;
              return (
                <button
                  key={link.view}
                  onClick={() => onNavigate(link.view)}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 hover:text-[#111111] ${
                    isActive ? 'text-[#111111] font-semibold' : 'text-[#666666]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111111]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions (Search & Account/Portal) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Search */}
            <button
              onClick={onOpenSearch}
              className="p-2 text-[#666666] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-full transition-colors focus:outline-none"
              title="Search articles, videos & books"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Auth / Account State */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.role === 'admin' ? (
                  <button
                    onClick={() => onNavigate('admin')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#111111] rounded-md hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin CMS
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('customer-account')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#111111] border border-[#111111] rounded-md hover:bg-[#F5F5F5] transition-colors whitespace-nowrap shrink-0"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    My Library
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="p-2 text-[#666666] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-full transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#111111] rounded-md hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                Account
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#111111] hover:bg-[#F5F5F5] rounded-md focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E5E5] bg-white px-4 py-6 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.view}
                onClick={() => {
                  onNavigate(link.view);
                  setMobileMenuOpen(false);
                }}
                className={`text-left text-base font-medium py-2 px-3 rounded-md transition-colors ${
                  currentView === link.view
                    ? 'bg-[#111111] text-white'
                    : 'text-[#111111] hover:bg-[#F5F5F5]'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
          
          <div className="pt-4 border-t border-[#E5E5E5] flex flex-col gap-2">
            {currentUser ? (
              <>
                <div className="text-xs text-[#666666] px-3">
                  Signed in as <span className="font-semibold text-[#111111]">{currentUser.name}</span>
                </div>
                {currentUser.role === 'admin' ? (
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center py-2.5 px-4 bg-[#111111] text-white text-sm font-semibold rounded-md"
                  >
                    WordPress Admin CMS
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onNavigate('customer-account');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center py-2.5 px-4 border border-[#111111] text-[#111111] text-sm font-semibold rounded-md"
                  >
                    My Purchased Books & Library
                  </button>
                )}
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2 text-xs text-red-600 font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-2.5 px-4 bg-[#111111] text-white text-sm font-semibold rounded-md"
              >
                Sign In / Customer Account
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
