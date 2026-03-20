export const TRANSPORTS = ["http", "stdio"] as const;
export const DEPLOY_TARGETS = [
  "none",
  "bun",
  "railway",
  "fly-io",
  "vercel",
] as const;

export type Transport = (typeof TRANSPORTS)[number];
export type DeployTarget = (typeof DEPLOY_TARGETS)[number];

export interface CliOptions {
  deploy?: DeployTarget;
  help: boolean;
  name?: string;
  targetDir?: string;
  transport?: Transport;
  yes: boolean;
}

export interface ResolvedOptions {
  appName: string;
  deploy: DeployTarget;
  targetDir: string;
  transport: Transport;
}

export interface GeneratedFile {
  content: string;
  path: string;
}
