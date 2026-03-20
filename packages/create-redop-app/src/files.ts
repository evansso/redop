import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { GeneratedFile } from "./types";

export async function assertEmptyTargetDir(targetDir: string) {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(targetDir);

  if (entries.length > 0) {
    throw new Error(`Target directory is not empty: ${targetDir}`);
  }
}

export async function writeGeneratedFiles(
  targetDir: string,
  files: GeneratedFile[]
) {
  for (const file of files) {
    const destination = path.join(targetDir, file.path);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.content, "utf8");
  }
}
