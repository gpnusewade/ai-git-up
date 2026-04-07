---
name: frontend-design
description: Professional frontend design skill that generates beautiful, production-ready UI code with built-in UX review capabilities. Use when building websites, landing pages, dashboards, or when reviewing existing UI for design issues.
license: MIT
compatibility: opencode
metadata:
  author: opencode-community
  version: "1.0.0"
---

# Frontend Design Skill

This skill enables AI to generate high-quality frontend code with professional design sensibilities and perform comprehensive UX audits on existing code.

## What I Do

### Mode 1: Generate Beautiful UI
When asked to build a UI component or page, I follow these principles:

1. **Typography** - Use distinctive fonts. NEVER use generic fonts like Inter, Roboto, Arial, or System UI unless explicitly requested. Prefer: Playfair Display, Space Grotesk, DM Sans, Fraunces, or custom font pairings.

2. **Layout** - Create unique, non-template layouts. Avoid centered, symmetric everything. Use:
   - Asymmetric grids
   - Diagonal elements
   - Overlapping components
   - Unexpected whitespace
   - Broken grid layouts

3. **Color** - Avoid AI clichés (purple gradients, generic blue). Use:
   - Distinctive palettes with purpose
   - High contrast for readability
   - Semantic color meaning
   - Dark/light mode considerations

4. **Details** - Add micro-interactions:
   - Hover effects with smooth transitions
   - Focus states for accessibility
   - Loading skeletons
   - Subtle animations

### Mode 2: UI/UX Audit
When asked to "review", "audit", or "check" UI code, I perform a systematic evaluation:

1. **Visual Design Audit**
   - Typography hierarchy and consistency
   - Color contrast and accessibility
   - Spacing and alignment
   - Visual weight distribution

2. **Usability Audit (based on Nielsen's 10 Heuristics)**
   - System status visibility
   - Match with real world
   - User control and freedom
   - Consistency and standards
   - Error prevention
   - Recognition over recall
   - Flexibility and efficiency
   - Aesthetic and minimalist design
   - Help users recognize errors
   - Help and documentation

3. **Accessibility Audit (WCAG 2.2)**
   - Semantic HTML structure
   - ARIA labels where needed
   - Keyboard navigability
   - Focus indicators
   - Alt text for images
   - Color contrast ratios (4.5:1 for normal text)

4. **Responsive & Mobile Audit**
   - Touch target sizes (min 44px)
   - Viewport configuration
   - Mobile-first breakpoints
   - Gesture compatibility

5. **Performance & Interaction Audit**
   - Loading states
   - Optimistic UI updates
   - Smooth transitions
   - Error feedback

## When to Use Me

Use this skill when:
- Building a new webpage, landing page, or dashboard
- Redesigning an existing UI
- Reviewing UI code for design issues
- Ensuring accessibility compliance
- Creating design systems or component libraries

Trigger phrases that activate me:
- "Build a landing page for..."
- "Create a dashboard with..."
- "Design a UI for..."
- "Review this UI code..."
- "Audit this component..."
- "Check the UX of..."

## Output Format

### For UI Generation:
Generate complete, self-contained HTML/CSS code with:
- `<style>` block with comprehensive CSS
- Responsive design
- Dark/light mode support where appropriate
- Comments explaining design decisions

### For UI Audit:
Output a structured report:

```markdown
## UI/UX Audit Report

### Summary
- Overall score: X/100
- Critical issues: X
- Major issues: X
- Minor issues: X

### Critical Issues (Must Fix)
[Issues that block usability or violate accessibility]

### Major Issues (Should Fix)
[Significant UX problems causing confusion]

### Minor Issues (Nice to Have)
[Polish items and improvements]

### Recommendations
[Specific, actionable suggestions]