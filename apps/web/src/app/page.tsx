"use client";

import {
  Activity,
  Box,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [pkgManager, setPkgManager] = useState("npm");
  const [copied, setCopied] = useState(false);

  const getCommand = () => {
    switch (pkgManager) {
      case "npm":
        return "npm install redop";
      case "yarn":
        return "yarn add redop";
      case "pnpm":
        return "pnpm add redop";
      case "bun":
        return "bun add redop";
      default:
        return "pnpm add redop";
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-redop-border border-b bg-redop-warm/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-380 items-center justify-between px-8 py-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-redop-ink text-xl uppercase tracking-widest">
              Redop
            </span>
          </div>
          <nav className="flex items-center gap-6 font-mono text-base text-redop-ink/70 uppercase tracking-wider">
            <Link
              className="transition-colors hover:text-redop-primary"
              href="#"
            >
              Docs
            </Link>
            <Link
              className="transition-colors hover:text-redop-primary"
              href="#"
            >
              Plugins
            </Link>
            <Link
              className="transition-colors hover:text-redop-primary"
              href="#"
            >
              GitHub
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[95rem] flex-1 flex-col px-8">
        {/* Hero Section */}
        <section className="grid items-center gap-16 pb-20 md:pt-20 md:pb-28 lg:grid-cols-2">
          <div>
            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 font-normal text-5xl text-redop-ink leading-[1.1] tracking-tight md:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Bun-native framework for building{" "}
              <span className="text-redop-primary">typed MCP servers.</span>
            </motion.h1>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Define tools, validate input, compose middleware, and add plugins.
              Get strong TypeScript inference from Zod and run natively on Bun.
            </motion.p>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-10"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-5 font-mono text-redop-ink/50 text-sm">
                  {["npm", "yarn", "pnpm", "bun"].map((pkg) => (
                    <button
                      className={`transition-colors hover:text-redop-ink ${pkgManager === pkg ? "font-medium text-redop-ink" : ""}`}
                      key={pkg}
                      onClick={() => setPkgManager(pkg)}
                    >
                      {pkg}
                    </button>
                  ))}
                </div>
                <div className="flex max-w-md items-center justify-between rounded-lg border border-redop-ink/20 border-dashed bg-transparent px-5 py-4 font-mono text-redop-ink text-sm">
                  <span>{getCommand()}</span>
                  <Button onClick={handleCopy} size={"icon"} variant={"ghost"}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <span className="font-mono text-redop-ink/50 text-sm">
                  Used by
                </span>
                <Image
                  alt="UseAgents"
                  className="opacity-80 transition-opacity hover:opacity-100"
                  height={24}
                  src="/logo-dark.svg"
                  width={100}
                />
              </div>
            </motion.div>
          </div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="group relative"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-redop-primary/20 to-redop-accent/20 opacity-50 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
            <div className="relative overflow-hidden rounded-xl border border-redop-border bg-redop-panel shadow-sm">
              <div className="flex items-center border-redop-border border-b bg-redop-warm/50 px-4 py-3">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-redop-ink/20" />
                  <div className="h-3 w-3 rounded-full bg-redop-ink/20" />
                  <div className="h-3 w-3 rounded-full bg-redop-ink/20" />
                </div>
                <div className="ml-4 font-mono text-redop-ink/50 text-xs">
                  server.ts
                </div>
              </div>
              <div className="overflow-x-auto p-6">
                <pre className="font-mono text-redop-ink text-sm leading-relaxed">
                  <code>
                    <span className="text-redop-primary">import</span> {"{"}{" "}
                    Redop {"}"} <span className="text-redop-primary">from</span>{" "}
                    <span className="text-redop-deep">&apos;redop&apos;</span>;
                    {"\n"}
                    <span className="text-redop-primary">import</span> {"{"} z{" "}
                    {"}"} <span className="text-redop-primary">from</span>{" "}
                    <span className="text-redop-deep">&apos;zod&apos;</span>;
                    {"\n"}
                    {"\n"}
                    <span className="text-redop-primary">const</span> app ={" "}
                    <span className="text-redop-primary">new</span> Redop({"{"}{" "}
                    name:{" "}
                    <span className="text-redop-deep">&apos;my-mcp&apos;</span>{" "}
                    {"}"}){"\n"}
                    .use(authMiddleware){"\n"}
                    .tool({"{"}
                    {"\n"}
                    name:{" "}
                    <span className="text-redop-deep">
                      &apos;get_weather&apos;
                    </span>
                    ,{"\n"}
                    description:{" "}
                    <span className="text-redop-deep">
                      &apos;Get current weather&apos;
                    </span>
                    ,{"\n"}
                    schema: z.object({"{"}
                    {"\n"}
                    location: z.string(),{"\n"}
                    {"}"}),{"\n"}
                    <span className="text-redop-primary">async</span>{" "}
                    handler(ctx, input) {"{"}
                    {"\n"}
                    <span className="text-redop-ink/40">
                      {"// input.location is fully typed"}
                    </span>
                    {"\n"}
                    <span className="text-redop-primary">return</span> await
                    fetchWeather(input.location);{"\n"}
                    {"}"}
                    {"\n"}
                    {"}"}){"\n"}
                    .listen({"{"} transport:{" "}
                    <span className="text-redop-deep">&apos;stdio&apos;</span>{" "}
                    {"}"});
                  </code>
                </pre>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Proof Strip */}
        <motion.section
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center gap-x-8 gap-y-4 border-redop-border border-y py-8 font-mono text-redop-ink/60 text-sm uppercase tracking-wider"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-redop-primary/60" /> Typed
            tools
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-redop-primary/60" /> Zod
            inference
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-redop-primary/60" />{" "}
            Middleware + plugins
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-redop-primary/60" /> HTTP +
            stdio
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-redop-primary/60" />{" "}
            Bun-native
          </div>
        </motion.section>

        {/* Features Section */}
        <section className="border-redop-border border-t py-24">
          <div className="mb-16">
            <h2 className="mb-4 font-normal text-4xl tracking-tight">
              Everything you need.
            </h2>
            <p className="max-w-2xl text-lg text-redop-ink/70">
              Built-in primitives for the real world. Stop writing the same
              validation and transport layers.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Code2 className="h-5 w-5 text-redop-primary" />,
                title: "Typed Tools",
                desc: "Define tools with full TS inference using Zod v4, Standard Schema, or JSON Schema.",
              },
              {
                icon: <Shield className="h-5 w-5 text-redop-primary" />,
                title: "Middleware",
                desc: "Add middleware for auth, rate limiting, and caching to control request flow.",
              },
              {
                icon: <Activity className="h-5 w-5 text-redop-primary" />,
                title: "Lifecycle Hooks",
                desc: "Global and tool-local before/after hooks for analytics and observability.",
              },
              {
                icon: <Box className="h-5 w-5 text-redop-primary" />,
                title: "Plugin System",
                desc: "Build and share reusable framework extensions across your MCP servers.",
              },
            ].map((feature, i) => (
              <div
                className="rounded-xl border border-redop-border bg-redop-panel p-6 shadow-sm transition-shadow hover:shadow-md"
                key={i}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-redop-soft">
                  {feature.icon}
                </div>
                <h3 className="mb-2 font-normal">{feature.title}</h3>
                <p className="text-redop-ink/70 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="border-redop-border border-t py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 font-normal text-3xl tracking-tight">
              Philosophy
            </h2>
            <div className="mt-12 grid gap-8 text-left sm:grid-cols-3">
              <div>
                <div className="mb-2 font-mono text-redop-primary">
                  01. Small API
                </div>
                <h3 className="mb-2 font-normal">Minimal surface</h3>
                <p className="text-redop-ink/70 text-sm leading-relaxed">
                  Learn it in 5 minutes. No magic, just clean composition of
                  standard web patterns.
                </p>
              </div>
              <div>
                <div className="mb-2 font-mono text-redop-primary">
                  02. Typed by default
                </div>
                <h3 className="mb-2 font-normal">End-to-end safety</h3>
                <p className="text-redop-ink/70 text-sm leading-relaxed">
                  If it compiles, it works. Inputs, contexts, and returns are
                  strictly typed.
                </p>
              </div>
              <div>
                <div className="mb-2 font-mono text-redop-primary">
                  03. For real apps
                </div>
                <h3 className="mb-2 font-normal">Production ready</h3>
                <p className="text-redop-ink/70 text-sm leading-relaxed">
                  Built for real MCP apps with auth, rate limiting, and logging,
                  not just toy demos.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="z-10 mt-auto w-full border-redop-border border-t bg-redop-panel py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-redop-ink">
              <div className="h-1.5 w-1.5 rounded-sm bg-redop-panel" />
            </div>
            <span className="font-mono font-semibold text-redop-ink text-sm uppercase tracking-widest">
              Redop
            </span>
          </div>
          <div className="font-mono text-redop-ink/50 text-xs">
            Built for Bun. MIT Licensed.
          </div>
        </div>
      </footer>
    </div>
  );
}
