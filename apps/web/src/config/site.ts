const url =
  process.env.NODE_ENV === "production"
    ? "https://useagents.site"
    : "http://localhost:3000";

export const siteConfig = {
  description:
    "Bun-native TypeScript framework for building typed MCP servers with tools, middleware, hooks, and plugins.",
  name: "Redop",
  ogImage: `${url}/og.png`,
  title: "Redop | Bun-native MCP Framework",
  url,
};

export const SITE_KEYWORDS = [""];
1;
