# Role Library and Domain Expert Construction

The role library is not a fixed cast. It is a set of review lenses plus a protocol for constructing vertical-domain experts.

## Selection Principles

1. **Prefer orthogonality**: avoid multiple roles that repeat the same concern.
2. **Choose by failure mode**: roles exist to catch ways the decision can fail.
3. **Cap serious reviews at 3-5 experts**: more usually adds synthesis noise.
4. **Include an execution lens**: complex decisions need someone to inspect delivery, testing, operations, or maintenance.
5. **Construct domain experts when needed**: do not force a generic role onto a specialized field.
6. **Ask before pretending**: if domain success criteria are unclear, ask the user to confirm the panel.

## Universal Review Lenses

| Lens | Use For | Catches |
|---|---|---|
| Product / Domain Reviewer | Product, strategy, user value, requirements. | False user assumptions, weak value proposition, scope drift. |
| System Architect | Architecture, boundaries, interfaces, complexity. | Tight coupling, unclear contracts, over-engineering, migration traps. |
| Delivery / Project Reviewer | Plans, dependencies, rollout, resources. | Unrealistic timelines, hidden dependencies, sequencing risk. |
| Quality / Test Reviewer | Acceptance criteria, test strategy, regressions. | Untestable claims, weak coverage, missing edge cases. |
| Security / Privacy Reviewer | Data, access, abuse, compliance. | Permission gaps, privacy leaks, misuse, regulatory exposure. |
| UX / Cognitive Load Reviewer | Workflows, UI, user understanding. | Confusing flows, adoption friction, poor error recovery. |
| Economics / Maintenance Reviewer | ROI, opportunity cost, ongoing cost. | Expensive low-value work, maintenance burden, hidden recurring cost. |
| Operations / SRE Reviewer | Production, monitoring, incidents, rollback. | Poor observability, fragile rollout, recovery gaps. |
| Research / Evidence Reviewer | Research, citations, external claims. | Weak evidence, overgeneralization, stale sources. |

## Technical Signal Mapping

| Signal | Candidate Roles |
|---|---|
| API, backend, database | Backend Architect, Database Reviewer, Security Reviewer |
| Frontend, component, interaction | Frontend Architect, UX Reviewer, Accessibility Reviewer |
| AI, agents, LLMs, prompts | Agent Systems Reviewer, Evaluation Reviewer, Safety Reviewer |
| Performance, scale, concurrency | Performance Engineer, Distributed Systems Reviewer, SRE |
| Infrastructure, deployment, migration | DevOps Reviewer, SRE, Rollback Reviewer |
| Documentation, knowledge systems | Information Architecture Reviewer, Reader Experience Reviewer |
| Skills, prompts, workflows | Skill Design Reviewer, Trigger/Evaluation Reviewer, Process Reliability Reviewer |

## Domain Expert Construction Protocol

When the task is in a vertical domain, construct role cards instead of relying only on the universal lenses.

Algorithm:
1. Identify the domain and subdomain.
2. Extract 3-7 domain success criteria.
3. Extract 3-7 domain failure modes.
4. Map the highest-impact failure modes to expert lenses.
5. Add one execution or implementation expert.
6. Add one evidence or risk expert when claims are uncertain.
7. Cap the panel at 5 experts.
8. If confidence is low, ask the user to confirm or adjust the proposed panel.

Role card format:

```markdown
## Expert Role Card
- Title:
- Domain:
- Review Lens:
- Failure Modes to Catch:
- Evidence Standard:
- Typical Blind Spots:
- What This Expert Must Not Do:
```

## Confidence Gate

Ask the user to confirm the panel when:
- The domain has specialized success criteria the agent cannot infer.
- Regulatory, financial, medical, legal, safety, or other high-stakes expertise is central.
- The panel would otherwise rely mostly on `[unknown]` or generic judgment.
- The user likely has domain knowledge that can materially improve role selection.

Suggested question:

```markdown
I can construct a domain-specific expert panel, but I need to confirm the domain's evaluation standard. Which success criteria matter most here?
A. Growth or return
B. Risk control
C. User or reader experience
D. Feasibility and execution
E. Long-term impact
F. Other
```

## Examples

### Financial Investment

Possible panel:
- Portfolio Risk Reviewer: position sizing, drawdown, correlation, tail risk.
- Fundamental / Valuation Reviewer: valuation assumptions, earnings quality, cycle position.
- Market Structure Reviewer: liquidity, transaction costs, crowded trades, reflexivity.
- Regulatory / Compliance Reviewer: suitability, restrictions, disclosure, legal boundaries.
- Behavioral Risk Reviewer: confirmation bias, narrative traps, historical overfitting.

### Xianxia Web Novel

Possible panel:
- Worldbuilding Consistency Reviewer: cultivation logic, resource economy, faction structure.
- Character Motivation Reviewer: desire, conflict, growth arc, emotional credibility.
- Genre Reader Experience Reviewer: payoff rhythm, chapter hooks, expectation management.
- Plot Architecture Reviewer: foreshadowing, escalation path, long-serialization tension.
- Cliche / Fatigue Red Team: trope fatigue, power inflation, protagonist immunity, stale arcs.

### Green Energy Commercialization

Possible panel:
- Technology Readiness Reviewer: maturity, efficiency, reliability, lifecycle.
- Project Finance Reviewer: CAPEX, OPEX, LCOE, IRR, subsidy dependence.
- Grid / Operations Reviewer: interconnection, curtailment, storage, maintenance.
- Policy / Carbon Accounting Reviewer: policy cycles, carbon boundaries, compliance.
- Deployment Red Team: scale-up gaps across supply chain, permits, local execution, business model.

## Expert Output Contract

```markdown
## Role
## Core Judgment
## Evidence
## Assumptions
## Unknowns
## Failure Modes
## Recommended Action
## Must-Fix / Nice-to-Have
```

## Red Team and Judge Are Not Normal Experts

The red team is a separate adversarial phase. It attacks assumptions, counterexamples, incentives, metrics, cost, edge cases, security, privacy, compliance, operations, and bland compromise.

The judge is also separate. It arbitrates rather than summarizes and must decide which claims are supported, which risks block action, what path is recommended, and what minimum validation is required.
