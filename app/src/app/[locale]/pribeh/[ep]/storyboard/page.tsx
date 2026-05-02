import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { MarkdownArticle } from "@/components/story/markdown-article";
import {
  loadStoryboard,
  getEpisode,
  getEpisodeTitle,
} from "@/lib/story";

interface Props {
  params: Promise<{ locale: string; ep: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale, ep } = await params;
  const meta = getEpisode(ep);
  if (!meta) return { title: "Pixoci" };
  const title = getEpisodeTitle(meta, locale);
  return {
    title: `${meta.id.toUpperCase()} · ${title} · Storyboard — Pixoci`,
    description: `Production storyboard for ${meta.titleEn}.`,
  };
}

export default async function StoryboardPage({ params }: Props) {
  const { locale, ep } = await params;
  const t = await getTranslations({ locale, namespace: "story" });
  const meta = getEpisode(ep);
  if (!meta) notFound();

  const source = loadStoryboard(locale, ep);
  if (!source) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/${locale}/pribeh/${ep}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToEpisode")}
      </Link>
      <MarkdownArticle source={source} />
    </div>
  );
}
