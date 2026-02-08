/**
 * @fileoverview Website crawler module for extracting content from web pages.
 * Uses Cheerio for HTML parsing and implements breadth-first crawling
 * with priority for important pages (about, pricing, features, etc.)
 */

import * as cheerio from 'cheerio';
import { CrawledPage, CrawlResult } from './types';

/** Maximum number of pages to crawl per website */
const MAX_PAGES = 10;

/** Timeout in milliseconds for each page fetch */
const FETCH_TIMEOUT = 10000;

/**
 * Fetches the HTML content of a URL with timeout protection
 * @param url - The URL to fetch
 * @returns The HTML string or null if fetch fails
 * @internal
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CreativeBriefBot/1.0 (Website Analysis Tool)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Extracts structured data from HTML content
 * Removes scripts, styles, nav, footer, header, and aside elements
 * @param html - Raw HTML string
 * @param url - The URL of the page (for resolving relative links)
 * @returns CrawledPage object with title, meta, headings, body text, and links
 * @internal
 */
function extractPageData(html: string, url: string): CrawledPage {
  const $ = cheerio.load(html);

  // Remove script, style, and nav elements
  $('script, style, nav, footer, header, aside').remove();

  // Extract title
  const title = $('title').text().trim() || '';

  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';

  // Extract headings
  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 200) {
      headings.push(text);
    }
  });

  // Extract body text (limited)
  const bodyText = $('body').text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10000);

  // Extract internal links
  const links: string[] = [];
  const baseUrl = new URL(url);
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    try {
      const linkUrl = new URL(href, url);
      // Only include internal links
      if (linkUrl.hostname === baseUrl.hostname && !links.includes(linkUrl.href)) {
        links.push(linkUrl.href);
      }
    } catch {
      // Invalid URL, skip
    }
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

/**
 * Crawls a website starting from the given URL
 *
 * Implements breadth-first crawling with priority for important pages
 * like /about, /pricing, /features, etc. Stops after MAX_PAGES (10) pages.
 *
 * @param startUrl - The starting URL to crawl
 * @returns Promise resolving to CrawlResult with all crawled pages
 * @throws Error if the URL is invalid
 *
 * @example
 * ```typescript
 * const result = await crawlWebsite('https://example.com');
 * console.log(`Crawled ${result.pages.length} pages`);
 * ```
 */
export async function crawlWebsite(startUrl: string): Promise<CrawlResult> {
  const pages: CrawledPage[] = [];
  const visited = new Set<string>();
  const toVisit: string[] = [startUrl];

  // Normalize the start URL
  let normalizedStart: string;
  try {
    const urlObj = new URL(startUrl);
    normalizedStart = urlObj.href;
  } catch {
    throw new Error('Invalid URL provided');
  }

  while (toVisit.length > 0 && pages.length < MAX_PAGES) {
    const url = toVisit.shift()!;

    // Skip if already visited
    if (visited.has(url)) continue;
    visited.add(url);

    // Fetch and parse the page
    const html = await fetchPage(url);
    if (!html) continue;

    const pageData = extractPageData(html, url);
    pages.push(pageData);

    // Add new links to visit (prioritize important pages)
    const priorityPaths = ['/about', '/product', '/service', '/pricing', '/features', '/solutions'];
    const newLinks = pageData.links.filter(link => !visited.has(link));

    // Sort by priority
    newLinks.sort((a, b) => {
      const aPath = new URL(a).pathname.toLowerCase();
      const bPath = new URL(b).pathname.toLowerCase();
      const aPriority = priorityPaths.some(p => aPath.includes(p)) ? 0 : 1;
      const bPriority = priorityPaths.some(p => bPath.includes(p)) ? 0 : 1;
      return aPriority - bPriority;
    });

    toVisit.push(...newLinks);
  }

  return {
    mainUrl: normalizedStart,
    pages,
    crawledAt: new Date().toISOString(),
  };
}

/**
 * Converts a CrawlResult into a human-readable summary for AI prompts
 *
 * Formats all crawled pages with their titles, descriptions, headings,
 * and content previews in a structured text format.
 *
 * @param result - The CrawlResult from crawlWebsite()
 * @returns Formatted string summary of all crawled content
 *
 * @example
 * ```typescript
 * const result = await crawlWebsite('https://example.com');
 * const summary = summarizeCrawlResult(result);
 * // Use summary in AI prompt
 * ```
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
