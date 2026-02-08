/**
 * Data normalization and content cleanup engine
 * Cleans crawled data before sending to AI for brief generation
 */

import { CrawledPage, CrawlResult } from './types';

interface CleanedHeading {
  level: 'h1' | 'h2' | 'h3';
  text: string;
}

interface CleanedPage {
  url: string;
  canonicalUrl: string;
  type: 'homepage' | 'product' | 'collection' | 'cart' | 'utility';
  title: string;
  metaDescription: string;
  headings: CleanedHeading[];
  cleanBodyText: string;
}

/**
 * Remove URL fragments and normalize
 */
function canonicalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove fragment
    urlObj.hash = '';

    // Normalize product URLs: prefer /products/* over /collections/*/products/*
    let pathname = urlObj.pathname;

    // Convert /collections/xyz/products/abc -> /products/abc
    const collectionsProductMatch = pathname.match(/\/collections\/[^\/]+\/products\/(.+)/);
    if (collectionsProductMatch) {
      pathname = `/products/${collectionsProductMatch[1]}`;
    }

    urlObj.pathname = pathname;
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Classify page type based on URL and content
 */
function classifyPage(url: string, title: string): CleanedPage['type'] {
  const pathname = new URL(url).pathname.toLowerCase();

  if (pathname === '/' || pathname === '') return 'homepage';
  if (pathname.includes('/products/')) return 'product';
  if (pathname.includes('/collections/')) return 'collection';
  if (pathname.includes('/cart')) return 'cart';
  if (pathname.includes('/newsletter') ||
      pathname.includes('/join') ||
      pathname.includes('/subscribe')) return 'utility';

  return 'utility';
}

/**
 * Remove noise from body text
 */
function cleanBodyText(text: string): string {
  // Patterns to remove
  const noisePatterns = [
    // Analytics and tracking
    /gtag\([^)]+\)/gi,
    /dataLayer\.push/gi,
    /google-analytics/gi,
    /facebook\.com\/tr/gi,

    // Common UI text
    /add to cart/gi,
    /continue shopping/gi,
    /view cart/gi,
    /checkout/gi,
    /sign up for.*newsletter/gi,
    /subscribe.*email/gi,
    /cookie.*consent/gi,
    /accept.*cookies/gi,

    // Navigation/Footer patterns
    /follow us on/gi,
    /social media/gi,
    /privacy policy/gi,
    /terms.*conditions/gi,
    /shipping.*returns/gi,

    // Repeated phrases (3+ times)
    /(.{20,}?)\1{2,}/gi,
  ];

  let cleaned = text;

  // Apply all patterns
  noisePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Remove very short fragments (likely UI artifacts)
  cleaned = cleaned
    .split('.')
    .filter(sentence => sentence.trim().length > 20)
    .join('. ');

  return cleaned;
}

/**
 * Structure headings with hierarchy
 */
function structureHeadings(headings: string[]): CleanedHeading[] {
  const structured: CleanedHeading[] = [];

  // First heading is usually h1
  if (headings.length > 0 && headings[0].length > 0) {
    structured.push({
      level: 'h1',
      text: headings[0]
    });
  }

  // Categorize remaining headings
  for (let i = 1; i < headings.length; i++) {
    const text = headings[i].trim();
    if (!text || text.length < 3) continue;

    // Long headings are likely h2 (section headers)
    // Short headings are likely h3 (sub-sections)
    const level = text.length > 30 ? 'h2' : 'h3';

    structured.push({ level, text });
  }

  return structured;
}

/**
 * Main cleanup function
 */
export function cleanupCrawlResult(crawlResult: CrawlResult): {
  cleanedPages: CleanedPage[];
  stats: {
    original: number;
    afterDedup: number;
    homepage: number;
    products: number;
    collections: number;
    discarded: number;
  }
} {
  const urlMap = new Map<string, CrawledPage>();

  // Step 1: Canonicalize and deduplicate URLs
  for (const page of crawlResult.pages) {
    const canonical = canonicalizeUrl(page.url);

    // Keep first occurrence or prefer /products/* over /collections/*/products/*
    if (!urlMap.has(canonical) || page.url.includes('/products/')) {
      urlMap.set(canonical, page);
    }
  }

  // Step 2: Classify and clean each page
  const cleanedPages: CleanedPage[] = [];
  const stats = {
    original: crawlResult.pages.length,
    afterDedup: urlMap.size,
    homepage: 0,
    products: 0,
    collections: 0,
    discarded: 0,
  };

  for (const [canonical, page] of urlMap) {
    const pageType = classifyPage(canonical, page.title);

    // Discard cart and utility pages
    if (pageType === 'cart' || pageType === 'utility') {
      stats.discarded++;
      continue;
    }

    // Update stats
    if (pageType === 'homepage') stats.homepage++;
    if (pageType === 'product') stats.products++;
    if (pageType === 'collection') stats.collections++;

    // Clean the page
    cleanedPages.push({
      url: page.url,
      canonicalUrl: canonical,
      type: pageType,
      title: page.title,
      metaDescription: page.metaDescription,
      headings: structureHeadings(page.headings),
      cleanBodyText: cleanBodyText(page.bodyText),
    });
  }

  return { cleanedPages, stats };
}

/**
 * Convert cleaned pages back to CrawlResult format for compatibility
 */
export function convertToLegacyFormat(
  cleanedPages: CleanedPage[],
  mainUrl: string,
  crawledAt: string
): CrawlResult {
  return {
    mainUrl,
    pages: cleanedPages.map(page => ({
      url: page.canonicalUrl,
      title: page.title,
      metaDescription: page.metaDescription,
      headings: page.headings.map(h => h.text),
      bodyText: page.cleanBodyText,
      links: [], // Links not needed after cleanup
    })),
    crawledAt,
  };
}
