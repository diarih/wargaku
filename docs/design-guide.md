# WargaKu Design Guide

## Product Tone

- Friendly and modern for younger operators.
- Administrative clarity first, visual style second.
- Keep copy short and practical.

## Visual Language

- Use bright neutral backgrounds with fresh cyan/lime accents.
- Prefer rounded cards and inputs (`--radius` from theme tokens).
- Keep one primary CTA per section.

## Typography

- Page title: `text-2xl` to `text-3xl` with strong weight.
- Section title: `text-lg` to `text-xl`.
- Body and helper: `text-sm` with muted foreground.

## Spacing

- Outer page spacing: `px-4 py-6`.
- Section gap: `space-y-6`.
- Card internal spacing: `p-4` to `p-6`.

## Core Components

- Header section with title and context sentence.
- Stat card row for overview pages.
- Empty state card with clear next action.
- Action button groups using button variants.

## State Requirements

- Every data section needs loading, empty, and error handling.
- Show success/failure feedback with toast (`sonner`).
- Disable action buttons while processing.

## Accessibility

- Always label form inputs.
- Maintain keyboard access and visible focus states.
- Keep contrast on text and action elements at AA-level or better.
