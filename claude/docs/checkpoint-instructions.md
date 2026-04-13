# Checkpoint System — Instructions for Claude

This document explains how checkpoints work on this project. Read this before creating a checkpoint.

---

## What a Checkpoint Is

A checkpoint is a structured documentation file written **before every commit**. It captures enough context that any future Claude session (or human) can pick up exactly where the last one left off — without needing to re-read the code or conversation history.

Checkpoints live in `claude/checkpoints/` and are numbered sequentially:
```
checkpoint-01.md
checkpoint-02.md
checkpoint-07-end-of-stage-1.md   ← milestone checkpoints get a descriptive suffix
checkpoint-17-final.md
```

---

## When to Create One

- Before every commit
- Always at the end of a session
- Always at the end of a pipeline stage (add a descriptive name suffix)
- When the user says "checkpoint", "save our progress", or "let's commit"

---

## File Format

```markdown
# Checkpoint [N] — [Title]
**Date:** YYYY-MM-DD
**Project:** [project name]
**Status:** [one sentence — what's done, what's next]

---

## 1. Context Resume

[Paragraph describing the current state of the project. What stage is active. What was just completed.]

**What changed since Checkpoint [N-1]:**

- **[Feature or change]:** [Specific technical detail — class names, prop names, values, formulas. Be precise enough that the change can be reproduced without reading the code.]
- **[Feature or change]:** [...]

**Production pipeline stage:** Stage N — [Name] [✓ if complete, or "in progress"]

---

## 2. Human Directions

Steps to reproduce from Checkpoint [N-1]:

1. [Exact instruction — file name, what to change, old value → new value]
2. [...]

---

## 3. Records of Resistance

**R1 — [Short title]**
- [What AI produced on the first attempt]
- [Why it didn't work or was rejected]
- [What the fix was]

*(If no resistance occurred this session, write: "None this session.")*

---

## 4. Successes

**S1 — [Short title]**
- [What worked well, and why it's worth noting for future sessions]
```

---

## Section-by-Section Guide

### Section 1 — Context Resume

This is the most important section. Write it so that a Claude session starting cold can read it and immediately understand:
- What the app does and how it's structured
- What stage of development we're in
- Exactly what changed in this session (bullet points, with real values)

**Be specific.** Don't write "updated button styles." Write "changed `.select-btn` background from `rgba(0,0,0,0.7)` to `rgba(0,0,0,0.6)` and added `overflow: hidden`."

### Section 2 — Human Directions

Numbered reproduction steps. Each step names the file and describes the exact change. Written as if someone is rebuilding from the previous checkpoint from scratch. Use `old value → new value` format when changing existing values.

### Section 3 — Records of Resistance

**This section feeds directly into the project's academic documentation (README → Records of Resistance).**

A "resistance" is any moment where:
- AI output was rejected and replaced
- The user said "undo", "revert", "go back", "I don't like this", "scratch that"
- A first attempt failed and required a revised approach
- The user changed their mind about a direction after seeing the result

Document the first attempt honestly, not just the final solution. If multiple resistance moments happened in one session, document all of them (R1, R2, R3...).

If no resistance occurred, write "None this session." — don't skip the section.

### Section 4 — Successes

Note approaches that worked cleanly or decisions that proved correct. These are useful for:
- Reminding future sessions what patterns to reuse
- Informing the AI Direction Log in the README
- Giving the student material to reference in their Five Questions reflection

---

## Relationship to the README

The README is the **student-facing submission document**. The checkpoints are the **internal working record**. They feed each other:

| Checkpoint Section | Feeds Into |
|---|---|
| Context Resume | README → Production Pipeline stage descriptions |
| Records of Resistance | README → Records of Resistance section |
| Successes | README → AI Direction Log entries |

When updating the README, pull from the checkpoints — don't rewrite from memory.

---

## Naming Convention

```
checkpoint-[NN]-[optional-descriptor].md
```

- Numbers are zero-padded to two digits: `01`, `02`, ... `17`
- Add a descriptor for milestone checkpoints: `-end-of-stage-2`, `-final`, `-halfway-through-stage-5`
- Regular mid-session checkpoints don't need a descriptor

---

## Example: What Good vs. Bad Looks Like

**Bad (too vague):**
```
- Updated the button
- Fixed the animation bug
- Changed some colors
```

**Good (specific and reproducible):**
```
- **SELECT button shake:** Moved shake from `.select-btn-label` to `.select-btn.holding`.
  Full base transform (`translateX(-50%) translateY(-50%) scale(0.8)`) baked into every
  keyframe so positioning isn't overridden. Amplitude grows from ±0.5px → ±7px across
  a single 1.5s arc — no `infinite`, runs once and stops.
```

---

## Quick Reference

- **File location:** `claude/checkpoints/`
- **Always before:** commits
- **Always after:** sessions, pipeline stage completions
- **Section order:** Context Resume → Human Directions → Records of Resistance → Successes
- **Resistance rule:** if the user said "undo", "I don't like this", or "go back" — it's a resistance, document it
- **Specificity rule:** values, class names, file names, formulas — not descriptions
