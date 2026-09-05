# Research Basis

Evidence snapshot: 2026-09-05.

Use this reference to audit or refresh the method. It distinguishes independent research and standards from vendor implementation reports. No source below establishes the exact integrated workflow; the kernel, adapters, risk tiers, conditional-module interface, and domain-pack contract are the synthesis implemented by this skill.

## Answer First

The strongest cross-source pattern is not “generate more code.” It is to improve the control system around code generation:

- keep user outcome and accountable decisions explicit;
- expose high-signal repository and runtime context just in time;
- translate requirements and architecture boundaries into executable checks;
- work in small independently verifiable batches;
- separate implementation from sufficiently independent evaluation;
- scale permissions, review, and release authority with consequence and oracle strength;
- persist decisions and state across sessions;
- feed observed failures and user/production outcomes back into specs, tools, and guardrails.

The exact degree of autonomy is local and empirical. Model name, benchmark score, or a vendor case study is not a sufficient autonomy policy.

## Evidence Map

| Source | Evidence Role and Main Finding | Limitation | Design Consequence |
|---|---|---|---|
| [DORA State of AI-assisted Software Development 2025](https://dora.dev/research/2025/dora-report/) | Independent cross-organization research: AI acts as an amplifier of the surrounding system; the companion model emphasizes user focus, small batches, version control, data, AI stance, and platform quality. | The field and capabilities model are still evolving; associations are not a universal causal recipe. | Optimize the delivery system and user outcome, not code volume; keep the skill extensible. |
| [DORA: Working in small batches](https://dora.dev/capabilities/working-in-small-batches/) | Research-backed capability guidance: independently valuable/testable batches shorten feedback and counter AI-related delivery instability. | Suggested durations and implementation patterns depend on local context. | Make the work unit a reviewable value or learning slice, not an arbitrary file/token count. |
| [DORA: User-centric focus](https://dora.dev/capabilities/user-centric-focus/) | User focus moderates whether higher AI throughput becomes useful product performance or a feature factory. | Organization-level evidence does not specify a task workflow. | Put user/operator outcomes and real feedback in the Development Contract and completion decision. |
| [OpenAI: Harness engineering](https://openai.com/index/harness-engineering/) | Direct case: an agent-first team relied on repository-local knowledge, progressive documentation, executable architecture, agent-visible UI/logs/metrics, isolated worktrees, review loops, and continuous cleanup. | One unusual vendor team; reported scale, speed, and low blocking-gate policy are not general benchmarks. | Make project and runtime reality legible; encode invariants; treat extreme autonomy and merge policy as locally earned. |
| [OpenAI: Building an AI-native engineering team](https://cdn.openai.com/business-guides-and-resources/building-an-ai-native-engineering-team.pdf) | Vendor lifecycle guide: agents can assist planning through operations, while humans retain strategy, architecture, ambiguous tradeoffs, test intent, final review, and sensitive actions. | Prescriptive vendor guidance, not independent effectiveness research. | Allocate authority by decision type; keep tests, review, and high-consequence ownership explicit. |
| [Anthropic: Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | Mechanism and practitioner guidance: context is finite; prefer the smallest high-signal context, right-altitude instructions, just-in-time retrieval, compaction, and structured memory. | Model behavior and techniques evolve; some claims are vendor observations. | Keep `SKILL.md` as router/kernel and load mode/domain references on demand. |
| [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | Direct experiment: a vague product-clone prompt underperformed; feature status, baseline smoke paths, incremental work, and handoff artifacts improved long-running continuity. | Narrow web-app/model/harness setting; feature completion does not prove value or legal permission. | Give reconstruction its own authorized evidence and parity adapter; resume from explicit state. |
| [Anthropic: Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) | Direct experiment: planner/generator/evaluator separation, tractable chunks, structured artifacts, and operationalized subjective criteria improved complex builds. | The richer harness cost much more; every component encodes assumptions that can become stale. | Keep roles separable but optional; use independent evaluation when value exceeds coordination cost. |
| [Anthropic: Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) and [Agent Skills specification](https://agentskills.io/specification) | Primary format/design sources: specialized procedural knowledge can be composed through discovery metadata, a core file, on-demand references, and deterministic scripts; skills should evolve from representative evaluations. | This establishes packaging mechanics, not the exact software-development/domain schema. | Represent vertical expertise as progressively disclosed domain packs and include an evaluation contract. |
| [Anthropic: Claude Code sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing) | Direct security implementation: filesystem and network isolation together enable autonomy inside boundaries and reduce approval fatigue. | Vendor implementation and reported metric; host capabilities vary. | Define permission envelopes; prefer enforced containment plus meaningful escalation over blanket access or constant prompts. |
| [GitHub Spec Kit](https://github.com/github/spec-kit), [SDD philosophy](https://github.com/github/spec-kit/blob/main/spec-driven.md), and [existing-project guidance](https://github.com/github/spec-kit/blob/main/docs/guides/existing-projects.md) | Current toolkit mechanics: durable specification-plan-task artifacts, human gates, extensible workflows, greenfield/brownfield paths, reviewable baselines, and bounded adoption. | Project documentation demonstrates a method but does not prove comparative effectiveness. | Treat intent artifacts as living executable contracts and adapt orientation rather than duplicating the kernel. |
| [GitHub: Review AI-generated code](https://docs.github.com/en/enterprise-cloud@latest/copilot/tutorials/review-ai-generated-code) and [responsible use of agents](https://docs.github.com/en/copilot/responsible-use/agents) | Product safety guidance: generated code can look valid while being semantically wrong, insecure, out of scope, or similar to public code; code, tests, and dependencies require review. | Vendor documentation, not a controlled study. | A plausible diff is never completion evidence; inspect changed oracles and provenance. |
| [METR Task-Completion Time Horizons](https://metr.org/time-horizons/) | Independent empirical research: task success varies with duration, domain, model, reliability threshold, and exact agent setup. | The suite is concentrated in software engineering, ML, and cybersecurity and cannot set project SLAs. | Default to bounded slices and expand autonomy only from representative local evidence. |
| [NIST SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | Public standard: outcome-oriented secure development practices can be integrated into any SDLC and tailored by risk. | High-level framework; technology, organization, and domain implementation remain necessary. | Keep a universal security baseline and activate deeper threat/privacy/compliance modules by trigger. |
| [NIST SP 800-218A](https://www.nist.gov/news-events/news/2024/07/secure-software-development-practices-generative-ai-and-dual-use-foundation) | AI-specific SSDF community profile for producers/acquirers of generative-AI models and systems. | Applies when the product includes relevant AI, not merely when an AI assistant writes ordinary software. | Route AI/ML product controls as a conditional module/domain overlay. |
| [OpenSSF Security-Focused Guide for AI Code Assistant Instructions](https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions) | Cross-industry guidance: instructions should be concise/actionable and paired with secure defaults, least privilege, dependency/provenance controls, and automated security checks. | Guidance quality does not guarantee a particular generated change is secure. | Put concrete technology/domain hazards and proof-producing checks in repository rules and domain packs. |
| [SLSA v1.2](https://slsa.dev/spec/v1.2/) | Approved industry specification: source/build tracks and provenance provide incremental software-supply-chain assurance; provenance must be verified against expectations. | Not every local prototype needs a distribution pipeline or SLSA claim. | Activate supply-chain/release assurance for distributed artifacts; do not impose it on local-only work. |
| [WIPO Copyright FAQ](https://www.wipo.int/en/web/copyright/faq-copyright) | International high-level guidance: software expression is commonly protected while ideas, procedures, and methods are distinguished. | Exact licenses, exceptions, contracts, other IP rights, and jurisdictional outcomes are project-specific. | Require rights/provenance and independent implementation in reconstruction; escalate legal uncertainty rather than asserting permission. |

## Corroborated Claims

### AI is an amplifier, so feedback and guardrails must scale with throughput

DORA provides the independent system-level finding. OpenAI and Anthropic cases show concrete mechanisms—repository legibility, executable constraints, runtime observability, small work units, and evaluators—while GitHub and OpenSSF describe generated-code failure modes. This supports the universal evidence kernel with high confidence. It does not support any single vendor's throughput number or automation policy as a general target.

### Small, independently verifiable work is safer than large one-shot generation

DORA small-batch guidance, METR task-duration results, and two independent vendor harness accounts point in the same direction. The skill therefore slices by value and oracle boundary. It deliberately avoids a universal duration, line count, or token budget because the evidence says performance depends on task and harness.

### Durable context and progressive disclosure are complementary

OpenAI reports repository-local plans and knowledge as its system of record; Anthropic explains finite attention and progressive loading; GitHub Spec Kit and Agent Skills provide working artifact structures. The synthesis is a compact entrypoint plus on-demand mode/domain references and a distilled handoff—not either stateless prompting or an always-loaded manual.

### Security requires lifecycle integration and bounded permissions

NIST, OpenSSF, and SLSA provide independent standards/guidance; Anthropic and OpenAI supply sandbox implementations. The skill separates the universal baseline from risk-triggered modules and distinguishes authorization from sandbox mechanics.

## Design Syntheses to Validate

These are intentionally versioned as `0.1.0` hypotheses rather than external standards:

- the exact eight outcomes in the core kernel;
- the S0-S2 scale and R0-R3 risk labels;
- the three engagement adapters and mixed-mode composition rule;
- the exact Domain Pack fields and Domain Delta;
- the module matrix and completion states;
- the parity-versus-optimization ledger split;
- the evaluation rubric thresholds and acceptable ceremony cost.

Use `evaluation.md` to forward-test them. Preserve failures and revise the narrowest implicated rule.

## Important Tensions and Resolutions

| Tension | Evidence | Resolution in This Skill |
|---|---|---|
| Autonomy versus safety | Extreme-autonomy cases coexist with DORA instability and generated-code/security warnings. | Autonomy expands inside risk-tiered, sandboxed, reversible boundaries with accountable gates. |
| Complete spec versus learning | SDD favors executable intent; user-value and feasibility can remain uncertain. | Living Development Contract plus explicit learning slices and falsifiable hypotheses. |
| Persistent context versus context rot | Long-running work needs memory; excess context dilutes attention. | Small project map, durable artifacts, task-specific context packet, and freshness checks. |
| Generic workflow versus vertical correctness | General models need domain-specific terms, invariants, data semantics, and oracles. | Domain packs tighten the kernel through a stable extension contract. |
| Full lifecycle versus variable product shape | Security and review are universal controls; deployment/operations/migration are not universal activities. | Mandatory applicability scan plus conditionally executed modules. |
| Parity versus optimization | Reconstruction needs fidelity; product work also seeks differentiation. | Separate parity and optimization ledgers with explicit claims and acceptance targets. |
| Independent review versus coordination cost | Evaluator separation can help, but rich multi-agent harnesses are costly and model-dependent. | Independent review scales with risk/oracle weakness; separate agents remain optional. |

## Refresh Triggers

Re-run focused research and update this file when:

- DORA publishes a materially different AI-assisted development model or replication;
- NIST SSDF, its AI profile, SLSA, Agent Skills, or key ecosystem security guidance changes version;
- representative local evaluations show the kernel, tiering, or domain interface causes recurring failure;
- agent context, tool, sandbox, long-horizon, or evaluation capabilities change enough to invalidate current harness assumptions;
- an actual domain or jurisdiction requires current regulation, market rules, scientific standards, or legal interpretation;
- a linked source is stale, unavailable, or contradicted by stronger independent evidence.

Record the access date, changed claim, confidence update, affected rule, and evaluation scenario. Do not update methodology from popularity, benchmark marketing, or one successful demo alone.
