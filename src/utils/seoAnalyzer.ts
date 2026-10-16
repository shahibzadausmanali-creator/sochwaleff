import { SeoAnalysisResult } from '../types.js';

export function calculateSeoScore(params: {
  title: string;
  slug: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  featuredImage?: string;
}): SeoAnalysisResult {
  const {
    title = '',
    slug = '',
    content = '',
    seoTitle = '',
    seoDescription = '',
    focusKeyword = '',
    featuredImage = ''
  } = params;

  const kw = focusKeyword.trim().toLowerCase();
  const effectiveTitle = (seoTitle || title).trim();
  const effectiveDesc = (seoDescription || '').trim();
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const checks = {
    titleLength: effectiveTitle.length >= 30 && effectiveTitle.length <= 65,
    hasMetaDescription: effectiveDesc.length > 0,
    metaDescriptionLength: effectiveDesc.length >= 80 && effectiveDesc.length <= 160,
    hasKeyword: kw.length > 0,
    keywordInTitle: kw.length > 0 && effectiveTitle.toLowerCase().includes(kw),
    keywordInDescription: kw.length > 0 && effectiveDesc.toLowerCase().includes(kw),
    slugClean: slug.length > 0 && /^[a-z0-9\u0600-\u06FF-]+$/.test(slug) && !slug.includes(' '),
    contentLength: wordCount >= 250,
    hasImage: Boolean(featuredImage && featuredImage.trim().length > 0),
    hasHeadings: content.includes('\n') || content.includes('#') || content.length > 500
  };

  const suggestions: string[] = [];
  let score = 0;

  if (checks.titleLength) {
    score += 15;
  } else if (effectiveTitle.length > 0) {
    score += 8;
    suggestions.push(`SEO Title is ${effectiveTitle.length} characters (aim for 30–65 characters).`);
  } else {
    suggestions.push('Add an SEO Title for search engine listings.');
  }

  if (checks.metaDescriptionLength) {
    score += 15;
  } else if (checks.hasMetaDescription) {
    score += 8;
    suggestions.push(`Meta Description is ${effectiveDesc.length} characters (ideal is 80–160 characters).`);
  } else {
    suggestions.push('Add a Meta Description to summarize this article in search results.');
  }

  if (checks.hasKeyword) {
    score += 10;
    if (checks.keywordInTitle) {
      score += 10;
    } else {
      suggestions.push(`Include your focus keyword "${focusKeyword}" in the SEO Title.`);
    }

    if (checks.keywordInDescription) {
      score += 10;
    } else {
      suggestions.push(`Mention your focus keyword "${focusKeyword}" in the Meta Description.`);
    }
  } else {
    suggestions.push('Specify a Focus Keyword to evaluate on-page relevance.');
  }

  if (checks.slugClean) {
    score += 10;
  } else {
    suggestions.push('Ensure the URL slug uses only lowercase letters, numbers, and hyphens.');
  }

  if (checks.contentLength) {
    score += 15;
  } else {
    score += Math.min(10, Math.floor((wordCount / 250) * 15));
    suggestions.push(`Content length is ${wordCount} words (recommend at least 250+ words for educational articles).`);
  }

  if (checks.hasImage) {
    score += 10;
  } else {
    suggestions.push('Set a high-resolution featured image for article cards and social preview cards.');
  }

  if (checks.hasHeadings) {
    score += 5;
  } else {
    suggestions.push('Break up body text into multiple structured paragraphs or subheadings.');
  }

  const passedCount = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;

  return {
    score: Math.min(100, Math.max(0, score)),
    checks,
    passedCount,
    totalChecks,
    suggestions
  };
}
