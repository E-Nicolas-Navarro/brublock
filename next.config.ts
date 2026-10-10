import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Use the TS compiler API; avoids a separate CLI process for config reads.
    useTypeScriptCli: false,
  },
};

export default config;
