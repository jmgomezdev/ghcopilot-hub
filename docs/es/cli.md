# CLI

El binario del paquete es `ghcopilot-hub` y también puede ejecutarse con `node tooling/cli/src/bin.js` dentro del
hub.

## Instalación

Global:

```bash
npm install -g ghcopilot-hub
ghcopilot-hub doctor --hub-only
```

Global con Bun:

```bash
bun add -g ghcopilot-hub
ghcopilot-hub doctor --hub-only
```

Sin instalación global:

```bash
npx ghcopilot-hub@latest doctor --hub-only
```

Sin instalación global con Bun:

```bash
bunx ghcopilot-hub@latest doctor --hub-only
```

Durante desarrollo del hub:

```bash
node tooling/cli/src/bin.js doctor --hub-only
```

Durante desarrollo del hub con Bun:

```bash
bun run validate:hub
bun run test
```

Ayuda:

```bash
ghcopilot-hub --help
ghcopilot-hub list --help
```

## Comandos

### `init`

Inicializa `.github/ghcopilot-hub.json`, sincroniza todos los agentes del hub, añade como máximo un pack y skills opcionales, y
aplica un sync completo.

```bash
ghcopilot-hub init
ghcopilot-hub init --skill ghcopilot-hub-mermaid-expert
ghcopilot-hub init --pack spa-tanstack
ghcopilot-hub init --pack mpa-base --skill ghcopilot-hub-mermaid-expert
```

Cuando `init` se ejecuta sin `--pack`, arranca un proyecto orientado a agentes: copia todos los agentes del hub y la
única skill sincronizada es la `ghcopilot-hub-consumer` por defecto, salvo que también pases una o más opciones
`--skill`.

Cuando `init` se ejecuta con un pack, también genera un `AGENTS.md` de base a partir del archivo indicado en la clave
`bootstrap` de ese pack y resuelto dentro de `hub/bootstrap/`. Un proyecto puede seleccionar como máximo un pack, y esa ruta de destino se
persiste en `settings.bootstrapAgentsTarget` dentro del manifiesto.

Si el repositorio consumidor ya tiene `AGENTS.md`, el CLI pregunta si debe sobrescribirlo:

- `yes`: mantiene `AGENTS.md` como destino gestionado
- `no`: crea `AGENTS-base.md` y persiste ese destino en su lugar

Si el comando se ejecuta sin terminal interactiva, o con `--json`, el CLI falla en vez de elegir un destino por su
cuenta.

### `update`

Recalcula el estado deseado desde el manifiesto y sincroniza el proyecto contra el estado actual del hub.

```bash
ghcopilot-hub update
ghcopilot-hub update --force
```

Si el manifiesto ya gestiona el bootstrap de agentes mediante `settings.bootstrapAgentsTarget`, `update` mantiene ese
archivo base específico del pack sincronizado también. Cuando el destino es `AGENTS.md` y la ejecución va a sobrescribir un `AGENTS.md`
existente en raíz, el CLI vuelve a preguntar antes de reemplazarlo, salvo que se use `--force`.

### `list`

Muestra el catálogo disponible para proyectos consumidores sin modificar ningún archivo.

```bash
ghcopilot-hub list
ghcopilot-hub list packs
ghcopilot-hub list skills
ghcopilot-hub list skills --json
```

`list packs` imprime cada pack con las skills que expande. `list skills` imprime cada identificador de skill y sólo
añade el nombre visible cuando difiere del identificador.

### `add`

Añade un pack o una skill al manifiesto y sincroniza.

```bash
ghcopilot-hub add pack ssr-nextjs
ghcopilot-hub add skill ghcopilot-hub-mermaid-expert
```

Los proyectos sólo admiten un pack. Si el proyecto ya tiene otro distinto, `add pack` falla hasta que se elimine.

### `remove`

Elimina un pack o una skill del manifiesto y sincroniza.

```bash
ghcopilot-hub remove pack spa-tanstack
ghcopilot-hub remove skill ghcopilot-hub-tanstack-router
```

En `remove skill`, la skill también se añade a `excludeSkills` para que un pack no la vuelva a incorporar.

### `diff`

Muestra qué crearía, actualizaría o borraría el sync sin escribir archivos.

```bash
ghcopilot-hub diff
ghcopilot-hub diff --json
```

### `doctor`

Audita el estado del proyecto consumidor.

Comprueba:

- manifiesto válido
- packs y skills existentes
- archivos managed faltantes
- drift en archivos managed
- rutas managed con contenido no gestionado
- archivos managed huérfanos

```bash
ghcopilot-hub doctor
ghcopilot-hub doctor --json
ghcopilot-hub doctor --hub-only
```

`--hub-only` valida el propio repositorio hub: frontmatter, packs, catálogo y base.

## Opciones comunes

- `--project-dir <path>`: raíz del proyecto consumidor
- `--hub-dir <path>`: raíz del hub cuando el CLI se ejecuta desde otro sitio
- `--force`: cambia `onConflict` a `overwrite` para esa ejecución
- `--json`: emite salida estructurada
- `--help`: imprime la ayuda del CLI en terminal

`--json` desactiva el prompt interactivo del bootstrap de AGENTS. Si un `init` con pack o un `update` del bootstrap
necesita esa decisión, el comando termina con exit code `1` y un error explícito.

Si hay conflictos sólo en algunas rutas managed, `init`, `update`, `add` y `remove` aplican igualmente los cambios no
conflictivos y terminan con exit code `2` para señalar que quedan conflictos por resolver.

## Exit codes

- `0`: operación correcta o sin issues
- `1`: error de uso, manifiesto inválido o fallo de ejecución
- `2`: `diff` o `doctor` detectaron conflictos/issues, o una sincronización quedó bloqueada por conflictos

## Distribución

Antes de publicar el paquete:

```bash
npm run prepublishOnly
```

Eso valida el hub, ejecuta la suite y comprueba el contenido final del tarball con `npm pack --dry-run`.

Con Bun puedes ejecutar las validaciones equivalentes así:

```bash
bun run validate:hub
bun run test
bun pm pack --quiet
```
