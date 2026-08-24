import { access, readFile } from "node:fs/promises";

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/headers" || specifier === "next/navigation") {
    return nextResolve(`${specifier}.js`, context);
  }
  if (specifier === "cloudflare:workers") {
    return {
      url: "data:text/javascript,export const env = globalThis.__CLOUDFLARE_TEST_ENV__ ?? {};",
      shortCircuit: true,
    };
  }
  if (specifier.endsWith(".md?raw") && context.parentURL) {
    return {
      url: new URL(specifier, context.parentURL).href,
      shortCircuit: true,
    };
  }
  if (
    context.parentURL?.startsWith("file:") &&
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\.[a-z0-9]+(?:\?.*)?$/i.test(specifier)
  ) {
    const base = new URL(specifier, context.parentURL);
    for (const candidate of [`${base.href}.ts`, `${base.href}/index.ts`]) {
      try {
        await access(new URL(candidate));
        return { url: candidate, shortCircuit: true };
      } catch {
        // Try the next TypeScript resolution candidate.
      }
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".md?raw")) {
    const sourceUrl = new URL(url);
    sourceUrl.search = "";
    const markdown = await readFile(sourceUrl, "utf8");
    return {
      format: "module",
      source: `export default ${JSON.stringify(markdown)};`,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
