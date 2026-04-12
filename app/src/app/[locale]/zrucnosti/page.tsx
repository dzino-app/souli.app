"use client";

import { useEffect, useState } from "react";
import { Plus, Power, Trash2, Search, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getInstalledSkills,
  getPublicSkills,
  installSkill,
  uninstallSkill,
  toggleSkill,
  createSkill,
  type Skill,
  type InstalledSkill,
} from "@/lib/skills";

export default function SkillsPage() {
  const [installed, setInstalled] = useState<InstalledSkill[]>([]);
  const [marketplace, setMarketplace] = useState<Skill[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"mine" | "browse" | "create">("mine");
  const [loading, setLoading] = useState(true);

  // Create form
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [inst, pub] = await Promise.all([
      getInstalledSkills(),
      getPublicSkills(),
    ]);
    setInstalled(inst);
    setMarketplace(pub);
    setLoading(false);
  }

  async function handleToggle(id: string, enabled: boolean) {
    await toggleSkill(id, enabled);
    setInstalled((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled } : s)),
    );
  }

  async function handleUninstall(id: string) {
    await uninstallSkill(id);
    setInstalled((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleInstall(skillId: string) {
    const ok = await installSkill(skillId);
    if (ok) loadData();
  }

  async function handleCreate() {
    if (!newName.trim() || !newPrompt.trim()) return;
    setCreating(true);
    const skill = await createSkill({
      name: newName,
      description: newDesc,
      system_prompt: newPrompt,
      is_public: true,
    });
    if (skill) {
      await installSkill(skill.id);
      setNewName("");
      setNewDesc("");
      setNewPrompt("");
      setTab("mine");
      loadData();
    }
    setCreating(false);
  }

  const installedIds = new Set(installed.map((s) => s.skill_id));
  const filteredMarketplace = marketplace.filter(
    (s) =>
      !installedIds.has(s.id) &&
      (!search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())),
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div>
        <h1 className="text-xl font-bold">Zručnosti</h1>
        <p className="text-sm text-muted-foreground">
          Rozšír schopnosti svojho Souliho
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["mine", "browse", "create"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "mine" ? "Moje" : t === "browse" ? "Obchod" : "Vytvoriť"}
          </button>
        ))}
      </div>

      {/* My Skills */}
      {tab === "mine" && (
        <div className="flex flex-col gap-3">
          {installed.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Zatiaľ nemáš žiadne zručnosti.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setTab("browse")}
                >
                  Prezrieť obchod
                </Button>
              </CardContent>
            </Card>
          ) : (
            installed.map((s) => (
              <Card key={s.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">
                      {s.skill.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {s.skill.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(s.id, !s.enabled)}
                      title={s.enabled ? "Vypnúť" : "Zapnúť"}
                    >
                      <Power
                        className={`h-4 w-4 ${
                          s.enabled ? "text-green-500" : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleUninstall(s.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Browse Marketplace */}
      {tab === "browse" && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hľadať zručnosti..."
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm"
            />
          </div>
          {filteredMarketplace.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Žiadne zručnosti na inštaláciu.
            </p>
          ) : (
            filteredMarketplace.map((s) => (
              <Card key={s.id}>
                <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">
                      {s.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {s.description}
                    </p>
                    <span className="text-[10px] text-muted-foreground/60">
                      {s.usage_count}× nainštalovaná
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1"
                    onClick={() => handleInstall(s.id)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Inštalovať
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Skill */}
      {tab === "create" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Názov</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Napr.: Slovenský daňový poradca"
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Popis</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Krátky popis čo zručnosť robí"
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Systémový prompt</label>
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Inštrukcie pre Souliho, napr.: 'Keď sa ťa opýtajú o daniach, odpovedaj podľa slovenského daňového zákona...'"
              rows={6}
              className="rounded-lg border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating || !newName.trim() || !newPrompt.trim()}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            {creating ? "Vytváram..." : "Vytvoriť a publikovať"}
          </Button>
        </div>
      )}
    </div>
  );
}
