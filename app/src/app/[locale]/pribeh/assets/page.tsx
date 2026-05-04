import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getStyleAnchors, styleAnchorStats } from "@/lib/style-anchors";

export const metadata = {
  title: "Style anchors — Pixoci production",
  description: "Inventory of hand-painted style anchors required before AI-video generation.",
};

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AssetsPage({ params }: Props) {
  const { locale } = await params;
  const anchors = getStyleAnchors();
  const stats = styleAnchorStats(anchors);

  const dzino = anchors.find((a) => a.kind === "dzino");
  const mentors = anchors.filter((a) => a.kind === "mentor");
  const biomes = anchors.filter((a) => a.kind === "biome");

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={`/${locale}/pribeh`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Späť na príbeh
      </Link>

      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Pixoci · Production</p>
        <h1 className="text-3xl font-bold tracking-tight">Style anchors</h1>
        <p className="text-muted-foreground">
          The hand-painted reference plates required before AI-video generation. Without them, AI video drifts across episodes and shots stop matching across cuts.
        </p>
      </header>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total slots</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Painted</p>
            <p className="text-2xl font-bold text-success mt-1">{stats.painted}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Placeholder</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.placeholders}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Missing</p>
            <p className="text-2xl font-bold text-destructive mt-1">{stats.missing}</p>
          </div>
        </CardContent>
      </Card>

      {/* Dzino — protagonist */}
      {dzino && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Protagonist
          </h2>
          <AssetCard anchor={dzino} large />
        </section>
      )}

      {/* Biomes */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Biomes ({biomes.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {biomes.map((a) => (
            <AssetCard key={a.id} anchor={a} />
          ))}
        </div>
      </section>

      {/* Mentors */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Mentors ({mentors.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {mentors.map((a) => (
            <AssetCard key={a.id} anchor={a} />
          ))}
        </div>
      </section>

      {/* Production prompts */}
      <section className="pt-4 border-t">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Production prompts
        </h2>
        <Card>
          <CardContent className="py-4 space-y-2">
            <p className="text-sm">
              Per-shot prompts ready to paste into Runway Gen-4 / Sora / SVD:
            </p>
            <ul className="text-sm space-y-1">
              <li>
                <a
                  href="https://github.com/dzino-app/dzino/blob/main/app/content/story/en/prompts/e01.md"
                  className="text-primary underline"
                >
                  E01 — The Pixel Garden (38 shots)
                </a>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground pt-2">
              More episodes&apos; prompts are extracted on demand from{" "}
              <code className="px-1 py-0.5 bg-muted rounded">app/content/story/en/storyboards/</code>.
            </p>
          </CardContent>
        </Card>
      </section>

      <footer className="pt-4 border-t text-xs text-muted-foreground">
        <p>
          See{" "}
          <a
            href="https://github.com/dzino-app/dzino/issues/50"
            className="underline text-primary"
          >
            issue #50
          </a>{" "}
          for the full kickoff plan and status.
        </p>
      </footer>
    </div>
  );
}

function AssetCard({
  anchor,
  large = false,
}: {
  anchor: ReturnType<typeof getStyleAnchors>[number];
  large?: boolean;
}) {
  const status = !anchor.exists
    ? { label: "Missing", color: "bg-destructive/15 text-destructive" }
    : anchor.isPlaceholder
      ? { label: "Placeholder", color: "bg-amber-500/15 text-amber-700" }
      : { label: "Painted", color: "bg-success/15 text-success" };

  return (
    <Card className="overflow-hidden">
      <div className={`relative bg-muted ${large ? "aspect-square sm:aspect-[2/1]" : "aspect-square"}`}>
        {anchor.exists ? (
          <Image
            src={anchor.src}
            alt={anchor.name}
            fill
            sizes={large ? "(min-width: 640px) 800px, 100vw" : "(min-width: 1024px) 200px, (min-width: 640px) 33vw, 50vw"}
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
            no image
          </div>
        )}
      </div>
      <CardContent className="py-3 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{anchor.name}</p>
          <p className="text-xs text-muted-foreground truncate">{anchor.role}</p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider shrink-0 ${status.color}`}
        >
          {status.label}
        </span>
      </CardContent>
    </Card>
  );
}
