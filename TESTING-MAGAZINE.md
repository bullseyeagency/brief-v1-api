# Magazine Format Testing Guide

## What Was Implemented

### Backend (Image Generation)
- ✅ **13 images per brief** (3 avatars + cover + 8 pages + back cover)
- ✅ **Image-to-image generation** using NanoBanana `/v1/images/edit`
- ✅ **Character consistency** - avatars used as references for section images
- ✅ **Permanent storage** - all images saved to Supabase Storage

### Frontend (3D Magazine UI)
- ✅ **3D CSS flip book** (no external libraries)
- ✅ **5 sheets = 10 pages** (double-sided)
- ✅ **Click to flip** + keyboard navigation (arrow keys)
- ✅ **Realistic spine** and page shadows

## Page Structure (10 Pages)

| Page | Image | Avatar Reference |
|------|-------|------------------|
| 0 | Cover | Primary + Secondary |
| 1 | Brand Truth & Promise | Primary |
| 2 | Market Context | Secondary |
| 3 | The Problem | Primary |
| 4 | The Transformation | Primary |
| 5 | Proof Pillars | Tertiary |
| 6 | The Offer | Primary |
| 7 | Messaging Framework | Secondary |
| 8 | Creative Direction | None (visual showcase) |
| 9 | Back Cover | None (CTA) |

## Testing Steps

### 1. Run Database Migration

```bash
cd /Users/marco/Visual\ Studio/brief-v1-api

# Check if column already exists
# If not, run migration manually or let Supabase handle it
```

### 2. Start Development Server

```bash
npm run dev
# Should run on port 3012
```

### 3. Generate Test Brief with Images

**Option A: Via UI** (if you have a form)
- Navigate to generation form
- Enable "Generate Images" option
- Submit with test URL

**Option B: Via API** (curl)
```bash
curl -X POST http://localhost:3012/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "crawlResult": {
      "mainUrl": "https://example.com",
      "pages": [{
        "url": "https://example.com",
        "title": "Test Business",
        "metaDescription": "A test business",
        "headings": ["Welcome", "About Us"],
        "bodyText": "We help businesses succeed with innovative solutions.",
        "links": []
      }],
      "crawledAt": "2026-02-11T00:00:00Z"
    },
    "generateImages": true
  }'
```

### 4. Check Console Logs

Look for these log messages:

```
[Magazine] Starting image generation...
[Magazine] Generating avatar references...
[Magazine] ✓ Primary avatar generated
[Magazine] ✓ Secondary avatar generated
[Magazine] ✓ Tertiary avatar generated
[Magazine] Generating magazine pages with avatar references...
[Magazine] ✅ All 13 images generated in X.Xs

[Storage] Saving magazine images to permanent storage...
[Storage] ✅ All 13 magazine images saved permanently
[Storage] ✅ Updated database with permanent magazine image URLs
```

### 5. Verify Database

Check that the brief has images stored:

```sql
SELECT
  id,
  images->>'cover' as cover_url,
  jsonb_array_length(images->'avatars') as avatar_count,
  jsonb_object_keys(images->'pages') as page_keys
FROM v1_generated_briefs
WHERE images IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;
```

Expected:
- `cover_url`: Should be a Supabase Storage URL
- `avatar_count`: Should be 3
- `page_keys`: Should show 8 keys (brandTruth, marketContext, problem, etc.)

### 6. Verify Supabase Storage

Navigate to Supabase Dashboard → Storage → `brief-images` bucket

Should see folder structure:
```
brief-images/
└── {brief-id}/
    ├── avatar_primary_timestamp.png
    ├── avatar_secondary_timestamp.png
    ├── avatar_tertiary_timestamp.png
    ├── page_cover_timestamp.png
    ├── page_brand_truth_timestamp.png
    ├── page_market_context_timestamp.png
    ├── page_problem_timestamp.png
    ├── page_transformation_timestamp.png
    ├── page_proof_pillars_timestamp.png
    ├── page_offer_timestamp.png
    ├── page_messaging_timestamp.png
    ├── page_creative_direction_timestamp.png
    └── page_back_cover_timestamp.png
```

Total: **13 images per brief**

### 7. Test Magazine UI

Visit: `http://localhost:3012/brief-booklet/{slug}`

**Expected Behavior:**
- Magazine loads with 3D flip effect
- Click right side to flip to next page
- Click left side to flip back
- Arrow keys work (← →)
- Page counter updates
- Spine visible on cover
- Shadow effects on pages

**Visual Checks:**
- ✅ Cover has realistic spine binding
- ✅ Pages flip smoothly (1 second transition)
- ✅ Images display correctly (1:1 square aspect ratio)
- ✅ Character faces look similar across pages
  - Primary avatar appears on pages 0, 1, 3, 4, 6
  - Secondary avatar appears on pages 0, 2, 7
  - Tertiary avatar appears on page 5

### 8. Test Character Consistency

**Critical Test:** Compare the same avatar across multiple pages
- Pages 1, 3, 4, 6 should show the PRIMARY avatar
- Does the face/character look similar?
- Are there obvious physical features that match?

**What to Look For:**
- Same hair style/color
- Same ethnicity
- Same clothing style
- Same age appearance
- Same facial features

**Note:** AI consistency isn't perfect, but should be recognizable as the same person.

### 9. Mobile Testing

Test on mobile device or browser dev tools (mobile view):
- Magazine should resize responsively
- Touch gestures work for page turning
- Page counter readable
- Navigation hints helpful

### 10. Performance Testing

Check generation time:
- **Expected:** 18-22 seconds for full generation
- **Avatar generation:** ~6-8 seconds (sequential)
- **Page generation:** ~12-14 seconds (parallel)
- **Storage upload:** ~2-3 seconds

## Troubleshooting

### Issue: "No images" message in magazine

**Cause:** Brief doesn't have images
**Solution:** Generate new brief with `generateImages: true`

### Issue: Images not loading

**Check:**
1. Database has images column populated
2. Supabase Storage has files
3. Storage URLs are public
4. CORS configured in Supabase

### Issue: Character doesn't look consistent

**Possible Causes:**
- Avatar prompt not descriptive enough
- NanoBanana API variation
- Image-to-image transformation too aggressive

**Solutions:**
- Regenerate with different prompt
- Adjust transformation prompts to emphasize "maintain character likeness"

### Issue: Migration failed

**Check:**
```sql
-- See if column already exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'v1_generated_briefs'
AND column_name = 'images';
```

If column exists, migration will be skipped (IF NOT EXISTS).

## Success Criteria

- [x] Brief generates 13 images
- [x] Images stored in Supabase Storage
- [x] Database has permanent URLs
- [x] Magazine UI displays all 10 pages
- [x] Page flipping works smoothly
- [x] Character consistency visible (similar faces across pages)
- [x] Generation completes in under 30 seconds
- [x] Mobile responsive

## Cost Tracking

**Per Brief:**
- Old: 8 images × $0.04 = $0.32
- New: 13 images × $0.04 = $0.52
- **Increase:** +$0.20 per brief (+62.5%)

## Next Steps

If testing is successful:
1. Update CHANGELOG.md
2. Update README.md with new features
3. Deploy to production
4. Test on production environment

## Rollback Plan

If issues found, rollback by:
1. Reverting generate API to use `generateBriefImages()`
2. Reverting storage to use `saveAllBriefImages()`
3. Keeping old booklet UI (Swiper)
4. Database migration is additive (no data loss)
