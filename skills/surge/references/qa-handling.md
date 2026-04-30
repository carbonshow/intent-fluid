# QA Result Handling Detailed Logic

This document is the complete reference manual for the Director handling QA phase outputs.

---

## Three-Value Conclusion Handling

Read `iter_{N}_qa.md`, handle according to the three-value conclusion.

### Conclusion: Pass-Converged

All acceptance items passed, all quality dimensions ≥ Good.

**Handling**: Execute Evaluator Calibration Review (see §Evaluator Calibration Review below), then execute Completion Review Checkpoint (see §Completion Review Checkpoint below). Enter retro only after user confirms.

### Director Override: Pass-Optimizable → Converged

The QA subagent may output "Pass-Optimizable" even when all quality dimensions are ≥ Good (e.g., because it identifies High/Medium benefit improvements). In this case, the **Director** applies the following override rule:

> When ALL quality dimensions are ≥ Good AND all acceptance criteria at the current evaluation level pass, the Director SHOULD declare convergence, execute Evaluator Calibration Review, then execute Completion Review Checkpoint. Enter retro only after user confirms.

This prevents the common failure mode where QA never outputs "Pass-Converged" due to conservative judgment. The QA subagent's optimization gradients are still recorded in `quality_history` for the retro phase.

### Conclusion: Pass-Optimizable

All acceptance items passed, but some quality dimensions still have room for improvement. **Director executes convergence detection.**

### Conclusion: Fail

There are failed acceptance items, handle according to deviation level (see Deviation Level Handling Table below).

---

## Convergence Conditions

**Stop iteration, execute Evaluator Calibration Review + Completion Review Checkpoint, and enter retro only after user confirms, if ANY condition is met:**

| # | Condition Name | Judgment Criteria |
|---|----------------|-------------------|
| 1 | **Low Marginal Benefit** | Expected benefits of all improvement items in optimization gradient are "Low" |
| 2 | **Insufficient Budget** | Remaining iteration rounds ≤ 1 and no "High" benefit improvement items |
| 3 | **Plateau Phase** | Quality evaluation tier of each dimension has no substantial change for 2 consecutive rounds (`plateau_count >= 2`). **Note**: When judging, must combine with the intra-tier positioning description in QA output — if the tier remains unchanged but positioning description shows significant progress (e.g. "just entered Basic" -> "close to Good"), Director should judge it as a substantial change and NOT increase plateau_count |
| 4 | **Pareto Frontier** | Regression warning (`[REGRESSION]`) appears, indicating trade-offs between multiple dimensions, unable to improve all simultaneously — show regression situation to user, let user decide whether to accept current results or specify optimization priority |
| 5 | **Oscillation Detection** | Check `quality_history`, if the same dimension bounces back and forth in tier for 3 consecutive rounds (e.g. Basic→Good→Basic or Good→Basic→Good), judged as oscillation mode — optimization direction for that dimension has internal conflicts, must lock that dimension (no longer target for optimization) or ask user to rule on priority |

---

## Processing Flow When Not Converged

If no convergence conditions are met:

1. Filter improvement items with expected benefit "High" or "Medium" from the optimization gradient.
2. Elevate evaluation level (if currently L1 and improvement items don't involve L2, elevate to L1+L2; similarly for L3).
3. **Determine Iteration Path** (Full vs Lightweight):
   - **Full Iteration** (Default): Execute all phases starting from analyze.
   - **Lightweight Iteration**: When all the following conditions are met simultaneously, the Director can choose to skip analyze and research, starting directly from design or implement:
     - All acceptance items passed (i.e. conclusion is "Pass-Optimizable" not "Fail").
     - Improvement items in optimization gradient only belong to non-functional dimensions (e.g. maintainability, code style, readability).
     - No changes in requirement understanding or new features.
   - Selection of starting phase for lightweight iteration: If improvements require structural changes, start from design; if only local tweaks (e.g. adding comments, renaming) start from implement.
4. **Determine Optimization Intensity Guidance** (Step size control):
   - **Early (L1 not fully passed)**: Allow large-scale changes, optimization directives do not limit modification scope.
   - **Mid (L1 passed, optimizing L2/L3)**: Limit modification scope to dimensions specified in optimization gradient, explicitly tell subagent not to refactor already passed parts.
   - **Late (All passed, only optimizing quality)**: Demand targeted refinement, mark `[REFINEMENT-ONLY]` in optimization directives, subagent must not introduce structural changes.
   - **After Regression**: Narrow optimization scope to the regressed dimension and directly related code, mark `[REGRESSION-FIX]`.
5. Update `state.md`:
   - `current_eval_level` updated to new tier.
   - `last_quality_assessment` store summary of this round's quality evaluation (incl. intra-tier positioning).
   - `quality_history` append this round's evaluation records.
   - `plateau_count`: If tier is identical to previous round **AND** intra-tier positioning has no significant change, +1; otherwise reset to 0.
   - `optimization_directives` store the filtered list of optimization directives (for next round QA to verify).
6. **Deadlock Circuit Breaker**: If an acceptance standard is marked "Partial Pass" for two consecutive rounds with no substantial improvement, the Director should escalate it to a P0 blocking item, or submit it to the user as an independent decision item in the Iteration Review (accept status quo and mark risk vs force refactor), preventing endless plateaus.
7. Inject the filtered improvement items as "optimization directives" into the next round's context (appended to prompt passed to each phase), with intensity labels.
8. Return to the start of the iteration loop, `iteration` +1.

---

## Evaluation Tier Progression Rules

| Current State | Condition | Next Round Tier |
|---------------|-----------|-----------------|
| L1 | All L1 passed | L1+L2 |
| L1+L2 | All L1+L2 passed | L1+L2+L3 |
| L1+L2+L3 | All passed | Keep L1+L2+L3 |
| Any tier | L1 fails | Rollback to L1 |

- Round 1 QA evaluates L1 (If `deliverable_type` is `document`, because it highly relies on L2 attributes like terminology consistency and evidence strength, Round 1 should default to evaluating `L1+L2`)
- After L1 passes fully, include L2 next round (Evaluate L1+L2)
- After L1+L2 passes fully, include L3 next round (Evaluate L1+L2+L3)
- If L1 fails in any round, evaluation tier rolls back to L1

---

## Deviation Level Handling Table

| Level | Judgment Criteria | Handling |
|-------|-------------------|----------|
| Level 1 Execution | Output exists but has implementation defects, can be fixed without redesign | Rerun implement, pass deviation details |
| Level 2 Design | Output structure/interfaces do not match design doc, or design cannot meet requirements | Rollback to design |
| Level 3 Requirement | Misunderstood requirements, or requirement itself changed, redesign cannot solve it | Rollback to analyze or escalate to human |

**Judgment Priority**: Start from Level 1, explicitly rule out lower-level reasons before escalating.

Read deviation level suggestions in qa output, combine with own judgment to decide rollback target.

### state.md Update upon Failure

- `last_deviation_level` is this round's deviation level.
- `current_eval_level` roll back to `"L1"` (failure means core standards need re-verification).
- `plateau_count` reset to 0.
- `quality_history` append this round's record (record even if failed, to ensure oscillation detection continuity).
- `optimization_directives` clear to `[]` (do not inject optimization directives when failed, to prevent next round QA from verifying outdated directives).

---

## Acceptance Criteria Modification Flow

If qa suggests modifying acceptance criteria, present suggestions to the user for confirmation. After modifying:
- Update `acceptance.md`.
- In `state.md` increment `acceptance_modifications` by 1.
- If `acceptance_modifications >= 2`, explain reasons to the user and ask whether to continue.

---

## Test Suite Evolution Mechanism

Read the "Test Suite Evolution Suggestions" block in `iter_{N}_qa.md`. If there are new suggestions:

### 1. Review

Director evaluates the rationality of suggestions one by one:
- Is it a duplicate of existing items?
- Is it within the reasonable scope of the current task? (Avoid scope creep)
- Is the suggested tier attribution reasonable?

### 2. Append

Append approved items to the end of the corresponding tier in `test_cases.md`. If core items need to be synchronized in `acceptance.md`, they can be appended accordingly, but the primary accumulation occurs in `test_cases.md`.

### 3. Mark Source

Append `(iter-{N} evolved)` after the verification method of the new item to indicate which iteration round it was added in.

### Constraints

- Max 5 new items per round.
- Do not delete existing items.
- If new items will double or more the number of items in the current evaluation tier, confirm with the user (prevent test suite runaway bloat).

---

## Optimization Directive Closed-Loop Verification

**From Round 2**, when dispatching the QA subagent, the Director MUST pass the `optimization_directives` from `state.md` (the list injected in the previous round). The QA subagent will verify execution item by item in Stage 5.

### Director Handling QA Verification Results

Read the "Optimization Directive Execution Verification" block in `iter_{N}_qa.md`:

| Execution Status | Director Handling |
|------------------|-------------------|
| **Executed** | No extra handling, directive took effect |
| **Partially Executed** | Analyze missing part, decide whether to supplement directive next round |
| **Unexecuted (Forgotten)** | Re-inject directive next round, elevate priority in prompt |
| **Unexecuted (Conflict)** | Analyze conflict reason, may need to adjust directive or split into multiple steps |
| **Unexecuted (Infeasible)** | Remove from optimization targets, record in memory_draft |
| **Not Applicable** | Normal, no handling needed |

**Constraints**: If the same directive is "Unexecuted" for two consecutive rounds, the Director should explain it to the user in the Iteration Review and ask for guidance, rather than blindly continuing to inject it.

---

## Iteration Review Checkpoint

**After process experience extraction is complete, and before entering the next iteration round, the Director MUST execute a User Review Checkpoint.**

### Trigger Conditions

- **Trigger**: QA conclusion is "Fail" or "Pass-Optimizable but Unconverged" — i.e., any situation requiring continued iteration.
- **Do Not Trigger**: "Pass-Converged" or "Pass-Optimizable and Converged" goes straight to retro, no Review needed.

### Display Format

```
Iteration Review — Round {N} Ended
─────────────────────────────────────────
QA Conclusion: [Fail / Pass-Optimizable]
Deviation Level: [Level X (If Fail) / No Deviation]
Quality Change: [Summary of tier changes, e.g. "Robustness: Basic→Good ↑"]
Iteration Path: [Full Iteration / Lightweight Iteration (Start from design/implement)]
Opt Intensity: [Large Scale / Limited Scope / Targeted Refinement]
Planned Action: [Rerun implement / Rollback to design / Rollback to analyze / Continue optimization]
Opt Directions: [Summary of filtered improvement items]
Last Directives: [Executed X / Partially Executed X / Unexecuted X]
Remaining Rnds: {max_iterations - N} rounds
─────────────────────────────────────────

Historical Output Files (Available for review):
  - iterations/iter_01_*.md, iter_02_*.md, ...
```

### User Options

| Option | Handling |
|--------|----------|
| A) Agree with plan, continue | Proceed to next round according to Director's plan |
| B) Adjust optimization direction | User provides guidance, Director injects it as extra context into next round's prompts (appended to "optimization directives") |
| C) Modify acceptance criteria | Display current `acceptance.md`, update file after user modification, `acceptance_modifications` +1 |
| D) Terminate early, enter retro | Update `status` to `terminated_by_user` in `state.md`, skip remaining iterations, jump directly to retro phase |

**After user confirmation, the Director may enter the next iteration round (`iteration` +1, return to start of loop).**

---

## Evaluator Calibration Review

**Timing**: After the Director determines convergence (Pass-Converged, Director Override, or convergence condition met), BEFORE displaying the Completion Review Checkpoint to the user.

**Purpose**: Detect whether the QA subagent's judgment is miscalibrated (too lenient or too strict), so the user can make an informed decision about whether to accept convergence or continue iterating.

### Director Self-Audit Steps

1. **Cross-reference QA scores with implementation artifacts**: Re-read key sections of `iter_{N}_implement.md` (or the actual deliverable files). For each quality dimension rated ≥ Good, check whether the Director's own reading of the output supports that rating.

2. **Check for "identify-then-dismiss" pattern**: Scan the QA report for phrases where the QA identified a potential issue but then dismissed it as acceptable (e.g., "this could be improved but is adequate"). Count these instances — more than 3 such dismissals is a warning sign of leniency bias.

3. **Compare with historical pattern** (if iteration > 1): Check `quality_history` — did the QA suddenly jump multiple tiers in a single round without corresponding major changes in the implementation? A jump from Basic to Excellent in one round is suspicious.

4. **Check acceptance criteria coverage**: Verify the QA actually tested each acceptance criterion with concrete evidence (not just "verified ✓" without explanation). Shallow verification is a known QA failure mode.

5. **Check epistemic audit state**: Read `convergence-audit.md` and run `scripts/audit-task.js check-convergence` if available. Unresolved high-confidence evidence gaps, required-but-missing falsification checks, or weak convergence evidence must be shown in the Completion Review.

### Output

- If no calibration concerns: Proceed to Completion Review Checkpoint normally.
- If calibration concerns found: Add `[CALIBRATION WARNING]` tags to the Completion Review display:
  ```
  ⚠️ Calibration Warnings:
  - [CALIBRATION WARNING: QA may be too lenient — dismissed 4 identified issues as "acceptable"]
  - [CALIBRATION WARNING: Robustness jumped Basic→Excellent in one round without major implementation changes]
  ```
  The user can then decide whether to accept convergence (Option A) or continue optimizing (Option B) with adjusted QA focus.

### Cross-Task Calibration Accumulation

- After retro, record any confirmed calibration findings in `memory_draft.md` with format: `[{timestamp}] [calibration] {finding}` (e.g., "QA consistently underweights robustness for code deliverables").
- In subsequent tasks, the Director MAY pass accumulated calibration findings as "Calibration Hints" to the QA subagent (see `references/phases/qa.md` §Input Contract).

---

## Completion Review Checkpoint

**After convergence is determined (Pass-Converged, Director Override, or convergence condition met) and Evaluator Calibration Review is completed, the Director MUST execute a Completion Review before entering retro.**

### Display Format

```
Completion Review — Round {N} Ended
─────────────────────────────────────────
QA Conclusion: [Pass-Converged / Pass-Optimizable (Director Override) / Pass-Optimizable (Converged)]
Convergence Reason: [All quality ≥ Good / Low marginal benefit / Plateau / ...]
Quality Summary: [Final tier for each dimension with intra-tier positioning]
Iterations Completed: {N} / {max_iterations}
Calibration Warnings: [List any warnings from Evaluator Calibration Review, or "None"]
─────────────────────────────────────────

Historical Output Files (Available for review):
  - iterations/iter_01_*.md, iter_02_*.md, ...
```

### User Options

| Option | Handling |
|--------|----------|
| A) Confirm completion, enter retro | Update `state.md`: set `current_phase` to `retro`, `status` to `done`, proceed to retro phase |
| B) Continue optimizing | User specifies optimization direction; Director treats as unconverged, injects user direction as optimization directive, continues iteration |
| C) Adjust acceptance criteria | Display current `acceptance.md`, update file after user modification, `acceptance_modifications` +1, then re-run QA with updated criteria |
| D) Review deliverables before deciding | Director presents key deliverable content summary (read and summarize the main output files), user decides after review |

### Oscillation Handling via Double-Loop Learning (双环学习)

If `quality_history` shows the same dimension oscillating (e.g., Basic→Good→Basic) for 3 consecutive rounds, do NOT simply lock the dimension or blindly ask the user what to do. This indicates a systemic conflict in the acceptance criteria or underlying assumptions.

**Director Action (Frame Review)**:
1. Suspend standard iteration.
2. Analyze the conflicting constraints (e.g., "Requirement A demands extreme performance, but Requirement B demands heavy encryption").
3. Draft a proposed `acceptance_v2.md` that resolves the conflict by adjusting thresholds, removing mutually exclusive constraints, or redefining success.
4. Present the analysis and the `acceptance_v2.md` draft to the user for confirmation: *"I detected an architectural conflict causing quality oscillation. Instead of continuing to iterate, I suggest we revise the acceptance criteria. Here is the proposed change..."*
