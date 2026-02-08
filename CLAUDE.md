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
- AI: Claude, OpenAI (GPT-5), Manus

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

- [ ] Deploy to Vercel
- [ ] Test with more websites
- [ ] Add PDF export feature

## Session Notes

<!-- Add notes from each session below -->

### 2026-01-17
- Initial build complete (v1.00)
- Added progress bar, task log, debug console (v1.01)
- Fixed OpenAI GPT-5 compatibility (max_completion_tokens)
- Fixed deliverables object rendering bug
- Set up GitHub repo and pushed
- Created documentation template (README, ARCHITECTURE, TSDoc)
