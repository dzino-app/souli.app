import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { MarkdownArticle } from "@/components/story/markdown-article";
import { loadScroll } from "@/lib/story";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "story" });
  return {
    title: `${t("scrollTitle")} — Pixoci`,
    description: t("scrollDesc"),
  };
}

export default async function ScrollPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "story" });
  const source = loadScroll(locale);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/${locale}/pribeh`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToStory")}
      </Link>
      <MarkdownArticle source={source} />
    </div>
  );
}
