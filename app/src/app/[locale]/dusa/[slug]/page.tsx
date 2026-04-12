"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Save, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownResponse } from "@/components/chat/markdown-response";
import { getSoulFile, updateSoulFile, type SoulFile } from "@/lib/soul";
import { renderWikilinks, getBacklinks, type BacklinkEntry } from "@/lib/wikilinks";

export default function SoulFilePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) ?? "sk";
  const slug = params.slug as string;
  const [file, setFile] = useState<SoulFile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [backlinks, setBacklinks] = useState<BacklinkEntry[]>([]);

  useEffect(() => {
    const f = getSoulFile(slug);
    if (f) {
      setFile(f);
      setEditContent(f.content);
      setBacklinks(getBacklinks(slug));
    }
  }, [slug]);

  function handleSave() {
    if (!file) return;
    updateSoulFile(file.slug, editContent, "user");
    setFile({ ...file, content: editContent, updatedBy: "user", updatedAt: new Date().toISOString() });
    setEditing(false);
    setBacklinks(getBacklinks(slug));
  }

  if (!file) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Súbor sa nenašiel.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/dusa")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Späť
        </Button>
      </div>
    );
  }

  // Render wikilinks as clickable markdown links
  const renderedContent = renderWikilinks(file.content, `/${locale}/dusa`);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dusa")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{file.displayName}</h1>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" /> Uložiť
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditContent(file.content); }}>
                Zrušiť
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Upraviť
            </Button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <p className="text-xs text-muted-foreground">
        Naposledy upravil: {file.updatedBy === "dzino" ? "Dzino" : "Vy"} ·{" "}
        {new Date(file.updatedAt).toLocaleDateString("sk-SK")}
      </p>

      {/* Content */}
      <Card>
        <CardContent className="py-6">
          {editing ? (
            <>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[300px] rounded-md border bg-background px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground mt-2">
                Tip: použi [[názov]] na prepojenie s inými súbormi duše
              </p>
            </>
          ) : (
            <MarkdownResponse content={renderedContent} />
          )}
        </CardContent>
      </Card>

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" />
            <span>{backlinks.length} {backlinks.length === 1 ? "odkaz" : "odkazov"} sem</span>
          </div>
          <div className="flex flex-col gap-1">
            {backlinks.map((bl) => (
              <button
                key={bl.slug}
                type="button"
                onClick={() => router.push(`/${locale}/dusa/${bl.slug}`)}
                className="text-left rounded-md border px-3 py-2 hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium text-primary">{bl.displayName}</span>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {bl.context}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
