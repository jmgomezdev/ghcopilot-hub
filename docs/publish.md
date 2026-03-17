# Publish the Package

This repository is set up to distribute `ghcopilot-hub` as an npm package. The tarball includes:

- `hub/`
- `tooling/cli/src/`
- `README.md`

## Pre-publish Validation

The `prepublishOnly` script runs these checks:

```bash
npm run validate:hub
npm test
npm run pack:check
```

This blocks publishing when the hub catalog, the test suite, or the tarball contents are broken.

The project is also validated with Bun in CI, and the same checks can be run locally with:

```bash
bun run validate:hub
bun run test
bun pm pack --quiet
```

## Manual Publish

```bash
npm run prepublishOnly
npm publish
```

If you want to publish with another dist-tag:

```bash
npm publish --tag next
```

## Publish from GitHub Actions

There is a manual workflow in `.github/workflows/publish-package.yml`.

Requirements:

- `NPM_TOKEN` secret configured in the repository
- version updated in `package.json`
- permissions to publish on npm

## First Release Checklist

- verify whether `ghcopilot-hub` is available on npm; if it is not, change `name` in `package.json`
- set the final license you want to publish
- verify that `author`, `repository`, `homepage`, and `bugs` still point to the correct public repository

Packaging itself is already solved; this checklist only covers external metadata that depends on the final target.
