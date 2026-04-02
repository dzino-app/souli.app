export type QuickActionType = "fact" | "joke" | "challenge" | "question";

export interface QuickAction {
  type: QuickActionType;
  label: string;
  content: string;
}

const FACTS: string[] = [
  "Najstarší strom na svete má viac ako 5 000 rokov a volá sa Metuzalem.",
  "Kolibríky sú jediné vtáky, ktoré dokážu lietať dozadu.",
  "Ľudské oko dokáže rozlíšiť asi 10 miliónov rôznych farieb.",
  "Hviezdy, ktoré vidíš v noci, môžu byť už dávno mŕtve — ich svetlo k nám stále cestuje.",
  "V priemere sa človek za život prejde vzdialenosť, ktorá zodpovedá trom obchôdzkam okolo Zeme.",
  "Naša DNA je z 99,9% rovnaká ako DNA akéhokoľvek iného človeka na Zemi.",
  "Jeden deň na Venuši trvá dlhšie ako jeden rok na Venuši.",
  "Včely komunikujú tancom — rôzne pohyby znamenajú rôzne smery a vzdialenosti k jedlu.",
  "Mozog spotrebuje asi 20% energie tela, hoci tvorí len 2% jeho hmotnosti.",
  "Zápalky boli vynájdené až po zapaľovači.",
];

const JOKES: string[] = [
  "Prečo sa programátori boja lesa? Pretože je tam príliš veľa bugov!",
  "Čo povie nula osmičke? Pekný opasok!",
  "Aký je rozdiel medzi snowboardistom a korytnačkou? Korytnačka má výhodu — nemusí nosiť helmu.",
  "Prečo sa ryba nikdy nedelí? Pretože sa bojí háčika!",
  "Čo hovorí kalkulačka, keď sa zobudí? Jedeeeen deň!",
  "Prečo kniha vždy vyhráva? Pretože má veľa strán!",
  "Aký čaj pijú kozmonauti? Gravi-čaj!",
  "Prečo nechodia mravce do kostola? Pretože sú insekti!",
  "Čo je neviditeľné a vonia banánmi? Opičí prd!",
  "Aký je najrýchlejší koláč? Šprint-kuch!",
];

const CHALLENGES: string[] = [
  "Napíš jednu vec, za ktorú si dnes vďačný.",
  "Usmej sa na niekoho neznámeho dnes.",
  "Vypni telefón na 30 minút a rob niečo, čo ťa baví.",
  "Nauč sa jedno nové slovo v cudzom jazyku.",
  "Vyjdi von a 5 minút len pozoruj oblaky.",
  "Napíš niekomu správu, ktorú si mu dlho chcel poslať.",
  "Vyskúšaj niečo, čo si ešte nikdy nejedol.",
  "Prečítaj si 10 strán knihy, ktorú máš rozčítanú.",
  "Urob 20 drepov práve teraz — poďme na to!",
  "Nakresli niečo — aj keby to bol len smiešny panáčik.",
];

const QUESTIONS: string[] = [
  "Keby si mohol mať akúkoľvek superschopnosť, akú by si si vybral?",
  "Aký je tvoj najobľúbenejší zvuk?",
  "Keby si mohol cestovať kamkoľvek na svete, kam by si šiel?",
  "Čo by si robil, keby si nemusel pracovať?",
  "Aká je najlepšia rada, ktorú si kedy dostal?",
  "Keby si mohol večerať s akoukoľvek osobou z histórie, s kým by to bolo?",
  "Čo ťa naposledy rozosmálo naozaj od srdca?",
  "Aké je tvoje najstaršie spomienka?",
  "Keby si mohol zmeniť jednu vec na svete, čo by to bolo?",
  "Aký film alebo seriál by si odporučil každému?",
];

const TYPE_LABELS: Record<QuickActionType, string> = {
  fact: "Zaujímavosť",
  joke: "Vtip",
  challenge: "Výzva",
  question: "Otázka pre teba",
};

const POOLS: Record<QuickActionType, string[]> = {
  fact: FACTS,
  joke: JOKES,
  challenge: CHALLENGES,
  question: QUESTIONS,
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomAction(): QuickAction {
  const types: QuickActionType[] = ["fact", "joke", "challenge", "question"];
  const type = pickRandom(types);
  const content = pickRandom(POOLS[type]);
  return {
    type,
    label: TYPE_LABELS[type],
    content,
  };
}

export function getTypeEmoji(type: QuickActionType): string {
  switch (type) {
    case "fact":
      return "\u{1F4A1}";
    case "joke":
      return "\u{1F604}";
    case "challenge":
      return "\u{1F3AF}";
    case "question":
      return "\u{1F914}";
  }
}
