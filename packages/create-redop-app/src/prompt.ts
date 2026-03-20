import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  DEPLOY_TARGETS,
  TRANSPORTS,
  type DeployTarget,
  type Transport,
} from "./types";

function formatChoices(choices: readonly string[], defaultValue: string) {
  return choices
    .map((choice) => (choice === defaultValue ? `${choice}*` : choice))
    .join(", ");
}

async function ask(
  rl: readline.Interface,
  label: string,
  defaultValue: string
): Promise<string> {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  const answer = await rl.question(`${label}${suffix}: `);
  return answer.trim() || defaultValue;
}

async function askChoice<T extends string>(
  rl: readline.Interface,
  label: string,
  choices: readonly T[],
  defaultValue: T
): Promise<T> {
  while (true) {
    const answer = await ask(
      rl,
      `${label} [${formatChoices(choices, defaultValue)}]`,
      defaultValue
    );

    if (choices.includes(answer as T)) {
      return answer as T;
    }

    output.write(
      `Please choose one of: ${choices.join(", ")}\n`
    );
  }
}

export async function promptForName(defaultName: string) {
  const rl = readline.createInterface({ input, output });
  try {
    return await ask(rl, "App name", defaultName);
  } finally {
    rl.close();
  }
}

export async function promptForRemaining(
  current: {
    defaultDeploy: DeployTarget;
    defaultName: string;
    deploy?: DeployTarget;
    name?: string;
    targetDir?: string;
    transport?: Transport;
  }
): Promise<{
  deploy: DeployTarget;
  name: string;
  targetDir: string;
  transport: Transport;
}> {
  const rl = readline.createInterface({ input, output });
  try {
    const name = current.name ?? (await ask(rl, "App name", current.defaultName));
    const transport =
      current.transport ??
      (await askChoice(rl, "Transport", TRANSPORTS, "http"));
    const deploy =
      current.deploy ??
      (await askChoice(
        rl,
        "Deploy target",
        DEPLOY_TARGETS,
        current.defaultDeploy
      ));
    const targetDir =
      current.targetDir ?? (await ask(rl, "Target directory", name));

    return { deploy, name, targetDir, transport };
  } finally {
    rl.close();
  }
}
