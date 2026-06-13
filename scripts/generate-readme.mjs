import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourcePath = path.join(
  rootDir,
  "src",
  "components",
  "Forest",
  "ultimate_truth.html",
);
const readmePath = path.join(rootDir, "README.md");
const checkOnly = process.argv.includes("--check");

const defaultMetadata = {
  title: "PerillaCove",
  imageSrc: "https://infoimages.perillacove.com/nature.webp",
  imageAlt: "Nature's integrated system",
  imageAnchor: "waste approaches zero",
};

const html = readFileSync(sourcePath, "utf8");

const parseMetadata = () => {
  const metadataMatch = html.match(/<!--\s*({[\s\S]*?})\s*-->/);
  if (!metadataMatch) return defaultMetadata;

  try {
    const parsed = JSON.parse(metadataMatch[1]);
    return {
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title
          : defaultMetadata.title,
      imageSrc:
        typeof parsed.imageSrc === "string" && parsed.imageSrc.trim()
          ? parsed.imageSrc
          : defaultMetadata.imageSrc,
      imageAlt:
        typeof parsed.imageAlt === "string" && parsed.imageAlt.trim()
          ? parsed.imageAlt
          : defaultMetadata.imageAlt,
      imageAnchor:
        typeof parsed.imageAnchor === "string" && parsed.imageAnchor.trim()
          ? parsed.imageAnchor
          : defaultMetadata.imageAnchor,
    };
  } catch {
    return defaultMetadata;
  }
};

const escapeAttribute = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const metadata = parseMetadata();
const blocks = (html.match(/<p>[\s\S]*?<\/p>|<hr\s*\/?>/gi) ?? []).map(
  (block) => block.trim(),
);
const imageAnchorIndex = blocks.findIndex((block) =>
  block.toLowerCase().includes(metadata.imageAnchor.toLowerCase()),
);
const splitIndex =
  imageAnchorIndex >= 0 ? imageAnchorIndex : Math.min(1, blocks.length - 1);
const beforeImageBlocks = blocks.slice(0, splitIndex + 1);
const afterImageBlocks = blocks.slice(splitIndex + 1);

const imageBlock = `<p align="center">
  <img src="${escapeAttribute(metadata.imageSrc)}" alt="${escapeAttribute(
    metadata.imageAlt,
  )}" width="100%" />
</p>`;
const readmeFooter = `<p>
  <a href="https://perillacove.com/writing" target="_blank" rel="noopener noreferrer">Writings</a>
</p>`;

const readme = `<!--
This file is generated from src/components/Forest/ultimate_truth.html.
Edit that source, then run \`pnpm run readme:sync\`.
-->

<!-- prettier-ignore-start -->

# ${metadata.title}

${beforeImageBlocks.join("\n\n")}

${imageBlock}

${afterImageBlocks.join("\n\n")}

${readmeFooter}

<!-- prettier-ignore-end -->
`;

if (checkOnly) {
  const currentReadme = readFileSync(readmePath, "utf8");
  if (currentReadme !== readme) {
    console.error(
      "README.md is out of sync with src/components/Forest/ultimate_truth.html. Run `pnpm run readme:sync`.",
    );
    process.exit(1);
  }
  process.exit(0);
}

writeFileSync(readmePath, readme);
