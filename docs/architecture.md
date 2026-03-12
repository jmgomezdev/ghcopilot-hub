# Arquitectura v1

## Principios

- Fuente de verdad única: la metadata real vive en el frontmatter de `*.agent.md` y `SKILL.md`.
- Estado deseado declarativo: cada proyecto declara packs, skills extra y exclusiones en
  `.github/ghcopilot-hub.json`.
- Sin versionado funcional: el proyecto siempre sincroniza contra el último estado del hub.
- Trazabilidad mínima: cada archivo gestionado registra origen, revisión y hash del contenido sincronizado.
- Personalización controlada: los cambios locales van a `.github/local-overrides/`, no a archivos managed.

## Recursos del hub

### Agentes

- Ubicación: `hub/agents/*.agent.md`
- Identificador: nombre de archivo sin `.agent.md`
- Frontmatter mínimo: `name`, `description`
- Política v1: todos los agentes del hub se copian a cada proyecto consumidor

### Skills

- Ubicación: `hub/skills/<skill-id>/SKILL.md`
- Identificador: nombre de carpeta
- Frontmatter mínimo: `name`, `description`
- Se sincroniza la carpeta completa de la skill, incluyendo `references/` y `assets/`

### Packs

- Ubicación: `hub/packs/*.json`
- Formato:

```json
{
  "name": "spa-tanstack",
  "skills": ["typescript", "react", "tanstack-query", "tanstack-router", "testing"]
}
```

`name` debe ser único y toda skill referenciada debe existir en `hub/skills/`.

### Base compartida

- Ubicación: `hub/base/`
- Destino: misma ruta relativa dentro del proyecto consumidor
- Uso: instrucciones base, prompts comunes y ajustes mínimos de VS Code

## Manifiesto del proyecto

Archivo: `.github/ghcopilot-hub.json`

```json
{
  "packs": [],
  "skills": [],
  "excludeSkills": [],
  "settings": {
    "onConflict": "fail",
    "preserveLocalOverrides": true
  }
}
```

Contrato:

- `packs`: lista de packs a expandir
- `skills`: skills extra fuera de packs
- `excludeSkills`: skills a retirar incluso si vienen por pack
- `settings.onConflict`: `fail` o `overwrite`
- `settings.preserveLocalOverrides`: mantiene `.github/local-overrides/` como espacio libre del proyecto

Skill por defecto:

- `ghcopilot-hub-consumer` se instala siempre salvo que el proyecto la excluya explícitamente en `excludeSkills`

## Resolución

Fórmula:

```text
agents = todos los agentes del hub
skills = defaultSkills + packs + skills - excludeSkills
baseFiles = todo lo que exista dentro de hub/base/
```

El layout interno del hub agrupa estos recursos bajo `hub/`.

Errores de resolución:

- pack inexistente
- skill inexistente
- frontmatter inválido o faltante
- pack con JSON inválido o referencias rotas

## Sync

Mapa origen a destino:

- `hub/agents/*.agent.md` -> `.github/agents/*.agent.md`
- `hub/skills/<id>/**` -> `.github/skills/<id>/**`
- `hub/base/**` -> misma ruta relativa en el proyecto

Cabecera de trazabilidad:

```md
<!-- managed-by: ghcopilot-hub -->
<!-- source: hub/skills/testing/SKILL.md -->
<!-- revision: unknown -->
<!-- content-hash: <sha256> -->
```

Para archivos JSONC se usa comentario `//`.

Estados posibles por archivo:

- `create`: falta en el proyecto
- `update`: existe y puede actualizarse sin conflicto
- `remove`: es managed y ya no forma parte del estado deseado
- `conflict`: existe drift local o contenido no gestionado en una ruta managed

## Drift y conflictos

Se considera drift cuando el cuerpo del archivo actual no coincide con el `content-hash` guardado en la última
sincronización.

Política:

- `onConflict: fail`: bloquea `update` y `remove` si hay drift
- `onConflict: overwrite` o `--force`: sobrescribe o elimina aunque exista drift

## Overrides locales

`.github/local-overrides/` queda fuera del alcance del sync. El archivo base de instrucciones referencia este
directorio para que el contexto local complemente al contenido gestionado sin editarlo.
