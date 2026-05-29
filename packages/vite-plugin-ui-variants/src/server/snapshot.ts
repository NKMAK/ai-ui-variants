import fs from "node:fs";
import path from "node:path";

export type BaseSnapshot = Record<string, string>;

export function saveSnapshot(repoRoot: string, repoRelFiles: string[]): BaseSnapshot {
  const snapshot: BaseSnapshot = {};

  for (const repoRelFile of repoRelFiles) {
    const filePath = path.join(repoRoot, repoRelFile);
    snapshot[repoRelFile] = fs.readFileSync(filePath, "utf8");
  }

  return snapshot;
}

export function restoreSnapshot(repoRoot: string, snapshot: BaseSnapshot): void {
  for (const [repoRelFile, content] of Object.entries(snapshot)) {
    const filePath = path.join(repoRoot, repoRelFile);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
  }
}
