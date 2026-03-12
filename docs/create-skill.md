# Crear una skill

## Contrato mínimo

Cada skill vive en su propia carpeta bajo `hub/skills/` y debe tener un `SKILL.md` con frontmatter válido.

```md
---
name: my-skill
description: Brief description of what the skill does.
---

# Skill content
```

Reglas:

- el id de la skill es el nombre de carpeta
- `name` y `description` son obligatorios
- cualquier asset adicional debe vivir dentro de la misma carpeta
- evita metadata duplicada fuera del frontmatter

## Pasos

1. Crea `hub/skills/<skill-id>/SKILL.md`.
2. Añade `references/` y `assets/` si son necesarios.
3. Ejecuta `npm run validate:hub`.
4. Si la skill debe ser reutilizable por varios stacks, añádela a uno o más packs.

## Checklist

- la carpeta coincide con el id
- `SKILL.md` tiene frontmatter válido
- el contenido es autocontenido dentro de la carpeta
- el hub valida sin errores
