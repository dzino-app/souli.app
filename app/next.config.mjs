import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/[locale]/pribeh/**": ["./content/story/**", "./public/style-anchors/**"],
  },
  async redirects() {
    return [
      // /:locale/story → /:locale/pribeh — English-friendly alias for the story routes.
      {
        source: "/:locale(en|sk|cs|de|es|fr|hi|hu|pl)/story",
        destination: "/:locale/pribeh",
        permanent: false,
      },
      {
        source: "/:locale(en|sk|cs|de|es|fr|hi|hu|pl)/story/:path*",
        destination: "/:locale/pribeh/:path*",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
