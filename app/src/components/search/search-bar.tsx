"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  ClientSearchIndex,
  type SearchableItem,
  type SearchResult,
} from "@/lib/client-search";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  /** Items to search over (may contain encrypted fields). */
  items: SearchableItem[];
  /** Called when the user selects a result. */
  onSelect: (id: string) => void;
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Extra className for the wrapper. */
  className?: string;
}

/**
 * Debounced, client-side fuzzy search bar with dropdown results.
 *
 * Decrypts items once on mount (via ClientSearchIndex) and performs
 * in-memory fuzzy search on every (debounced) keystroke.
 */
export function SearchBar({
  items,
  onSelect,
  placeholder = "Hľadať konverzácie...",
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [indexReady, setIndexReady] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable search index across renders
  const index = useMemo(() => new ClientSearchIndex(), []);

  // Build the index whenever items change
  useEffect(() => {
    let cancelled = false;
    setIndexReady(false);
    index.build(items).then(() => {
      if (!cancelled) setIndexReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [items, index]);

  // Debounced search
  const doSearch = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (!q.trim()) {
          setResults([]);
          setOpen(false);
          return;
        }
        const hits = index.search(q);
        setResults(hits);
        setOpen(hits.length > 0);
      }, 300);
    },
    [index],
  );

  // Trigger search when query changes
  useEffect(() => {
    if (indexReady) doSearch(query);
  }, [query, indexReady, doSearch]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      index.clear();
    };
  }, [index]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(id: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    onSelect(id);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover text-popover-foreground shadow-md max-h-64 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelect(r.id)}
              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {r.snippet}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
