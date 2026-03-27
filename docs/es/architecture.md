# Arquitectura v1

## Principios

- Fuente de verdad única: la metadata real vive en el frontmatter de `*.agent.md` y `SKILL.md`.
- Estado deseado declarativo: cada proyecto declara packs opcionales, skills extra y exclusiones en
  `.github/ghcopilot-hub.json`.
- Sin versionado funcional: el proyecto siempre sincroniza contra el último estado del hub.
- Trazabilidad mínima: cada archivo gestionado registra origen, revisión y hash del contenido sincronizado.

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
- Las skills compartidas creadas en el hub usan el prefijo `ghcopilot-hub-`; las skills curadas de terceros pueden conservar su id de origen
- Se sincroniza la carpeta completa de la skill, incluyendo `references/` y `assets/`

### Packs

- Ubicación: `hub/packs/*.json`
- Formato:

```json
{
  "name": "spa-tanstack",
  "bootstrap": "spa-tanstack.agents.md",
  "skills": [
    "ghcopilot-hub-typescript",
    "ghcopilot-hub-react",
    "ghcopilot-hub-tanstack-query",
    "ghcopilot-hub-tanstack-router",
    "ghcopilot-hub-testing"
  ]
}
```

`name` debe ser único, `bootstrap` debe apuntar a un archivo dentro de `hub/bootstrap/` y toda skill referenciada debe
existir en `hub/skills/`.

## Manifiesto del proyecto

Archivo: `.github/ghcopilot-hub.json`

```json
{
  "packs": [],
  "skills": [],
  "excludeSkills": [],
  "settings": {
    "onConflict": "fail",
    "bootstrapAgentsTarget": null
  }
}
```

Contrato:

- `packs`: lista opcional con como máximo un pack a expandir
- `skills`: skills extra fuera de packs
- `excludeSkills`: skills a retirar incluso si vienen por pack
- `settings.onConflict`: `fail` o `overwrite`
- `settings.bootstrapAgentsTarget`: `null`, `AGENTS.md` o `AGENTS-base.md`
- los ids de skills compartidas creadas en el hub usan el prefijo `ghcopilot-hub-`; las skills curadas de terceros conservan su id de carpeta

Skill por defecto:

- `ghcopilot-hub-consumer` se instala siempre salvo que el proyecto la excluya explícitamente en `excludeSkills`
- un array `packs` vacío es válido y representa una base de proyecto orientada a agentes

## Resolución

Fórmula:

```text
agents = todos los agentes del hub
skills = defaultSkills + packs + skills - excludeSkills
bootstrapAgents = settings.bootstrapAgentsTarget ? packSeleccionado.agents.md : none
```

El layout interno del hub agrupa estos recursos bajo `hub/`.

Errores de resolución:

- pack inexistente
- skill inexistente
- frontmatter inválido o faltante
- pack con JSON inválido o referencias rotas

## Sync

Mapa origen a destino:

- `hub/bootstrap/<pack.bootstrap>` -> `AGENTS.md` o `AGENTS-base.md` según `settings.bootstrapAgentsTarget`
- `hub/agents/*.agent.md` -> `.github/agents/*.agent.md`
- `hub/skills/<id>/**` -> `.github/skills/<id>/**`

Cabecera de trazabilidad:

```md
<!-- managed-by: ghcopilot-hub -->
<!-- source: hub/skills/ghcopilot-hub-testing/SKILL.md -->
<!-- revision: unknown -->
<!-- content-hash: <sha256> -->
```

Para archivos JSONC se usa comentario `//`.

Las versiones actuales del CLI ya no materializan archivos gestionados legacy. Si un proyecto conserva archivos legacy
de versiones anteriores, `ghcopilot-hub update` los elimina.

Estados posibles por archivo:

- `create`: falta en el proyecto
- `update`: existe y puede actualizarse sin conflicto
- `remove`: es managed y ya no forma parte del estado deseado
- `conflict`: existe drift local o contenido no gestionado en una ruta managed

Rutas gestionadas frente a rutas locales:

- gestionada cuando la selecciona el manifiesto: `AGENTS-base.md`
- gestionada: `.github/agents/**`
- gestionada: `.github/skills/**`
- local: `.github/ghcopilot-hub.json`

El bootstrap `AGENTS.md` en raíz es un caso especial. Solo aparece con `init` basado en pack, sale del archivo AGENTS
propio del pack seleccionado y la ruta elegida se guarda en el manifiesto para que sincronizaciones posteriores sigan
usando el mismo destino. Si el repositorio ya tiene `AGENTS.md`, el CLI pregunta antes de sobrescribirlo y puede
redirigir el archivo gestionado a `AGENTS-base.md`.

El CLI sólo inspecciona las rutas gestionadas para diff, doctor, update y decisiones de borrado.

Los archivos legacy de versiones anteriores se eliminan con `ghcopilot-hub update`.

Cada archivo gestionado lleva una cabecera de trazabilidad con:

- `managed-by`
- `source`
- `revision`
- `content-hash`

`content-hash` permite distinguir entre archivos desactualizados por cambios del hub y archivos con drift por edición
local manual.

## Drift y conflictos

Se considera drift cuando el cuerpo del archivo actual no coincide con el `content-hash` guardado en la última
sincronización.

Política:

- `onConflict: fail`: bloquea `update` y `remove` si hay drift
- `onConflict: overwrite` o `--force`: sobrescribe o elimina aunque exista drift

Si una ejecución encuentra conflictos en algunas rutas managed pero también tiene operaciones no conflictivas en otras,
el CLI aplica esas operaciones seguras y devuelve exit code `2` para dejar el conflicto pendiente visible.
