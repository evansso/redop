import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { parseCliArgs } from "../src/args";
import { run } from "../src/index";

async function withTempDir(runTest: (root: string) => Promise<void>) {
  const root = await mkdtemp(path.join(os.tmpdir(), "create-redop-app-"));
  try {
    await runTest(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

describe("create-redop-app", () => {
  test("parseCliArgs handles supported flags", () => {
    expect(
      parseCliArgs([
        "--name",
        "demo",
        "--transport",
        "http",
        "--deploy",
        "railway",
        "--target-dir",
        "demo-app",
        "--yes",
      ])
    ).toEqual({
      deploy: "railway",
      help: false,
      name: "demo",
      targetDir: "demo-app",
      transport: "http",
      yes: true,
    });
  });

  test("invalid transport fails clearly", () => {
    expect(() =>
      parseCliArgs(["--transport", "websocket"])
    ).toThrow('Invalid transport: "websocket"');
  });

  test("http + none generates a runnable baseline", async () => {
    await withTempDir(async (root) => {
      const target = path.join(root, "http-none");
      await run([
        "--yes",
        "--name",
        "http-none",
        "--transport",
        "http",
        "--deploy",
        "none",
        "--target-dir",
        target,
      ]);

      const indexTs = await readFile(path.join(target, "src/index.ts"), "utf8");
      const readme = await readFile(path.join(target, "README.md"), "utf8");

      expect(indexTs).toContain('hostname: "0.0.0.0"');
      expect(indexTs).toContain("process.env.PORT ?? 3000");
      expect(readme).toContain("/mcp/health");
    });
  });

  test("http + railway includes deploy guidance", async () => {
    await withTempDir(async (root) => {
      const target = path.join(root, "railway-app");
      await run([
        "--yes",
        "--name",
        "railway-app",
        "--transport",
        "http",
        "--deploy",
        "railway",
        "--target-dir",
        target,
      ]);

      const readme = await readFile(path.join(target, "README.md"), "utf8");
      expect(readme).toContain("Deploy on Railway");
      expect(readme).toContain("bun run src/index.ts");
    });
  });

  test("http + fly-io generates Dockerfile and fly.toml", async () => {
    await withTempDir(async (root) => {
      const target = path.join(root, "fly-app");
      await run([
        "--yes",
        "--name",
        "fly-app",
        "--transport",
        "http",
        "--deploy",
        "fly-io",
        "--target-dir",
        target,
      ]);

      const dockerfile = await readFile(path.join(target, "Dockerfile"), "utf8");
      const flyToml = await readFile(path.join(target, "fly.toml"), "utf8");

      expect(dockerfile).toContain("FROM oven/bun:1");
      expect(flyToml).toContain('path = "/mcp/health"');
    });
  });

  test("http + vercel adds vercel config and caveat text", async () => {
    await withTempDir(async (root) => {
      const target = path.join(root, "vercel-app");
      await run([
        "--yes",
        "--name",
        "vercel-app",
        "--transport",
        "http",
        "--deploy",
        "vercel",
        "--target-dir",
        target,
      ]);

      const vercelJson = await readFile(path.join(target, "vercel.json"), "utf8");
      const readme = await readFile(path.join(target, "README.md"), "utf8");

      expect(vercelJson).toContain('"bunVersion": "1.x"');
      expect(readme).toContain("not a drop-in host");
    });
  });

  test("stdio + none generates stdio starter", async () => {
    await withTempDir(async (root) => {
      const target = path.join(root, "stdio-app");
      await run([
        "--yes",
        "--name",
        "stdio-app",
        "--transport",
        "stdio",
        "--deploy",
        "none",
        "--target-dir",
        target,
      ]);

      const indexTs = await readFile(path.join(target, "src/index.ts"), "utf8");
      expect(indexTs).toContain('transport: "stdio"');
    });
  });

  test("stdio + fly-io includes mismatch warning", async () => {
    await withTempDir(async (root) => {
      const target = path.join(root, "stdio-fly");
      await run([
        "--yes",
        "--name",
        "stdio-fly",
        "--transport",
        "stdio",
        "--deploy",
        "fly-io",
        "--target-dir",
        target,
      ]);

      const readme = await readFile(path.join(target, "README.md"), "utf8");
      expect(readme).toContain('uses stdio');
      expect(readme).toContain('"fly-io"');
    });
  });
});
