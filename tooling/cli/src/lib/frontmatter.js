import { parse } from "yaml";

import { CliError } from "./errors.js";

const FRONTMATTER_DELIMITER = "---";

export function parseFrontmatter(sourceText, sourcePath) {
  const normalized = sourceText.replace(/\r\n/g, "\n");

  if (!normalized.startsWith(`${FRONTMATTER_DELIMITER}\n`)) {
    throw new CliError(`Missing frontmatter in ${sourcePath}`);
  }

  const endIndex = normalized.indexOf(`\n${FRONTMATTER_DELIMITER}\n`, FRONTMATTER_DELIMITER.length + 1);
  if (endIndex === -1) {
    throw new CliError(`Unterminated frontmatter in ${sourcePath}`);
  }

  const rawFrontmatter = normalized.slice(FRONTMATTER_DELIMITER.length + 1, endIndex);
  const body = normalized.slice(endIndex + FRONTMATTER_DELIMITER.length + 2);
  const data = parse(rawFrontmatter);

  if (!data || typeof data !== "object") {
    throw new CliError(`Invalid frontmatter object in ${sourcePath}`);
  }

  return { data, body };
}

export function requireMetadataField(data, fieldName, sourcePath) {
  const value = data[fieldName];

  if (typeof value !== "string" || value.trim() === "") {
    throw new CliError(`Frontmatter field "${fieldName}" is required in ${sourcePath}`);
  }

  return value.trim();
}
