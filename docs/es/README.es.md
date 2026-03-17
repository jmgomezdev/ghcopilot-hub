# ghcopilot-hub

[English](../../README.md) | [Español](README.es.md)

Hub centralizado para reutilizar agentes y skills de GitHub Copilot entre proyectos y materializarlos en cada
repositorio con un CLI declarativo.

## Por Qué Usarlo en un Proyecto Consumidor

Úsalo cuando quieras que la configuración compartida de Copilot se gestione como infraestructura y no como archivos
copiados a mano entre repositorios.

Con `ghcopilot-hub`, un repositorio consumidor puede declarar los agentes y skills que necesita, materializarlos desde
un hub central y mantener esa configuración consistente con el tiempo.

Resultados típicos en el consumidor:

- arrancar un repositorio nuevo con un pack ya preparado como `spa-tanstack` o `node-api`
- añadir o quitar skills según evoluciona el proyecto sin copiar archivos entre repositorios
- ver qué packs y skills existen antes de decidir la configuración
- revisar el drift antes de actualizar archivos gestionados
- mantener archivos propios del proyecto fuera de las rutas gestionadas

El proyecto consumidor declara su estado deseado en `.github/ghcopilot-hub.json` y el CLI sincroniza ese estado bajo
`.github/agents/` y `.github/skills/`.

## Uso Rápido Desde un Proyecto Consumidor

No hace falta instalar el paquete de forma global. El flujo normal es ejecutarlo con `npx`, y los mismos comandos se
pueden lanzar con `bunx` u otro runner equivalente.

Inspeccionar el catálogo:

```bash
npx ghcopilot-hub@latest list
npx ghcopilot-hub@latest list packs
npx ghcopilot-hub@latest list skills
```

Inicializar un proyecto consumidor con un pack:

```bash
npx ghcopilot-hub@latest init --pack spa-tanstack
```

Ajustar la selección más adelante:

```bash
npx ghcopilot-hub@latest add skill mermaid-expert
npx ghcopilot-hub@latest remove skill tanstack-router
```

Revisar o aplicar el estado actual del hub:

```bash
npx ghcopilot-hub@latest diff
npx ghcopilot-hub@latest doctor
npx ghcopilot-hub@latest update
```

La ayuda está disponible directamente en terminal:

```bash
npx ghcopilot-hub@latest --help
```

Si prefieres, también puedes instalar el paquete y ejecutar `ghcopilot-hub` directamente en lugar de usar `npx`.

## Modelo del Proyecto Consumidor

Layout del proyecto consumidor:

```text
.github/
  ghcopilot-hub.json
  agents/
  skills/
  local-overrides/
```

El archivo `.github/ghcopilot-hub.json` es el fichero local de control del proyecto consumidor. No se trata como un
artefacto gestionado y sincronizado.

Ejemplo de manifiesto:

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

## Archivos Gestionados y Locales

Paths gestionados:

- `.github/agents/**`
- `.github/skills/**`

Paths locales:

- `.github/local-overrides/**`
- `.github/ghcopilot-hub.json`

Los archivos legacy que venían de versiones antiguas de `hub/base/` se eliminan con `ghcopilot-hub update`.

Cada archivo gestionado lleva una cabecera de trazabilidad con:

- `managed-by`
- `source`
- `revision`
- `content-hash`

`content-hash` permite distinguir entre un archivo desactualizado por cambios del hub y un archivo drifted por edición
local manual.

## Layout Interno del Proyecto

```text
hub/
  agents/            agentes compartidos
  skills/            skills compartidas con sus assets y referencias
  packs/             composiciones declarativas de skills
tooling/cli/         CLI de materialización, diff y doctor
docs/                documentación operativa
```

La v1 cubre estos puntos:

- catálogo dinámico de agentes y skills leyendo el filesystem
- packs declarativos de skills
- manifiesto por proyecto consumidor en `.github/ghcopilot-hub.json`
- sincronización de archivos gestionados hacia el repositorio consumidor
- detección de drift y diff previo a aplicar cambios
- preservación de personalizaciones locales en `.github/local-overrides/`

No incluye versionado funcional por proyecto. Cada sincronización apunta al estado actual del hub y registra la
revisión disponible en las cabeceras managed.

El catálogo sincronizable del hub vive bajo `hub/`. Así la raíz del repositorio queda reservada para tooling,
documentación, workflows y metadata del paquete.

## Desarrollo

```bash
npm run lint
npm run format:check
npm test
npm run validate:hub
npm run pack:check
```

Los mismos scripts también se pueden ejecutar con Bun.

Documentación adicional:

- [architecture.md](architecture.md)
- [cli.md](cli.md)
- [create-skill.md](create-skill.md)
- [create-pack.md](create-pack.md)
- [publish.md](publish.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

Copyright (c) 2026 Jose Manuel Gomez Perez.

Website: [jmgomez.dev](https://jmgomez.dev/)
