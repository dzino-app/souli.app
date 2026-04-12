/**
 * Soul file templates — pre-built personality sections users can add.
 *
 * Each template provides a slug, display name, category, and starter
 * content with guided prompts that the Souli can fill through conversation.
 *
 * Tone: fairytale, chill, mysterious — matches Dzino's world.
 */

export interface SoulTemplate {
  slug: string;
  displayName: string;
  emoji: string;
  category: string;
  description: string;
  starterContent: string;
}

export const SOUL_TEMPLATES: SoulTemplate[] = [
  {
    slug: "sny",
    displayName: "Sny",
    emoji: "\u2728",
    category: "rast",
    description: "O čom snívaš — v noci aj cez deň",
    starterContent: [
      "# Sny",
      "",
      "Miesto, kde sa stretáva fantázia s túžbou.",
      "",
      "## Nočné sny",
      "- (Povedz mi, čo sa ti snívalo naposledy)",
      "",
      "## Denné snenie",
      "- (Kam ťa myseľ odnáša, keď sa zamyslíš?)",
      "",
      "## Životné sny",
      "- (Čo by si robil, keby si mohol robiť čokoľvek?)",
    ].join("\n"),
  },
  {
    slug: "tajomstva",
    displayName: "Tajomstvá",
    emoji: "\ud83d\udd12",
    category: "jadro",
    description: "Veci, ktoré nehovoríš nahlas — bezpečné tu",
    starterContent: [
      "# Tajomstvá",
      "",
      "Tento súbor je šifrovaný. Nikto okrem teba ho nevidí.",
      "",
      "- (Tu si môžeš zapísať čokoľvek — myšlienky, pocity, veci, ktoré nechceš zabudnúť)",
      "- (Tvoj Souli si to zapamätá a nikdy to nikomu nepovie)",
    ].join("\n"),
  },
  {
    slug: "hudba",
    displayName: "Hudba a zvuky",
    emoji: "\ud83c\udfb5",
    category: "zaujmy",
    description: "Tvoj soundtrack — pesničky, žánre, spomienky na hudbu",
    starterContent: [
      "# Hudba a zvuky",
      "",
      "Každý má svoju melódiu.",
      "",
      "## Obľúbené pesničky",
      "- (Aká pieseň ti vždy zdvihne náladu?)",
      "",
      "## Žánre a nálady",
      "- (Čo počúvaš, keď si smutný? A keď šťastný?)",
      "",
      "## Hudobné spomienky",
      "- (Je nejaká pieseň spojená s dôležitou spomienkou?)",
    ].join("\n"),
  },
  {
    slug: "miesta",
    displayName: "Miesta",
    emoji: "\ud83c\udf0d",
    category: "zaujmy",
    description: "Kde si bol, kde chceš ísť, kde sa cítiš doma",
    starterContent: [
      "# Miesta",
      "",
      "Mapa tvojho sveta — skutočného aj vysnívaného.",
      "",
      "## Domov",
      "- (Kde je tvoj domov? Čo pre teba znamená?)",
      "",
      "## Obľúbené miesta",
      "- (Kam rád chodíš? Prečo?)",
      "",
      "## Bucket list",
      "- (Kam by si chcel cestovať, keby si mohol kamkoľvek?)",
    ].join("\n"),
  },
  {
    slug: "ritualy",
    displayName: "Rituály",
    emoji: "\ud83c\udf19",
    category: "rast",
    description: "Tvoje ranné rutiny, večerné rituály, malé zvyky",
    starterContent: [
      "# Rituály",
      "",
      "Malé veci, ktoré robia deň výnimočným.",
      "",
      "## Ráno",
      "- (Čo je prvá vec, ktorú robíš po prebudení?)",
      "",
      "## Večer",
      "- (Ako vyzerá tvoj ideálny večer?)",
      "",
      "## Malé radosti",
      "- (Aký malý rituál ťa vždy poteší?)",
    ].join("\n"),
  },
  {
    slug: "strachy",
    displayName: "Strachy a výzvy",
    emoji: "\ud83d\udc09",
    category: "rast",
    description: "Draky, ktorým čelíš — a tie, čo si už premohol",
    starterContent: [
      "# Strachy a výzvy",
      "",
      "Každý hrdina má svojich drakov.",
      "",
      "## Čoho sa bojím",
      "- (Čo ťa znervózňuje? Čo ti berie spánok?)",
      "",
      "## Čo som prekonal",
      "- (Na aký prekonaný strach si hrdý?)",
      "",
      "## Výzvy pred sebou",
      "- (Aká výzva ťa čaká?)",
    ].join("\n"),
  },
  {
    slug: "ludia",
    displayName: "Dôležití ľudia",
    emoji: "\u2764\ufe0f",
    category: "vztahy",
    description: "Ľudia, na ktorých ti záleží — tvoje konštelácia",
    starterContent: [
      "# Dôležití ľudia",
      "",
      "Hviezdy tvojej konštelácie.",
      "",
      "## Rodina",
      "- (Kto je pre teba najdôležitejší?)",
      "",
      "## Priatelia",
      "- (Kto ťa vždy rozosmeie?)",
      "",
      "## Niekto špeciálny",
      "- (Je niekto, na koho myslíš častejšie ako na ostatných?)",
    ].join("\n"),
  },
  {
    slug: "filozofia",
    displayName: "Životná filozofia",
    emoji: "\ud83e\uddd8",
    category: "jadro",
    description: "Čomu veríš, čo ťa formuje, tvoje pravidlá",
    starterContent: [
      "# Životná filozofia",
      "",
      "Kompas, podľa ktorého naviguje tvoja loď.",
      "",
      "## Čomu verím",
      "- (Aká myšlienka ťa drží, keď je ťažko?)",
      "",
      "## Moje pravidlá",
      "- (Aké pravidlo si sám pre seba vytvoril?)",
      "",
      "## Čo som sa naučil",
      "- (Aká najdôležitejšia lekcia ťa v živote stretla?)",
    ].join("\n"),
  },
];
