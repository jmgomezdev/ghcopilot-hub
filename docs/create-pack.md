# Crear un pack

Los packs son composiciones declarativas de skills. No contienen lógica, solo selección.

## Formato

Archivo en `hub/packs/<pack-id>.json`:

```json
{
  "name": "node-api",
  "skills": ["typescript", "testing", "zod"]
}
```

Reglas:

- `name` debe ser único
- cada skill listada debe existir en `hub/skills/`
- el nombre del archivo puede coincidir con `name` para facilitar navegación
- mantén packs pequeños y compositivos

## Pasos

1. Crea el JSON en `hub/packs/`.
2. Referencia solo skills existentes.
3. Ejecuta `npm run validate:hub`.
4. Si aplica, documenta el caso de uso del pack en el README.
