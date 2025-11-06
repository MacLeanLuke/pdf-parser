# Mercy Networks – Brand Guide

## Identity

- **Brand Name:** Mercy Networks  
- **Product Descriptor:** Eligibility Finder (internal/product view only)  
- **Tagline:** “Where help finds you.”  
- **Mission:** To make finding and giving help as simple as asking for it.  
- **Voice:** Warm, clear, compassionate. We speak with dignity to people who need shelter, food, care, or long-term support, and to the caseworkers and volunteers who serve them.

## Brand Pillars

1. **Compassion made simple** – Every experience should feel calm, human, and easy to act on.  
2. **Connection over complexity** – We bridge people, programs, and front-line teams through clarity.  
3. **Shared progress** – When someone adds a service, the whole network benefits.

## Color Palette

| Role | Hex | Tailwind Token | Usage |
| --- | --- | --- | --- |
| Trust Blue | `#2563EB` | `brand.blue` | Primary actions, links, highlights |
| Mercy Green | `#10B981` | `brand.green` | Success, compassionate emphasis |
| Slate | `#1E293B` | `brand.slate` | Headings, key text on light backgrounds |
| Soft Gray | `#CBD5E1` | `brand.gray` | Borders, secondary text, dividers |
| Soft White | `#F8FAFC` | `brand.white` | Default page background |
| Deep Navy | `#0F172A` | `brand.navy` | Accent text or icons when needed |
| Ember Orange | `#F97316` | `brand.orange` | Alerts, “in progress” indicators |

The default experience is bright and inviting: white/very light gray surfaces, rich navy/slate text, and blue/green accents. Maintain AA contrast for body text and action states.

## Typography

- **Headings:** IBM Plex Serif (500–600 weight). Use sentence case and relaxed letter spacing to keep titles friendly.  
- **Body & UI:** Inter (400–500 weight). Clear microcopy, 16px minimum size.  
- **Buttons:** Inter 500–600, sentence case (e.g., “Find help”).  

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Serif:wght@500;600&display=swap');

:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-serif: 'IBM Plex Serif', Georgia, serif;
}
```

## Iconography

- Use [lucide-react](https://lucide.dev/) with 20px default size.  
- Icons reinforce warmth and clarity: `Heart`, `Home`, `HelpingHand`, `Search`, `Globe`, `UtensilsCrossed`, `UserCheck`.  
- Icons inherit current text color (`stroke-current`).

## Components & Layout

| Component | Guidance |
| --- | --- |
| **Header/Nav** | Soft white background, brand name “Mercy Networks,” tagline beneath. Links in muted slate/blue. |
| **Cards** | `rounded-2xl`, light border (`brand.border`), subtle shadow-sm. Generous padding for breathing room. |
| **Buttons** | Primary = blue, secondary = slate outline on white, danger = orange. Sentence case labels. |
| **Inputs** | Rounded 2xl, light border, generous padding. Placeholder copy should offer concrete prompts. |
| **Badges/Chips** | Pill shapes to highlight “Who it helps,” “What’s required,” etc. |
| **Footer** | Calm white/gray band with concise mission statement. |

Layout defaults to a centered column (`max-w-4xl`) with `space-y-6/8`. Use white cards on the soft background for clarity.

## Accessibility & UX

- Maintain visible focus rings (`ring-brand-blue ring-offset-white`).  
- Never rely on color alone; pair icons or text for state changes.  
- Keep copy at a 6th–8th grade reading level—speak plainly (“Who this helps,” “What’s required”).  
- Provide inline error feedback (“We couldn’t find clear service details in this PDF…”).  
- Optimize for mobile use in low-bandwidth scenarios.

## Tone Examples

- “Find help, simply.”  
- “Tell us what you need so we can connect you to the right shelter or program.”  
- “Scan this website for service details.”  
- “We didn’t find a match yet—try adjusting your words or add a new service below.”

## Brand Assets

- **Logo Concept:** Heart + home monogram, rendering compassion and safe shelter.  
- **Wordmark:** “Mercy Networks” in IBM Plex Serif bold with ample tracking.  
- **Favicon:** `/favicon.svg` (heart-home line art on blue background).  
- **Open Graph Image:** `/og-image.svg` with wordmark and tagline “Where help finds you.”

## Usage Guidelines

1. Keep hero and navigation copy focused on helping people find shelter, food, medical care, or long-term support—avoid “eligibility” unless explanatory.  
2. Search results should summarize “Who this helps,” “What’s required,” and “Where it is” in human terms.  
3. Prompt staff to add new services when we have gaps; celebrate shared impact (“Add new connections”).  
4. Metadata and social previews must reinforce the brand promise: Mercy, connection, simplicity.  
5. When in doubt, ask: “Would this wording help someone in crisis feel guided and respected?”
