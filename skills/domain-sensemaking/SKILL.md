---
name: domain-sensemaking
description: "Use proactively when the user needs to make sense of an unfamiliar, ambiguous, complex, or messy domain before acting. Trigger not only on explicit requests about 快速掌握未知领域, 深度调研, 调研方法论, exploratory search, sensemaking, knowledge graph learning, frontier exploration, research workflow, evidence synthesis, or industry consulting, but also on vague questions, 'I do not know where to start', learning plans, market/industry/technology/product trend analysis, competitor/user/interview/observation synthesis, scientific or engineering investigation design, hypothesis generation, theory building, decision framing, strategy memo creation, and situations where the task requires iteratively reframing the question, ranking what to explore next, building concept/claim/evidence relationships, or deriving an actionable conclusion from incomplete information. Do not use for simple fact lookup, narrow one-shot Q&A, or tasks with an already fixed implementation path."
---

# Domain Sensemaking

Use this skill to convert a vague question into an iterative research workflow: frame the problem, generate and rank exploration frontiers, collect evidence, build a concept/claim graph, reframe the question, test convergence, then synthesize a reader-calibrated conclusion.

This skill is platform-neutral. Use whatever capabilities are available: local files, user-provided notes, web search, papers, databases, interviews, code experiments, or only dialogue. If a platform lacks browsing, file writes, or subagents, continue with explicit assumptions and ask for the missing inputs.

## Deterministic Helpers

When a filesystem and Python are available, use the bundled `scripts/sensemaking_helper.py` for fixed-format work instead of recreating tables manually:

```bash
python scripts/sensemaking_helper.py init --output path/to/workspace --question "..." --mode Learning
python scripts/sensemaking_helper.py select-frontier path/to/workspace --top 3 --focus "..."
python scripts/sensemaking_helper.py new-round path/to/workspace --focus "..."
python scripts/sensemaking_helper.py new-source path/to/workspace --title "..." --url "..."
python scripts/sensemaking_helper.py score-frontier path/to/frontier.csv --format markdown
python scripts/sensemaking_helper.py lint-workspace path/to/workspace
python scripts/sensemaking_helper.py check-convergence path/to/workspace/convergence.csv --workspace path/to/workspace
python scripts/sensemaking_helper.py record-feedback --workspace path/to/workspace --artifact final-synthesis.md --dimension evidence --verdict negative --tag weak_sources --feedback "..."
python scripts/sensemaking_helper.py summarize-feedback --min-count 3
python scripts/sensemaking_helper.py propose-evolution --min-count 3
```

All paths above are relative to this skill's directory. Resolve them against the skill's installed location before executing.

- Use `init` at the start of substantial research to create a problem card, frontier queue, relationship tables, convergence checklist, and synthesis scaffold.
- Use `select-frontier` after scoring or revising the frontier; it creates the next `rounds/round-XX.md` from the highest-priority nodes. Manual overrides require an explicit reason.
- Use `new-round` before each new exploration cycle so the investigation leaves an auditable trail.
- Use `new-source` whenever you inspect a substantial webpage, paper, report, dataset, interview, or internal document whose contents may need reuse.
- Fill `reader-brief.md` before writing `final-synthesis.md`; it controls explanation depth, terminology, structure, and citation expectations for the human-facing artifact.
- Use `score-frontier` whenever candidate nodes have `impact`, `uncertainty`, `explorability`, and `cost` scores.
- Treat frontier scores as a scheduling aid, not the final research judgment. Override the ranking when a lower-scoring node is structurally central, blocks many dependencies, or better serves the user's target output.
- Use `lint-workspace` before final synthesis; fix missing rounds, source notes, empty priorities, or untraceable high-confidence claims before polishing.
- Use `check-convergence --workspace` before final synthesis to avoid ending with an unchecked narrative or self-declared convergence.
- Use `record-feedback` when the user critiques a result or when lint/self-review reveals a reusable weakness.
- Use `summarize-feedback` and `propose-evolution` after repeated feedback patterns; proposals require human review and tests before changing the skill.
- If scripts cannot run, follow `references/templates.md` manually and keep the same fields.

## Core Rules

- Treat LLM output as candidate structure or hypotheses, not evidence.
- Separate `source`, `claim`, `evidence`, and `inference`.
- Preserve question evolution. Do not silently replace the initial question with a cleaner one.
- Prefer a small explicit knowledge graph over a long reading list.
- Rank the next frontier before continuing exploration.
- Record each exploration round before moving on. A final document that says "after exploration" is not enough; the workspace must show what changed between rounds unless the task is explicitly quick-and-dirty.
- Record source contents as reusable notes. If a page, paper, or document materially informs the research, capture its key claims, useful details, reliability, and follow-up links in `source-notes/source-XXX.md`.
- Stop exploration when evidence can support a decision, explanation, experiment, or synthesis; do not optimize for completeness.
- For time-sensitive, financial, legal, medical, scientific, or business-critical facts, verify with primary or current sources when available.
- Treat working tables as research infrastructure, not the final human experience. `final-synthesis.md` must read as a reasoned document for the target reader, not as a pasted claim ledger.
- When the research must become an Agent workflow, evaluation rubric, experiment, or reusable skill, read `references/cognitive-primitives.md` and translate broad methods into execution-level primitives.
- Treat feedback as evolution evidence. Record concrete user critiques in `logs/feedback.jsonl`, but do not rewrite this skill from a single feedback event.

## Mode Selection

Choose one primary mode before exploring:

| Mode | Use when | Primary output |
|---|---|---|
| Learning | The user wants to understand a mature or emerging domain | mental model, concept map, competency questions |
| Research / Engineering | The user needs a hypothesis, design, experiment, or technical plan | testable hypotheses, design space, validation plan |
| Consulting / Decision | The user must act on messy market, business, user, or competitor signals | recommendation, assumptions, scenarios, monitoring signals |

If the user does not specify the mode, infer it from the requested output. If still unclear, default to Learning for understanding questions and Consulting / Decision for business action questions.

## Workflow

**Write-through rule**: every step produces files, not just conversation text. When a workspace exists, write each artifact (problem card, frontier CSV, node exploration notes, relation/claim/contradiction tables, convergence CSV, final synthesis) to the workspace **immediately after completing that step** before moving on. Keeping results only in the conversation is not acceptable -- the workspace is the single source of truth and must stay up to date so that later steps (and the helper scripts) can read from it.

### 0. Frame the Problem

Run `init` to create the workspace, then **immediately fill in** the generated `problem-card.md` with concrete content before proceeding to Step 1. Do not leave placeholder fields empty -- populate every section (uncertainties, known facts, hypotheses, constraints, convergence criteria) now, based on the user's question and whatever context is available. The filled problem card is the input to frontier generation; an empty template has no value.

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

Write each cycle to `rounds/round-XX.md` with:

- selected frontier nodes and why they were chosen;
- evidence collected and how reliable it is;
- what changed in the concept graph, claims, contradictions, or confidence;
- the question reframing after this round;
- decision: continue, pivot, deepen, or converge.

For substantial research, expect at least two rounds unless convergence is obvious and justified in `rounds/round-01.md`.

When you inspect a nontrivial source, create a source note instead of relying on chat memory:

- `source_id`, title, URL/path, source type, access date, and reliability.
- Key points in your own words, preserving enough detail to reuse later.
- Claims supported or contradicted by the source.
- Concepts, methods, cases, or examples discovered.
- Useful quotes or snippets only when legally and practically appropriate.
- Links to affected frontier nodes, claims, relations, and round files.

### 3. Engineer the Knowledge

Maintain three working tables and **write them to `relations.csv`, `claims.csv`, and `contradictions.csv`** as you go. Update these files incrementally after each exploration round, not just at the end:

- Concept relation table: `A`, `relation`, `B`, `note`.
- Claim-evidence table: `claim`, `supporting_evidence`, `opposing_evidence`, `confidence`.
- Contradiction/gap table: `type`, `content`, `next_action`.

Use relation labels such as `is-a`, `part-of`, `depends-on`, `causes`, `enables`, `contrasts-with`, `evolves-from`, `used-for`, and `failure-mode-of`.

For identified contradictions, actively seek design-pattern resolutions (layering, dual-track, budget allocation, scope separation) rather than only recording `next_action`. When a contradiction is resolved through a concrete integration strategy, record it in the `Resolution` column so it becomes reusable design knowledge.

For complex concept graphs, causal structures, workflows, feedback loops, or decision paths, include a Mermaid code block in `visual-map.md` or `final-synthesis.md`. Prefer Mermaid over ASCII diagrams when the Markdown renderer supports it.

### 4. Reframe the Question

After each exploration round, rewrite the question and explain why:

- Broad question -> sub-question.
- Concept question -> mechanism question.
- Open question -> decision question.
- Single-cause question -> system question.

Keep the original question visible so the final synthesis can explain how the investigation evolved.
The final synthesis should summarize the evolution, but the detailed evolution should live in the round files.

### 5. Check Convergence

Update `convergence.csv` with the current status of each check, then run `check-convergence` to verify. Converge only when all relevant checks pass:

- The question is now specific enough to answer.
- The main concept/variable/claim graph has no critical isolated nodes.
- Key disagreements can be explained.
- Important claims have enough evidence or are explicitly marked uncertain.
- A decision, explanation, experiment, or next action can be derived.
- New exploration mostly repeats known nodes or does not change the conclusion.

Run `lint-workspace` before accepting convergence; missing audit trails, source notes, empty frontier priority, or untraceable high-confidence claims are convergence blockers.
If checks fail, continue to frontier ranking.
If checks pass after only one round, write why additional exploration is low value; do not treat "all rows marked pass" as sufficient evidence by itself.

### 6. Rank the Next Frontier

Do not continue by asking for "more related topics." Score candidate nodes:

```text
frontier_score = impact * uncertainty * explorability / exploration_cost
```

Prioritize nodes that can change the final conclusion, are currently uncertain, can be explored with available methods, and have acceptable cost. Defer low-impact or untestable nodes.

### 7. Calibrate the Reader

Before writing the final synthesis, create or update a reader brief:

- `primary_reader`: who will read this and what they need to do next.
- `known_territory`: concepts, industries, tools, or methods the reader likely knows well.
- `needs_explanation`: terms, methods, or assumptions the reader may not know.
- `detail_policy`: concise, standard, teaching, or layered.
- `format_policy`: tables, diagrams, lists, prose, appendices, and split files.
- `citation_policy`: when to cite, what counts as source evidence, and whether internal notes or external links are expected.

Use the brief to adapt explanation density:

- Explain unfamiliar threshold concepts on first use with a short inline definition, footnote, or glossary entry.
- Do not explain concepts in `known_territory` unless the research uses them in a nonstandard way.
- Use layered disclosure for mixed audiences: start with a plain-language conclusion, then show the reasoning chain, then put details, source notes, or domain primers in appendices or separate files.
- If the reader cannot judge a claim without a prerequisite concept, teach just enough of that concept before using it as evidence.

### 8. Synthesize

The final output must be a reasoned argument, not a source dump:

- Restate the initial question.
- Show how the question was reframed.
- State the target reader assumptions and explanation policy, either explicitly or through the introduction.
- Lead with the conclusion, then show the reasoning chain that connects premises, evidence, intermediate inferences, and the answer.
- Summarize explored nodes only when they explain why the conclusion should change; move raw exploration history to appendices if needed.
- Present the concept/variable/claim graph in text, table, or diagram form based on what the reader needs to compare or understand.
- Use Mermaid code blocks directly for complex visualizations: `flowchart`, `graph`, `sequenceDiagram`, `stateDiagram-v2`, `timeline`, or `mindmap` as appropriate.
- State core claims with evidence, confidence, and implication. Distinguish source evidence from your inference.
- Explain contradictions and remaining unknowns in terms of how they affect the answer.
- Provide mode-specific next actions.
- For Research / Engineering mode: the synthesis must include testable hypotheses (with independent variable, dependent variable, expected effect, and measurement method) and at least one minimum validation experiment design. See `references/templates.md` for the templates.

Use format intentionally:

- Use tables for comparison, mappings, criteria, tradeoffs, evidence matrices, and decision options.
- Use Mermaid diagrams for processes, feedback loops, causal chains, dependencies, state transitions, and decision paths.
- Use lists for checklists, action items, compact taxonomies, and scan-friendly summaries.
- Use prose for causality, argumentation, interpretation, and why the conclusion follows.
- Split long outputs when the document has multiple audiences, lengthy primers, large evidence ledgers, or reusable reference material.
- Add citations or links for external facts, papers, claims from source documents, and internal repository evidence. Do not cite general reasoning that is clearly your synthesis.
- Cite source notes when possible so the final synthesis can point to durable local evidence, not only external URLs.

For reusable table templates, output contracts, and mode-specific checklists, read `references/templates.md`. For detailed human-facing synthesis rules, read `references/human-synthesis.md`. For workflow or skill design outputs, read `references/cognitive-primitives.md`.

## Self-Evolution

When the user gives feedback on a domain-sensemaking result:

1. Record it with `record-feedback`, including workspace/artifact, quality dimension, verdict, and concrete tags.
2. If similar feedback has appeared repeatedly, run `summarize-feedback --min-count 3`.
3. If a pattern is repeated and actionable, run `propose-evolution --min-count 3`.
4. Treat the proposal as a review artifact, not an automatic patch. Before changing scripts, references, or `SKILL.md`, add or update a regression test or pressure scenario.

Read `references/self-evolution.md` for dimensions, tag vocabulary, promotion rules, and the human review gate.

## Persistence

When operating inside a knowledge base or project, save substantial results to the appropriate durable location and link them into the local index. When no file system is available, return a self-contained artifact that the user can store manually.
