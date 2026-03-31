// ─── MOCK BLOG DATA ───
// Rich editorial content for Patry Closet fashion blog.
// Each post uses Markdown for body content (rendered via react-markdown).

export const BLOG_AUTHORS = {
  patricia: {
    id: 'patricia',
    name: 'Patricia Romero',
    role: 'Creative Director',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  },
  elena: {
    id: 'elena',
    name: 'Elena Vásquez',
    role: 'Fashion Editor',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80',
  },
  marcos: {
    id: 'marcos',
    name: 'Marcos Delgado',
    role: 'Sustainability Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
  },
  lucia: {
    id: 'lucia',
    name: 'Lucía Fernández',
    role: 'Style Consultant',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  },
};

export const BLOG_CATEGORIES = [
  { id: 'trends', labelKey: 'blog.categories.trends', fallback: 'Trends' },
  { id: 'sustainability', labelKey: 'blog.categories.sustainability', fallback: 'Sustainability' },
  { id: 'style-guides', labelKey: 'blog.categories.styleGuides', fallback: 'Style Guides' },
  { id: 'behind-the-brand', labelKey: 'blog.categories.behindBrand', fallback: 'Behind the Brand' },
  { id: 'collaborations', labelKey: 'blog.categories.collaborations', fallback: 'Collaborations' },
];

export const BLOG_SEASONS = [
  { id: 'spring-summer', labelKey: 'blog.seasons.springSummer', fallback: 'Spring/Summer' },
  { id: 'fall-winter', labelKey: 'blog.seasons.fallWinter', fallback: 'Fall/Winter' },
  { id: 'resort', labelKey: 'blog.seasons.resort', fallback: 'Resort' },
  { id: 'all-year', labelKey: 'blog.seasons.allYear', fallback: 'All Year' },
];

export const blogPosts = [
  {
    id: 1,
    slug: 'fall-2026-fashion-trends-you-need-to-know',
    titleKey: 'blog.post1.title',
    titleFallback: 'Fall 2026 Fashion Trends You Need to Know',
    excerptKey: 'blog.post1.excerpt',
    excerptFallback: 'From rich earth tones to sculptural silhouettes, discover the trends shaping this season\'s most coveted looks.',
    coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Model wearing fall 2026 fashion trends',
    category: 'trends',
    season: 'fall-winter',
    tags: ['fall-2026', 'trends', 'runway', 'color-palette'],
    author: BLOG_AUTHORS.patricia,
    publishedAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-20T14:30:00Z',
    readingTime: 8,
    featured: true,
    trending: true,
    badge: 'trending',
    relatedProductIds: [1, 3, 5],
    content: `
## The New Silhouette: Sculptural Meets Fluid

Fall 2026 marks a dramatic shift in how we think about shape. Designers from Milan to Paris are embracing **architectural draping** — structured shoulders meeting flowing hemlines in unexpected harmony.

![Sculptural fashion on the runway](https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=900&q=80)

The key pieces to invest in:
- **Cocoon coats** in rich camel and burgundy
- **Wide-leg trousers** with sharp pleats
- **Asymmetric midi dresses** that move with you

> "This season is about contrast — the rigid and the soft coexisting beautifully." — *Vogue Italia*

## Earth Tones Redefined

Forget basic beige. This season's palette draws from **volcanic rock, aged terracotta, and forest moss**. Think:

| Color | Where to Wear | Key Piece |
|-------|--------------|-----------|
| Burnt Sienna | Office to evening | Tailored blazer |
| Moss Green | Weekend brunch | Oversized knit |
| Slate Grey | Formal events | Column dress |
| Burgundy Wine | Date night | Silk blouse |

![Color palette inspiration](https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=900&q=80)

## Texture Play: Velvet, Leather & Bouclé

Material mixing is the ultimate power move this fall. Pair a **velvet blazer** with leather trousers, or layer a bouclé cardigan over silk.

### How to Style It

1. Start with a base texture (silk or cotton)
2. Add contrast with your outerwear (leather jacket, wool coat)
3. Finish with accessories in a third texture (suede bag, knit scarf)

![Texture mixing outfit](https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80)

## The Statement Boot

Knee-high boots are the non-negotiable of Fall 2026. Look for:

- **Square toes** — modern and architectural
- **Rich browns** and deep reds
- **Block heels** for comfort without compromise

*At Patry Closet, we've curated a selection that captures every trend mentioned here. Explore our [Fall Collection](/products?season=fall-winter) to build your perfect autumn wardrobe.*
`,
  },
  {
    id: 2,
    slug: 'sustainable-fashion-guide-building-conscious-wardrobe',
    titleKey: 'blog.post2.title',
    titleFallback: 'The Complete Guide to Building a Conscious Wardrobe',
    excerptKey: 'blog.post2.excerpt',
    excerptFallback: 'Learn how to curate a sustainable wardrobe without sacrificing style. Our step-by-step approach to ethical fashion.',
    coverImage: 'https://images.unsplash.com/photo-1520974735194-8d95cdf6d2ef?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Sustainable fashion fabrics and eco-friendly clothing',
    category: 'sustainability',
    season: 'all-year',
    tags: ['sustainability', 'eco-fashion', 'capsule-wardrobe', 'ethical'],
    author: BLOG_AUTHORS.marcos,
    publishedAt: '2026-03-10T09:00:00Z',
    readingTime: 12,
    featured: true,
    badge: 'new',
    relatedProductIds: [2, 7, 12],
    content: `
## Why Sustainable Fashion Matters Now

The fashion industry accounts for **10% of global carbon emissions** — more than international flights and maritime shipping combined. But here's the good news: every conscious choice you make as a consumer creates ripple effects.

![Sustainable fabrics close-up](https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=900&q=80)

## The 30-Wear Rule

Before any purchase, ask yourself: *"Will I wear this at least 30 times?"* This simple question transforms impulse buying into intentional curation.

### The Capsule Wardrobe Formula

A truly sustainable wardrobe starts with **33 versatile pieces**:

- **9 tops** (3 casual, 3 work, 3 dressy)
- **6 bottoms** (2 jeans, 2 trousers, 2 skirts)
- **6 outerwear** pieces (seasonal rotation)
- **6 dresses** (day-to-night versatility)
- **6 accessories** (scarves, belts, jewelry)

> "Buy less, choose well, make it last." — *Vivienne Westwood*

## Fabric Guide: What to Look For

| Fabric | Sustainability Score | Best For |
|--------|---------------------|----------|
| Organic Cotton | ★★★★☆ | Everyday basics |
| Tencel/Lyocell | ★★★★★ | Dresses, blouses |
| Recycled Polyester | ★★★★☆ | Activewear, outerwear |
| Linen | ★★★★★ | Summer pieces |
| Hemp | ★★★★★ | Durable casuals |

![Organic cotton field](https://images.unsplash.com/photo-1594633312681-86309903deb9?auto=format&fit=crop&w=900&q=80)

## Care = Longevity

How you care for clothes matters as much as what you buy:

1. **Wash cold** — saves energy, preserves color
2. **Air dry** when possible
3. **Repair first** — a small stitch saves a garment
4. **Store properly** — cedar blocks, padded hangers for knits

## Patry Closet's Commitment

We're proud to partner with certified ethical manufacturers. Every piece in our [Sustainable Collection](/products?tag=sustainable) meets OEKO-TEX standards and uses responsible packaging.

*Small changes. Big impact. Start your conscious wardrobe today.*
`,
  },
  {
    id: 3,
    slug: 'complete-event-dressing-guide-weddings-galas-parties',
    titleKey: 'blog.post3.title',
    titleFallback: 'The Ultimate Event Dressing Guide: Weddings, Galas & Parties',
    excerptKey: 'blog.post3.excerpt',
    excerptFallback: 'From black-tie galas to garden weddings, master the art of event dressing with our comprehensive style guide.',
    coverImage: 'https://images.unsplash.com/photo-1529139574466-a303d20ff24f?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Elegant event fashion and styling',
    category: 'style-guides',
    season: 'all-year',
    tags: ['events', 'wedding-guest', 'formal-wear', 'party-dresses'],
    author: BLOG_AUTHORS.lucia,
    publishedAt: '2026-03-05T11:00:00Z',
    readingTime: 10,
    featured: false,
    badge: null,
    relatedProductIds: [4, 6, 8],
    content: `
## Decode the Dress Code

Nothing's worse than showing up underdressed (or overdressed). Here's your definitive guide:

### Black Tie
- **Women:** Floor-length gown or sophisticated cocktail dress
- **Key fabrics:** Silk, satin, velvet
- **Colors:** Deep jewel tones, classic black, metallics

### Cocktail Attire
- **Women:** Knee-length or midi dress
- **Key fabrics:** Crepe, lace, structured cotton
- **Colors:** Versatile — from pastels to bold prints

### Garden Party / Semi-formal
- **Women:** Flowing midi, jumpsuit, or dressy separates
- **Key fabrics:** Chiffon, linen blends, floral prints
- **Colors:** Seasonal — floral, soft earth tones

![Event dressing inspiration board](https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=900&q=80)

## The Wedding Guest Commandments

1. **Never** wear white (or ivory, cream, or champagne)
2. Check if there's a **color theme**
3. Consider the **venue** — heels at a beach wedding? Think again
4. **Layers** are your friend (churches, evening receptions)
5. **Invest in a great bag** — it's your most visible accessory

> "Dressing well is a form of good manners." — *Tom Ford*

## The One-Dress Strategy

Own **one perfect dress** that works across events:

- **The midi wrap dress** in a rich solid color
- Dress it up with heels and statement jewelry
- Dress it down with flats and a crossbody bag
- Works for weddings, dinners, work events, and cocktail hours

![Versatile midi dress styling](https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80)

## Accessory Power Moves

| Event Type | Jewelry | Bag | Shoes |
|-----------|---------|-----|-------|
| Black Tie | Statement earrings | Clutch | Strappy heels |
| Cocktail | Layered necklace | Mini bag | Block heels |
| Garden Party | Delicate pendant | Woven tote | Wedges |
| Office party | Cuff bracelet | Structured bag | Pointed flats |

*Explore our [Event Collection](/products?category=dresses) for pieces that transition effortlessly between occasions.*
`,
  },
  {
    id: 4,
    slug: 'behind-patry-closet-our-story-values-vision',
    titleKey: 'blog.post4.title',
    titleFallback: 'Behind Patry Closet: Our Story, Values & Vision',
    excerptKey: 'blog.post4.excerpt',
    excerptFallback: 'From a small atelier in Madrid to a digital fashion destination — discover the people and passion behind Patry Closet.',
    coverImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Patry Closet design studio and team',
    category: 'behind-the-brand',
    season: 'all-year',
    tags: ['about-us', 'brand-story', 'team', 'madrid'],
    author: BLOG_AUTHORS.patricia,
    publishedAt: '2026-02-28T08:00:00Z',
    readingTime: 7,
    featured: false,
    badge: null,
    relatedProductIds: [1, 9, 15],
    content: `
## Where It All Began

In 2022, in a small studio in Madrid's Malasaña district, Patricia Romero had a vision: **fashion that empowers without compromising ethics.** What started as a curated collection of 15 pieces has grown into a movement.

![Our Madrid studio](https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=900&q=80)

## Our Three Pillars

### 1. Timeless Design
We don't chase fast fashion. Every piece in our collection is designed to be **loved for years**, not weeks. Our design team spends months perfecting each silhouette.

### 2. Ethical Production
We work exclusively with **certified workshops** in Spain and Portugal. Every artisan earns fair wages, and we visit each facility personally twice a year.

### 3. Sustainable Materials
From **organic cotton** to **recycled packaging**, sustainability isn't a marketing term for us — it's how we build everything.

> "We believe fashion should make you feel powerful and leave the planet better than we found it." — *Patricia Romero, Founder*

## Meet the Team

Our team of 12 passionate individuals brings diverse expertise:

- **Design Studio** (Madrid) — 4 designers specializing in womenswear
- **Sustainability** — Dedicated team ensuring ethical sourcing
- **Digital Experience** — Tech team building the online destination you're using now
- **Customer Care** — Multilingual support team (ES, EN, FR)

![Patry Closet team at work](https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80)

## What's Next

For 2026-2027, we're focused on:

1. **Expanding our sustainable line** — 80% organic/recycled by 2027
2. **Men's collection** — launching Fall 2026
3. **Physical experience** — pop-up stores in Madrid and Barcelona
4. **Community** — styling workshops and fashion events

*Thank you for being part of our story. Every purchase supports ethical fashion.*
`,
  },
  {
    id: 5,
    slug: 'spring-summer-2026-color-trends-how-to-wear-them',
    titleKey: 'blog.post5.title',
    titleFallback: 'Spring/Summer 2026 Color Trends & How to Wear Them',
    excerptKey: 'blog.post5.excerpt',
    excerptFallback: 'Pantone\'s picks meet street style. Here\'s your definitive color guide for the warm months ahead.',
    coverImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Colorful spring summer fashion looks',
    category: 'trends',
    season: 'spring-summer',
    tags: ['color-trends', 'spring-2026', 'pantone', 'street-style'],
    author: BLOG_AUTHORS.elena,
    publishedAt: '2026-02-20T10:00:00Z',
    readingTime: 6,
    featured: false,
    badge: 'new',
    relatedProductIds: [3, 10, 14],
    content: `
## Pantone's 2026 Forecast

This year's color story is about **optimism meets sophistication**. The standout shades:

![Spring color palette](https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80)

### 🟡 Digital Lavender
Last year's darling is evolving into a **deeper, richer purple**. Pair it with cream or denim for balance.

### 🟢 Verdant Green
Lush, botanical green is everywhere — from tailored suits to flowing maxi dresses. It's the new neutral.

### 🔴 Coral Blush
Softer than classic coral, this warm pink works on **every skin tone**. Perfect for summer dresses and accessories.

### ⚪ Butter Cream
The anti-white. Warmer, softer, and infinitely more wearable. Your new go-to for summer separates.

## Color Pairing Cheat Sheet

| Primary Color | Perfect Pair | Bold Contrast |
|--------------|-------------|---------------|
| Digital Lavender | Cream, Sage | Terracotta |
| Verdant Green | Navy, White | Hot Pink |
| Coral Blush | Denim, Tan | Emerald |
| Butter Cream | Everything | Cobalt Blue |

## How to Introduce Color

**If you're color-shy**, start with:
1. A colored accessory (bag, scarf, earrings)
2. A statement shoe in a trend color
3. A colored top paired with neutral bottoms

**If you're color-brave**, go for:
1. Monochrome head-to-toe looks
2. Color-blocked outfits (two bold shades together)
3. Printed pieces that combine multiple trend colors

> "Color is the keyboard, the eyes are the harmonies, the soul is the piano with many strings." — *Wassily Kandinsky*

*Shop our [Spring Colors Collection](/products?season=spring-summer) and make this your most colorful season yet.*
`,
  },
  {
    id: 6,
    slug: 'capsule-wardrobe-30-pieces-endless-outfits',
    titleKey: 'blog.post6.title',
    titleFallback: '30 Pieces, Endless Outfits: The Capsule Wardrobe Guide',
    excerptKey: 'blog.post6.excerpt',
    excerptFallback: 'How to build a versatile wardrobe that works for every occasion with just 30 carefully chosen pieces.',
    coverImage: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Organized capsule wardrobe with essential pieces',
    category: 'style-guides',
    season: 'all-year',
    tags: ['capsule-wardrobe', 'minimalism', 'style-tips', 'essentials'],
    author: BLOG_AUTHORS.lucia,
    publishedAt: '2026-02-14T09:30:00Z',
    readingTime: 9,
    featured: false,
    badge: null,
    relatedProductIds: [2, 5, 11],
    content: `
## What Is a Capsule Wardrobe?

A capsule wardrobe is a **curated collection of timeless, versatile pieces** that can be mixed and matched to create dozens of outfits. It's about quality over quantity.

![Minimalist wardrobe essentials](https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=900&q=80)

## The Essential 30

### Tops (10 pieces)
1. White cotton t-shirt
2. Black fitted tee
3. Breton striped top
4. White button-down shirt
5. Silk blouse (cream or blush)
6. Cashmere crew-neck sweater (navy)
7. Oversized knit (oatmeal)
8. Fitted turtleneck (black)
9. Linen shirt (olive or chambray)
10. Dressy camisole (black silk)

### Bottoms (6 pieces)
1. Straight-leg dark jeans
2. High-waisted wide trousers (navy)
3. Tailored black trousers
4. Midi skirt (pleated, neutral)
5. Casual chinos (khaki)
6. Denim shorts (summer essential)

### Outerwear (5 pieces)
1. Tailored blazer (black or navy)
2. Trench coat (classic beige)
3. Leather jacket (black)
4. Wool coat (camel)
5. Denim jacket (medium wash)

### Dresses (4 pieces)
1. Black wrap dress
2. Floral midi dress
3. Shirt dress (casual)
4. Evening slip dress

### Accessories (5 pieces)
1. Leather tote bag (tan)
2. Crossbody bag (black)
3. Silk scarf
4. Leather belt (brown)
5. Statement earrings

## The Mix-and-Match Math

With 30 pieces, you can create **over 100 unique outfits**. The secret is investing in **neutral bases** and adding personality with 2–3 accent pieces per season.

> "Simplicity is the ultimate sophistication." — *Leonardo da Vinci*

### Sample Week

| Day | Outfit |
|-----|--------|
| Monday | White shirt + tailored trousers + blazer |
| Tuesday | Breton top + straight jeans + trench |
| Wednesday | Wrap dress + leather belt + tote |
| Thursday | Silk blouse + midi skirt + heels |
| Friday | Black tee + wide trousers + leather jacket |

*Start curating your capsule wardrobe with our [Essentials Collection](/products?tag=essentials).*
`,
  },
  {
    id: 7,
    slug: 'influencer-collaboration-spring-lookbook-2026',
    titleKey: 'blog.post7.title',
    titleFallback: 'Spring Lookbook 2026: Our Influencer Collaboration',
    excerptKey: 'blog.post7.excerpt',
    excerptFallback: 'We teamed up with 5 style creators to bring you the most inspiring spring looks. See how they styled our collection.',
    coverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Influencer wearing Patry Closet spring collection',
    category: 'collaborations',
    season: 'spring-summer',
    tags: ['lookbook', 'influencer', 'collaboration', 'spring-2026'],
    author: BLOG_AUTHORS.elena,
    publishedAt: '2026-02-08T10:00:00Z',
    readingTime: 5,
    featured: false,
    trending: true,
    badge: 'trending',
    relatedProductIds: [1, 4, 6],
    content: `
## The Collaboration

For Spring 2026, we invited **five diverse creators** from across Europe to style our new collection their way. The result? Five completely different looks from the same pieces.

![Spring lookbook hero](https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80)

## Look 1: Minimal Chic by @sofiagarcia

**The vision:** Clean lines, neutral palette, effortless elegance.

- Cream silk blouse + tailored wide trousers
- Accessories: Gold cuff, structured tote
- Location: Retiro Park, Madrid

*"I wanted to show that luxury doesn't need to be loud."*

## Look 2: Street Meets Elegance by @annaberlin

**The vision:** Mixing casual and formal for everyday impact.

- Oversized blazer over graphic tee + midi skirt
- Accessories: Chunky boots, crossbody bag
- Location: Mitte District, Berlin

![Street style look](https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80)

## Look 3: Romantic Bohemian by @chloe_paris

**The vision:** Feminine, flowing, and full of personality.

- Floral wrap dress layered with denim jacket
- Accessories: Silk scarf, woven basket bag
- Location: Le Marais, Paris

## Look 4: Power Professional by @giulia.style

**The vision:** From the boardroom to aperitivo without changing.

- Structured dress with leather belt + statement earrings
- Accessories: Pointed flats, leather folio
- Location: Brera, Milan

## Look 5: Weekend Wanderer by @lisbon_looks

**The vision:** Relaxed, colorful, ready for anything.

- Linen shirt + high-waisted shorts + espadrilles
- Accessories: Straw hat, woven tote
- Location: Alfama, Lisbon

![Weekend style inspiration](https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80)

## Shop the Looks

Every piece featured is available in our [Spring Collection](/products?season=spring-summer). Mix, match, and make it yours.

*Want to collaborate with Patry Closet? Reach out through our [Contact page](/contact) — we'd love to hear from you.*
`,
  },
  {
    id: 8,
    slug: 'how-to-care-for-your-clothes-extend-wardrobe-life',
    titleKey: 'blog.post8.title',
    titleFallback: 'How to Care for Your Clothes & Extend Their Life',
    excerptKey: 'blog.post8.excerpt',
    excerptFallback: 'Professional garment care tips that save money and reduce waste. Your clothes will thank you.',
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Garment care and clothing maintenance tips',
    category: 'sustainability',
    season: 'all-year',
    tags: ['garment-care', 'sustainability', 'tips', 'laundry'],
    author: BLOG_AUTHORS.marcos,
    publishedAt: '2026-01-30T08:00:00Z',
    readingTime: 7,
    featured: false,
    badge: null,
    relatedProductIds: [7, 13, 16],
    content: `
## Why Garment Care Matters

**The average garment is worn only 7 times** before being discarded. With proper care, you can multiply that by 10x — saving money and reducing environmental impact.

![Garment care essentials](https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=900&q=80)

## Washing: Less Is More

The #1 rule: **wash less often**. Most clothes don't need washing after every wear.

### Washing Frequency Guide

| Garment | Wash After |
|---------|-----------|
| Underwear & socks | Every wear |
| T-shirts & tops | 1-2 wears |
| Jeans & trousers | 4-5 wears |
| Sweaters & knits | 3-4 wears |
| Blazers & jackets | 5-6 wears (spot clean) |
| Dresses | 1-3 wears (depends on season) |

### The Golden Rules

1. **Always cold water** (saves 90% of washing energy)
2. **Inside out** — protects colors and prints
3. **Mesh bags** for delicates
4. **Skip the dryer** when possible
5. **Gentle detergent** — avoid harsh chemicals

## Storage Secrets

- **Knits:** Fold, never hang (prevents shoulder bumps)
- **Blazers & coats:** Broad-shouldered hangers
- **Dresses:** Padded or velvet hangers
- **Denim:** Fold or hang by belt loops
- **Off-season:** Breathable garment bags + cedar blocks

## Repair Before Replace

A **5-minute fix** can extend a garment's life by years:

- Loose button? Sew it back (keep spare buttons!)
- Small hole in a knit? Invisible mending with matching thread
- Broken zipper? A local tailor charges €5-10
- Pilling? A fabric shaver costs €15 and works miracles

> "The most sustainable garment is the one already in your closet." — *Orsola de Castro*

## When It's Time to Let Go

If a garment is truly beyond repair:
1. **Donate** if still wearable
2. **Textile recycling** for worn-out pieces
3. **Upcycle** — old tees make great cleaning cloths

*At Patry Closet, every piece comes with a care card. Because longevity is the ultimate sustainability.*
`,
  },
  {
    id: 9,
    slug: 'work-from-home-style-guide-comfort-meets-chic',
    titleKey: 'blog.post9.title',
    titleFallback: 'Work From Home Style: Where Comfort Meets Chic',
    excerptKey: 'blog.post9.excerpt',
    excerptFallback: 'Elevate your WFH wardrobe without sacrificing comfort. Video-call ready meets all-day wearable.',
    coverImage: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Work from home fashion and style guide',
    category: 'style-guides',
    season: 'all-year',
    tags: ['wfh', 'comfort-style', 'casual-chic', 'home-office'],
    author: BLOG_AUTHORS.lucia,
    publishedAt: '2026-01-20T09:00:00Z',
    readingTime: 6,
    featured: false,
    badge: null,
    relatedProductIds: [5, 8, 17],
    content: `
## The WFH Wardrobe Philosophy

Working from home doesn't mean living in pajamas. The right clothes can **boost productivity, confidence, and mood** — even when your commute is 10 steps.

![Work from home chic outfit](https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?auto=format&fit=crop&w=900&q=80)

## The "Third Piece" Theory

The secret to looking put-together on camera: **always add a third layer.** A tee + cardigan, a shirt + vest, a sweater + scarf. It instantly elevates.

### The WFH Capsule (10 pieces)

1. **Fitted knit top** (ribbed, in a flattering color)
2. **Button-down oxford** (slightly oversized)
3. **Cashmere cardigan** (investment piece)
4. **Structured jogger pants** (the hero)
5. **Wide-leg knit trousers**
6. **Soft blazer** (unstructured, comfortable)
7. **Wrap top** (video-call star)
8. **Cotton dress** (for "I need to feel dressed" days)
9. **Luxe hoodie** (elevated, not gym)
10. **Statement earrings** (instant polish)

## Video Call Styling Hacks

- **Solid colors** read better on camera than prints
- **Jewel tones** (emerald, burgundy, sapphire) are universally flattering
- **A necklace or earrings** compensate for the casual bottom
- **Good lighting** > good outfit (invest in a ring light)

> "Style is a way to say who you are without having to speak." — *Rachel Zoe*

## The Quick-Change Kit

Keep these near your desk for unexpected video calls:
- A blazer on the back of your chair
- Statement earrings in a drawer
- A silk scarf for instant elegance
- Dry shampoo (let's be honest)

*Browse our [WFH Edit](/products?tag=comfort) for pieces that blur the line between lounge and luxury.*
`,
  },
  {
    id: 10,
    slug: 'denim-guide-find-your-perfect-jeans',
    titleKey: 'blog.post10.title',
    titleFallback: 'The Denim Guide: How to Find Your Perfect Jeans',
    excerptKey: 'blog.post10.excerpt',
    excerptFallback: 'Straight, wide-leg, or skinny? Dark wash or vintage? Our definitive guide to finding jeans that fit like they were made for you.',
    coverImage: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Different styles of denim jeans and fits',
    category: 'style-guides',
    season: 'all-year',
    tags: ['denim', 'jeans-guide', 'fit-guide', 'essentials'],
    author: BLOG_AUTHORS.elena,
    publishedAt: '2026-01-10T10:00:00Z',
    readingTime: 8,
    featured: false,
    badge: null,
    relatedProductIds: [6, 11, 18],
    content: `
## Why the Right Jeans Change Everything

A great pair of jeans is the **foundation of modern style**. They go from Monday meetings to Saturday brunch, from airport lounges to rooftop dinners.

![Denim collection display](https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80)

## Know Your Silhouette

### Straight Leg
- **Best for:** Everyone (the universal flattering cut)
- **Pair with:** Tucked-in blouse, blazer, ankle boots
- **Rise:** Mid to high

### Wide Leg
- **Best for:** Creating length and drama
- **Pair with:** Fitted tops, platform shoes
- **Rise:** High (for best proportions)

### Slim / Skinny
- **Best for:** Tucking into boots, streamlined looks
- **Pair with:** Oversized sweaters, long coats
- **Rise:** Mid to high

### Bootcut
- **Best for:** Balancing proportions, retro vibes
- **Pair with:** Heeled boots (hidden under the flare), fitted tops
- **Rise:** Mid

### Mom / Relaxed
- **Best for:** Casual weekend looks, 90s aesthetic
- **Pair with:** Crop tops, sneakers, denim jackets
- **Rise:** High

## The Wash Guide

| Wash | Vibe | Best Season |
|------|------|------------|
| Raw/Dark Indigo | Polished, dressy | Fall/Winter |
| Mid-blue | Classic, versatile | All year |
| Light wash | Casual, summery | Spring/Summer |
| Black | Sleek, modern | All year |
| Vintage/Distressed | Edgy, relaxed | Spring/Summer |

## Fit Tips

1. **Buy for your hips** — waist can be taken in
2. **Sit down in the fitting room** — check for comfort
3. **Denim stretches** — buy snug, they'll relax 0.5-1 size
4. **Hem length matters** — invest in tailoring for the perfect break

> "I have often said that I wish I had invented blue jeans: the most spectacular, the most practical, the most relaxed and nonchalant." — *Yves Saint Laurent*

*Find your perfect pair in our [Denim Collection](/products?category=jeans).*
`,
  },
];

// Utility: get post by slug
export const getPostBySlug = (slug) => blogPosts.find(p => p.slug === slug) || null;

// Utility: get posts by category
export const getPostsByCategory = (categoryId) =>
  categoryId ? blogPosts.filter(p => p.category === categoryId) : blogPosts;

// Utility: get related posts (same category, excluding current)
export const getRelatedPosts = (postId, limit = 3) => {
  const current = blogPosts.find(p => p.id === postId);
  if (!current) return blogPosts.slice(0, limit);

  const sameCat = blogPosts.filter(p => p.id !== postId && p.category === current.category);
  const others = blogPosts.filter(p => p.id !== postId && p.category !== current.category);
  return [...sameCat, ...others].slice(0, limit);
};

// Utility: get featured posts
export const getFeaturedPosts = () => blogPosts.filter(p => p.featured);

// Utility: get all unique tags
export const getAllTags = () => [...new Set(blogPosts.flatMap(p => p.tags))];
