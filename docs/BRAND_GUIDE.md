# Eligibility Finder – Brand Guide

## Identity

- **Brand Name:** Eligibility Finder  
- **Tagline:** “Clarity from complexity — faster eligibility for everyone.”
- **Voice:** Trustworthy, human-centered, efficient, and accessible. We design for caseworkers and agencies supporting people experiencing homelessness.

## Color Palette

| Role | Hex | Tailwind Token | Usage |
| --- | --- | --- | --- |
| Primary Blue | `#2563EB` | `brand.blue` | CTAs, highlights, focus states |
| Midnight Navy | `#0F172A` | `brand.navy` | Page backgrounds, header |
| Slate Gray | `#1E293B` | `brand.slate` | Cards, secondary surfaces |
| Cool Gray | `#CBD5E1` | `brand.gray` | Body text, borders, subtle UI |
| Soft White | `#F8FAFC` | `brand.white` | Contrast text, “light” surfaces |
| Accent Green | `#10B981` | `brand.green` | Success, confirmations |
| Accent Orange | `#F97316` | `brand.orange` | Warnings, in-progress states |

All combinations satisfy WCAG AA contrast. Default experience uses a “dark navy” surface with light text.

## Typography

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Serif:wght@500;600&display=swap');

:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-serif: 'IBM Plex Serif', Georgia, serif;
}
```

- **Headings (H1/H2):** IBM Plex Serif, 600/500 weight
- **Body & UI:** Inter 400–500
- **Buttons:** Inter 600
- Minimum body size 16px; tracking for metadata uses uppercase with extended letter spacing.

## Iconography

- Library: [lucide-react](https://lucide.dev/)  
- Suggested glyphs: `FileText`, `Globe`, `Search`, `Sparkles`, `UserCheck`, `CheckCircle`, `AlertCircle`, `Clock`.  
- Icons inherit text color (`stroke-current`) and default to 20px.

## Components

| Component | Notes |
| --- | --- |
| **Header** | Sticky, `brand.navy`, contains logo/brand, quick links |
| **Card** | `rounded-2xl`, `border-white/5`, `shadow-card` |
| **Button** | Variants: primary (blue), secondary (slate), outline (transparent border), danger (orange) |
| **Tabs** | Rounded, filled active state, accessible focus ring |
| **Input** | 2xl radius, brand focus ring, subtle background |
| **Badge/Chip** | Small pill, variant colors for status/pill filters |
| **Alert Banner** | Color-coded backgrounds + icon for state change |

Animations use `transition-all duration-200 ease-out` for hover/focus.

## Layout

- Max width `1200px` (`max-w-6xl`)
- Sections separated by `gap-8`–`gap-10`
- Cards use `p-6`, lists `gap-3`, modals `shadow-lg`
- Grid: responsive 12-column; two-column layout for wide screens

## Accessibility

- All buttons/links include visible focus ring (`ring-brand-blue`).
- Never rely on color alone — pair icons/text for state.
- Inline errors accompany field descriptions.
- Copy aims for reading grade ~8.

## Brand Assets

- **Wordmark:** “Eligibility Finder” in IBM Plex Serif Bold.
- **Favicon:** `/favicon.svg` (blue circle with white check).
- **Open Graph:** `/og-image.svg` with wordmark + tagline.

## Usage Guidelines

1. Prefer `Card` + `CardHeader` + `CardContent` for modular sections.
2. Keep hero/intro copy concise (“Clarity from complexity…”).
3. Use tabs for PDF vs Website ingestion; both share the same result view.
4. Metadata (timestamps, source) uses uppercase microcopy with Cool Gray text.
5. History lists show highlight on hover and active state with blue border.

For additional details, see the implementation in `app/page.tsx`, `app/records/[id]/page.tsx`, and shared UI components under `components/ui/`.
