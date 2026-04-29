---
name: domain-sensemaking
description: "Use proactively when the user needs to make sense of an unfamiliar, ambiguous, complex, or messy domain before acting. Trigger not only on explicit requests like deep research, exploratory search, sensemaking, knowledge graph learning, frontier exploration, research workflow, evidence synthesis, or industry consulting, but also on vague questions, 'I do not know where to start', learning plans, market/industry/technology/product trend analysis, competitor/user/interview/observation synthesis, scientific or engineering investigation design, hypothesis generation, theory building, decision framing, strategy memo creation, and situations where the task requires iteratively reframing the question, ranking what to explore next, building concept/claim/evidence relationships, or deriving an actionable conclusion from incomplete information. Do not use for simple fact lookup, narrow one-shot Q&A, or tasks with an already fixed implementation path."
---

# Domain Sensemaking

Use this skill to convert a vague question into an iterative research workflow: frame the problem, generate and rank exploration frontiers, collect evidence, build a concept/claim graph, reframe the question, test convergence, then synthesize a traceable conclusion.

This skill is platform-neutral. Use whatever capabilities are available: local files, user-provided notes, web search, papers, databases, interviews, code experiments, or only dialogue. If a platform lacks browsing, file writes, or subagents, continue with explicit assumptions and ask for the missing inputs.

## Deterministic Helpers

When a filesystem and Python are available, use the bundled `scripts/sensemaking_helper.py` for fixed-format work instead of recreating tables manually:

```bash
python scripts/sensemaking_helper.py init --output path/to/workspace --question "..." --mode Learning
python scripts/sensemaking_helper.py score-frontier path/to/frontier.csv --format markdown
python scripts/sensemaking_helper.py check-convergence path/to/convergence.csv
```

All paths above are relative to this skill's directory. Resolve them against the skill's installed location before executing.

- Use `init` at the start of substantial research to create a problem card, frontier queue, relationship tables, convergence checklist, and synthesis scaffold.
- Use `score-frontier` whenever candidate nodes have `impact`, `uncertainty`, `explorability`, and `cost` scores.
- Use `check-convergence` before final synthesis to avoid ending with an unchecked narrative.
- If scripts cannot run, follow `references/templates.md` manually and keep the same fields.

## Core Rules

- Treat LLM output as candidate structure or hypotheses, not evidence.
- Separate `source`, `claim`, `evidence`, and `inference`. Never conflate them.
- Preserve question evolution. Do not silently replace the initial question with a cleaner one.
- Prefer a small explicit knowledge graph over a long reading list.
- Rank the next frontier before continuing exploration.
- Stop exploration when evidence can support a decision, explanation, experiment, or synthesis; do not optimize for completeness.
- For time-sensitive, financial, legal, medical, scientific, or business-critical facts, verify with primary or current sources when available.

## Mode Selection

Choose one primary mode before exploring:

| Mode | Use when | Primary output |
|---|---|---|
| Learning | The user wants to understand a mature or emerging domain | mental model, concept map, competency questions |
| Research / Engineering | The user needs a hypothesis, design, experiment, or technical plan | testable hypotheses, design space, validation plan |
| Consulting / Decision | The user must act on messy market, business, user, or competitor signals | recommendation, assumptions, scenarios, monitoring signals |

If the user does not specify the mode, infer it from the requested output. If still unclear, default to Learning for understanding questions and Consulting / Decision for business action questions.

## Workflow

**Write-through rule**: every step produces files, not just conversation text. When a workspace exists, write each artifact (problem card, frontier CSV, node exploration notes, relation/claim/contradiction tables, convergence CSV, final synthesis) to the workspace **immediately after completing that step** before moving on. Keeping results only in the conversation is not acceptable — the workspace is the single source of truth and must stay up to date so that later steps (and the helper scripts) can read from it.

### 0. Frame the Problem

Run `init` to create the workspace, then **immediately fill in** the generated `problem-card.md` with concrete content before proceeding to Step 1. Do not leave placeholder fields empty — populate every section (uncertainties, known facts, hypotheses, constraints, convergence criteria) now, based on the user's question and whatever context is available. The filled problem card is the input to frontier generation; an empty template has no value.

Create a problem card before searching:

- `initial_question`: raw user question.
- `mode`: Learning, Research / Engineering, or Consulting / Decision.
- `target_output`: what the user needs at the end.
- `core_uncertainties`: 3-7 unknowns that can change the conclusion.
- `known_facts`: confirmed context.
- `initial_hypotheses`: plausible but unproven beliefs.
- `constraints`: time, data, scope, cost, permissions, business boundary.
- `draft_convergence_criteria`: what would be enough to stop.

### 1. Build the Initial Frontier

Generate a first frontier from the problem card, then **write the nodes to `frontier.csv`** with scores. Use `score-frontier` to rank them and overwrite the CSV with sorted results. Classify nodes instead of listing undifferentiated keywords:

- `concept`: terms, theories, mechanisms, models.
- `variable`: factors, metrics, constraints, drivers.
- `method`: solution patterns, algorithms, procedures, tools.
- `evidence`: papers, reports, datasets, interviews, observations.
- `case`: companies, incidents, products, historical examples.
- `controversy`: conflicting claims or interpretations.
- `hypothesis`: falsifiable assumptions.
- `decision`: action-relevant judgment points.

For each node, write the uncertainty it is meant to reduce.

### 2. Explore Nodes

For each selected frontier node, collect four outputs and **save each exploration as a separate file** in the workspace (e.g., `node-1-name.md`):

1. Definition: what it is and what it is not.
2. Structure: related concepts, variables, methods, cases, and dependencies.
3. Evidence: supporting and opposing sources, with reliability notes.
4. Implication: how this changes the question, hypotheses, or next frontier.

Use breadth-first exploration for the first map, then depth-first exploration for high-impact nodes.

### 3. Engineer the Knowledge

Maintain three working tables and **write them to `relations.csv`, `claims.csv`, and `contradictions.csv`** as you go. Update these files incrementally after each exploration round, not just at the end:

- Concept relation table: `A`, `relation`, `B`, `note`.
- Claim-evidence table: `claim`, `supporting_evidence`, `opposing_evidence`, `confidence`.
- Contradiction/gap table: `type`, `content`, `next_action`.

Use relation labels such as `is-a`, `part-of`, `depends-on`, `causes`, `enables`, `contrasts-with`, `evolves-from`, `used-for`, and `failure-mode-of`.

### 4. Reframe the Question

After each exploration round, rewrite the question and explain why:

- Broad question -> sub-question.
- Concept question -> mechanism question.
- Open question -> decision question.
- Single-cause question -> system question.

Keep the original question visible so the final synthesis can explain how the investigation evolved.

### 5. Check Convergence

Update `convergence.csv` with the current status of each check, then run `check-convergence` to verify. Converge only when all relevant checks pass:

- The question is now specific enough to answer.
- The main concept/variable/claim graph has no critical isolated nodes.
- Key disagreements can be explained.
- Important claims have enough evidence or are explicitly marked uncertain.
- A decision, explanation, experiment, or next action can be derived.
- New exploration mostly repeats known nodes or does not change the conclusion.

If checks fail, return to frontier ranking (step 6).

### 6. Rank the Next Frontier

Do not continue by asking for "more related topics." Score candidate nodes:

```text
frontier_score = impact * uncertainty * explorability / exploration_cost
```

Prioritize nodes that can change the final conclusion, are currently uncertain, can be explored with available methods, and have acceptable cost. Defer low-impact or untestable nodes.

### 7. Synthesize

Write the final output to `final-synthesis.md`. The final output is a reasoned argument, not a source dump:

- Restate the initial question.
- Show how the question was reframed.
- Summarize explored nodes and why they mattered.
- Present the concept/variable/claim graph in text or table form.
- State core claims with evidence and confidence.
- Explain contradictions and remaining unknowns.
- Answer the question.
- Provide mode-specific next actions.

For reusable table templates, output contracts, and mode-specific checklists, read `references/templates.md`.

## Persistence

When operating inside a knowledge base or project, save substantial results to the appropriate durable location and link them into the local index. When no file system is available, return a self-contained artifact that the user can store manually.
