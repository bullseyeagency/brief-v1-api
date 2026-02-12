# Creative Brief Booklet Format

## Overview

A magazine-style flip book presentation of creative briefs with smooth page transitions and professional layouts.

## Features

- **12 Pages** with professional magazine-style layouts
- **3D Flip Animation** using Swiper.js
- **Keyboard Navigation** (Arrow keys to flip pages)
- **Touch/Swipe Support** for mobile devices
- **Page Counter** showing current page
- **Responsive Design** adapts to different screen sizes

## Page Structure

1. **Cover Page** - Brand name and date
2. **Brand Foundation** - Truth, Promise, Unique Truth
3. **Market Context** - Landscape, Competition, Tension
4. **Avatar 1** - Primary avatar with image
5. **Avatar 2** - Secondary avatar with image
6. **Avatar 3** - Tertiary avatar with image
7. **The Challenge** - Problem and Tension
8. **Transformation** - Before/After states
9. **Proof Pillars** - 5 credibility pillars
10. **The Offer** - Core offer and CTA
11. **Messaging Guidelines** - Rules and tone
12. **Creative Direction** - Visual and narrative approach
13. **Back Cover** - Credits and metadata

## How to Access

### URL Format
```
http://localhost:3012/brief-booklet/[slug]
```

### Example
```
http://localhost:3012/brief-booklet/abc123
```

Replace `[slug]` with your brief's unique identifier.

## Navigation Controls

- **Arrow Keys**: ← Previous page, → Next page
- **Mouse Click**: Click left/right edges of page
- **Touch Swipe**: Swipe left/right on mobile
- **Navigation Buttons**: Chevron buttons on sides
- **Back Button**: Top-left corner returns to original brief

## Design Features

### Page Layouts

Each page type has a unique design:

- **Cover**: Gradient background with centered title
- **Content Pages**: Clean white/light backgrounds with section headers
- **Avatar Pages**: Image-first design with details below
- **Challenge Page**: Orange/red gradient for tension
- **Transformation Page**: Green gradient with before/after split
- **Back Cover**: Dark background with metadata

### Typography

- **Headings**: Large, bold, professional
- **Body Text**: Readable, relaxed line height
- **Labels**: Uppercase, tracked, subtle
- **Section Numbers**: Small, consistent positioning

### Color System

- **Brand Foundation**: Blue/Purple gradient accents
- **Problem**: Red/Orange gradient (tension)
- **Transformation**: Green gradient (success)
- **Proof**: Blue accents (trust)
- **Offer**: Purple/Pink gradient (action)

## Technical Implementation

### Libraries Used

- **Swiper.js** v11.x - Flip effect and navigation
- **Next.js 14** - React framework
- **Tailwind CSS** - Styling

### Key Features

```typescript
// Swiper Configuration
modules: [EffectFlip, Navigation, Pagination, Keyboard]
effect: "flip"
grabCursor: true
keyboard: { enabled: true }
```

### Page Structure

Each page is a `<SwiperSlide>` component with:
- Full-height container
- Overflow auto for long content
- Custom scrollbar styling
- Responsive padding

## Image Integration

Currently using placeholder images (Dicebear avatars). To add generated images:

1. Generate images via BriefViewer "Generate Image" buttons
2. Store image URLs in database
3. Fetch images in booklet page
4. Display in avatar pages

### Future Image Enhancement

```typescript
// Replace placeholder with generated image
<img
  src={generatedImageUrl || placeholderUrl}
  alt={avatar.name}
  className="w-full h-full object-cover"
/>
```

## Mobile Optimization

- Touch gestures for page flipping
- Responsive text sizing
- Adjusted padding for smaller screens
- Smooth animations

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS/Android)

## Performance

- Lazy loading of slides
- Optimized animations
- Minimal re-renders
- Fast page transitions (~300ms)

## Customization

### Change Page Aspect Ratio

```typescript
style={{
  aspectRatio: '8.5/11', // Standard letter
  // Or: '210/297' for A4
  // Or: '1/1' for square
}}
```

### Adjust Flip Speed

```typescript
<Swiper
  speed={600} // milliseconds
  ...
/>
```

### Custom Colors

Edit gradient classes in each `<SwiperSlide>`:
```typescript
className="bg-gradient-to-br from-blue-600 to-purple-600"
```

## Future Enhancements

- [ ] Add generated images to avatar pages
- [ ] Add section images to content pages
- [ ] PDF export functionality
- [ ] Print-optimized stylesheet
- [ ] Fullscreen mode
- [ ] Thumbnail navigation
- [ ] Page bookmarks
- [ ] Share/download options

## Troubleshooting

### Flip animation not working
- Check if Swiper CSS is imported
- Verify EffectFlip module is loaded

### Content overflow
- Check if container has `overflow-auto`
- Adjust padding for longer content

### Images not loading
- Verify image URLs are valid
- Check CORS settings for external images

## Related Files

| File | Purpose |
|------|---------|
| `/app/brief-booklet/[slug]/page.tsx` | Main booklet component |
| `/app/brief/[slug]/page.tsx` | Original brief display |
| `/lib/types.ts` | TypeScript interfaces |

---

**Questions?** Check the main project [README.md](./README.md) or [ARCHITECTURE.md](./ARCHITECTURE.md)
