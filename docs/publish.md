# Publicar el paquete

Este repositorio queda preparado para distribuir `ghcopilot-hub` como paquete npm. El tarball incluye:

- `hub/`
- `tooling/cli/src/`
- `README.md`

## Validación previa

El script `prepublishOnly` ejecuta estas comprobaciones:

```bash
npm run validate:hub
npm test
npm run pack:check
```

Con eso se bloquea una publicación cuando el catálogo del hub, la suite o el tarball están rotos.

El proyecto también se valida con Bun en CI y los mismos checks pueden ejecutarse localmente con:

```bash
bun run validate:hub
bun run test
bun pm pack --quiet
```

## Publicación manual

```bash
npm run prepublishOnly
npm publish
```

Si quieres publicar con otra dist-tag:

```bash
npm publish --tag next
```

## Publicación desde GitHub Actions

Existe un workflow manual en `.github/workflows/publish-package.yml`.

Requisitos:

- secreto `NPM_TOKEN` configurado en el repositorio
- versión actualizada en `package.json`
- permisos para publicar en npm

## Checklist para el primer release

- verificar si `ghcopilot-hub` está libre en npm; si no lo está, cambiar `name` en `package.json`
- fijar la licencia final que quieras publicar
- verificar que `author`, `repository`, `homepage` y `bugs` siguen apuntando al repositorio público correcto

El empaquetado ya queda resuelto; esa checklist cubre solo metadata externa dependiente del destino final.
