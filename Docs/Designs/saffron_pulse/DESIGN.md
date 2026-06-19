---
name: Saffron Pulse
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#574237'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#8b7265'
  outline-variant: '#dec0b1'
  surface-tint: '#9a4600'
  primary: '#9a4600'
  on-primary: '#ffffff'
  primary-container: '#f47920'
  on-primary-container: '#572400'
  inverse-primary: '#ffb68d'
  secondary: '#b6171e'
  on-secondary: '#ffffff'
  secondary-container: '#da3433'
  on-secondary-container: '#fffbff'
  tertiary: '#1b6d24'
  on-tertiary: '#ffffff'
  tertiary-container: '#5ead5b'
  on-tertiary-container: '#003d0b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc9'
  primary-fixed-dim: '#ffb68d'
  on-primary-fixed: '#321200'
  on-primary-fixed-variant: '#763300'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb3ac'
  on-secondary-fixed: '#410003'
  on-secondary-fixed-variant: '#930010'
  tertiary-fixed: '#a3f69c'
  tertiary-fixed-dim: '#88d982'
  on-tertiary-fixed: '#002204'
  on-tertiary-fixed-variant: '#005312'
  background: '#FDFBF7'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
  muted-text: '#757575'
  surface-alt: '#F5F2ED'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  reservation-code:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system for the restaurant embodies a "Modern Indian" aesthetic—fusing the warmth of traditional hospitality with the efficiency of high-tech voice interaction. The brand personality is vibrant, appetizing, and radically frictionless. 

The design style is **Corporate / Modern** with **High-Contrast** accents. It prioritizes a "Zero-PII" (Personally Identifiable Information) philosophy, using UI transparency and privacy badges to build trust instantly. The interface should feel "lightweight" and "fast," favoring functional clarity over decorative clutter to support the primary voice-first user journey.

- **Visual Tone:** Warm but professional, energetic yet clean.
- **Target Audience:** Tech-savvy diners seeking immediate, low-friction table reservations without the burden of account creation or data entry.
- **Key Emotion:** Instant gratification and effortless hospitality.

## Colors

The palette is anchored by **Saffron Orange**, a high-energy primary color used to drive action and represent the restaurant’s core identity. **Warm Red** serves as a secondary accent, primarily used for active audio visualizations and emphasis in high-friction moments.

**Leaf Green** is reserved strictly for success states and confirmation badges to provide immediate visual feedback of a completed reservation. The **Off-White** background provides a soft, organic canvas that prevents the high-contrast charcoal text from feeling clinical.

- **Primary:** Action-oriented, used for the main microphone and CTAs.
- **Neutral:** Deep Charcoal for maximum legibility and accessibility.
- **Muted:** Medium Gray for secondary metadata like the "IST" timezone and privacy disclaimers.

## Typography

The system uses a pairing of **Outfit** and **Inter**. 

**Outfit** is used for all headings and high-impact display elements. Its geometric but friendly nature makes the "Book with Voice" calls-to-action feel modern and approachable.

**Inter** is used for all functional UI text, body copy, and transcriptions. Given the voice-first nature of the product, Inter's high legibility ensures that users can quickly scan transcribed text or read confirmation details like the 15-minute hold policy.

- **Headlines:** Bold and expressive, using tighter tracking for larger sizes.
- **Body:** Neutral and systematic to handle variable lengths of transcribed user speech.
- **Reservation Code:** A specialized heavy weight of Outfit is used to ensure the unique code (e.g., TABLE-B99) is the undisputed hero of the success screen.

## Layout & Spacing

The layout follows a **fluid grid** model with a focus on centered modal experiences for the reservation flow.

- **Desktop:** 12-column grid with a 1200px max-width.
- **Mobile:** Single column with 16px side margins.
- **Voice Modal:** Centered both vertically and horizontally, occupying a max-width of 480px on desktop to feel intimate and focused.

Spacing rhythm is built on a **8px baseline**, ensuring that vertical stacks between transcribed text, microphone buttons, and privacy badges remain consistent and tight. High-friction areas (like the reservation confirmation) utilize expanded `stack-lg` spacing to give the reservation code room to breathe.

## Elevation & Depth

To maintain a "fast and light" feel, the system uses **Tonal Layers** combined with **Ambient Shadows**.

- **Surface 0:** The Off-White background (#FDFBF7).
- **Surface 1:** Modals and cards use a pure white background with a very soft, diffused shadow (15% opacity Charcoal) to create separation without looking heavy.
- **Glassmorphism:** When the voice modal is active, the underlying homepage uses a 12px backdrop blur with a 20% charcoal overlay to keep the focus entirely on the conversation.
- **Interactive Depth:** Buttons use a subtle 2px bottom-offset shadow that disappears when "pressed" to provide tactile feedback during the Phase 1 push-to-talk experience.

## Shapes

The shape language is consistently **Rounded (8px)**. This radius is applied to buttons, input fields, and modal containers to strike a balance between a precise "tech" aesthetic and a friendly "hospitality" feel.

- **Microphone Button:** While most elements follow the 8px rule, the primary microphone trigger can utilize a full circle (pill) shape to emphasize its role as the primary interaction point.
- **Reservation Badge:** Uses the standard 8px radius but includes a "ticket-notch" visual treatment to reinforce its purpose as a physical-style voucher.

## Components

### Buttons
- **Primary (Voice Trigger):** Saffron Orange background, white icon. In Phase 2, this component transforms into a glowing audio visualizer.
- **Secondary (Send):** Outlined Deep Charcoal with an 8px radius.
- **Interaction:** All buttons should have a distinct "active" state where the elevation drops to 0.

### Voice Visualizer (Phase 2)
- A dynamic waveform that pulses between Saffron Orange and Warm Red.
- Must respond instantly to "barge-in" by flattening the agent's waveform when the user begins speaking.

### Reservation Code Badge
- A high-contrast card using Leaf Green for the border or a subtle top-stripe.
- The code must be centered and rendered in `reservation-code` typography.
- Include a "Copy" icon for utility, despite the zero-PII nature.

### Privacy Badge
- A small, pill-shaped component with a lock icon.
- Background: Surface-alt (#F5F2ED).
- Text: "Zero-PII: No Phone or Email Required" in `label-md`.

### Input Fields (Transcription)
- Background-less or very light gray (#F5F2ED) frame.
- Minimalist design; should look like a "log" rather than a traditional form field to discourage typing.