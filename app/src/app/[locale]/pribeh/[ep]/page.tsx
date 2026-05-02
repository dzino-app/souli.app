import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { MarkdownArticle } from "@/components/story/markdown-article";
import {
  EPISODES,
  loadEpisode,
  getEpisode,
  getNextEpisode,
  getPrevEpisode,
} from "@/lib/story";

interface Props {
  params: Promise<{ locale: string; ep: string }>;
}

export function generateStaticParams() {
  return EPISODES.map((e) => ({ ep: e.id }));
}

export async function generateMetadata({ params }: Props) {
  const { ep } = await params;
  const meta = getEpisode(ep);
  if (!meta) return { title: "Pixoci" };
  return {
    title: `E${meta.id} · ${meta.titleSk} — Pixoci`,
    description: `${meta.titleEn} · ${meta.mentor === "—" ? meta.biome : `s ${meta.mentor}`}`,
  };
}

export default async function EpisodePage({ params }: Props) {
  const { locale, ep } = await params;
  const meta = getEpisode(ep);
  if (!meta) notFound();

  let source: string;
  try {
    source = await loadEpisode(ep);
  } catch {
    notFound();
  }

  const next = getNextEpisode(ep);
  const prev = getPrevEpisode(ep);
  const base = `/${locale}/pribeh`;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={base}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Všetky kapitoly
      </Link>

      <MarkdownArticle source={source} />

      <nav className="flex items-stretch gap-3 pt-6 border-t">
        {prev ? (
          <Link
            href={`${base}/${prev.id}`}
            className="group flex-1 flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">E{prev.id}</p>
              <p className="text-sm font-medium truncate mt-0.5">{prev.titleSk}</p>
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
              <p className="text-xs uppercase tracking-wider text-muted-foreground">E{next.id}</p>
              <p className="text-sm font-medium truncate mt-0.5">{next.titleSk}</p>
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
