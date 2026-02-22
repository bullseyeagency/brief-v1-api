/**
 * @fileoverview Website crawler module for extracting content from web pages.
 * Uses sitemap-first strategy with BFS fallback.
 * Supports Shopify, WordPress/local, and generic platforms.
 */

import * as cheerio from 'cheerio';
import { CrawledPage, CrawlResult } from './types';

const MAX_PAGES = 15;
const FETCH_TIMEOUT = 10000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type BriefType = 'shopify' | 'local' | 'default';

interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

// ─── Slot allocations ─────────────────────────────────────────────────────────

const SHOPIFY_SLOTS = {
  pages: 4,
  priorityCollection: 1,
  otherCollections: 2,
  products: 5,
};

const LOCAL_SLOTS = {
  corePages: 6,
  services: 4,
  portfolio: 2,
};

// ─── Filter constants ─────────────────────────────────────────────────────────

const SHOPIFY_PAGES_ALLOWLIST = [
  'about', 'our-story', 'story', 'faq', 'reviews', 'process',
  'our-materials', 'science', 'sustainability', 'commitment',
  'contact', 'team', 'how-we',
];

const SHOPIFY_PRODUCTS_DENYLIST = [
  '-3-pack', '-4-pack', '-6-pack', '-8-pack',
  '-bundle', '-combo',
  '-subscription', '-prepaid', '-3-mo', '-6-mo', '-12-mo',
  '-bogo', '-free', '-promo', '-loyalty',
  '-copy', '-draft', '-ca',
  'cyber-week',
];

const SHOPIFY_COLLECTION_PRIORITY = [
  'best-sellers', 'top-sellers', 'bestsellers',
  'most-popular', 'featured', 'all', 'all-products',
];

const SHOPIFY_COLLECTION_SKIP = [
  'tv-promo', 'shop-by-city', 'shop-by-breed',
  'build-your-own', 'configurator',
];

const LOCAL_PAGES_ALLOWLIST = [
  'about', 'our-story', 'services', 'contact', 'faq',
  'process', 'gallery', 'portfolio', 'reviews',
  'testimonials', 'financing', 'team', 'our-work',
];

const LOCAL_PAGES_SKIP = [
  'privacy', 'terms', 'thank-you', 'promo',
  'registration', 'activate', 'sitemap',
  'blog', 'news', 'resources',
  'request-service', 'tag', 'category',
];

const US_STATE_ABBREVS = [
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga',
  'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md',
  'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj',
  'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc',
  'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy',
];

// ─── URL helpers ──────────────────────────────────────────────────────────────

function getPathname(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function isLocationPage(url: string): boolean {
  const path = getPathname(url);
  const segments = path.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || '';

  for (const state of US_STATE_ABBREVS) {
    if (last.endsWith(`-${state}`)) return true;
  }

  if (
    path.includes('/locations/') ||
    path.includes('/service-area/') ||
    path.includes('/request-service/')
  ) return true;

  if (path.includes('/contact-us/') && segments.length > 1) return true;

  return false;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CreativeBriefBot/1.0 (Website Analysis Tool)' },
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function parseFlatSitemap(url: string): Promise<string[]> {
  const text = await fetchPage(url);
  if (!text) return [];
  const $ = cheerio.load(text, { xmlMode: true });
  const urls: string[] = [];
  $('url').each((_, el) => {
    const loc = $(el).find('loc').first().text().trim();
    if (loc) urls.push(loc);
  });
  return urls;
}

async function parseSitemapIndex(url: string): Promise<SitemapEntry[]> {
  const text = await fetchPage(url);
  if (!text) return [];
  const $ = cheerio.load(text, { xmlMode: true });
  const entries: SitemapEntry[] = [];
  $('sitemap').each((_, el) => {
    const loc = $(el).find('loc').first().text().trim();
    const lastmod = $(el).find('lastmod').first().text().trim();
    if (loc) entries.push({ loc, lastmod });
  });
  return entries;
}

// ─── Sitemap discovery ────────────────────────────────────────────────────────

async function discoverSitemap(startUrl: string): Promise<string | null> {
  const origin = new URL(startUrl).origin;

  // 1. Try robots.txt
  const robotsText = await fetchPage(`${origin}/robots.txt`);
  if (robotsText) {
    const match = robotsText.match(/^Sitemap:\s*(.+)$/im);
    if (match) return match[1].trim();
  }

  // 2. Try common patterns
  const candidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/wp-sitemap.xml`,
  ];

  for (const candidate of candidates) {
    const text = await fetchPage(candidate);
    if (text && (text.includes('<sitemap>') || text.includes('<url>'))) {
      return candidate;
    }
  }

  return null;
}

// ─── Platform detection ───────────────────────────────────────────────────────

function detectPlatform(entries: SitemapEntry[]): 'shopify' | 'wordpress' | 'unknown' {
  const locs = entries.map(e => e.loc.toLowerCase());
  if (locs.some(l => l.includes('sitemap_products'))) return 'shopify';
  if (locs.some(l =>
    l.includes('page-sitemap') ||
    l.includes('wp-sitemap-posts-page') ||
    l.includes('post-sitemap')
  )) return 'wordpress';
  return 'unknown';
}

// ─── Shopify URL selection ────────────────────────────────────────────────────

function isEnglishSitemap(loc: string): boolean {
  try {
    const path = new URL(loc).pathname;
    return !/^\/[a-z]{2}\//.test(path);
  } catch {
    return true;
  }
}

async function selectShopifyUrls(entries: SitemapEntry[]): Promise<string[]> {
  const selected: string[] = [];

  const pagesSitemap = entries.find(e => e.loc.includes('sitemap_pages') && isEnglishSitemap(e.loc));
  const collectionsSitemap = entries.find(e => e.loc.includes('sitemap_collections') && isEnglishSitemap(e.loc));
  const productsSitemap = entries.find(e => e.loc.includes('sitemap_products') && isEnglishSitemap(e.loc));

  // Pages
  if (pagesSitemap) {
    try {
      const urls = await parseFlatSitemap(pagesSitemap.loc);
      const filtered = urls.filter(url => {
        const path = getPathname(url);
        return SHOPIFY_PAGES_ALLOWLIST.some(k => path.includes(k));
      });
      selected.push(...filtered.slice(0, SHOPIFY_SLOTS.pages));
    } catch {
      console.log('[Crawler] Shopify pages sitemap failed');
    }
  }

  // Collections
  if (collectionsSitemap) {
    try {
      const urls = await parseFlatSitemap(collectionsSitemap.loc);
      const eligible = urls.filter(url => {
        const path = getPathname(url);
        return !SHOPIFY_COLLECTION_SKIP.some(s => path.includes(s));
      });
      const priority = eligible.filter(url => {
        const path = getPathname(url);
        return SHOPIFY_COLLECTION_PRIORITY.some(p => path.includes(p));
      });
      const others = eligible.filter(url => !priority.includes(url));
      selected.push(...priority.slice(0, SHOPIFY_SLOTS.priorityCollection));
      selected.push(...others.slice(0, SHOPIFY_SLOTS.otherCollections));
    } catch {
      console.log('[Crawler] Shopify collections sitemap failed');
    }
  }

  // Products
  if (productsSitemap) {
    try {
      const urls = await parseFlatSitemap(productsSitemap.loc);
      const filtered = urls.filter(url => {
        const path = getPathname(url);
        if (SHOPIFY_PRODUCTS_DENYLIST.some(d => path.includes(d))) return false;
        const segments = path.split('/').filter(Boolean);
        const last = segments[segments.length - 1] || '';
        if (/^fb\d+$/.test(last) || /^kxl\d+/.test(last)) return false;
        if (/[-_]\d+$/.test(last)) return false;
        return true;
      });
      selected.push(...filtered.slice(0, SHOPIFY_SLOTS.products));
    } catch {
      console.log('[Crawler] Shopify products sitemap failed');
    }
  }

  return selected;
}

// ─── WordPress/Local URL selection ────────────────────────────────────────────

async function selectWordPressUrls(entries: SitemapEntry[]): Promise<string[]> {
  const selected: string[] = [];

  const isPageSitemap = (loc: string) =>
    loc.includes('page-sitemap') || loc.includes('wp-sitemap-posts-page');

  const isServiceSitemap = (loc: string) =>
    loc.includes('service-sitemap') || loc.includes('-service-');

  const isPortfolioSitemap = (loc: string) =>
    loc.includes('portfolio-sitemap') || loc.includes('-portfolio-');

  const isSkipped = (loc: string) =>
    loc.includes('post-sitemap') ||
    loc.includes('wp-sitemap-posts-post') ||
    loc.includes('category-sitemap') ||
    loc.includes('tag-sitemap') ||
    loc.includes('local-sitemap') ||
    loc.includes('news-sitemap');

  for (const entry of entries) {
    if (isSkipped(entry.loc)) continue;

    try {
      const urls = await parseFlatSitemap(entry.loc);

      if (isPageSitemap(entry.loc)) {
        const filtered = urls.filter(url => {
          const path = getPathname(url);
          if (isLocationPage(url)) return false;
          if (LOCAL_PAGES_SKIP.some(s => path.includes(s))) return false;
          return LOCAL_PAGES_ALLOWLIST.some(k => path.includes(k));
        });
        selected.push(...filtered.slice(0, LOCAL_SLOTS.corePages));
      } else if (isServiceSitemap(entry.loc)) {
        const filtered = urls.filter(url => !isLocationPage(url));
        selected.push(...filtered.slice(0, LOCAL_SLOTS.services));
      } else if (isPortfolioSitemap(entry.loc)) {
        selected.push(...urls.slice(0, LOCAL_SLOTS.portfolio));
      }
    } catch {
      console.log(`[Crawler] Sub-sitemap failed: ${entry.loc}`);
    }
  }

  return selected;
}

// ─── Flat sitemap fallback selection ─────────────────────────────────────────

async function selectFlatSitemapUrls(sitemapUrl: string, type: BriefType): Promise<string[]> {
  const urls = await parseFlatSitemap(sitemapUrl);
  if (!urls.length) return [];

  const allowlist = type === 'local' ? LOCAL_PAGES_ALLOWLIST : SHOPIFY_PAGES_ALLOWLIST;

  const filtered = urls.filter(url => {
    const path = getPathname(url);
    if (isLocationPage(url)) return false;
    return allowlist.some(k => path.includes(k));
  });

  return filtered.length
    ? filtered.slice(0, MAX_PAGES - 1)
    : urls.slice(0, MAX_PAGES - 1);
}

// ─── Page content extraction ──────────────────────────────────────────────────

function extractPageData(html: string, url: string): CrawledPage {
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, aside').remove();

  const title = $('title').text().trim() || '';
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';

  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 200) headings.push(text);
  });

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 10000);

  const links: string[] = [];
  const baseUrl = new URL(url);
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname === baseUrl.hostname && !links.includes(linkUrl.href)) {
        links.push(linkUrl.href);
      }
    } catch {}
  });

  return {
    url,
    title,
    metaDescription,
    headings: headings.slice(0, 20),
    bodyText,
    links: links.slice(0, 50),
  };
}

// ─── BFS fallback ─────────────────────────────────────────────────────────────

async function bfsCrawl(startUrl: string, type: BriefType): Promise<CrawledPage[]> {
  const pages: CrawledPage[] = [];
  const visited = new Set<string>();
  const toVisit: string[] = [startUrl];

  const priorityPaths: Record<BriefType, string[]> = {
    shopify: ['/collections', '/products', '/about', '/pages', '/reviews', '/faq'],
    local: ['/about', '/services', '/contact', '/reviews', '/testimonials', '/gallery', '/team'],
    default: ['/about', '/product', '/service', '/pricing', '/features', '/solutions'],
  };

  const priority = priorityPaths[type];

  while (toVisit.length > 0 && pages.length < MAX_PAGES) {
    const url = toVisit.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    const html = await fetchPage(url);
    if (!html) continue;

    const pageData = extractPageData(html, url);
    pages.push(pageData);

    const newLinks = pageData.links.filter(link => !visited.has(link));
    newLinks.sort((a, b) => {
      const aPath = new URL(a).pathname.toLowerCase();
      const bPath = new URL(b).pathname.toLowerCase();
      const aPriority = priority.some(p => aPath.includes(p)) ? 0 : 1;
      const bPriority = priority.some(p => bPath.includes(p)) ? 0 : 1;
      return aPriority - bPriority;
    });

    toVisit.push(...newLinks);
  }

  return pages;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Crawls a website using sitemap-first strategy with BFS fallback.
 * @param startUrl - The URL to crawl
 * @param type - Brief type: 'shopify' | 'local' | 'default'
 */
export async function crawlWebsite(startUrl: string, type: BriefType = 'default'): Promise<CrawlResult> {
  const normalizedStart = new URL(startUrl).href;
  const origin = new URL(startUrl).origin;

  console.log(`[Crawler] Starting crawl: ${startUrl} (type: ${type})`);

  try {
    const sitemapUrl = await discoverSitemap(startUrl);

    if (!sitemapUrl) {
      console.log('[Crawler] No sitemap found, using BFS');
      const pages = await bfsCrawl(startUrl, type);
      return { mainUrl: normalizedStart, pages, crawledAt: new Date().toISOString() };
    }

    console.log(`[Crawler] Sitemap: ${sitemapUrl}`);

    const sitemapText = await fetchPage(sitemapUrl);
    if (!sitemapText) throw new Error('Sitemap fetch failed');

    const isSitemapIndex = sitemapText.includes('<sitemapindex') || sitemapText.includes('<sitemap>');

    let selectedUrls: string[] = [];

    if (isSitemapIndex) {
      const entries = await parseSitemapIndex(sitemapUrl);
      const platform = detectPlatform(entries);
      console.log(`[Crawler] Platform: ${platform}`);

      if (platform === 'shopify') {
        selectedUrls = await selectShopifyUrls(entries);
      } else if (platform === 'wordpress') {
        selectedUrls = await selectWordPressUrls(entries);
      } else {
        selectedUrls = await selectFlatSitemapUrls(sitemapUrl, type);
      }
    } else {
      console.log('[Crawler] Flat sitemap');
      selectedUrls = await selectFlatSitemapUrls(sitemapUrl, type);
    }

    // Always include homepage
    const homepage = `${origin}/`;
    if (!selectedUrls.includes(homepage)) {
      selectedUrls = [homepage, ...selectedUrls];
    }

    // Deduplicate and cap
    selectedUrls = [...new Set(selectedUrls)].slice(0, MAX_PAGES);
    console.log(`[Crawler] Selected ${selectedUrls.length} URLs`);

    // Crawl selected URLs
    const pages: CrawledPage[] = [];
    for (const url of selectedUrls) {
      try {
        const html = await fetchPage(url);
        if (!html) continue;
        pages.push(extractPageData(html, url));
      } catch {
        console.log(`[Crawler] Failed: ${url}`);
      }
    }

    if (pages.length === 0) {
      console.log('[Crawler] No pages from sitemap, using BFS');
      const bfsPages = await bfsCrawl(startUrl, type);
      return { mainUrl: normalizedStart, pages: bfsPages, crawledAt: new Date().toISOString() };
    }

    console.log(`[Crawler] Complete: ${pages.length} pages`);
    return { mainUrl: normalizedStart, pages, crawledAt: new Date().toISOString() };

  } catch (error) {
    console.log(`[Crawler] Sitemap strategy failed (${error}), using BFS`);
    const pages = await bfsCrawl(startUrl, type);
    return { mainUrl: normalizedStart, pages, crawledAt: new Date().toISOString() };
  }
}

/**
 * Converts a CrawlResult into a human-readable summary for AI prompts.
 */
export function summarizeCrawlResult(result: CrawlResult): string {
  let summary = `Website: ${result.mainUrl}\n`;
  summary += `Pages crawled: ${result.pages.length}\n`;
  summary += `Crawled at: ${result.crawledAt}\n\n`;

  result.pages.forEach((page, i) => {
    summary += `--- Page ${i + 1}: ${page.url} ---\n`;
    summary += `Title: ${page.title}\n`;
    summary += `Description: ${page.metaDescription}\n`;
    summary += `Headings:\n${page.headings.map(h => `  - ${h}`).join('\n')}\n`;
    summary += `Content preview: ${page.bodyText.slice(0, 500)}...\n\n`;
  });

  return summary;
}
