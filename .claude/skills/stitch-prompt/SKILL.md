---
name: stitch-prompt
description: Generate optimized UI prompts for Google Stitch (Gemini 2.5). Convert design ideas, specs, or wireframe descriptions into structured prompts following the 5-part pattern. Use when creating UI mockups, prototyping web/mobile apps, designing frontend layouts, or generating high-fidelity screen designs. Supports multi-screen build orders and incremental refinements.
---

# Stitch Prompt Generator

Generate well-structured prompts for Google Stitch to create high-fidelity UI designs.

## Overview

Google Stitch is an AI-powered UI design tool (Gemini 2.5) that generates responsive interfaces from natural language. This skill helps craft effective prompts that produce consistent, high-quality results.

**Default Mode:** High-fidelity for detailed, polished designs.
*Use Experimental mode when available. If it requires an image, upload a placeholder or use Standard.*

**Alternative:** Standard mode (fast) for quick Figma exports or wireframes.

## Workflow

### 1. Gather Requirements

Ask the user for:
- **App/Screen purpose**: What is being designed and for whom?
- **Visual style**: Theme, colors (hex preferred), mood adjectives
- **Key components**: Navigation, cards, inputs, buttons, etc.
- **Reference apps**: Similar interfaces for inspiration (e.g., "like Linear", "Warp-style")

### 2. Generate Prompt Using 5-Part Structure

Every Stitch prompt follows this pattern:

```
1. CONTEXT      → What the app/page is for
2. USERS/GOALS  → Who uses it and why
3. LAYOUT       → Key structural components (nav, cards, grids)
4. VISUAL STYLE → Colors (hex), typography, mood
5. STATES       → Interactions and behaviors (optional but recommended)
```

**Target length:** 500-700 characters. Dense and specific, not verbose.

### 3. Refine with Follow-up Prompts

For changes after initial generation:
- **One change per prompt** — Never combine multiple modifications
- **Reference existing elements** — "Keep the header, add X below it"
- **Be surgical** — Target specific components, not entire layouts
- **Explicit preservation** — "Update EXISTING [element]. DO NOT recreate. Keep [X] same."

## Output Format

Present prompts in a code block with clear structure:

```
[Platform] [page type] for [context/app name].

LAYOUT:
- [Component 1]: [specs]
- [Component 2]: [specs]
- [Component 3]: [specs]

STYLE:
- Background: [hex color]
- Accents: [hex colors]
- Typography: [font style]
- Theme: [mood adjectives]

STATES (optional):
- [Interaction behaviors]
```

Output the prompt in a code block. Minimize conversational preamble.

## Golden Rules

1. **Be specific and incremental** — Generic prompts → generic results
2. **One major change per prompt** — Multiple changes break layouts
3. **Use UI/UX terminology** — "CTA button", "hero section", "card layout"
4. **NO ASCII DIAGRAMS** — Stitch reads them as literal text. Use prose descriptions.

See [references/best-practices.md](references/best-practices.md) for detailed rules and pitfalls.

## Visual Style Guidelines

- **Hex colors encouraged** — `#FFA344` is better than "amber"
- **Reference apps welcome** — "Warp Terminal aesthetic", "Linear-style"
- **Mood adjectives** — "minimal", "vibrant", "professional", "dark theme"

## Resources

- **Best Practices**: See [references/best-practices.md](references/best-practices.md) for detailed rules, pitfalls, and length guidelines
- **Examples**: See [references/examples.md](references/examples.md) for real-world prompt patterns

## Build Order Pattern

For complex apps, generate screens in sequence:

1. **Foundation** — Complete app layout (header, main area, input, status)
2. **Content** — Messages, cards, data displays
3. **Controls** — Inputs, toggles, dropdowns, buttons
4. **Modals** — Settings, dialogs, overlays
5. **States** — Loading, error, empty states
6. **Polish** — Micro-interactions, animations, final refinements

Each prompt builds on the previous. Generate one screen at a time.

**For multi-screen build orders (>3 screens):** Use the Task tool to generate the full sequence in a separate file `stitch-build-order.md` rather than outputting all prompts to the main chat.
