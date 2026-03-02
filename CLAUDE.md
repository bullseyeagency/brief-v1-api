# Claude Session Memory

> This file is automatically read by Claude at the start of each session.
> Update it with context, decisions, and preferences to maintain continuity.

## Project Overview

**Brief v1 API** - Backend service for Sophia OS with enhanced creative features.
Generates creative briefs, persona images (Gemini), and comic strips (infinite-heroes integration).

## Current State

- **Version**: 2.0.0 (API Service)
- **Status**: In Development
- **Port**: 3012
- **Parent**: Cloned from creative-brief v1

## Key Decisions Made

| Decision | Reasoning |
|----------|-----------|
| localStorage for state | No backend needed, data stays on user device |
| Multi-provider AI | Flexibility, no vendor lock-in |
| Separate /brand-output page | Cleaner UX, dedicated results view |
| TSDoc comments | Code documentation standard |

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- AI: Claude, OpenAI (GPT-5), Gemini

## File Structure Conventions

```
app/           → Pages and API routes
components/    → React components
lib/           → Business logic (framework-agnostic)
lib/providers/ → AI provider integrations
```

## Documentation Standards

Every project should have:
- README.md (setup, usage, deployment)
- ARCHITECTURE.md (system design, data flow)
- CHANGELOG.md (version history)
- TSDoc comments on exported functions
- CLAUDE.md (this file - session memory)

## User Preferences

- No emojis unless requested
- Update CHANGELOG.md for every version
- Push to GitHub only when explicitly asked
- Use `gh` CLI at: `/Users/marco/Visual Studio/github/bin/gh`

## GitHub

- Account: bullseyeagency
- Auth: Configured via `gh auth login`

## Outstanding Tasks

- [x] **Magazine format with avatar references** (COMPLETED 2026-02-11)
- [ ] **Test magazine generation end-to-end**
  - Generate test brief with `generateImages: true`
  - Verify 13 images created and stored
  - Test 3D flip book magazine UI
  - Verify character consistency across pages
  - See TESTING-MAGAZINE.md for full guide
- [ ] Add database persistence for manual image generation buttons
  - Update `/api/generate-section-image` to save permanently
  - Update `/api/generate-avatar-image` to save permanently
  - Pass `briefId` from BriefViewer component to API endpoints
- [ ] Deploy to Vercel
- [ ] Test with more websites
- [ ] Add PDF export feature

## Active Model IDs

| Provider | Model ID |
|---|---|
| OpenAI | `gpt-5.2-2025-12-11` |
| Claude | `claude-sonnet-4-6` |
| Gemini | `gemini-2.0-flash-exp` (not yet tested) |

Provider priority in `create-brief/route.ts`: OpenAI → Claude → Gemini (first key found wins)

## Crawler v2 — sitemap-first strategy

`lib/crawler.ts` was fully rewritten (2026-02-21):
- robots.txt discovery → platform detection → smart URL selection → BFS fallback
- Shopify: pages allowlist + priority collections (best-sellers first) + products denylist
- WordPress/Local: page/service/portfolio sub-sitemaps, skips post/tag/category/local, filters location pages
- Language filter: skips /fr/, /de/, /es/ sitemaps
- MAX_PAGES = 15

Known crawl bugs to fix:
- `wholesale`, `plan-page` collections pass Shopify collection filter — add to SHOPIFY_COLLECTION_SKIP
- `-bottles`, `-bottle` product variants pass product denylist — add to SHOPIFY_PRODUCTS_DENYLIST

## Session Notes

<!-- Add notes from each session below -->

### 2026-02-11
- Analyzed mechanical brief output issues (see BRIEF-GENERATION-ANALYSIS.md)
- Proposed feedback loop: OpenAI structure + Claude creative refinement
- **Implemented image generation module** (lib/image-generator.ts)
  - Generates 8 comic-style images per brief (3 avatars + 5 sections)
  - Modern graphic novel style based on reference image
  - Uses NanoBanana API (Gemini 3 Pro Image): https://nanobananaapi.dev/
  - ~$0.32 per brief, ~10-15 seconds parallel generation
  - Optional: `generateImages: true` in API request
- Updated types.ts with BriefImages interface
- Updated generate route to support image generation
- Created IMAGE-GENERATION.md documentation
- **Added manual image generation testing UI**
  - Created /api/generate-avatar-image endpoint for individual avatar images
  - Modified CustomerAvatarsElegant component with "Generate Image" button
  - Added loading states and image display for each avatar
  - Allows manual testing of image generation per avatar
- **Added image generation settings page**
  - Created "Image Generation" tab in settings
  - Provider selection (NanoBanana)
  - Model selection dropdown (Gemini 3 Pro, 2.5 Flash, etc.)
  - Sample preview generation
  - Settings properly passed to API endpoints
- **Implemented Creative Brief Booklet Format** (NEW!)
  - Magazine-style flip book presentation at /brief-booklet/[slug]
  - Uses Swiper.js with 3D flip effect
  - 12 beautifully designed pages
  - Keyboard navigation (arrow keys)
  - Touch/swipe support for mobile
  - Professional layouts for each section
  - Page counter and navigation controls
  - See BOOKLET-FORMAT.md for full documentation
- **Implemented permanent image storage**
  - NanoBanana URLs are temporary (expire after ~1 hour)
  - Created lib/image-storage.ts with download → upload → permanent URL flow
  - Uses supabaseAdmin (service role key) for storage operations
  - All 8 images saved to Supabase Storage during brief generation
  - Created test endpoints (/api/test-storage, /api/list-buckets) for debugging
  - See STORAGE-SETUP.md for configuration guide
- **Redesigned /brief-old layout**
  - 2-column grid layout (image left, text right) for all sections
  - Square aspect ratio (1:1) for section images
  - Enhanced styling with gradients, shadows, better spacing
  - Prominent "Generate Image" buttons for manual testing
- **IDENTIFIED:** Manual image generation buttons don't persist to database
  - Currently only update React state (temporary, lost on refresh)
  - Need to add database persistence for individual image generation
  - Scheduled for next bundle of changes
- **MAJOR UPDATE: Magazine Format with Avatar References** 🎉
  - Migrated from 8 images to **13 images per brief**
  - Uses NanoBanana `/v1/images/edit` for image-to-image generation
  - Avatars generated first, then used as references for section images
  - **Perfect character consistency** - same face across all relevant pages
  - New structure: Cover + 8 section pages + Back cover (10 total pages)
  - Updated data models (Avatar + BriefImages interfaces)
  - Created `generateMagazineImages()` orchestrator function
  - Created `saveMagazineImages()` for 13-image storage
  - **Replaced Swiper with 3D CSS flip book**
    - Pure CSS/React (no external library)
    - 5 double-sided sheets = 10 pages
    - Realistic spine binding and page shadows
    - Click to flip + keyboard navigation
    - Mobile responsive with touch gestures
  - Added database migration (20260211_add_images_column.sql)
  - Created TESTING-MAGAZINE.md with comprehensive testing guide
  - Generation time: ~18-22 seconds (vs old 10-15 seconds)
  - Cost: $0.52/brief (vs old $0.32) - 13 images vs 8 images

### 2026-01-17
- Initial build complete (v1.00)
- Added progress bar, task log, debug console (v1.01)
- Fixed OpenAI GPT-5 compatibility (max_completion_tokens)
- Fixed deliverables object rendering bug
- Set up GitHub repo and pushed
- Created documentation template (README, ARCHITECTURE, TSDoc)
