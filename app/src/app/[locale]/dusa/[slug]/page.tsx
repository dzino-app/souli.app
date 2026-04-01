"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownResponse } from "@/components/chat/markdown-response";
import { getSoulFile, updateSoulFile, type SoulFile } from "@/lib/soul";

export default function SoulFilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [file, setFile] = useState<SoulFile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const f = getSoulFile(slug);
    if (f) {
      setFile(f);
      setEditContent(f.content);
    }
  }, [slug]);

  function handleSave() {
    if (!file) return;
    updateSoulFile(file.slug, editContent, "user");
    setFile({ ...file, content: editContent, updatedBy: "user", updatedAt: new Date().toISOString() });
    setEditing(false);
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
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[300px] rounded-md border bg-background px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              autoFocus
            />
          ) : (
            <MarkdownResponse content={file.content} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
