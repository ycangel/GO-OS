import type { NextConfig } from "next";
import { resolve } from "node:path";

const selfHosted = process.env.GO_SELF_HOSTED === "1";
const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  ...(selfHosted ? { output: "standalone" as const } : {}),
  webpack(config) {
    config.module.rules.push({
      test: /\.md$/,
      resourceQuery: /raw/,
      type: "asset/source",
    });

    if (selfHosted) {
      config.resolve.alias = {
        ...config.resolve.alias,
        [resolve(projectRoot, "db/index.ts")]: resolve(
          projectRoot,
          "db/index.node.ts",
        ),
      };
    }
    return config;
  },
};

export default nextConfig;
