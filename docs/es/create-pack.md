# Crear un pack

Los packs son composiciones declarativas de skills. No contienen lógica, solo selección.

## Formato

Archivo en `hub/packs/<pack-id>.json`:

```json
{
  "name": "node-api",
  "bootstrap": "node-api.agents.md",
  "skills": ["ghcopilot-hub-typescript", "ghcopilot-hub-testing", "ghcopilot-hub-zod"]
}
```

Reglas:

- `name` debe ser único
- `bootstrap` debe apuntar a un archivo existente dentro de `hub/bootstrap/`
- cada skill listada debe existir en `hub/skills/`
- las skills creadas en el hub deberían usar el prefijo `ghcopilot-hub-`; las skills curadas de terceros pueden conservar su id de origen
- el nombre del archivo puede coincidir con `name` para facilitar navegación
- mantén packs pequeños y compositivos

## Pasos

1. Crea el JSON en `hub/packs/`.
2. Referencia solo skills existentes.
3. Ejecuta `npm run validate:hub`.
4. Si aplica, documenta el caso de uso del pack en el README.
