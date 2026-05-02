import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/[locale]/pribeh/**": ["./content/story/**"],
  },
};

export default withNextIntl(nextConfig);
