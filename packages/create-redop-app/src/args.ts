import { parseArgs } from "node:util";

import type { CliOptions, DeployTarget, Transport } from "./types";
import { DEPLOY_TARGETS, TRANSPORTS } from "./types";

const HELP_TEXT = `create-redop-app

Usage:
  create-redop-app [options]

Options:
  --name <name>            App name
  --transport <type>      Transport: http | stdio
  --deploy <target>       Deploy target: none | bun | railway | fly-io | vercel
  --target-dir <path>     Output directory
  --yes                   Use defaults without prompting
  --help                  Show this help
`;

function assertChoice<T extends string>(
  value: string | undefined,
  choices: readonly T[],
  label: string
): T | undefined {
  if (value == null) {
    return undefined;
  }

  if (choices.includes(value as T)) {
    return value as T;
  }

  throw new Error(
    `Invalid ${label}: "${value}". Expected one of: ${choices.join(", ")}`
  );
}

export function getHelpText() {
  return HELP_TEXT;
}

export function parseCliArgs(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      deploy: { type: "string" },
      help: { short: "h", type: "boolean" },
      name: { type: "string" },
      "target-dir": { type: "string" },
      transport: { type: "string" },
      yes: { short: "y", type: "boolean" },
    },
    strict: true,
    allowPositionals: false,
  });

  return {
    deploy: assertChoice(values.deploy, DEPLOY_TARGETS, "deploy target"),
    help: values.help ?? false,
    name: values.name,
    targetDir: values["target-dir"],
    transport: assertChoice(values.transport, TRANSPORTS, "transport"),
    yes: values.yes ?? false,
  };
}

export function defaultDeployForTransport(transport: Transport): DeployTarget {
  return transport === "http" ? "bun" : "none";
}
