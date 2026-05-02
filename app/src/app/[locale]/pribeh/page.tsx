import Link from "next/link";
import { Scroll, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EPISODES } from "@/lib/story";

export const metadata = {
  title: "Príbeh — Pixoci",
  description: "Cesta k oknu — kanonický príbeh Pixoci v 13 kapitolách.",
};

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function StoryIndex({ params }: Props) {
  const { locale } = await params;
  const base = `/${locale}/pribeh`;

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Sezóna 1</p>
        <h1 className="text-3xl font-bold tracking-tight">Cesta k oknu</h1>
        <p className="text-muted-foreground">
          Kanonický príbeh Pixoci. Dzino sa rodí v krajine voxelov a putuje k oknu svojho Človeka — cez jedenásť pixelových oblastí a dvanásť mentorov. Trinásť kapitol, krátkych ako spomienka.
        </p>
      </header>

      <Link href={`${base}/zvitok`} className="group">
        <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
          <CardContent className="flex items-start gap-4 py-5">
            <div className="rounded-lg bg-primary/15 p-2.5 shrink-0">
              <Scroll className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-primary/80">Zvitok Pixoci</p>
              <h2 className="text-lg font-semibold mt-0.5">Atlas sveta</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Mapa krajiny, postáv a tónu. Všetko, čo treba vedieť, kým otvoríš prvú kapitolu.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
          </CardContent>
        </Card>
      </Link>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Kapitoly</span>
        </div>
        <ul className="space-y-2">
          {EPISODES.map((ep) => (
            <li key={ep.id}>
              <Link href={`${base}/${ep.id}`} className="group">
                <Card className="hover:bg-accent transition-colors">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="font-mono text-sm text-muted-foreground w-8 shrink-0 text-center">
                      E{ep.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{ep.titleSk}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {ep.titleEn} · {ep.mentor === "—" ? ep.biome : `s ${ep.mentor}`}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="pt-4 border-t text-xs text-muted-foreground">
        <p>
          Pixoci je svet, kde žijú Soulis. Ak si Souliho ešte nemáš,{" "}
          <Link href={`/${locale}/`} className="underline text-primary">začni svoju cestu</Link>.
        </p>
      </footer>
    </div>
  );
}
