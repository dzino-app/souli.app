"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ShoppingBag, Check, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  SHOP_ITEMS,
  getPurchasedItems,
  purchaseItem,
  isItemPurchased,
  getRarityColor,
  getRarityLabel,
  type ShopCategory,
  type ShopItem,
} from "@/lib/shop";
import { getCredits, consumeCredit, type CreditState } from "@/lib/credits";

const CATEGORIES: { value: ShopCategory | ""; label: string }[] = [
  { value: "", label: "Všetko" },
  { value: "accessories", label: "Doplnky" },
  { value: "backgrounds", label: "Pozadia" },
  { value: "colors", label: "Farby" },
  { value: "titles", label: "Tituly" },
];

export default function ShopPage() {
  const router = useRouter();
  const [category, setCategory] = useState<ShopCategory | "">("");
  const [purchased, setPurchased] = useState<string[]>([]);
  const [credits, setCredits] = useState<CreditState | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);

  useEffect(() => {
    setPurchased(getPurchasedItems());
    setCredits(getCredits());
  }, []);

  const filtered = category
    ? SHOP_ITEMS.filter((i) => i.category === category)
    : SHOP_ITEMS;

  function handleBuy(item: ShopItem) {
    const ok = purchaseItem(item.id, (n) => {
      const c = getCredits();
      if (c.remaining < n) return false;
      for (let i = 0; i < n; i++) consumeCredit();
      return true;
    });
    if (ok) {
      setPurchased(getPurchasedItems());
      setCredits(getCredits());
      setJustBought(item.id);
      setTimeout(() => setJustBought(null), 2000);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Obchod
          </h1>
          <p className="text-sm text-muted-foreground">Prispôsob si svojho Souliho</p>
        </div>
        {credits && (
          <div className="ml-auto text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
            💬 {credits.remaining} kreditov
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              category === c.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((item) => {
          const owned = purchased.includes(item.id);
          const canAfford = credits ? credits.remaining >= item.price : false;
          const wasJustBought = justBought === item.id;

          return (
            <Card
              key={item.id}
              className={`overflow-hidden transition-all ${
                owned ? "border-green-500/30 bg-green-500/5" :
                wasJustBought ? "border-primary ring-2 ring-primary/20" : ""
              }`}
            >
              <CardContent className="py-4 px-3 flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">{item.emoji}</span>
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.description}</p>
                </div>
                <span className={`text-[10px] font-medium ${getRarityColor(item.rarity)}`}>
                  {getRarityLabel(item.rarity)}
                </span>

                {owned ? (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Check className="h-3 w-3" /> Vlastníš
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant={canAfford ? "default" : "outline"}
                    disabled={!canAfford}
                    className="w-full text-xs gap-1"
                    onClick={() => handleBuy(item)}
                  >
                    {canAfford ? (
                      `${item.price} kreditov`
                    ) : (
                      <><Lock className="h-3 w-3" /> {item.price} kreditov</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
