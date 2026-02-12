# Image Generation for Creative Briefs

## Overview

Automatically generates 8 comic-style images for each creative brief using **NanoBanana API** (Gemini 3 Pro Image):
- **3 Avatar Images** (Primary, Secondary, Tertiary)
- **5 Brief Section Images** (Brand Truth, Market Context, Problem, Transformation, Proof Pillars)

## Visual Style

**Modern Graphic Novel / Contemporary Comic Style**

Based on reference: `/Users/marco/Downloads/Gemini_Generated_Image_41g2gy41g2gy41g2.png`

### Key Characteristics:
- Clean, smooth line work (not thick vintage outlines)
- Natural, realistic skin tones and hair
- Soft, muted color palette with pastels
- Subtle halftone dot patterns in backgrounds
- Professional, polished commercial illustration
- Multi-panel layouts with clean borders
- Modern comic typography

## Usage

### API Request

Add `generateImages: true` to the generate request:

```typescript
POST /api/generate

{
  "crawlResult": { /* ... */ },
  "provider": "openai",
  "model": "gpt-4o",
  "generateImages": true  // <-- Enable image generation
}
```

### Response

```typescript
{
  "brief": { /* CreativeBrief */ },
  "deliverables": { /* Deliverables */ },
  "images": {
    "avatars": [
      "data:image/png;base64,...",  // Primary avatar
      "data:image/png;base64,...",  // Secondary avatar
      "data:image/png;base64,..."   // Tertiary avatar
    ],
    "sections": {
      "brandTruth": "data:image/png;base64,...",
      "marketContext": "data:image/png;base64,...",
      "problem": "data:image/png;base64,...",
      "transformation": "data:image/png;base64,...",
      "proofPillars": "data:image/png;base64,..."
    }
  },
  "model": "gpt-4o",
  "provider": "openai"
}
```

## Image Details

### Avatar Images

**Layout:**
- Multi-panel comic layout
- Large center panel with character portrait
- 4-6 surrounding panels showing transformation journey
- Top banner with headline
- Speech bubble with character quote
- Circular badge icons

**Content:**
- Character based on avatar details (name, age, background)
- Before/after transformation panels
- Visual representation of desire and conflict
- Professional, relatable styling

**Example:**
```
TOP BANNER: "SARAH'S EVOLUTION: UNLOCK YOUR POTENTIAL!"
CENTER: Sarah holding phone, confident smile
SPEECH BUBBLE: "Fast, reliable help when I need it!"
SIDE PANELS: Problem → Solution → Success
BADGES: "24/7 Service", "Local Expert"
```

### Brief Section Images

#### 1. Brand Truth & Promise
- 2-panel split showing truth → promise
- Symbolic imagery
- Professional badge icons
- Gold/blue accent colors

#### 2. Market Context
- Marketplace overview
- Multiple vignettes showing segments
- Dynamic composition
- Business professional colors

#### 3. Problem & Tension
- Multi-panel escalation
- Worried expressions
- Muted, concerned color palette
- Thought bubbles showing stress

#### 4. Transformation
- Large before/after split
- Color shift: muted → vibrant
- Clear visual contrast
- Success indicators

#### 5. Proof Pillars
- 5 badge/shield icons arranged in pattern
- Each representing one proof pillar
- Gold/blue/green professional tones
- Achievement/certification style

## Cost & Performance

### Cost per Brief
- 8 images × ~$0.04 per image = **~$0.32 per brief**
- Total brief cost with images: ~$0.35-$0.40

### Performance
- Parallel generation: **~10-15 seconds** for all 8 images
- Sequential generation: ~60-80 seconds (not recommended)

## Configuration

### Environment Variables

```bash
# Required for image generation
NANOBANANA_API_KEY=your_nanobanana_api_key_here
```

Get your API key from: https://nanobananaapi.dev/

### Optional: Make Images Optional

Images are opt-in by default. Users must pass `generateImages: true`.

**To make images default:**

```typescript
// In /app/api/generate/route.ts
let { crawlResult, provider, model, apiKey, generateImages = true } = body;
//                                                                  ^^^^
```

## Error Handling

Image generation failures **do not fail the entire request**.

If images fail:
- Brief and deliverables still generated
- `images` field returns `null`
- Error logged to console
- User receives complete brief without images

## Storage Options

### Current: Base64 Data URLs
Images returned as `data:image/png;base64,...` strings.

**Pros:**
- No storage setup needed
- Immediate availability
- Works out of the box

**Cons:**
- Large payload size (~1-2MB per image)
- Not ideal for long-term storage

### Future: Supabase Storage

Upload images to permanent storage:

```typescript
// In lib/image-generator.ts

export async function uploadImageToStorage(
  base64Data: string,
  fileName: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('brief-images')
    .upload(fileName, base64ToBlob(base64Data));

  if (error) throw error;

  return supabase.storage
    .from('brief-images')
    .getPublicUrl(fileName).data.publicUrl;
}
```

## Testing

### Test with Sample Brief

```bash
# Generate brief with images
curl -X POST http://localhost:3012/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "crawlResult": { /* your crawl data */ },
    "generateImages": true
  }'
```

### Verify Image Output

Check that response includes:
- ✅ `images.avatars` array with 3 URLs
- ✅ `images.sections` object with 5 URLs
- ✅ All URLs are valid base64 data URLs or storage URLs

## Troubleshooting

### Images Not Generating

**Check:**
1. `NANOBANANA_API_KEY` is set in `.env.local`
2. `generateImages: true` in request
3. NanoBanana API quota not exceeded
4. Console for image generation errors

### Poor Image Quality

**Adjust prompts in:**
- `lib/image-generator.ts`
- Each `build*ImagePrompt()` function
- Add more specific style guidance
- Reference exact visual elements

### API Errors

**Common issues:**
- Invalid API key
- Quota exceeded
- Prompt too long (max ~1000 tokens)
- Safety filters blocking content

## Future Enhancements

- [ ] Add image style presets (vintage, modern, minimalist)
- [ ] Support custom brand colors
- [ ] Add watermarks or branding
- [ ] Generate multiple variations per image
- [ ] A/B test different visual styles
- [ ] Add image optimization (compression, resizing)
- [ ] Support video generation for transformations

## Related Files

| File | Purpose |
|------|---------|
| `lib/image-generator.ts` | Main image generation module |
| `lib/types.ts` | BriefImages interface |
| `app/api/generate/route.ts` | Integration point |
| `IMAGE-GENERATION.md` | This documentation |

---

**Questions?** Check the [BRIEF-GENERATION-ANALYSIS.md](./BRIEF-GENERATION-ANALYSIS.md) for full workflow context.
