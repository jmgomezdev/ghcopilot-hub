import path from "node:path";
import crypto from "node:crypto";

import { MANAGED_BY } from "./constants.js";

function getHeaderStyle(targetRelativePath) {
  const extension = path.extname(targetRelativePath).toLowerCase();

  if (extension === ".json" || extension === ".jsonc" || extension === ".code-workspace") {
    return {
      renderLine: (key, value) => `// ${key}: ${value}`,
      parseLine: (line) => {
        const match = line.match(/^\/\/\s([^:]+):\s(.*)$/);
        return match ? { key: match[1], value: match[2] } : null;
      },
    };
  }

  return {
    renderLine: (key, value) => `<!-- ${key}: ${value} -->`,
    parseLine: (line) => {
      const match = line.match(/^<!--\s([^:]+):\s(.*)\s-->$/);
      return match ? { key: match[1], value: match[2] } : null;
    },
  };
}

export function hashContent(content) {
  return crypto.createHash("sha256").update(content.replace(/\r\n/g, "\n")).digest("hex");
}

export function renderManagedFile({ targetRelativePath, sourceRelativePath, revision, body }) {
  const style = getHeaderStyle(targetRelativePath);
  const normalizedBody = body.replace(/\r\n/g, "\n");
  const header = [
    style.renderLine("managed-by", MANAGED_BY),
    style.renderLine("source", sourceRelativePath),
    style.renderLine("revision", revision),
    style.renderLine("content-hash", hashContent(normalizedBody)),
  ].join("\n");

  return `${header}\n\n${normalizedBody}`;
}

export function parseManagedFile({ targetRelativePath, content }) {
  const style = getHeaderStyle(targetRelativePath);
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const header = {};
  let index = 0;

  while (index < lines.length) {
    const parsedLine = style.parseLine(lines[index]);
    if (!parsedLine) {
      break;
    }

    header[parsedLine.key] = parsedLine.value;
    index += 1;
  }

  if (header["managed-by"] !== MANAGED_BY) {
    return null;
  }

  if (lines[index] === "") {
    index += 1;
  }

  return {
    header,
    body: lines.slice(index).join("\n"),
  };
}
