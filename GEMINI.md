# Intent-Fluid Project Context

## Project Overview
**Intent-Fluid** is a curated collection of AI SKILLs, Tools, and Workflows designed to bridge the gap between high-level concepts and execution. Its core philosophy is "Intent Over Implementation," aiming to reduce the friction of coding by leveraging AI to handle low-level boilerplate, APIs, and configuration, thereby allowing creators to maintain a state of "Flow". 

## Directory Overview
The repository is architected around three main pillars intended to function as a digital agentic brain:
- **Cognitive Patterns:** Mental models and prompts for AI.
- **Atomic Actions:** Scripts and utilities for direct execution.
- **Synthesized Flow:** End-to-end automations connecting skills and tools.

## Skill Directory Structure
Skills live under `skills/`. Each skill is a directory containing a `SKILL.md` file with YAML frontmatter (name, description, version, author, tags, platforms) followed by the skill prompt body. The AI platform scans `skills/*/SKILL.md` to discover available skills and uses the `description` field to determine when to activate each skill.

Current skills:
- `skills/surge/` — Autonomous iterative delivery (PRD → analyze → research → design → implement → QA → retro)

## Key Files & Directories
- `README.md`: Contains the project manifesto, core philosophy, architecture breakdown, and use cases.
- `/skills` *(Architecture Pillar)*: A library of structured prompts, chain-of-thought methodologies, and agent configurations. Each skill has a `SKILL.md` manifest.
- `/tools` *(Architecture Pillar)*: Planned CLI utilities, lightweight Python scripts, and API connectors designed to be called automatically by AI Agents for atomic operations.
- `/workflows` *(Architecture Pillar)*: Planned end-to-end automation recipes that chain Skills and Tools together for cohesive, self-executing processes.
- `docs/SKILL_SPEC.md`: Skill developer specification — format, naming, and validation rules.
- `LICENSE`: MIT License file.

## Usage
This repository serves as a personal workshop and template library for orchestrating AI intelligence:
1. **Explore Workflows:** Identify and study end-to-end automation recipes.
2. **Adapt Skills:** Utilize the structured prompts to enforce professional, structured thinking in LLMs.
3. **Integrate Tools:** Use the atomic scripts as templates for custom API integrations and operations.
