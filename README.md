# ghcopilot-hub

Hub centralizado para reutilizar agentes y skills de GitHub Copilot entre proyectos y materializarlos en cada
repositorio con un CLI declarativo.

## Objetivo de v1

La v1 resuelve estos puntos:

- catálogo dinámico de agentes y skills leyendo el filesystem
- packs declarativos de skills
- manifiesto por proyecto consumidor en `.github/ghcopilot-hub.json`
- sincronización de archivos gestionados hacia el repo consumidor
- detección de drift y diff previo a aplicar cambios
- preservación de personalizaciones locales en `.github/local-overrides/`

No incluye versionado funcional por proyecto. Cada sincronización apunta al estado actual del hub y registra la
revisión disponible en las cabeceras managed.

## Layout del hub

```text
hub/
  agents/            agentes compartidos
  skills/            skills compartidas con sus assets y referencias
  packs/             composiciones declarativas de skills
  base/              archivos base sincronizados a cada proyecto
tooling/cli/         CLI de materialización, diff y doctor
docs/                documentación operativa
```

## Layout del proyecto consumidor

```text
.github/
  ghcopilot-hub.json
  copilot-instructions.md
  instructions/
  prompts/
  agents/
  skills/
  local-overrides/
.vscode/
  settings.json
```

## Manifiesto

```json
{
  "packs": ["spa-tanstack"],
  "skills": ["mermaid-expert"],
  "excludeSkills": [],
  "settings": {
    "onConflict": "fail",
    "preserveLocalOverrides": true
  }
}
```

Reglas de resolución:

- la skill `ghcopilot-hub-consumer` se instala por defecto en cualquier proyecto gestionado por el CLI
- todos los agentes del hub se copian siempre
- las skills finales salen de `packs + skills - excludeSkills`
- `excludeSkills` gana incluso si una skill llega desde un pack
- los archivos locales viven fuera de los paths gestionados

## CLI

Uso rápido:

```bash
npm install
node tooling/cli/src/bin.js doctor --hub-only
```

Uso rápido con Bun:

```bash
bun install
bun run validate:hub
```

Instalación como paquete distribuido:

```bash
npm install -g ghcopilot-hub
ghcopilot-hub doctor --hub-only
```

Instalación global con Bun:

```bash
bun add -g ghcopilot-hub
ghcopilot-hub doctor --hub-only
```

Uso efímero sin instalación global:

```bash
npx ghcopilot-hub@latest doctor --hub-only
```

Uso efímero con Bun:

```bash
bunx ghcopilot-hub@latest doctor --hub-only
```

Ejemplos sobre un proyecto consumidor:

```bash
ghcopilot-hub init --pack spa-tanstack
ghcopilot-hub add skill mermaid-expert
ghcopilot-hub remove skill tanstack-router
ghcopilot-hub diff
ghcopilot-hub doctor
ghcopilot-hub update
```

## Reglas de sync

Paths gestionados:

- `.github/agents/**`
- `.github/skills/**`
- `.github/instructions/**`
- `.github/prompts/**`
- `.github/copilot-instructions.md`
- `.vscode/settings.json`

Paths locales:

- `.github/local-overrides/**`

Cada archivo gestionado lleva una cabecera de trazabilidad con:

- `managed-by`
- `source`
- `revision`
- `content-hash`

`content-hash` permite distinguir entre un archivo desactualizado por cambios del hub y un archivo drifted por
edición local manual.

## Scaffolding del repo

El catálogo sincronizable del hub vive bajo `hub/`. Así la raíz del repositorio queda reservada para tooling,
documentación, workflows y metadata del paquete.

## Desarrollo

```bash
npm test
npm run validate:hub
npm run pack:check
```

Con Bun:

```bash
bun run validate:hub
bun run test
bun pm pack --quiet
```

Documentación adicional:

- [docs/architecture.md](docs/architecture.md)
- [docs/cli.md](docs/cli.md)
- [docs/create-skill.md](docs/create-skill.md)
- [docs/create-pack.md](docs/create-pack.md)
- [docs/publish.md](docs/publish.md)
