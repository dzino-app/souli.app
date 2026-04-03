"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarGrid } from "@/components/library/avatar-grid";
import { Link } from "@/i18n/routing";
import type { AvatarRow } from "@/lib/supabase/avatars-db";
import type { Species } from "@/lib/avatar";

const SPECIES_LIST: { value: Species | ""; label: string }[] = [
  { value: "", label: "Všetky" },
  { value: "human", label: "Človek" },
  { value: "cat", label: "Mačka" },
  { value: "dog", label: "Pes" },
  { value: "bunny", label: "Zajac" },
  { value: "bear", label: "Medveď" },
  { value: "fox", label: "Líška" },
];

export default function LibraryPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "sk";

  const [avatars, setAvatars] = useState<AvatarRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [species, setSpecies] = useState("");
  const [sort, setSort] = useState<"popular" | "recent">("popular");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const fetchAvatars = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (species) params.set("species", species);
    params.set("sort", sort);
    if (search) params.set("search", search);
    params.set("page", String(page));

    try {
      const res = await fetch(`/api/library?${params}`);
      const data = await res.json();
      setAvatars(data.avatars ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setAvatars([]);
    } finally {
      setLoading(false);
    }
  }, [species, sort, search, page]);

  useEffect(() => {
    fetchAvatars();
  }, [fetchAvatars]);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Pixoci</h1>
          <p className="text-sm text-muted-foreground">
            Objav nových Soulis
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Hľadať Soulis..."
          className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SPECIES_LIST.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => {
              setSpecies(s.value);
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
              species === s.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border hover:border-primary/40"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSort("popular")}
          className={`text-xs font-medium ${sort === "popular" ? "text-primary" : "text-muted-foreground"}`}
        >
          Populárne
        </button>
        <span className="text-muted-foreground text-xs">|</span>
        <button
          type="button"
          onClick={() => setSort("recent")}
          className={`text-xs font-medium ${sort === "recent" ? "text-primary" : "text-muted-foreground"}`}
        >
          Najnovšie
        </button>
        <span className="ml-auto text-xs text-muted-foreground">
          {total} {total === 1 ? "Souli" : "Soulis"}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <AvatarGrid avatars={avatars} locale={locale} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Predchádzajúca
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Ďalšia
          </Button>
        </div>
      )}
    </div>
  );
}
