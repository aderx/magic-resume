const { spawnSync } = require("node:child_process");
const { rmSync } = require("node:fs");

function runNextBuild() {
  return spawnSync("pnpm", ["exec", "next", "build"], {
    stdio: "inherit",
    env: process.env,
  });
}

function cleanNextDir() {
  rmSync(".next", { recursive: true, force: true });
}

const first = runNextBuild();

if (first.status === 0) {
  process.exit(0);
}

const errorText = `${first.stderr || ""}\n${first.stdout || ""}`;
const isIntermittentExportRenameError =
  errorText.includes("ENOENT") &&
  errorText.includes(".next/export/500.html") &&
  errorText.includes("rename");

if (!isIntermittentExportRenameError) {
  process.exit(first.status || 1);
}

console.warn(
  "[build] Detected intermittent Next.js export rename error. Cleaning .next and retrying once..."
);
cleanNextDir();

const second = runNextBuild();
process.exit(second.status || 1);
