"use client";

export type ShopCategory = "accessories" | "backgrounds" | "colors" | "titles";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  price: number;
  emoji: string;
  value: string;
  rarity: "common" | "rare" | "legendary";
}

const STORAGE_KEY = "souli_purchased_items";

export const SHOP_ITEMS: ShopItem[] = [
  { id: "acc-scarf", name: "Šál", description: "Útulný pletený šál", category: "accessories", price: 5, emoji: "🧣", value: "scarf", rarity: "common" },
  { id: "acc-headband", name: "Čelenka", description: "Farebná čelenka", category: "accessories", price: 5, emoji: "💫", value: "headband", rarity: "common" },
  { id: "acc-monocle", name: "Monokl", description: "Elegantný monokl", category: "accessories", price: 10, emoji: "🧐", value: "monocle", rarity: "rare" },
  { id: "acc-crown-gold", name: "Zlatá koruna", description: "Pre kráľa Pixoci", category: "accessories", price: 25, emoji: "👑", value: "crown", rarity: "legendary" },
  { id: "acc-halo-glow", name: "Žiariaca svätožiara", description: "Mystická aura", category: "accessories", price: 15, emoji: "😇", value: "halo", rarity: "rare" },
  { id: "bg-forest", name: "Čarovný les", description: "Zelený les so svetluškami", category: "backgrounds", price: 10, emoji: "🌲", value: "forest", rarity: "common" },
  { id: "bg-space", name: "Vesmír", description: "Hviezdy a galaxie", category: "backgrounds", price: 10, emoji: "🌌", value: "space", rarity: "common" },
  { id: "bg-beach", name: "Pláž", description: "Západ slnka nad morom", category: "backgrounds", price: 10, emoji: "🏖️", value: "beach", rarity: "common" },
  { id: "bg-castle", name: "Hrad", description: "Mystický hrad v oblakoch", category: "backgrounds", price: 15, emoji: "🏰", value: "castle", rarity: "rare" },
  { id: "bg-aurora", name: "Polárna žiara", description: "Žiarivé svetlá", category: "backgrounds", price: 20, emoji: "🌈", value: "aurora", rarity: "legendary" },
  { id: "col-midnight", name: "Polnočná modrá", description: "Hlboká modrá noci", category: "colors", price: 8, emoji: "🌙", value: "#1e1b4b", rarity: "rare" },
  { id: "col-sunset", name: "Západová oranžová", description: "Farba západu slnka", category: "colors", price: 8, emoji: "🌅", value: "#ea580c", rarity: "rare" },
  { id: "col-mint", name: "Mätová", description: "Svieža mäta", category: "colors", price: 5, emoji: "🍃", value: "#10b981", rarity: "common" },
  { id: "title-explorer", name: "Objaviteľ", description: "Preskúmal Pixoci", category: "titles", price: 0, emoji: "🗺️", value: "Objaviteľ", rarity: "common" },
  { id: "title-dreamer", name: "Snívač", description: "Sníva s otvorenými očami", category: "titles", price: 5, emoji: "💭", value: "Snívač", rarity: "common" },
  { id: "title-legend", name: "Legenda Pixoci", description: "Najpopulárnejší Souli", category: "titles", price: 50, emoji: "⭐", value: "Legenda Pixoci", rarity: "legendary" },
];

export function getPurchasedItems(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function purchaseItem(itemId: string, deductCredits: (n: number) => boolean): boolean {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return false;
  const purchased = getPurchasedItems();
  if (purchased.includes(itemId)) return false;
  if (item.price > 0 && !deductCredits(item.price)) return false;
  purchased.push(itemId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(purchased));
  return true;
}

export function isItemPurchased(itemId: string): boolean {
  return getPurchasedItems().includes(itemId);
}

export function getRarityColor(rarity: string): string {
  return { common: "text-muted-foreground", rare: "text-blue-500", legendary: "text-amber-500" }[rarity] ?? "text-muted-foreground";
}

export function getRarityLabel(rarity: string): string {
  return { common: "Bežný", rare: "Vzácny", legendary: "Legendárny" }[rarity] ?? rarity;
}
