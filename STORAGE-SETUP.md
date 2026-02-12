# Image Storage Setup Guide

## Overview

Images from NanoBanana are **temporary URLs that expire**. We download them and upload to **Supabase Storage** for permanent hosting.

## Setup Supabase Storage

### 1. Create Storage Bucket

Go to your Supabase project dashboard:

1. Navigate to **Storage** in the left sidebar
2. Click **"New bucket"**
3. Bucket name: `brief-images`
4. **Public bucket**: ✅ Yes (images need to be publicly accessible)
5. Click **"Create bucket"**

### 2. Set Storage Policies

The bucket needs to be publicly readable. Create these policies:

#### Allow Public Read Access

```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brief-images');
```

#### Allow Authenticated Upload

```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brief-images');
```

#### Allow Service Role Full Access

```sql
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'brief-images');
```

### 3. Configure in Supabase Dashboard

Alternatively, use the UI:

1. Go to **Storage** → **Policies**
2. Click **"New Policy"**
3. Choose **"For full customization"**
4. Policy name: `Public read access`
5. Allowed operation: `SELECT`
6. Target roles: `public`
7. Using expression: `bucket_id = 'brief-images'`
8. Click **"Review"** → **"Save policy"**

Repeat for upload and service role policies.

## How It Works

### Image Flow

```
1. NanoBanana API generates image
   ↓
2. Returns temporary URL (expires in X hours)
   ↓
3. We download the image (fetch as Blob)
   ↓
4. Upload to Supabase Storage
   ↓
5. Get permanent public URL
   ↓
6. Save permanent URL in database
```

### File Structure

Images are organized by brief ID:

```
brief-images/
├── abc123-def456/
│   ├── avatar_primary_1234567890.png
│   ├── avatar_secondary_1234567890.png
│   ├── avatar_tertiary_1234567890.png
│   ├── section_brand_truth_1234567890.png
│   ├── section_market_context_1234567890.png
│   ├── section_problem_1234567890.png
│   ├── section_transformation_1234567890.png
│   └── section_proof_pillars_1234567890.png
└── xyz789-ghi012/
    └── ...
```

## Implementation Details

### Key Functions

**`lib/image-storage.ts`** contains:

- `downloadImage(url)` - Downloads image from temporary URL
- `uploadImageToStorage(blob, fileName)` - Uploads to Supabase
- `saveImagePermanently(tempUrl, briefId, imageType)` - Full flow
- `saveAllBriefImages(briefId, tempImages)` - Saves all 8 images
- `deleteBriefImages(briefId)` - Cleanup utility

### Usage in Generate Route

```typescript
// Step 1: Generate images (get temporary URLs)
const tempImages = await generateBriefImages(brief, businessName);

// Step 2: Save brief to database
const { data: savedBrief } = await supabase
  .from('v1_generated_briefs')
  .insert({ brief, deliverables, images: tempImages })
  .select('id')
  .single();

// Step 3: Download and upload to permanent storage
const permanentImages = await saveAllBriefImages(savedBrief.id, tempImages);

// Step 4: Update database with permanent URLs
await supabase
  .from('v1_generated_briefs')
  .update({ images: permanentImages })
  .eq('id', savedBrief.id);
```

## Environment Variables

Make sure these are set:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The service role key is needed for server-side uploads.

## Testing

### Test Image Upload

```bash
# Create a test image
curl -X POST http://localhost:3012/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "crawlResult": { "mainUrl": "https://example.com", "pages": [...] },
    "generateImages": true
  }'
```

Check Supabase Storage dashboard to verify images were uploaded.

## Storage Limits

### Supabase Free Tier
- **Storage**: 1 GB
- **Bandwidth**: 2 GB/month
- **Cost**: Free

### Paid Plans
- **Pro**: $25/month for 100 GB storage + 200 GB bandwidth
- **Additional**: $0.021/GB storage, $0.09/GB bandwidth

### Image Sizes

Typical image sizes:
- Avatar images: ~200-500 KB each
- Section images: ~300-600 KB each
- Total per brief: ~3-4 MB (8 images)

**Free tier allows ~250 briefs** with images (1 GB / 4 MB).

## Optimization Tips

### 1. Compress Images

Add image compression before upload:

```typescript
import sharp from 'sharp';

async function compressImage(blob: Blob): Promise<Buffer> {
  const buffer = await blob.arrayBuffer();
  return await sharp(Buffer.from(buffer))
    .resize(1024, 1024, { fit: 'inside' })
    .webp({ quality: 80 })
    .toBuffer();
}
```

### 2. Lazy Loading

Only generate images when requested:

```typescript
// Don't generate all images upfront
generateImages: false  // Default

// Generate on-demand when viewing brief
await fetch('/api/generate-avatar-image', { ... });
```

### 3. CDN Caching

Supabase Storage includes CDN caching automatically.

### 4. Cleanup Old Images

Implement a cleanup job:

```typescript
// Delete images for briefs older than 30 days
const oldBriefs = await supabase
  .from('v1_generated_briefs')
  .select('id')
  .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

for (const brief of oldBriefs.data) {
  await deleteBriefImages(brief.id);
}
```

## Alternative Storage Options

If Supabase Storage doesn't work for you:

### Option 1: AWS S3

```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({ ... });

await s3.upload({
  Bucket: 'brief-images',
  Key: fileName,
  Body: imageBlob,
  ContentType: 'image/png',
  ACL: 'public-read',
}).promise();
```

### Option 2: Cloudinary

```typescript
import cloudinary from 'cloudinary';

const result = await cloudinary.v2.uploader.upload(imageUrl, {
  folder: 'briefs',
  public_id: fileName,
});

return result.secure_url;
```

### Option 3: Vercel Blob Storage

```typescript
import { put } from '@vercel/blob';

const blob = await put(fileName, imageBlob, {
  access: 'public',
});

return blob.url;
```

## Troubleshooting

### Images Not Appearing

1. **Check bucket is public**
   - Go to Storage → Settings
   - Verify "Public bucket" is enabled

2. **Check policies**
   - Go to Storage → Policies
   - Verify SELECT policy for public role exists

3. **Check CORS**
   - Usually handled automatically by Supabase
   - If issues, add CORS policy in dashboard

### Upload Fails

1. **Check service role key**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set
   - Check it's the service role key, not anon key

2. **Check file size**
   - Max file size: 50 MB by default
   - Increase in Storage settings if needed

3. **Check bucket exists**
   - Verify bucket name is correct
   - Default: `brief-images`

### Temporary URLs Still Showing

- Check if permanent storage step completed
- Look for `[Storage]` logs in console
- Verify database was updated with permanent URLs

## Monitoring

### Storage Usage

Check storage usage in Supabase dashboard:
1. Go to **Settings** → **Billing**
2. View storage metrics

### Cost Estimation

- Images per brief: 8
- Size per brief: ~4 MB
- Briefs per month: X
- Total storage: X × 4 MB
- Bandwidth: X × 4 MB × views per brief

**Example:**
- 100 briefs/month = 400 MB storage
- 10 views per brief = 4 GB bandwidth/month

## Related Files

| File | Purpose |
|------|---------|
| `lib/image-storage.ts` | Storage utility functions |
| `app/api/generate/route.ts` | Uses storage in brief generation |
| `lib/supabase.ts` | Supabase client configuration |

---

**Questions?** Check [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
