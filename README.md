# Creative Brief Generator

> URL-to-Brief automation using the Mercenary Creative System

Transform any website into a complete creative brief with AI-powered analysis. Supports multiple AI providers (Claude, OpenAI, Gemini).

## Features

- **Website Crawling**: Automatically crawls up to 10 pages from any URL
- **Multi-Provider AI**: Choose between Claude, OpenAI (GPT-5), or Gemini
- **Mercenary Creative System**: Generates briefs following the 6-pillar cinematic arc
- **Progress Tracking**: Real-time progress bar and task log
- **Debug Console**: View exact prompts sent to AI
- **Export Options**: Download brief as JSON, deliverables as TXT

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Cheerio | HTML parsing for crawler |

## Getting Started

### Prerequisites

- Node.js 18+
- API key for at least one AI provider

### Installation

```bash
# Clone the repository
git clone https://github.com/bullseyeagency/creative-brief.git
cd creative-brief

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Usage

1. Enter a website URL
2. Select AI provider (Claude, OpenAI, or Gemini)
3. Enter your API key
4. Click "Generate Creative Brief"
5. View results on `/brand-output` page

## Project Structure

```
creative-brief/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── crawl/         # Website crawler endpoint
│   │   └── generate/      # AI generation endpoint
│   ├── brand-output/      # Results page
│   └── page.tsx           # Input form
├── components/            # React components
│   ├── BriefViewer.tsx    # Brief display with sections
│   └── DeliverablesViewer.tsx
├── lib/                   # Business logic
│   ├── crawler.ts         # Website crawling
│   ├── prompts.ts         # AI prompt templates
│   ├── providers/         # AI provider integrations
│   ├── store.ts           # Client-side state
│   ├── types.ts           # TypeScript interfaces
│   └── validation.ts      # Brief validation
└── CHANGELOG.md           # Version history
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/crawl` | POST | Crawl website, returns page content |
| `/api/generate` | POST | Generate brief from crawl data |

## Environment Variables

None required. Users provide their own API keys in the UI.

For server-side keys (optional):

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Deploy (no configuration needed)

### Other Platforms

```bash
npm run build
npm start
```

Supports: Netlify, Railway, Cloudflare Pages, any Node.js host

## Brief Output Structure

The generated brief includes:

- **Brand Truth & Promise**: Core brand identity
- **Market Context**: Competitive landscape
- **3 Avatars**: Primary, Secondary, Tertiary customer personas
- **Problem & Tension**: Human problem being solved
- **Transformation**: Before/after states
- **5 Proof Pillars**: Evidence supporting claims
- **Offer & CTA**: Conversion path
- **Messaging Rules**: Tone and forbidden phrases
- **Creative Directions**: Visual and narrative style
- **Testing Plan**: Hypotheses and metrics

## License

MIT

---

Built with Claude Code
