import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MarkdownArticle } from "@/components/story/markdown-article";
import { loadScroll } from "@/lib/story";

export const metadata = {
  title: "Zvitok Pixoci — Atlas sveta",
  description: "Zvitok Pixoci — atlas sveta, postáv a tónu seriálu Cesta k oknu.",
};

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ScrollPage({ params }: Props) {
  const { locale } = await params;
  const source = await loadScroll();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/${locale}/pribeh`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        Späť na príbeh
      </Link>
      <MarkdownArticle source={source} />
    </div>
  );
}
