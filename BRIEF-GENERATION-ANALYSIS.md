# Brief Generation Analysis

**Date**: 2026-02-11
**Analyzed by**: Claude Sonnet 4.5
**Purpose**: Understanding why OpenAI-generated briefs feel "too mechanical" and proposing solutions

---

## Problem Statement

The current brief-v1-api generates creative briefs that feel "too mechanical" despite using sophisticated AI models (OpenAI GPT-4o, Claude, Gemini). The output lacks the natural, fluid, creative quality expected from a creative brief.

---

## Complete Data Flow: URL → Brief

```
┌─────────────────────────────────────────────────────────────────┐
│ USER SUBMITS URL                                                 │
│ POST /api/create-brief { url: "https://example.com" }          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: CRAWL (lib/crawler.ts)                                  │
│                                                                  │
│ • Fetch up to 10 pages                                          │
│ • Remove scripts, styles, nav, footer, header, aside           │
│ • Extract: title, meta, h1/h2/h3, body text (10k char limit)   │
│ • Extract internal links                                        │
│ • Priority pages: /about, /product, /pricing, /features        │
│                                                                  │
│ OUTPUT: CrawlResult {                                           │
│   mainUrl: string,                                              │
│   pages: [                                                      │
│     {                                                           │
│       url, title, metaDescription,                             │
│       headings: [...],                                         │
│       bodyText: "...", // 10k chars                            │
│       links: [...]                                             │
│     }                                                           │
│   ],                                                            │
│   crawledAt: "2026-02-11..."                                   │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: CLEANUP (lib/crawl-cleanup.ts)                          │
│                                                                  │
│ • Canonicalize URLs (deduplicate)                              │
│ • Classify pages (homepage, product, collection, cart, utility) │
│ • Discard cart + utility pages                                 │
│ • Remove noise patterns:                                        │
│   - Analytics/tracking code                                     │
│   - "Add to cart", "Continue shopping"                         │
│   - Cookie consent, newsletter signup                          │
│   - Privacy policy, terms, social media                        │
│   - Repeated phrases (3+ times)                                │
│ • Structure headings by level                                   │
│                                                                  │
│ OUTPUT: cleanedPages [                                          │
│   {                                                             │
│     url, canonicalUrl, type,                                   │
│     title, metaDescription,                                    │
│     headings: [{level: 'h1', text: '...'}],                   │
│     cleanBodyText: "..." // cleaned, no noise                  │
│   }                                                             │
│ ]                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: SUMMARIZE (lib/crawler.ts:summarizeCrawlResult)        │
│                                                                  │
│ Converts cleaned pages into text format:                        │
│                                                                  │
│ "Website: https://example.com                                   │
│  Pages crawled: 8                                               │
│  Crawled at: 2026-02-11...                                     │
│                                                                  │
│  --- Page 1: https://example.com ---                           │
│  Title: Example Company - Best Services                        │
│  Description: We provide amazing services...                    │
│  Headings:                                                      │
│    - Welcome to Example                                         │
│    - Our Services                                               │
│    - Why Choose Us                                              │
│  Content preview: We are a local company serving...            │
│  (first 500 chars only)                                        │
│                                                                  │
│  --- Page 2: ... ---                                           │
│  ..."                                                           │
│                                                                  │
│ OUTPUT: Single string with ~4-8 page summaries                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: BUILD PROMPT (lib/prompts.ts)                          │
│                                                                  │
│ Check metadata.type to choose prompt variant:                   │
│                                                                  │
│ IF type === 'local':                                            │
│   → buildLocalGenerationPrompt()                               │
│   "Analyze this LOCAL SERVICE BUSINESS..."                     │
│   Focus: geography, trust, personal service, local reviews     │
│                                                                  │
│ IF type === 'shopify':                                          │
│   → buildShopifyGenerationPrompt()                             │
│   "Analyze this ECOMMERCE STORE..."                            │
│   Focus: products, shipping, reviews, online experience        │
│                                                                  │
│ ELSE:                                                            │
│   → buildGenerationPrompt()                                    │
│   Generic prompt for any business type                         │
│                                                                  │
│ All prompts include:                                            │
│ • 9-step Mercenary system instructions                         │
│ • STRICT JSON schema with exactly 3 avatars, 5 proof pillars  │
│ • "NO em dash characters"                                      │
│ • "Keep sentences short and declarative"                       │
│ • Website summary from Step 3                                  │
│                                                                  │
│ OUTPUT: Prompt string (~3000-5000 words)                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: GENERATE BRIEF (OpenAI/Claude/Gemini)                  │
│                                                                  │
│ generateWithProvider({                                          │
│   systemPrompt: "You are a creative strategist...",           │
│   userPrompt: "[prompt from Step 4]",                         │
│   model: "gpt-4o" or "claude-sonnet-4" or "gemini-2.0-flash" │
│ })                                                              │
│                                                                  │
│ AI Response: JSON string                                        │
│ {                                                               │
│   "brandTruth": "We fix plumbing problems fast.",             │
│   "brandPromise": "Same-day service, guaranteed.",            │
│   "uniqueTruth": "Only 24/7 plumber in the county.",         │
│   "marketContext": "Homeowners need...",                      │
│   "avatars": [                                                 │
│     {                                                           │
│       "type": "primary",                                       │
│       "name": "Sarah Johnson",                                 │
│       "age": 42,                                               │
│       "background": "Busy working mom...",                     │
│       "currentState": "Stressed about broken pipe...",        │
│       "desire": "Fast, reliable help...",                     │
│       "transformation": "From panicked to relieved...",       │
│       ...                                                       │
│     },                                                          │
│     { ... secondary avatar ... },                              │
│     { ... tertiary avatar ... }                                │
│   ],                                                            │
│   "proofPillars": [                                            │
│     { "claim": "...", "evidence": "...", ... },               │
│     ... (exactly 5 total) ...                                  │
│   ],                                                            │
│   ...                                                           │
│ }                                                               │
│                                                                  │
│ OUTPUT: CreativeBrief JSON object                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: VALIDATE (lib/validation.ts)                           │
│                                                                  │
│ validateCreativeBrief(brief)                                    │
│ • Check for exactly 3 avatars                                   │
│ • Check for exactly 5 proof pillars                            │
│ • Check all required fields exist                              │
│ • Sanitize em dashes (replace with hyphens)                    │
│                                                                  │
│ OUTPUT: Validated brief (logs warnings, doesn't fail)          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: GENERATE DELIVERABLES (OpenAI/Claude/Gemini)           │
│                                                                  │
│ generateWithProvider({                                          │
│   systemPrompt: "You are a creative copywriter...",           │
│   userPrompt: buildDeliverablesPrompt(JSON.stringify(brief))  │
│ })                                                              │
│                                                                  │
│ Prompt: "Based on this creative brief, generate:              │
│   • Website Summary (2-3 paragraphs)                           │
│   • Creative Brief (formatted for humans)                      │
│   • 3 Facebook Campaigns (different avatars)                   │
│   • TV Commercial 30s script"                                  │
│                                                                  │
│ AI Response: JSON {                                             │
│   websiteSummary: "This company provides...",                  │
│   creativeBrief: "Brand Promise: ... Target: ...",            │
│   facebookCampaigns: [...],                                    │
│   tvCommercial30s: "SCENE 1: ..."                             │
│ }                                                               │
│                                                                  │
│ OUTPUT: Deliverables JSON object                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: SAVE TO DATABASE (Supabase)                            │
│                                                                  │
│ supabase.from('v1_generated_briefs').insert({                  │
│   source_url,                                                   │
│   crawl_result,      // Full crawl data                        │
│   brief,             // CreativeBrief JSON from Step 5         │
│   deliverables,      // Deliverables JSON from Step 7         │
│   provider,          // "openai", "claude", "gemini"           │
│   model,             // "gpt-4o", etc                          │
│   generation_time_ms,                                           │
│   is_public: true,                                              │
│   public_slug        // auto-generated: "abc123ef"             │
│ })                                                              │
│                                                                  │
│ OUTPUT: Database record with public URL                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ RETURN TO USER                                                   │
│                                                                  │
│ {                                                               │
│   success: true,                                                │
│   publicUrl: "/brief/abc123ef",                                │
│   briefId: "550e8400-...",                                     │
│   status: "complete"                                            │
│ }                                                               │
│                                                                  │
│ User visits /brief/abc123ef to see formatted brief             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Root Causes of Mechanical Output

### 1. Overly Rigid JSON Schema

The system enforces extremely strict structural requirements:

**File**: `lib/prompts.ts:1-287`

- **Exactly 3 avatars** - TypeScript enforces `[Avatar, Avatar, Avatar]` tuple
- **Exactly 5 proof pillars** - TypeScript enforces `[ProofPillar, ProofPillar, ProofPillar, ProofPillar, ProofPillar]`
- **Draconian punctuation rules**: "NO em dash characters anywhere"
- **Forced brevity**: "Keep sentences short and declarative"

```typescript
// From lib/types.ts:28-73
export interface CreativeBrief {
  avatars: [Avatar, Avatar, Avatar];           // Exactly 3, no flexibility
  proofPillars: [ProofPillar, ProofPillar, ProofPillar, ProofPillar, ProofPillar]; // Exactly 5
  // ... 70+ required fields
}
```

**Impact**: The AI is constrained to a formulaic structure, killing creative expression.

### 2. Data Truncation Issues

**File**: `lib/crawler.ts:10-203`

Severe context limitations:
- **10 pages max** per website (`MAX_PAGES = 10`)
- **10,000 chars** per page body text (line 76)
- **500 char previews** in summary (line 199)
- **20 headings max** per page (line 100)
- **50 links max** per page (line 102)

```typescript
const MAX_PAGES = 10;
const FETCH_TIMEOUT = 10000;

// Body text truncated
bodyText: $('body').text()
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 10000);  // Only 10k chars

// Summary preview truncated
summary += `Content preview: ${page.bodyText.slice(0, 500)}...\n\n`;
```

**Impact**: The AI never sees the full context, leading to generic, surface-level insights.

### 3. Aggressive Cleanup Removes Context

**File**: `lib/crawl-cleanup.ts:68-114`

The cleanup process removes potentially valuable content:

```typescript
const noisePatterns = [
  /add to cart/gi,
  /continue shopping/gi,
  /sign up for.*newsletter/gi,
  /follow us on/gi,
  /privacy policy/gi,
  /terms.*conditions/gi,
  // etc...
];
```

**Impact**: Testimonials in footers, social proof in headers, and brand voice indicators are discarded as "noise."

### 4. Two-Step Rigid Generation Compounds the Problem

**File**: `app/api/generate/route.ts:113-163`

1. **Step 1**: Generate highly structured JSON brief (constrained)
2. **Step 2**: Generate deliverables based on that rigid brief (further constrained)

The deliverables inherit the mechanical feel from the constrained brief.

### 5. Prompt Engineering Over-Constrains Creativity

**File**: `lib/prompts.ts:288-401` (Local variant example)

```text
Remember:
- NO em dash characters anywhere
- Extract REAL evidence from the website for proof pillars
- Make avatars feel like real people
- Keep sentences short and declarative
- Emphasize trust, proximity, and personal service throughout

Generate the complete JSON now:
```

**Impact**: The AI is told to "be creative" while simultaneously being handcuffed by rigid constraints.

---

## Proposed Solution: Feedback Loop Architecture

**Concept**: Use OpenAI for structure extraction + Claude for creative refinement

```
┌─────────────────────────────────────────────────────────────────┐
│ STEPS 1-5: SAME AS CURRENT SYSTEM                              │
│ (Crawl → Cleanup → Summarize → OpenAI Brief Generation)        │
│                                                                  │
│ OUTPUT from OpenAI: CreativeBrief JSON (structured but stiff)  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ NEW STEP 6: MERCENARY FRAMEWORK REFINEMENT (Claude)             │
│                                                                  │
│ Inject both the OpenAI brief AND the raw website data into     │
│ Claude with the 10-question Mercenary framework:               │
│                                                                  │
│ Prompt to Claude:                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ "You are a world-class creative strategist.             │   │
│ │                                                          │   │
│ │ You have TWO inputs:                                     │   │
│ │                                                          │   │
│ │ 1. STRUCTURED BRIEF (from OpenAI):                      │   │
│ │    [paste full CreativeBrief JSON]                      │   │
│ │                                                          │   │
│ │ 2. RAW WEBSITE DATA:                                     │   │
│ │    [paste cleanedCrawlResult or summary]                │   │
│ │                                                          │   │
│ │ The OpenAI brief is accurate but mechanical. Your job   │   │
│ │ is to transform it into compelling, human, fluid copy   │   │
│ │ using the Mercenary creative framework:                 │   │
│ │                                                          │   │
│ │ 1. THE PROMISE: What transformation do they offer?      │   │
│ │    [analyze OpenAI's brandPromise + raw data]           │   │
│ │                                                          │   │
│ │ 2. THE PROBLEM: What human problem are they solving?    │   │
│ │    [analyze OpenAI's humanProblem + raw data]           │   │
│ │                                                          │   │
│ │ 3. THE SOLUTION: How do they solve it?                  │   │
│ │    [analyze OpenAI's transformation + raw data]         │   │
│ │                                                          │   │
│ │ 4. AUDIENCE SEGMENTS: Who are their real customers?     │   │
│ │    [analyze OpenAI's avatars + raw data]                │   │
│ │                                                          │   │
│ │ 5. THE SALES ARGUMENT: Why should customers believe?    │   │
│ │    [analyze OpenAI's proofPillars + raw data]           │   │
│ │                                                          │   │
│ │ 6. THE USP: What makes them truly different?            │   │
│ │    [analyze OpenAI's uniqueTruth + raw data]            │   │
│ │                                                          │   │
│ │ 7. THE OFFERS: What are they selling?                   │   │
│ │    [analyze OpenAI's offer + raw data]                  │   │
│ │                                                          │   │
│ │ 8. PROOF POINTS: What evidence exists?                  │   │
│ │    [analyze OpenAI's proofPillars + find more in raw]   │   │
│ │                                                          │   │
│ │ 9. BRAND VOICE: How do they communicate?                │   │
│ │    [analyze OpenAI's toneGuidelines + raw data]         │   │
│ │                                                          │   │
│ │ 10. CONVERSION PATH: How do customers buy?              │   │
│ │     [analyze OpenAI's conversionPath + raw data]        │   │
│ │                                                          │   │
│ │ Write in natural, flowing language. Be insightful.      │   │
│ │ Be human. Reference specific details from the website.  │   │
│ │ Make this brief something a creative team would WANT    │   │
│ │ to read and be inspired by."                            │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ Claude Output: Natural, fluid, compelling creative brief        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: GENERATE DELIVERABLES (Claude, using refined brief)    │
│                                                                  │
│ Generate Facebook campaigns, website copy, video scripts, etc.  │
│ based on the human-friendly refined brief from Claude           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why This Feedback Loop Works

### Best of Both Worlds

| Provider | Strength | Role in Feedback Loop |
|----------|----------|----------------------|
| **OpenAI** | Structured data extraction, analytical processing | Initial brief generation, factual accuracy |
| **Claude** | Creative language, natural flow, human insight | Creative refinement, compelling copy |

### Key Benefits

1. **OpenAI does the heavy lifting**: Structure extraction, data analysis, avatar creation, proof identification
2. **Claude adds the humanity**: Takes structured data and transforms it into compelling, fluid, creative language
3. **Full context preserved**: Claude sees BOTH the OpenAI analysis AND the raw website data
4. **Mercenary framework applied correctly**: Used as a creative thinking tool, not a rigid structure
5. **No mechanical constraints**: Claude is free to be creative with language and format

---

## Implementation Options

### Option A: New API Endpoint
Create `/api/generate-with-refinement` that:
1. Calls existing generation flow (Steps 1-5)
2. Adds refinement step (Claude with Mercenary framework)
3. Returns refined brief + deliverables

### Option B: Modify Existing Flow
Update `/app/api/generate/route.ts` to:
1. Check for `useRefinement: true` flag
2. If true, add refinement step after OpenAI generation
3. Backward compatible with existing system

### Option C: Separate Refinement Service
Create `/api/refine-brief` that:
1. Takes existing brief ID
2. Fetches brief + crawl data from database
3. Runs Claude refinement
4. Saves refined version alongside original
5. Allows A/B comparison

---

## Next Steps

1. Decide on implementation approach (A, B, or C)
2. Build prompt template for Claude refinement
3. Test with 3-5 sample websites
4. Compare original vs. refined output quality
5. Measure generation time increase (estimate: +15-30 seconds)
6. Consider cost implications (additional Claude API call)

---

## Files Analyzed

| File | Purpose | Key Issues |
|------|---------|-----------|
| `lib/crawler.ts` | Website crawling | 10 page limit, 10k char limit, 500 char previews |
| `lib/crawl-cleanup.ts` | Data normalization | Aggressive cleanup removes context |
| `lib/prompts.ts` | Prompt engineering | Overly rigid constraints, formulaic structure |
| `lib/types.ts` | TypeScript interfaces | Exactly 3 avatars, exactly 5 proof pillars enforced |
| `lib/validation.ts` | Output validation | Enforces rigid structure, sanitizes em dashes |
| `app/api/generate/route.ts` | Generation orchestration | Two-step rigid process compounds mechanical feel |
| `app/api/create-brief/route.ts` | API entry point | Background processing, metadata handling |

---

## Conclusion

The mechanical output is not a limitation of the AI models themselves, but rather a result of:
1. Over-constraining prompts
2. Data truncation
3. Rigid schema enforcement
4. Two-step process that compounds rigidity

**The feedback loop solution leverages the strengths of both OpenAI (structure) and Claude (creativity) to produce briefs that are both accurate and compelling.**
