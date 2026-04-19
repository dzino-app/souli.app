"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Target,
  Check,
  Plus,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getOfficialPrograms,
  getMyPrograms,
  enrollInProgram,
  completeDay,
  leaveProgram,
  generateCustomProgram,
  type Program,
  type UserProgram,
} from "@/lib/programs";

export default function ProgramsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "sk";

  const [official, setOfficial] = useState<Program[]>([]);
  const [mine, setMine] = useState<UserProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "browse" | "custom">("active");

  // Custom creation
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [o, m] = await Promise.all([getOfficialPrograms(), getMyPrograms()]);
    setOfficial(o);
    setMine(m);
    setLoading(false);
    // If no active programs, default to browse tab
    if (m.length === 0) setTab("browse");
  }

  async function handleEnroll(programId: string) {
    const ok = await enrollInProgram(programId);
    if (ok) {
      await loadAll();
      setTab("active");
    }
  }

  async function handleCompleteToday(up: UserProgram) {
    await completeDay(up.id, up.current_day);
    await loadAll();
  }

  async function handleLeave(id: string) {
    if (!confirm("Naozaj chceš ukončiť tento program?")) return;
    await leaveProgram(id);
    await loadAll();
  }

  async function handleGenerate() {
    if (topic.length < 3) return;
    setGenerating(true);
    try {
      const program = await generateCustomProgram(topic, locale);
      if (program) {
        await enrollInProgram(program.id);
        setTopic("");
        await loadAll();
        setTab("active");
      }
    } finally {
      setGenerating(false);
    }
  }

  const enrolledIds = new Set(mine.map((m) => m.program_id));
  const availableOfficial = official.filter((p) => !enrolledIds.has(p.id));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            30-dňové cesty
          </h1>
          <p className="text-sm text-muted-foreground">Štruktúrovaný rast so Soulim</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["active", "browse", "custom"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "active" ? `Moje (${mine.length})` : t === "browse" ? "Prehliadať" : "Vytvoriť vlastnú"}
          </button>
        ))}
      </div>

      {/* Active programs */}
      {tab === "active" && (
        <div className="flex flex-col gap-3">
          {mine.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center space-y-3">
                <Target className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Zatiaľ nemáš žiadnu aktívnu cestu.
                </p>
                <Button size="sm" onClick={() => setTab("browse")}>Prezrieť cesty</Button>
              </CardContent>
            </Card>
          ) : (
            mine.map((up) => {
              const today = up.program?.days.find((d) => d.day === up.current_day);
              const done = up.completed_days.includes(up.current_day);
              const progress = ((up.completed_days.length / (up.program?.total_days ?? 30)) * 100).toFixed(0);
              const finished = !!up.finished_at;

              return (
                <Card key={up.id} className={finished ? "border-green-500/30 bg-green-500/5" : ""}>
                  <CardContent className="py-4 px-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate">{up.program?.title}</h3>
                        <p className="text-[11px] text-muted-foreground">
                          Deň {up.current_day}/{up.program?.total_days ?? 30} · {progress}%
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => handleLeave(up.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Today's prompt */}
                    {!finished && today && (
                      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
                        <p className="text-[10px] uppercase tracking-wide text-primary/80 font-medium">
                          Dnes · {today.focus}
                        </p>
                        <p className="text-sm leading-relaxed">{today.prompt}</p>
                        {done ? (
                          <div className="flex items-center gap-1.5 text-xs text-green-600">
                            <Check className="h-3.5 w-3.5" /> Zvládnuté — vráť sa zajtra
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full gap-1.5"
                            onClick={() => handleCompleteToday(up)}
                          >
                            <Check className="h-4 w-4" />
                            Označiť ako zvládnuté
                          </Button>
                        )}
                      </div>
                    )}

                    {finished && (
                      <p className="text-xs text-green-700 dark:text-green-400 text-center">
                        Cesta dokončená! 🎉
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Browse */}
      {tab === "browse" && (
        <div className="flex flex-col gap-3">
          {availableOfficial.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Všetky oficiálne cesty máš už aktívne.
            </p>
          ) : (
            availableOfficial.map((p) => (
              <Card key={p.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="py-4 px-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{p.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {p.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {p.total_days} dní
                    </p>
                  </div>
                  <Button size="sm" className="shrink-0 gap-1" onClick={() => handleEnroll(p.id)}>
                    <Plus className="h-3.5 w-3.5" />
                    Začať
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Custom */}
      {tab === "custom" && (
        <div className="flex flex-col gap-3">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4 px-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Vytvor si vlastnú 30-dňovú cestu</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Napíš, čo sa chceš naučiť alebo zlepšiť. Souli ti zostaví 30 denných výziev
                na mieru.
              </p>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Napr.: Chcem sa naučiť meditovať · Chcem byť lepší v písaní · Chcem spoznať seba · Chcem si zlepšiť spánok..."
                rows={3}
                maxLength={200}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground/60">
                  {topic.length}/200
                </span>
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={topic.length < 3 || generating}
                  className="gap-1.5"
                >
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {generating ? "Pripravujem cestu..." : "Vytvoriť"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            Cesta sa vytvorí len pre teba a uloží medzi tvoje aktívne cesty.
          </p>
        </div>
      )}
    </div>
  );
}
