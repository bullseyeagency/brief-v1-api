# Architecture

> System design and data flow for Creative Brief Generator

## Overview

This application follows a **3-tier architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌──────────────┐   │
│   │  Input Form │───▶│  Progress   │───▶│ Brand Output │   │
│   │   page.tsx  │    │   Display   │    │    Page      │   │
│   └─────────────┘    └─────────────┘    └──────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│                                                             │
│   ┌─────────────────┐         ┌──────────────────────┐     │
│   │  /api/crawl     │         │  /api/generate       │     │
│   │  Website fetch  │────────▶│  AI brief creation   │     │
│   └─────────────────┘         └──────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
│                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│   │  Claude  │    │  OpenAI  │    │  Manus   │            │
│   │ Provider │    │ Provider │    │ Provider │            │
│   └──────────┘    └──────────┘    └──────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Input
```
User enters URL → Validates format → Stores in React state
User selects provider → Loads provider config → Sets default model
User enters API key → Stored in memory (not persisted)
```

### 2. Crawling Phase
```
POST /api/crawl
    │
    ├── Fetch main URL
    ├── Parse HTML with Cheerio
    ├── Extract: title, meta, headings, body text, links
    ├── Follow internal links (up to 10 pages)
    └── Return CrawlResult
```

### 3. Generation Phase
```
POST /api/generate
    │
    ├── Build system prompt (Mercenary Framework rules)
    ├── Build generation prompt (crawl data + JSON schema)
    ├── Send to selected AI provider
    ├── Parse JSON response
    ├── Validate brief (3 avatars, 5 pillars)
    ├── Sanitize em-dashes
    ├── Generate deliverables (second AI call)
    └── Return { brief, deliverables, model, provider }
```

### 4. Results Display
```
Client receives response
    │
    ├── Save to localStorage (for page navigation)
    ├── Redirect to /brand-output
    └── Display in tabbed interface
```

## Key Design Decisions

### Why localStorage for state?
- Simplifies page navigation (no server session)
- Data persists on refresh
- No backend database needed
- User data stays on their device

### Why multi-provider support?
- Users may have different API keys
- Providers have different strengths
- Avoids vendor lock-in
- Easy to add new providers

### Why server-side crawling?
- Avoids CORS issues
- Can handle JavaScript-rendered pages (future)
- API key never exposed to browser console
- Rate limiting possible

## Folder Structure Rationale

```
app/                    # Next.js 14 App Router (file-based routing)
├── api/                # API routes (serverless functions)
│   ├── crawl/          # Isolated: only crawling logic
│   └── generate/       # Isolated: only AI generation
├── brand-output/       # Results page (separate from input)
└── page.tsx            # Main entry point

components/             # Reusable UI components
├── BriefViewer.tsx     # Complex: handles all brief sections
└── DeliverablesViewer.tsx  # Handles string/object formats

lib/                    # Business logic (framework-agnostic)
├── providers/          # AI provider abstraction
│   ├── index.ts        # Factory function
│   ├── claude.ts       # Anthropic SDK
│   ├── openai.ts       # OpenAI SDK
│   └── manus.ts        # HTTP client
├── crawler.ts          # Website crawling
├── prompts.ts          # Prompt engineering
├── store.ts            # Client state management
├── types.ts            # TypeScript interfaces
└── validation.ts       # Data validation
```

## Type System

### Core Types

```typescript
// Input
CrawlResult           # Website content
GenerateRequest       # API request payload

// Output
CreativeBrief         # 10-section brief structure
Avatar                # Customer persona (3 required)
ProofPillar           # Evidence item (5 required)
Deliverables          # Generated assets

// Config
AIProvider            # 'claude' | 'openai' | 'manus'
ProviderConfig        # Models and defaults
```

### Validation Rules

| Rule | Location | Purpose |
|------|----------|---------|
| Exactly 3 avatars | validation.ts | Mercenary Framework |
| Exactly 5 proof pillars | validation.ts | Mercenary Framework |
| No em-dashes | validation.ts | Clean typography |
| Valid URL format | api/crawl | Input sanitization |

## Error Handling

```
User Input Errors     → Show inline error message
Crawl Failures        → Return 400 with specific message
AI Parse Errors       → Fallback deliverables + retry hint
Network Errors        → Catch-all error display
```

## Performance Considerations

- **Crawl limit**: Max 10 pages to avoid long waits
- **Timeout**: 2 minutes for AI generation
- **Caching**: None (each generation is unique)
- **Bundle size**: ~200KB (mostly AI SDKs)

## Security

- API keys: Client-side only, never logged server-side
- No database: Nothing to breach
- Input validation: URL format checked before crawl
- Sanitization: HTML stripped from crawl results

## Future Improvements

- [ ] Stream AI responses for real-time display
- [ ] Save/load previous briefs
- [ ] Team collaboration features
- [ ] Custom prompt templates
- [ ] PDF export
