<p align="center">
  <img src="assets/images/hero-banner.png" alt="Intent-Fluid" width="100%">
</p>

<p align="center">
  <strong>Transforming human intent into autonomous execution.</strong><br>
  Stop manual grinding, start directing intelligence.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Claude_Code_|_Cursor_|_Gemini_CLI-success?style=for-the-badge" alt="Platform Supported">
  <img src="https://img.shields.io/badge/Paradigm-Intent_Driven-ff69b4?style=for-the-badge" alt="Paradigm: Intent-Driven">
  <img src="https://img.shields.io/badge/Focus-Flow--State-blueviolet?style=for-the-badge" alt="Focus: Flow-State">
</p>

---

## 🎬 See Surge In Action

<p align="center">
  <video src="assets/videos/surge-demo.mp4" width="100%" controls autoplay muted>
    Your browser does not support the video tag. <a href="assets/videos/surge-demo.mp4">Download the demo video</a>.
  </video>
</p>

> **One PRD in → complete deliverables out.** Watch Surge autonomously iterate through Analyze → Research → Design → Implement → QA until quality converges.

---

## ⚡ The Difference

<p align="center">
  <img src="assets/images/before-after.png" alt="Without Surge vs With Surge" width="100%">
</p>

---

## 🌊 Why Surge?

**🔄 Autonomous Iteration Engine**
Director Agent drives Analyze → Research → Design → Implement → QA in a closed loop. Not a one-shot generator — it iterates until quality converges. Auto-detects stagnation, oscillation, and Pareto frontiers to reach highest quality in minimum iterations.

**👥 Expert Review Panel**
Automatically assembles 3-5 domain experts for parallel design review. Each expert evaluates independently — security, performance, maintainability — with veto power. Multi-perspective synthesis eliminates blind spots.

**✅ Rigorous Quality Assurance**
Three-tier acceptance criteria (L1→L2→L3) with progressive escalation. Output integrity validation auto-detects truncation and recovers. Optimization directives are closed-loop tracked — every improvement proposed is verified next round.

**📋 PRD-to-Deliverable Pipeline**
One PRD in, complete deliverables out — code, documents, or strategy reports. Auto-analyzes requirement topology, negotiates acceptance criteria, orchestrates parallel subtasks. From fuzzy intent to structured output, fully autonomous.

**🧠 Self-Evolving Process Memory**
Extracts process experience after every iteration — ambiguities found, reusable components, rejected approaches, missing test cases. Persisted to memory files — gets smarter with every use. Retro phase generates rule update suggestions.

---

## 🧠 The Cognitive Pipeline

<p align="center">
  <img src="assets/images/cognitive-pipeline.png" alt="Surge Cognitive Pipeline" width="100%">
</p>

Intent-Fluid transforms intent into structured reality through an iterative, agentic pipeline. It doesn't generate once and stop — it loops through Analyze → Research → Design → Implement → QA until quality converges on your acceptance criteria. Each iteration extracts process memory, making the next run smarter.

---

## 📦 Quick Start

See the full [Installation Guide](docs/INSTALL.md) for platform-specific instructions.

```bash
git clone https://github.com/carbonshow/intent-fluid.git
```

| Platform | Integration |
|----------|-------------|
| Claude Code | `/plugin marketplace add carbonshow/intent-fluid` |
| Cursor | Add `https://github.com/carbonshow/intent-fluid` as a rule source or MCP server |
| Gemini CLI | `gemini extensions install https://github.com/carbonshow/intent-fluid` |

---

## 🏗 Architecture

<p align="center">
  <img src="assets/images/architecture.png" alt="Intent-Fluid Architecture" width="100%">
</p>

### Available Skills

| Skill | Description |
|-------|-------------|
| [surge](skills/surge/) | Autonomous delivery system — iterative analyze/research/design/implement/QA cycles driven by a Director Agent. Provide a PRD to activate. |

### Creating a New Skill

1. Read the [Skill Specification](docs/SKILL_SPEC.md)
2. Copy the [Skill Template](docs/SKILL_TEMPLATE.md)
3. Create your skill under `skills/<your-skill-name>/`
4. Validate: `bash scripts/validate-skill.sh skills/<your-skill-name>`

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center"><em>"Stay in flow. Let the intelligence follow your will."</em></p>
