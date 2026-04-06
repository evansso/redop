import { build } from "bun";

async function buildOrExit(config: Parameters<typeof Bun.build>[0]) {
  const result = await build(config);

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log.message);
    }
    process.exit(1);
  }
}

await buildOrExit({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "node",
});
