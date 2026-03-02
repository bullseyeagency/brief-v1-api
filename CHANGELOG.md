# Creative Brief Generator - Changelog

## v1.01 (2026-01-17)

### New Features
- **OpenAI 5.x Models**: Added support for GPT-5, GPT-5 Mini, GPT-4.1, and GPT-4.1 Mini
- **Separate Results Page**: Results now display on `/brand-output` instead of the main page
- **Progress Bar**: Visual progress indicator with percentage (0-100%) during generation
- **Task Log Window**: Real-time log showing each step of the generation process
- **Debug Console**: New tab on results page showing:
  - Generation metadata (provider, model, timestamp)
  - Complete task log from generation
  - Expandable AI prompts (System, Brief Generation, Deliverables)
- **Estimated Time Display**: Shows approximate time remaining during generation

### UI Improvements
- Results page has three tabs: Creative Brief, Deliverables, Debug Console
- Each deliverable has a copy-to-clipboard button
- Download buttons for individual files and "Download All"
- "New Brief" navigation to start over
- Version number displayed in header and footer

### Technical Changes
- Added `lib/store.ts` for localStorage-based state management between pages
- Added `components/DeliverablesViewer.tsx` for deliverables display
- Prompts are now captured and stored for debugging
- Auto-redirect to results page on completion

### Bug Fixes
- Fixed OpenAI API compatibility: use `max_completion_tokens` instead of `max_tokens` for GPT-5.x models
- Fixed deliverables rendering crash when AI returns structured objects instead of strings
- Added smart formatting for Facebook campaign objects (campaignName, objective, targetAvatar, etc.)
- Added smart formatting for TV commercial objects (openingHook, voiceover, etc.)
- Download functions now handle both string and object deliverable formats

---

## v1.00 (2026-01-17)

### Initial Release
- URL input with validation
- Multi-provider AI support (Claude, OpenAI, Gemini)
- Website crawling (up to 10 pages)
- Creative Brief generation following Mercenary Creative System
- Deliverables generation (Website Summary, Facebook Campaigns, TV Commercial)
- Brief viewer with collapsible sections
- Avatar cards with feature/benefit/WIIFM display
- Proof pillar cards with evidence types
- Download functionality for all outputs
- Em-dash sanitization
- Brief validation (3 avatars, 5 proof pillars)
