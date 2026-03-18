---
name: ghcopilot-hub-skill-creator
description: >
  Creates new AI agent skills or updates existing ones following the Agent Skills spec. Trigger: When user asks to
  create or update a new skill, add agent instructions, or document patterns for AI.
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## When to Create a Skill

Create a skill when:

- A pattern is used repeatedly and AI needs guidance
- Project-specific conventions differ from generic best practices
- Complex workflows need step-by-step instructions
- Decision trees help AI choose the right approach

**Don't create a skill when:**

- Documentation already exists (create a reference instead)
- Pattern is trivial or self-explanatory
- It's a one-off task

---

## Skill Structure

```
hub/skills/ghcopilot-hub-{skill-name}/
├── SKILL.md              # Required - main skill file
├── assets/               # Optional - templates, schemas, examples
│   ├── template.py
│   └── schema.json
└── references/           # Optional - deep dives and expanded explanations
  └── docs.md           # Extra detail that would be too long for SKILL.md
```

---

## SKILL.md Template

````markdown
---
name: ghcopilot-hub-{skill-name}
description: >
  {One-line description of what this skill does}. Trigger: {When the AI should load this skill}.
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
---

## When to Use

{Bullet points of when to use this skill}

## Critical Patterns

{The most important rules - what AI MUST know}

## Code Examples

{Minimal, focused examples}

## Commands

```bash
{Common commands}
```
````

## Resources

- **Templates**: See [assets/](assets/) for {description}
- **Documentation**: See [references/](references/) for deeper explanations

```

---

## Decision: assets/ vs references/

```

Need code templates? → assets/ Need JSON schemas? → assets/ Need example configs? → assets/ Need more detail or
extended explanations? → references/

---

## Frontmatter Fields

| Field              | Required | Description                           |
| ------------------ | -------- | ------------------------------------- |
| `name`             | Yes      | Skill identifier (lowercase, hyphens) |
| `description`      | Yes      | What + Trigger in one block           |
| `license`          | Yes      | Always `Apache-2.0` for jmgomezdev    |
| `metadata.author`  | Yes      | `jmgomezdev`                          |
| `metadata.version` | Yes      | Semantic version as string            |

---

## Content Guidelines

### DO

- Start with the most critical patterns
- Use tables for decision trees
- Keep code examples minimal and focused
- Keep vital and fundamental rules in the main `SKILL.md`
- When you need to elaborate or expand, create a dedicated `.md` file in `references/`
- Include Commands section with copy-paste commands
- Write all skill content and edits in English

### DON'T

- Add Keywords section (agent searches frontmatter, not body)
- Duplicate content from existing docs (reference instead)
- Include lengthy explanations (link to docs)
- Add troubleshooting sections (keep focused)
- Use web URLs in references (use local paths)

---

## Registering the Skill

After creating the skill, add it to `AGENTS.md`:

```markdown
| `{skill-name}` | {Description} | [SKILL.md](hub/skills/{skill-name}/SKILL.md) |
```

---

## Checklist Before Creating

- [ ] Skill doesn't already exist (check `hub/skills/`)
- [ ] Pattern is reusable (not one-off)
- [ ] Name follows conventions
- [ ] Frontmatter is complete (description includes trigger keywords)
- [ ] Critical patterns are clear
- [ ] Code examples are minimal
- [ ] Commands section exists
- [ ] Added to AGENTS.md

## Resources

- **Templates**: See [assets/](assets/) for SKILL.md template
- **Documentation**: There is no separate local documentation; the documentation is the skills themselves
