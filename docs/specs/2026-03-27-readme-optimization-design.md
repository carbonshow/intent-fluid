# README Optimization Design Spec

**Date:** 2026-03-27
**Branch:** `optimize-readme`
**Approach:** B — Contrast-Driven (Before/After + Alternating Text/Visual Highlights)

---

## 1. Goal

Redesign `README.md` to showcase Intent-Fluid's value proposition and Surge skill's core strengths with a modern, minimalist aesthetic (Vercel/Stripe-level). Balance visual impact for broad appeal with technical depth for developers.

## 2. Target Audience

Dual-audience: attract attention with visual impact first, retain professional users with technical depth.

## 3. Design Decisions

- **Language:** All content in English.
- **Visual style:** Modern minimalist, dark-friendly palette, clean typography.
- **Image strategy:** 4 images total. This spec defines detailed specs (dimensions, style, content, AI generation prompts) for each. Images are NOT generated as part of this task — only the spec is delivered. Images will be generated separately using tools like Nano Banana Pro 2.
- **Content reduction:** Remove verbose Manifesto section (distill into Hero tagline). Replace Use Cases section with Before/After comparison image. Add dedicated "Why Surge?" highlights section.

## 4. README Structure (7 Sections)

### Section 1: Hero

- **Content:** Banner image + project name + one-line value proposition + badge row
- **Value proposition:** "Transforming human intent into autonomous execution. Stop manual grinding, start directing intelligence."
- **Badges:** Platform (Claude Code | Cursor | Gemini CLI), Paradigm (Intent-Driven), Focus (Flow-State)
- **Visual:** `hero-banner.png` (see Image Spec #1)

### Section 2: Before / After

- **Header:** `⚡ The Difference`
- **Content:** Single comparison image showing the contrast between manual workflow pain and Surge's autonomous delivery
- **Visual:** `before-after.png` (see Image Spec #2)
- **Optional:** Brief text caption below the image summarizing key contrast points

### Section 3: Why Surge? (5 Core Highlights)

- **Header:** `🌊 Why Surge?`
- **Format:** Each highlight uses emoji + bold title + 2-3 sentence description. No additional images needed — emoji and concise copy carry the message.
- **Highlights (in order):**

1. **🔄 Autonomous Iteration Engine**
   Director Agent drives Analyze → Research → Design → Implement → QA in a closed loop. Not a one-shot generator — it iterates until quality converges. Auto-detects stagnation, oscillation, and Pareto frontiers to reach highest quality in minimum iterations.

2. **👥 Expert Review Panel**
   Automatically assembles 3-5 domain experts for parallel design review. Each expert evaluates independently — security, performance, maintainability — with veto power. Multi-perspective synthesis eliminates blind spots.

3. **✅ Rigorous Quality Assurance**
   Three-tier acceptance criteria (L1→L2→L3) with progressive escalation. Output integrity validation auto-detects truncation and recovers. Optimization directives are closed-loop tracked — every improvement proposed is verified next round.

4. **📋 PRD-to-Deliverable Pipeline**
   One PRD in, complete deliverables out — code, documents, or strategy reports. Auto-analyzes requirement topology, negotiates acceptance criteria, orchestrates parallel subtasks. From fuzzy intent to structured output, fully autonomous.

5. **🧠 Self-Evolving Process Memory**
   Extracts process experience after every iteration — ambiguities found, reusable components, rejected approaches, missing test cases. Persisted to memory files — gets smarter with every use. Retro phase generates rule update suggestions.

### Section 4: The Cognitive Pipeline

- **Header:** `🧠 The Cognitive Pipeline`
- **Content:** Detailed flow diagram showing Surge's full iteration loop with Expert Panel and Process Memory annotations
- **Visual:** `cognitive-pipeline.png` (see Image Spec #3)
- **Below image:** Brief text explanation of the iteration logic and convergence detection

### Section 5: Quick Start

- **Header:** `📦 Quick Start`
- **Content:**
  - `git clone` command in code block
  - Platform installation table (Claude Code / Cursor / Gemini CLI)
  - Link to detailed `docs/INSTALL.md`

### Section 6: Architecture

- **Header:** `🏗 Architecture`
- **Content:** Architecture overview image + brief description of the Skills system
- **Visual:** `architecture.png` (see Image Spec #4)
- **Below image:**
  - Available Skills table (currently: surge)
  - Links to Skill Spec and Skill Template for contributors

### Section 7: Footer

- **Content:** MIT License note + closing quote
- **Quote:** "Stay in flow. Let the intelligence follow your will."

## 5. Image Specifications

### Image 1: Hero Banner (`hero-banner.png`)

| Property | Value |
|----------|-------|
| **Dimensions** | 1200 × 400 px |
| **Location** | README top, first element |
| **Background** | Dark gradient (#0d1117 → deep navy-purple) |
| **Content** | Centered "Intent-Fluid" in clean sans-serif + tagline "Transform Intent into Autonomous Execution" below + abstract fluid/wave decorative lines on both sides |
| **Style** | Minimalist, subtle glow effect, no icons |
| **Dark/Light** | Deep background works in both modes (avoid pure black) |
| **AI Prompt** | "Minimalist dark tech banner, 1200x400, deep navy-to-purple gradient background, centered white text 'Intent-Fluid' in clean sans-serif font, subtle flowing fluid lines on both sides, faint glow effect, no icons, modern SaaS aesthetic, Vercel/Stripe style" |

### Image 2: Before/After Comparison (`before-after.png`)

| Property | Value |
|----------|-------|
| **Dimensions** | 1200 × 600 px |
| **Location** | Below Hero, above highlights |
| **Layout** | Left/right split |
| **Left (Before)** | Title "Without Surge" in gray. Scattered code fragments with red X marks and circular arrows showing manual retry loops. Bottom text: "Manual iteration, context lost, quality inconsistent" |
| **Right (After)** | Title "With Surge" in blue-purple gradient. Clean 5-step pipeline (Analyze→Research→Design→Implement→QA) flowing left-to-right with green checkmark convergence indicator. Bottom text: "Autonomous iteration, expert review, quality converged" |
| **Style** | Dark background, muted tones on left, vibrant blue-purple on right, flat design, clean sans-serif |
| **AI Prompt** | "Split comparison infographic, 1200x600, dark background. Left side muted gray: scattered code fragments with red X marks and circular arrows showing manual retry loops, label 'Without Surge'. Right side vibrant blue-purple: clean 5-step pipeline flowing left to right (Analyze→Research→Design→Implement→QA) with a green checkmark convergence indicator, label 'With Surge'. Minimalist flat design, no gradients on icons, clean sans-serif typography" |

### Image 3: Cognitive Pipeline (`cognitive-pipeline.png`)

| Property | Value |
|----------|-------|
| **Dimensions** | 1200 × 500 px |
| **Location** | After 5 highlights section |
| **Content** | Entry: 💡 PRD/Raw Intent → Main loop: Analyze → Research → Design (Expert Panel sub-node) → Implement (Parallel Tasks sub-node) → QA → Branch: Converged → Retro → Deliverable; Unconverged → back to Analyze. Side annotation: Process Memory extraction |
| **Style** | Dark navy background, rounded rectangle nodes with subtle glow borders, gradient glowing connection lines |
| **AI Prompt** | "Technical flowchart diagram, 1200x500, dark navy background. Nodes as rounded rectangles with subtle glow borders: PRD Input → Analyze → Research → Design (with 'Expert Panel' sub-node) → Implement (with 'Parallel Tasks' sub-node) → QA. QA branches: 'Converged' path to Retro → Deliverable; 'Unconverged' loops back to Analyze. Side annotation 'Process Memory' with brain icon. Gradient glowing connection lines, modern tech aesthetic, clean sans-serif labels" |

### Image 4: Architecture Overview (`architecture.png`)

| Property | Value |
|----------|-------|
| **Dimensions** | 1200 × 450 px |
| **Location** | After Quick Start, before Footer |
| **Content** | Three horizontal layers: Top "User Intent" (pink), Middle "Intent-Fluid Core" (blue), Bottom "Skills Library" with "surge" highlighted in purple glow + grayed placeholder slots for future skills. Right side vertical bar "Platform Adapters" showing Claude Code, Cursor, Gemini CLI |
| **Style** | Dark background, layered diagram, different color per layer, flat design, subtle connecting arrows |
| **AI Prompt** | "Layered architecture diagram, 1200x450, dark background. Three horizontal layers: top 'User Intent' in pink, middle 'Intent-Fluid Core' in blue, bottom 'Skills Library' with 'surge' highlighted in purple glow and grayed placeholder slots for future skills. Right side vertical bar 'Platform Adapters' showing Claude Code, Cursor, Gemini CLI logos. Clean flat design, subtle connecting arrows between layers, modern tech documentation style" |

## 6. Changes from Current README

| Current | Optimized | Rationale |
|---------|-----------|-----------|
| Verbose Manifesto section (~15 lines) | Removed; essence distilled into Hero tagline | Reduce scroll depth, front-load value |
| Use Cases section with 3 examples | Replaced by Before/After image | Visual contrast is more impactful than text examples |
| Mermaid diagram (inline code) | Replaced by designed `cognitive-pipeline.png` | Higher visual quality, consistent dark-theme aesthetic |
| No dedicated Surge highlights | New "Why Surge?" section with 5 highlights | Core differentiators now prominent and scannable |
| "Getting Started" at bottom | "Quick Start" moved up, simplified | Reduce friction to first use |
| Generic architecture text | Architecture overview image | Visual architecture is more memorable |

## 7. Out of Scope

- Actual image generation (specs only — generation done separately with Nano Banana Pro 2 or similar)
- INSTALL.md changes
- SKILL_SPEC.md or SKILL_TEMPLATE.md changes
- Content in languages other than English
