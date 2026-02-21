# Architecture

> System design and data flow for Creative Brief Generator v2.0

## Overview

This application follows a **server-side async processing architecture** with real-time status updates:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                                                             │
│   ┌─────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │  Homepage   │───▶│  Processing  │───▶│ Brief View   │  │
│   │  (API call) │    │  (Polling)   │    │ /brief/[slug]│  │
│   └─────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│                                                             │
│   ┌──────────────────┐         ┌────────────────────────┐  │
│   │ /api/create-brief│────────▶│ Netlify Background Fn  │  │
│   │ (Returns URL)    │         │ (Async Processing)     │  │
│   └──────────────────┘         └────────────────────────┘  │
│                                          │                   │
│   ┌──────────────────┐                  │                   │
│   │ /api/brief/[slug]│◀─────────────────┘                   │
│   │ (Get status/data)│                                       │
│   └──────────────────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                         │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │              Supabase PostgreSQL                      │  │
│   │                                                      │  │
│   │   • v1_generated_briefs (main table)              │  │
│   │   • status, progress, logs tracking               │  │
│   │   • brief & deliverables JSONB                    │  │
│   │   • metadata (type: local|shopify|default)        │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI SERVICES LAYER                         │
│                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│   │  OpenAI  │    │  Claude  │    │  Gemini  │            │
│   │ (gpt-4o) │    │(sonnet-4)│    │(flash-2) │            │
│   └──────────┘    └──────────┘    └──────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Complete User Journey

```
1. User enters URL on homepage
     ↓
2. POST /api/create-brief
     ↓
3. Creates database record (status: 'processing', progress: 30)
     ↓
4. Returns public URL immediately
     ↓
5. Redirects to /brief/[slug]
     ↓
6. Page polls /api/brief/[slug]/status every 10s
     ↓
7. Netlify background function processes brief async
     │
     ├─ Stage 1: Clean crawl data (30-35%)
     ├─ Stage 2: Generate brief (35-70%)
     ├─ Stage 3: Generate deliverables (70-95%)
     └─ Stage 4: Save & complete (95-100%)
     ↓
8. Status updates in real-time on frontend
     ↓
9. When complete, page reloads full brief data
     ↓
10. User views finished brief
```

### 1. Brief Creation (API Endpoint)

```
POST /api/create-brief
Input: { url, contactId?, metadata? }
    │
    ├── Validate URL format
    ├── Select AI provider (OpenAI > Claude > Gemini)
    ├── Crawl website (POST /api/crawl)
    ├── Create database record:
    │   • status: 'processing'
    │   • progress: 30
    │   • crawl_result: {...}
    │   • metadata: { type: 'local'|'shopify' }
    │   • logs: [...]
    ├── Invoke Netlify background function (async, don't wait)
    └── Return { success, publicUrl, briefId, status }
```

### 2. Background Processing (Netlify Function)

```
Netlify: process-brief-background
Input: { briefId, crawlResult, provider, model, apiKey }
    │
    ├── Fetch brief metadata (check type: local/shopify/default)
    ├── Safeguard: Skip if already completed or progress > 40%
    │
    ├─── STAGE 1: Clean Crawl Data (30-35%)
    │    ├── cleanupCrawlResult() - deduplicate pages
    │    ├── convertToLegacyFormat() - normalize structure
    │    └── Update status in database
    │
    ├─── STAGE 2: Generate Brief (35-70%)
    │    ├── buildSystemPrompt() - Mercenary framework rules
    │    ├── Choose prompt based on type:
    │    │   • buildLocalGenerationPrompt() for local
    │    │   • buildShopifyGenerationPrompt() for shopify
    │    │   • buildGenerationPrompt() for default
    │    ├── generateWithProvider() - send to AI
    │    ├── parseJsonResponse() - parse AI response
    │    ├── validateCreativeBrief() - check structure
    │    └── Update status (progress: 70)
    │
    ├─── STAGE 3: Generate Deliverables (70-95%)
    │    ├── buildDeliverablesPrompt() - inject brief into prompt
    │    ├── generateWithProvider() - send to AI
    │    ├── parseJsonResponse() - parse deliverables
    │    └── Update status (progress: 95)
    │
    └─── STAGE 4: Complete (95-100%)
         ├── sanitizeEmDashes() - clean output
         ├── Save brief and deliverables to database
         └── Set status: 'completed', progress: 100
```

### 3. Real-Time Status Updates

```
Frontend: /brief/[slug]
    │
    ├── Initial load: GET /api/brief/[slug]
    ├── If status !== 'completed':
    │   └── Poll GET /api/brief/[slug]/status every 10s
    │       ├── Update progress bar
    │       ├── Update current task
    │       ├── Append new logs
    │       └── If completed/failed: reload full data
    └── Display brief when complete
```

## Key Design Decisions

### Why Server-Side Processing?

- **Scalability**: Can process multiple briefs simultaneously
- **Security**: API keys never exposed to browser
- **Reliability**: Background functions can run up to 10 minutes
- **Consistency**: All briefs (homepage, sophia-os) use same flow

### Why Database Storage?

- **Persistence**: Briefs survive browser refresh
- **Sharing**: Public URLs can be shared with clients
- **History**: Track all generated briefs
- **Status Tracking**: Real-time progress updates
- **Integration**: sophia-os can link briefs to leads

### Why Background Processing?

- **User Experience**: Immediate response, no 60s wait
- **Timeout Protection**: Avoids API gateway timeouts
- **Progress Updates**: User sees real-time generation
- **Error Recovery**: Failed briefs can be retried

### Why Three Prompt Types?

- **Relevance**: Different businesses need different emphasis
- **Local**: Focus on geographic area, community trust, personal service
- **Shopify**: Focus on product quality, online experience, shipping
- **Default**: Generic ecommerce approach

### Why Backwards Progress Prevention?

- **User Confusion**: Progress should only move forward
- **Duplicate Detection**: Prevents Netlify retries from resetting progress
- **Data Integrity**: Ensures status reflects actual generation state

## Folder Structure

```
app/
├── api/
│   ├── create-brief/           # Main entry point
│   │   └── route.ts            # Creates brief, invokes background fn
│   ├── crawl/
│   │   └── route.ts            # Website crawling
│   ├── brief/
│   │   └── [slug]/
│   │       ├── route.ts        # Get brief data
│   │       └── status/
│   │           └── route.ts    # Get status only (for polling)
│   └── generate/               # DEPRECATED (old client-side flow)
├── brief/[slug]/
│   └── page.tsx                # New brief viewer (elegant design)
├── brief-old/[slug]/
│   └── page.tsx                # Old brief viewer (legacy)
├── briefs/
│   └── page.tsx                # List all briefs
├── brand-output/               # DEPRECATED (old client-side flow)
└── page.tsx                    # Homepage (API-based)

components/
├── BriefViewer.tsx             # Legacy brief display
├── DeliverablesViewer.tsx      # Handles old and new formats
├── CustomerAvatarsElegant.tsx  # New elegant avatar cards
├── ProofPillarsElegant.tsx     # New elegant proof display
├── CallToActionElegant.tsx     # New elegant CTA section
├── CreativeDirectionElegant.tsx # New elegant creative direction
├── DeliverablesElegant.tsx     # New elegant deliverables
└── 21st/                       # UI components library
    ├── ContainerScroll.tsx     # Scroll animation
    ├── TextGradientScroll.tsx  # Text animations
    └── ... (other UI components)

lib/
├── background-processor.ts     # Main async processing logic
├── prompts.ts                  # Prompt engineering (3 types)
├── crawler.ts                  # Website crawling
├── providers/                  # AI provider abstraction
│   ├── index.ts                # Factory function
│   ├── claude.ts               # Anthropic integration
│   ├── openai.ts               # OpenAI integration
│   └── gemini.ts               # Google Gemini integration
├── types.ts                    # TypeScript interfaces
├── validation.ts               # Brief validation
├── supabase.ts                 # Database client
└── store.ts                    # DEPRECATED (localStorage)

netlify/
└── functions/
    └── process-brief-background.ts  # Background processing entry

supabase/
└── migrations/
    ├── 20260208_v1_api_schema.sql          # Initial schema
    ├── 20260208_add_status_tracking.sql     # Status fields
    └── 20260209_add_metadata_column.sql     # Brief type tracking
```

## Type System

### Core Data Types

```typescript
// Crawl Data
CrawlResult {
  mainUrl: string
  pages: CrawledPage[]
  crawledAt: string
}

CrawledPage {
  url: string
  title: string
  metaDescription: string
  headings: string[]
  bodyText: string
  links: string[]
}

// Brief Structure
CreativeBrief {
  brandTruth: string
  brandPromise: string
  uniqueTruth: string

  marketContext: string
  competitiveLandscape: string
  marketTension: string

  avatars: Avatar[]          // Exactly 3

  humanProblem: string
  emotionalTension: string

  transformation: string
  beforeState: string
  afterState: string

  proofPillars: ProofPillar[]  // Exactly 5

  offer: string
  conversionPath: string
  callToAction: string

  messagingRules: string[]
  toneGuidelines: string[]
  forbiddenPhrases: string[]

  creativeDirections: string
  visualStyle: string
  narrativeApproach: string

  testingPlan: string
  hypotheses: string[]
  metrics: string[]
}

Avatar {
  type: 'primary' | 'secondary' | 'tertiary'
  name: string
  age: number
  background: string
  currentState: string
  desire: string
  conflict: string
  transformation: string
  moralArc: string
  featureBenefits?: FeatureBenefit[]  // Optional
  cinematicImagePrompt: string
}

ProofPillar {
  claim: string
  evidenceType: 'testimonial' | 'statistic' | 'case-study' | 'certification' | 'demonstration'
  evidence: string
  usageGuidance: string
}

// NEW: Deliverables Structure
Deliverables {
  websiteSummary: string

  facebookCampaigns: FacebookCampaign[]  // Array of 3 campaigns

  video8s: Video8s  // NEW: Replaces tvCommercial30s
}

FacebookCampaign {
  campaignName: string
  objective: string
  targetAvatar: 'Primary' | 'Secondary' | 'Tertiary'
  primaryText: string     // Max 125 chars
  headline: string        // Max 40 chars
  description: string     // Max 30 chars
  visualDirection: string
}

Video8s {
  recognition: Video8sSection      // 0-2 seconds
  proofInContext: Video8sSection   // 2-6 seconds
  beliefLock: Video8sSection       // 6-8 seconds
}

Video8sSection {
  duration: string
  purpose: string
  visualDirection: string
  voiceoverOrText: string
}

// Database Schema
V1GeneratedBrief {
  id: string
  source_url: string
  crawl_result: CrawlResult
  brief: CreativeBrief
  deliverables: Deliverables
  provider: string
  model: string
  public_slug: string
  is_public: boolean
  sophia_contact_id?: string
  metadata?: {
    type?: 'local' | 'shopify'
    companyName?: string
    source?: string
  }
  status: 'processing' | 'completed' | 'failed'
  progress: number
  current_task?: string
  logs: string[]
  error_message?: string
  created_at: string
}
```

## Prompt Engineering

### System Prompt (Shared for All Types)

The system prompt defines the Mercenary Creative System framework:

```
MANDATORY INTERNAL BUILD SEQUENCE:
  STEP 0 — INPUT ORIENTATION
  STEP 1 — HUMAN PROBLEM
  STEP 2 — BRAND ROLE
  STEP 3 — PROMISE AND UNIQUE TRUTH
  STEP 4 — PROOF PILLARS
  STEP 5 — EMOTIONAL TRANSFORMATION
  STEP 6 — MORAL OR TAKEAWAY
  STEP 7 — AVATARS
  STEP 8 — COPY ASSEMBLY
  STEP 9 — QUALITY CONTROL

OUTPUT REQUIREMENTS:
  - Exactly 3 avatars
  - Exactly 5 proof pillars
  - NO em dash characters
  - Valid JSON only
```

### User Prompts (3 Variants)

1. **buildLocalGenerationPrompt()**
   - For service-based businesses (type: 'local')
   - Emphasizes: geographic area, local trust, personal service
   - Avatars: local homeowners prioritizing proximity
   - Proof: community testimonials, years in area, local certifications

2. **buildShopifyGenerationPrompt()**
   - For ecommerce stores (type: 'shopify')
   - Emphasizes: product quality, online experience, shipping
   - Avatars: online shoppers comparing options
   - Proof: customer reviews, quality guarantees, shipping stats

3. **buildGenerationPrompt()**
   - Default/generic (no type specified)
   - Currently same as Shopify but less specific

### Deliverables Prompt

Executes strategy from brief without reinterpretation:
- Strict adherence to brief decisions
- One dominant proof per execution
- No new claims or invented proof
- Resolution over excitement

## Progress Tracking

### Progress Stages

| Progress | Stage | Description |
|----------|-------|-------------|
| 0-30% | Initial | Database record created, crawl complete |
| 30-35% | Cleaning | Deduplicating and normalizing crawl data |
| 35-40% | Prompts | Building AI prompts based on brief type |
| 40-55% | Brief Request | Sending to AI, waiting for response |
| 55-70% | Brief Parsing | Parsing and validating AI response |
| 70-80% | Deliverables Request | Generating campaigns and video |
| 80-95% | Deliverables Parsing | Parsing deliverables response |
| 95-100% | Completion | Saving to database, finalizing |

### Safeguards

1. **Backwards Progress Prevention**
   - `updateBriefStatus()` checks current progress before updating
   - Blocks updates that would move progress backwards
   - Logs warning when attempted

2. **Duplicate Run Prevention**
   - `processBriefGeneration()` checks status at start
   - Skips if already completed/failed
   - Skips if progress > 40% (likely duplicate invocation)

## Debug Logging

All AI requests and responses are logged to console for debugging:

```
═══════════════════════════════════════════════════════
📤 SENDING TO AI: BRIEF GENERATION
═══════════════════════════════════════════════════════
Provider: openai
Model: gpt-4o

--- SYSTEM PROMPT ---
[Full system prompt]

--- USER PROMPT ---
[Full user prompt with website data]
═══════════════════════════════════════════════════════

═══════════════════════════════════════════════════════
📥 AI RESPONSE: BRIEF GENERATION
═══════════════════════════════════════════════════════
Response length: 4523 characters

--- RAW RESPONSE ---
[Full JSON response]
═══════════════════════════════════════════════════════

✅ Brief parsed successfully
```

Logs appear in:
- Local: Terminal where brief-v1-api runs
- Production: Netlify function logs

## Error Handling

```
Input Validation Errors     → 400 response with specific error
Crawl Failures             → 400 with crawl error message
Database Errors            → 500 with "Failed to create brief record"
AI Parsing Errors          → Fallback deliverables + continue
Background Function Errors → Set status='failed', log error_message
Backwards Progress         → Warning logged, update blocked
Duplicate Processing       → Skipped silently with log
```

## Performance Considerations

- **Crawl Limit**: Max 10 pages (configurable via `MAX_PAGES`)
- **Priority Paths**: /about, /product, /service prioritized first
- **AI Timeout**: Handled by Netlify (10 minute max)
- **Polling Interval**: 10 seconds (balance between UX and load)
- **Database Queries**: Select only needed columns for status checks

## Security

- **API Keys**: Stored in environment variables only
- **Server-Side Only**: No client-side AI calls
- **Row Level Security**: Supabase RLS policies on v1_generated_briefs
- **Input Validation**: URL format checked, HTML stripped from crawl
- **Public URLs**: Optional, can be restricted via `is_public` flag

## Integration Points

### Sophia-OS Integration

Sophia-OS sends leads to brief generation:

```typescript
POST https://briefs.dalyandco.com/api/create-brief
{
  url: "https://company.com",
  contactId: "uuid",
  metadata: {
    companyName: "Company Name",
    source: "sophia-os",
    type: "local" // or "shopify"
  }
}

Response: {
  success: true,
  publicUrl: "https://briefs.dalyandco.com/brief/abc123",
  briefId: "uuid",
  status: "processing"
}
```

Sophia-OS stores `publicUrl` in `companies.brief_url` column.

## Future Improvements

- [ ] Streaming AI responses for real-time display
- [ ] Manual regeneration of specific sections
- [ ] Brief editing/refinement workflow
- [ ] Export to PDF/Docx
- [ ] Team collaboration and comments
- [ ] Custom prompt templates
- [ ] Brief versioning
- [ ] A/B testing framework for prompts
- [ ] Analytics on brief effectiveness
- [ ] Integration with project management tools
