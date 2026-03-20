const url =
  process.env.NODE_ENV === "production"
    ? "https://useagents.site"
    : "http://localhost:3000";

export const siteConfig = {
  name: "Redop",
  title: "Redop | Bun-native MCP Framework",
  description:
    "Bun-native TypeScript framework for building typed MCP servers with tools, middleware, hooks, and plugins.",
  url,
  ogImage: `${url}/og.png`,
};

export const SITE_KEYWORDS = [""];
1;
