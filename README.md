# Intent-Fluid

> **"Transforming human intent into autonomous execution. Stop manual grinding, start directing intelligence across code, content, and strategy."**

<p align="left">
  <img src="https://img.shields.io/badge/Platform-Claude_Code_|_Cursor_|_Gemini_CLI-success?style=for-the-badge" alt="Platform Supported">
  <img src="https://img.shields.io/badge/Paradigm-Intent_Driven-ff69b4?style=for-the-badge" alt="Paradigm: Intent-Driven">
  <img src="https://img.shields.io/badge/Focus-Flow--State-blueviolet?style=for-the-badge" alt="Focus: Flow-State">
</p>

<!-- Insert Demo GIF here: e.g., ![Intent-Fluid Demo](docs/assets/demo.gif) -->

---

## 📦 Quick Start & Installation

See the full [Installation Guide](docs/INSTALL.md) for platform-specific instructions.

**Quick start (any platform):**

```bash
git clone https://github.com/carbonshow/intent-fluid.git
```

| Platform | Command |
|----------|---------|
| Claude Code | `/plugin install intent-fluid@carbonshow` |
| Cursor | `/add-plugin intent-fluid` |
| Gemini CLI | `gemini extensions install https://github.com/carbonshow/intent-fluid` |

---

## 🧬 General Cognitive Engine (Use Cases)

Intent-Fluid is not just a code generator; it's a general-purpose methodology executor.

*   🧠 **Knowledge Architecture (Research & Synthesis):**
    *   **The Intent:** "Analyze these raw competitor documentation URLs and synthesize a comprehensive feature comparison matrix in Markdown."
    *   **The Fluid Workflow:** Provide the intent → the **surge** skill autonomously researches, extracts key differences, and formats a professional report.
*   💻 **Full-Stack Engineering (From Spec to Production):**
    *   **The Intent:** "Based on this rough API draft, design the database schema, generate the Node.js endpoints, and write comprehensive integration tests."
    *   **The Fluid Workflow:** Hand the draft to a skill → it orchestrates multi-phase delivery (design, implement, QA) with convergence detection.
*   📝 **Content Pipeline (Creation & Repurposing):**
    *   **The Intent:** "Deconstruct this 10-page technical whitepaper into a 5-part Twitter thread series optimized for engagement."
    *   **The Fluid Workflow:** The agent understands the context, restructures the narrative, and delivers ready-to-publish content.

---

## 🎯 Available Skills

| Skill | Description |
|-------|-------------|
| [surge](skills/surge/) | Autonomous delivery system — iterative analyze/research/design/implement/QA cycles driven by a Director Agent. Provide a PRD to activate. |

---

## 🌊 The Manifesto

As software creators and knowledge workers, our greatest asset is our ideas. Yet, a massive chasm exists between a concept and its realization: **the friction of execution**.

We spend invaluable cognitive energy fighting boilerplate, syntax, formatting, and infrastructure configuration. This friction destroys **Flow**.

**Intent-Fluid** is a curated collection of AI SKILLs designed to bridge this chasm. It embodies a new paradigm where human intention is the primary input, and AI acts as the adaptive catalyst that materializes that intention without requiring us to get bogged down in low-level details.

Here, we don't just write code; we orchestrate intelligence.

### The Core Philosophy

1.  **Intent Over Implementation:** We focus on *what* to achieve, leveraging AI to handle the *how*.
2.  **Flow-State Engineering:** If a workflow forces you to switch context or consult documentation for more than 30 seconds, it's broken. We build tools that maintain creative momentum.
3.  **Rapid Verification:** The time from "What if?" to "Here's a prototype" should approach zero.

---

## 🏗️ Architecture

### `/skills` — Cognitive Patterns

A library of structured prompts, chain-of-thought methodologies, and agent configurations. Each skill lives in its own directory under `skills/` with a `SKILL.md` manifest that defines when and how to activate it. See the [Skill Specification](docs/SKILL_SPEC.md) for the canonical format.

---

## 🚀 Getting Started

### Using Skills

1. Install intent-fluid (see above)
2. Start a new AI session
3. Provide a PRD or detailed spec — the appropriate skill activates automatically

### Creating a New Skill

1. Read the [Skill Specification](docs/SKILL_SPEC.md)
2. Copy the [Skill Template](docs/SKILL_TEMPLATE.md)
3. Create your skill under `skills/<your-skill-name>/`
4. Validate: `bash scripts/validate-skill.sh skills/<your-skill-name>`

### Exploring the Codebase

1.  **Study the [Skill Spec](docs/SKILL_SPEC.md):** Understand the canonical format for skill authoring.
2.  **Read `/skills/surge`:** See how a production skill is structured with references, scripts, and assets.
3.  **Adapt the patterns:** Use the prompt structures as templates for your own AI-assisted workflows.

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details. It is open for adaptation, provided credit is given to the original philosophy.

---
<p align="center">"Stay in flow. Let the intelligence follow your will."</p>
