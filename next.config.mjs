import createNextIntlPlugin from "next-intl/plugin";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

const withNextIntl = createNextIntlPlugin();

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (webpackConfig) => {
    // Avoid intermittent "Unable to snapshot resolve dependencies" warnings
    // on symlinked dependency trees (pnpm/workspace environments).
    webpackConfig.cache = false;
    return webpackConfig;
  },
  ...(process.env.NEXT_STANDALONE === "1" && { output: "standalone" }),
};

export default withNextIntl(config);
