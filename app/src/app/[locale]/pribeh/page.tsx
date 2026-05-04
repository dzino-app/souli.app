import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Scroll, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EPISODES, getEpisodeTitle } from "@/lib/story";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "story" });
  return {
    title: `${t("indexTitle")} — Pixoci`,
    description: t("indexDesc"),
  };
}

export default async function StoryIndex({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "story" });
  const base = `/${locale}/pribeh`;

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("season1")}</p>
        <h1 className="text-3xl font-bold tracking-tight">{t("indexTitle")}</h1>
        <p className="text-muted-foreground">{t("indexDesc")}</p>
      </header>

      <Link href={`${base}/zvitok`} className="group">
        <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
          <CardContent className="flex items-start gap-4 py-5">
            <div className="rounded-lg bg-primary/15 p-2.5 shrink-0">
              <Scroll className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-primary/80">{t("scrollKicker")}</p>
              <h2 className="text-lg font-semibold mt-0.5">{t("scrollTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("scrollDesc")}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
          </CardContent>
        </Card>
      </Link>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t("chapters")}</span>
        </div>
        <ul className="space-y-2">
          {EPISODES.map((ep) => {
            const title = getEpisodeTitle(ep, locale);
            const subtitle =
              ep.mentor === "—"
                ? ep.biome
                : t("withMentor", { name: ep.mentor });
            return (
              <li key={ep.id}>
                <Link href={`${base}/${ep.id}`} className="group">
                  <Card className="hover:bg-accent transition-colors">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="font-mono text-sm text-muted-foreground w-10 shrink-0 text-center">
                        {ep.id.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <Link
        href={`${base}/assets`}
        className="text-xs text-muted-foreground hover:text-foreground underline w-fit"
      >
        Production · style anchors
      </Link>

      <footer className="pt-4 border-t text-xs text-muted-foreground">
        <p>
          {t.rich("footer", {
            link: (chunks) => (
              <Link href={`/${locale}/`} className="underline text-primary">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </footer>
    </div>
  );
}
