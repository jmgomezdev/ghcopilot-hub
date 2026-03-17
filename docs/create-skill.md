# Create a Skill

## Minimum Contract

Each skill lives in its own folder under `hub/skills/` and must include a `SKILL.md` with valid frontmatter.

```md
---
name: my-skill
description: Brief description of what the skill does.
---

# Skill content
```

Rules:

- the skill id is the folder name
- `name` and `description` are required
- any additional asset must live inside the same folder
- avoid duplicated metadata outside frontmatter

## Steps

1. Create `hub/skills/<skill-id>/SKILL.md`.
2. Add `references/` and `assets/` if needed.
3. Run `npm run validate:hub`.
4. If the skill should be reusable across several stacks, add it to one or more packs.

## Checklist

- the folder matches the id
- `SKILL.md` has valid frontmatter
- the content is self-contained inside the folder
- the hub validates without errors
