#!/usr/bin/env node

import path from "node:path";
import process from "node:process";

import { defaultDeployForTransport, getHelpText, parseCliArgs } from "./args";
import { assertEmptyTargetDir, writeGeneratedFiles } from "./files";
import { promptForRemaining } from "./prompt";
import { buildFiles } from "./templates";
import type { DeployTarget, ResolvedOptions, Transport } from "./types";

function resolveDefaultName() {
  return "my-redop-app";
}

function validateName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("App name cannot be empty.");
  }
  return trimmed;
}

async function resolveOptions(argv: string[]): Promise<ResolvedOptions> {
  const parsed = parseCliArgs(argv);

  if (parsed.help) {
    console.log(getHelpText());
    process.exit(0);
  }

  const defaultName = resolveDefaultName();
  const defaultTransport = parsed.transport ?? "http";
  const defaultDeploy = parsed.deploy ?? defaultDeployForTransport(defaultTransport);

  const collected: {
    deploy: DeployTarget;
    name: string;
    targetDir: string;
    transport: Transport;
  } = parsed.yes
    ? {
        deploy: defaultDeploy,
        name: parsed.name ?? defaultName,
        targetDir: parsed.targetDir ?? (parsed.name ?? defaultName),
        transport: defaultTransport,
      }
    : await promptForRemaining({
        defaultDeploy,
        defaultName,
        deploy: parsed.deploy,
        name: parsed.name,
        targetDir: parsed.targetDir,
        transport: parsed.transport,
      });

  const appName = validateName(collected.name);

  return {
    appName,
    deploy: collected.deploy,
    targetDir: path.resolve(process.cwd(), collected.targetDir),
    transport: collected.transport,
  };
}

export async function run(argv: string[]) {
  const options = await resolveOptions(argv);
  await assertEmptyTargetDir(options.targetDir);
  const files = buildFiles(options);
  await writeGeneratedFiles(options.targetDir, files);

  const relativeDir = path.relative(process.cwd(), options.targetDir) || ".";
  console.log(`Created Redop app in ${relativeDir}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${relativeDir}`);
  console.log("  bun install");
  console.log("  bun run src/index.ts");
}

if (import.meta.main) {
  run(process.argv.slice(2)).catch((error) => {
    console.error(
      error instanceof Error ? error.message : `Unknown error: ${String(error)}`
    );
    process.exit(1);
  });
}
