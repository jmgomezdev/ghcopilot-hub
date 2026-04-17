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

- arrancar un repositorio solo con el catálogo compartido de agentes cuando todavía no encaja ningún pack predefinido
- arrancar un repositorio nuevo con un único pack ya preparado como `spa-tanstack` o `api-node`
- añadir o quitar skills según evoluciona el proyecto sin copiar archivos entre repositorios
- ver qué packs y skills existen antes de decidir la configuración
- revisar el drift antes de actualizar archivos gestionados
- mantener archivos propios del proyecto fuera de las rutas gestionadas

El proyecto consumidor declara su estado deseado en `.github/ghcopilot-hub.json` y el CLI sincroniza ese estado bajo
`.github/agents/` y `.github/skills/`. Cuando `init` arranca un proyecto basado en pack, también genera un
`AGENTS.md` de base en la raíz a partir del archivo bootstrap que ese pack declara dentro de `hub/bootstrap/`.

## Uso Rápido Desde un Proyecto Consumidor

No hace falta instalar el paquete de forma global. El flujo normal es ejecutarlo con `npx`, y los mismos comandos se
pueden lanzar con `bunx` u otro runner equivalente.

La forma recomendada de empezar ahora es el flujo interactivo de `init`. En una terminal real se abre con la ruta de
pack curado seleccionada por defecto, te deja añadir skills extra sólo cuando de verdad las necesitas y lleva a la
mayoría de proyectos a una base sólida en un solo paso.

Empieza aquí:

```bash
npx ghcopilot-hub@latest init
```

En ese camino interactivo por defecto eliges un pack, añades skills extra si hace falta, revisas el resumen y aplicas
el sync. Es la forma más rápida de arrancar con una configuración limpia y mantenible sin montarla entera a mano.

Si decides saltarte el pack, el arranque orientado a agentes sigue sincronizando todo el catálogo de agentes del hub y
sólo instala la skill por defecto `ghcopilot-hub-consumer`, salvo que también pases opciones `--skill`.

Si ya sabes exactamente qué pack quieres, puedes ir directo:

```bash
npx ghcopilot-hub@latest init --pack spa-tanstack
```

Ese `init` basado en pack también genera un `AGENTS.md` en raíz usando el archivo propio del pack seleccionado. Un
proyecto sólo puede tener un pack. Si el repositorio ya tiene uno, el CLI pregunta si debe sobrescribirlo. Si la
respuesta es no, crea `AGENTS-base.md` en su lugar. En modo no interactivo, el CLI falla en vez de decidir por su
cuenta.

Si prefieres revisar primero el catálogo, también lo tienes disponible:

```bash
npx ghcopilot-hub@latest list
npx ghcopilot-hub@latest list packs
npx ghcopilot-hub@latest list skills
```

Ajustar la selección más adelante:

```bash
npx ghcopilot-hub@latest add skill ghcopilot-hub-mermaid-expert
npx ghcopilot-hub@latest remove skill ghcopilot-hub-tanstack-router
```

Para excluir una skill que llega desde un pack, elimínala de forma explícita. El CLI la añade a
`excludeSkills`, así que el pack no la volverá a incorporar en el siguiente sync. También puedes
editar `.github/ghcopilot-hub.json` a mano y después ejecutar `update`.

Revisar o aplicar el estado actual del hub:

```bash
npx ghcopilot-hub@latest diff
npx ghcopilot-hub@latest doctor
npx ghcopilot-hub@latest update
```

Si el manifiesto aún contiene skills individuales que ya no existen en el catálogo actual del hub,
`diff` y `update` las tratan como entradas obsoletas a eliminar en lugar de fallar por skill desconocida.
Además, `update` reescribe el manifiesto para quitar esos ids obsoletos de `skills` y `excludeSkills`.

La ayuda está disponible directamente en terminal:

```bash
npx ghcopilot-hub@latest --help
```

Si prefieres, también puedes instalar el paquete y ejecutar `ghcopilot-hub` directamente en lugar de usar `npx`.

## Sistema de agentes

Cada proyecto consumidor recibe el catálogo completo de agentes del hub bajo `.github/agents/`, pero la forma más
fácil de usarlo es tratarlo como un flujo de dos pasos.

Úsalo así:

1. Ejecuta `/planner` para convertir la petición en un plan de ejecución aprobado.
   Coordina el discovery y el diseño con agentes como `explorer`, `librarian`, `architect` y `gatekeeper`.
2. Pasa ese plan aprobado a `/builder`.
   Ejecuta el handoff aprobado y cierra el ciclo con `plan-guardian`, `test-sentinel` y `archiver` para revisión,
   pruebas y trazabilidad.

Ese plan se puede entregar como contexto del chat, una URL compartida o memoria de sesión para que la implementación
retome el trabajo sin volver a planificar.

Consulta la explicación completa en [agent-system.md](agent-system.md).

## Modelo del Proyecto Consumidor

Layout del proyecto consumidor:

```text
.github/
  ghcopilot-hub.json
  agents/
  skills/
```

El archivo `.github/ghcopilot-hub.json` es el fichero local de control del proyecto consumidor. No se trata como un
artefacto gestionado y sincronizado.

Manifiesto mínimo para un proyecto orientado a agentes:

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

Ejemplo de manifiesto con pack:

```json
{
  "packs": ["spa-tanstack"],
  "skills": ["ghcopilot-hub-mermaid-expert"],
  "excludeSkills": [],
  "settings": {
    "onConflict": "fail",
    "bootstrapAgentsTarget": "AGENTS.md"
  }
}
```

Reglas de resolución:

- la skill `ghcopilot-hub-consumer` se instala por defecto en cualquier proyecto gestionado por el CLI
- los ids de skills compartidas del hub usan el prefijo `ghcopilot-hub-` para evitar colisiones con skills del repositorio
- todos los agentes del hub se copian siempre
- `packs` es opcional, así que `init` puede usarse como comando de arranque orientado a agentes
- un proyecto puede seleccionar como máximo un pack
- el `init` con pack genera `AGENTS.md` en la raíz a partir del bootstrap declarado por el pack dentro de `hub/bootstrap/` y guarda la ruta elegida en `settings.bootstrapAgentsTarget`
- las skills finales salen de `packs + skills - excludeSkills`
- `excludeSkills` gana incluso si una skill llega desde un pack
- las skills individuales obsoletas se ignoran para resolver, se planifican para borrado y se limpian del manifiesto en `update`
- los archivos locales viven fuera de los paths gestionados

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

- [agent-system.md](agent-system.md)
- [architecture.md](architecture.md)
- [cli.md](cli.md)
- [create-skill.md](create-skill.md)
- [create-pack.md](create-pack.md)
- [publish.md](publish.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

Copyright (c) 2026 Jose Manuel Gomez Perez.

Website: [jmgomez.dev](https://jmgomez.dev/)
