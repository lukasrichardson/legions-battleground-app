# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root, if it exists.
- **`docs/adr/`** for ADRs that touch the area being changed.

If these files do not exist, proceed silently. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions are resolved.

## File structure

This is a single-context repository:

```text
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## Use the glossary's vocabulary

When output names a domain concept, use the term defined in `CONTEXT.md`. Do not drift to synonyms the glossary explicitly avoids.

If a needed concept is absent, reconsider whether the language fits the project or note the documentation gap for `/grill-with-docs`.

## Flag ADR conflicts

Surface contradictions with existing ADRs explicitly rather than silently overriding them.
