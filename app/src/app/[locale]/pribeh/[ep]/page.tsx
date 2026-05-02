import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { MarkdownArticle } from "@/components/story/markdown-article";
import { ChimePlayer } from "@/components/story/chime-player";
import { Clapperboard } from "lucide-react";
import {
  loadEpisode,
  getEpisode,
  getEpisodeTitle,
  getNextEpisode,
  getPrevEpisode,
  hasStoryboard,
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
    title: `${meta.id.toUpperCase()} · ${title} — Pixoci`,
    description: `${meta.titleEn} · ${meta.mentor === "—" ? meta.biome : meta.mentor}`,
  };
}

export default async function EpisodePage({ params }: Props) {
  const { locale, ep } = await params;
  const t = await getTranslations({ locale, namespace: "story" });
  const meta = getEpisode(ep);
  if (!meta) notFound();

  const source = loadEpisode(locale, ep);
  if (!source) notFound();

  const next = getNextEpisode(ep);
  const prev = getPrevEpisode(ep);
  const base = `/${locale}/pribeh`;
  const showStoryboard = hasStoryboard(ep);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={base}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("allChapters")}
      </Link>

      <MarkdownArticle source={source} />

      {ep === "e12" && <ChimePlayer />}

      {showStoryboard && (
        <Link
          href={`${base}/${ep}/storyboard`}
          className="group flex items-center gap-3 p-4 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <Clapperboard className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-primary/80">{t("storyboardKicker")}</p>
            <p className="text-sm font-semibold mt-0.5">{t("storyboardTitle")}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
        </Link>
      )}

      <nav className="flex items-stretch gap-3 pt-6 border-t">
        {prev ? (
          <Link
            href={`${base}/${prev.id}`}
            className="group flex-1 flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{prev.id}</p>
              <p className="text-sm font-medium truncate mt-0.5">{getEpisodeTitle(prev, locale)}</p>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            href={`${base}/${next.id}`}
            className="group flex-1 flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors justify-end"
          >
            <div className="text-right min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{next.id}</p>
              <p className="text-sm font-medium truncate mt-0.5">{getEpisodeTitle(next, locale)}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </nav>
    </div>
  );
}
