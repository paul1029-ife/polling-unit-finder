import type { NextConfig } from "next";
const config: NextConfig = {
  outputFileTracingIncludes: { "/*": ["./data/**/*"] },
};
export default config;
