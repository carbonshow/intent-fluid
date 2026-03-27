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
| **Left (Before)** | Title "Without Surge" in gray. Human figure trapped in chaotic circular loop: Write → Test → Fail → Debug → Rewrite → Test Again → back to Write. Human at EVERY step (bottleneck). Red ✗ marks, clock draining icon. Caption: "You are the loop. Every iteration drains your time and focus." |
| **Right (After)** | Title "With Surge" in blue-purple. 3 rising wave forms (ocean waves), each = one iteration with A→R→D→I→Q phase nodes flowing in wave curve. Wave 1 (muted blue): "Initial prototype". Wave 2 (blue-purple): "Refined & optimized". Wave 3 (vivid purple + glow): "Converged ✓". User icon ONLY at wave crests (checkpoints). Caption: "Surge iterates like waves. You only steer at the crests." |
| **Style** | Dark background, muted exhaustion tones on left, vibrant momentum blue-purple on right, flat design, clean sans-serif |
| **AI Prompt** | "Split comparison infographic, 1200x600, dark background. Left side muted gray: a human stick figure trapped in a chaotic circular loop of arrows labeled Write, Test, Fail, Debug, Rewrite, Test Again, with red X marks and a clock draining icon, label 'Without Surge', caption 'You are the loop'. Right side vibrant blue-purple: three rising ocean wave forms stacked vertically, each wave contains small nodes A R D I Q flowing along the curve, waves get progressively brighter from bottom to top (muted blue, blue-purple, vivid glowing purple with checkmark), tiny human icon only at wave crests between waves as checkpoint, label 'With Surge', caption 'Surge iterates like waves. You only steer at the crests.' Minimalist flat design, clean sans-serif typography, modern tech aesthetic" |

### Image 3: Cognitive Pipeline (`cognitive-pipeline.png`)

| Property | Value |
|----------|-------|
| **Dimensions** | 1200 × 500 px |
| **Location** | After 5 highlights section |
| **Layout** | Horizontal pipeline backbone across center. 3 key phases pop out as spotlight panels with glowing emphasis borders. Non-spotlight phases stay compact. |
| **Spotlight 1** | 🔍 Research: Live Intelligence (blue glow, above backbone) — real-time web search for latest docs, best practices, domain expertise |
| **Spotlight 2** | 👥 Design: Expert Panel (purple glow, below backbone) — 3-5 independent experts, multi-perspective synthesis, veto power, no echo chamber |
| **Spotlight 3** | ✅ QA: Tiered Evaluation (green glow, above backbone) — L1→L2→L3 progressive levels, surgical precision steering for each iteration |
| **Bottom** | Iteration loop arrow from QA back to Analyze: "QA steers the next iteration — loop until converged" |
| **Style** | Dark navy background, spotlight panels with colored glow borders, compact muted non-spotlight nodes |
| **AI Prompt** | "Technical pipeline diagram, 1200x500, dark navy background. Horizontal backbone across center with nodes: PRD, Analyze, Research, Design, Implement, QA, Deliverable. Three nodes pop out as enlarged spotlight panels with glowing borders: Research panel (blue glow, above) labeled 'Live Intelligence' with subtitle about real-time web search; Design panel (purple glow, below) labeled 'Expert Panel' with subtitle about 3-5 independent experts with veto power; QA panel (green glow, above) labeled 'Tiered Evaluation' with subtitle about L1 L2 L3 progressive levels. Non-spotlight nodes compact and muted. Bottom iteration arrow from QA back to Analyze. Clean sans-serif typography, modern tech aesthetic, minimalist flat design" |

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
