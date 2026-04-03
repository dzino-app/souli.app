export type QuickActionType = "fact" | "joke" | "challenge" | "question" | "comfort" | "inspiration";

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
  "Naša DNA je z 99,9% rovnaká ako DNA akéhokoľvek iného človeka na Zemi.",
  "Jeden deň na Venuši trvá dlhšie ako jeden rok na Venuši.",
  "Včely komunikujú tancom — rôzne pohyby znamenajú rôzne smery a vzdialenosti k jedlu.",
  "Mozog spotrebuje asi 20% energie tela, hoci tvorí len 2% jeho hmotnosti.",
  "Zápalky boli vynájdené až po zapaľovači.",
  "V priemere sa človek za život prejde vzdialenosť, ktorá zodpovedá trom obchôdzkam okolo Zeme.",
];

const JOKES: string[] = [
  "Prečo sa programátori boja lesa? Pretože je tam príliš veľa bugov!",
  "Čo povie nula osmičke? Pekný opasok!",
  "Prečo sa ryba nikdy nedelí? Pretože sa bojí háčika!",
  "Prečo kniha vždy vyhráva? Pretože má veľa strán!",
  "Aký čaj pijú kozmonauti? Gravi-čaj!",
  "Prečo nechodia mravce do kostola? Pretože sú insekti!",
  "Aký je najrýchlejší koláč? Šprint-kuch!",
];

const CHALLENGES: string[] = [
  "Napíš jednu vec, za ktorú si dnes vďačný.",
  "Usmej sa na niekoho neznámeho dnes.",
  "Vypni telefón na 30 minút a rob niečo, čo ťa baví.",
  "Nauč sa jedno nové slovo v cudzom jazyku.",
  "Vyjdi von a 5 minút len pozoruj oblaky.",
  "Napíš niekomu správu, ktorú si mu dlho chcel poslať.",
  "Prečítaj si 10 strán knihy, ktorú máš rozčítanú.",
  "Nakresli niečo — aj keby to bol len smiešny panáčik.",
];

const QUESTIONS: string[] = [
  "Keby si mohol mať akúkoľvek superschopnosť, akú by si si vybral?",
  "Aký je tvoj najobľúbenejší zvuk?",
  "Keby si mohol cestovať kamkoľvek na svete, kam by si šiel?",
  "Čo by si robil, keby si nemusel pracovať?",
  "Aká je najlepšia rada, ktorú si kedy dostal?",
  "Čo ťa naposledy rozosmálo naozaj od srdca?",
  "Aké je tvoje najstaršie spomienka?",
  "Keby si mohol zmeniť jednu vec na svete, čo by to bolo?",
];

// For sad/low mood
const COMFORT: string[] = [
  "Je úplne ok cítiť sa tak, ako sa cítiš. Niekedy sú dni ťažšie a to je normálne.",
  "Vedel si, že po daždi vždy príde dúha? Platí to aj v živote.",
  "Niekedy stačí len dýchať. Nadýchni sa... vydýchni... už len tým robíš niečo dobré pre seba.",
  "Pamätaj — ťažké chvíle sú dočasné, aj keď sa tak necítia. Si silnejší, ako si myslíš.",
  "Nemusíš mať na všetko odpovede. Niekedy stačí byť tu a teraz.",
  "Ak ťa niečo trápi, pokojne mi o tom povedz. Počúvam.",
  "Malý krok je stále krok. Dnes nemusíš zdolať hory — stačí prežiť deň.",
  "Vedel si, že objatie trvajúce 20 sekúnd uvoľňuje oxytocín? Objím niekoho, koho máš rád.",
];

// For sad/low mood — inspirational
const INSPIRATION: string[] = [
  "\"Najťažšie cesty vedú na najkrajšie miesta.\" — neznámy",
  "\"Nie je dôležité, koľkokrát padneš. Dôležité je, koľkokrát vstaneš.\" — Vince Lombardi",
  "\"Odvaha nie je absencia strachu, ale rozhodnutie, že niečo iné je dôležitejšie.\" — Ambrose Redmoon",
  "\"Každý svätý má minulosť a každý hriešnik má budúcnosť.\" — Oscar Wilde",
  "\"Nečakaj na správny moment. Vezmi moment a urob ho správnym.\"",
  "\"Ak prechádzaš peklom, neprestávaj kráčať.\" — Winston Churchill",
  "\"Si presne tam, kde máš byť. A to je ok.\"",
  "\"Bolesti, ktoré dnes cítiš, sa stanú silou, ktorú budeš cítiť zajtra.\"",
];

const TYPE_LABELS: Record<QuickActionType, string> = {
  fact: "Zaujímavosť",
  joke: "Vtip",
  challenge: "Výzva",
  question: "Otázka pre teba",
  comfort: "Pre teba",
  inspiration: "Inšpirácia",
};

const POOLS: Record<QuickActionType, string[]> = {
  fact: FACTS,
  joke: JOKES,
  challenge: CHALLENGES,
  question: QUESTIONS,
  comfort: COMFORT,
  inspiration: INSPIRATION,
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Mood-aware action selection
export function getRandomAction(currentMood?: number | null): QuickAction {
  let types: QuickActionType[];

  if (currentMood !== null && currentMood !== undefined && currentMood <= 2) {
    // Sad/bad mood — comfort, inspiration, gentle question. NEVER jokes.
    types = ["comfort", "comfort", "inspiration", "inspiration", "question"];
  } else if (currentMood !== null && currentMood !== undefined && currentMood >= 4) {
    // Happy mood — jokes, facts, challenges, questions
    types = ["joke", "fact", "challenge", "question"];
  } else {
    // Neutral or unknown — mix of everything except comfort
    types = ["fact", "fact", "challenge", "question", "joke"];
  }

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
    case "fact": return "💡";
    case "joke": return "😄";
    case "challenge": return "🎯";
    case "question": return "🤔";
    case "comfort": return "🤗";
    case "inspiration": return "✨";
  }
}
