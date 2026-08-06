import type { CEFRLevel } from "./levels";

export type GrammarTopic = {
  id: string;
  level: CEFRLevel;
  title: string;
  description: string;
};

/**
 * Grammatikktemaer for A1–B2, basert på kjennetegn i
 * Læreplan i norsk for voksne innvandrere (HK-dir):
 * A1: få innøvde grunnleggende strukturer
 * A2: noen grunnleggende strukturer riktig
 * B1: godt grep om grunnleggende strukturer + noen leddsetninger
 * B2: godt grep, varierte setningstyper, komplekse setninger uten misforståelser
 */
export const GRAMMAR_TOPICS: GrammarTopic[] = [
  // ——— A1 ———
  {
    id: "a1-presens",
    level: "A1",
    title: "Verb i presens",
    description: "Vanlige verb i nåtid (jobber, bor, liker, snakker)",
  },
  {
    id: "a1-vaere-ha",
    level: "A1",
    title: "Være og ha",
    description: "jeg er / du er, jeg har / du har",
  },
  {
    id: "a1-pronomen",
    level: "A1",
    title: "Personlige pronomen",
    description: "jeg, du, han, hun, vi, dere, de",
  },
  {
    id: "a1-sporreord",
    level: "A1",
    title: "Spørreord",
    description: "hva, hvem, hvor, når, hvordan, hvorfor",
  },
  {
    id: "a1-ordfolje",
    level: "A1",
    title: "Enkel ordfølge",
    description: "Subjekt – verbal – objekt i enkle setninger",
  },
  {
    id: "a1-substantiv",
    level: "A1",
    title: "Substantiv (en/ei/et)",
    description: "Kjønn og ubestemt form",
  },
  {
    id: "a1-preposisjoner",
    level: "A1",
    title: "Enkle preposisjoner",
    description: "i, på, til, fra, med",
  },
  {
    id: "a1-negasjon",
    level: "A1",
    title: "Negasjon med «ikke»",
    description: "Jeg snakker ikke / Jeg har ikke …",
  },
  {
    id: "a1-tall-tid",
    level: "A1",
    title: "Tall, klokke og dato",
    description: "Enkle talluttrykk, klokkeslett og datoer",
  },
  {
    id: "a1-sporsmal",
    level: "A1",
    title: "Ja/nei-spørsmål",
    description: "Bor du her? Har du jobb?",
  },
  {
    id: "a1-demonstrativ",
    level: "A1",
    title: "Denne / det / her / der",
    description: "Pekeord i enkle situasjoner",
  },
  {
    id: "a1-imperativ",
    level: "A1",
    title: "Enkle imperativer",
    description: "Kom! Sitt! Skriv navnet ditt.",
  },
  // ——— A2 ———
  {
    id: "a2-preteritum",
    level: "A2",
    title: "Preteritum",
    description: "Fortid: jobbet, gikk, var, hadde, sa",
  },
  {
    id: "a2-perfektum",
    level: "A2",
    title: "Perfektum",
    description: "har jobbet, har vært, har gjort",
  },
  {
    id: "a2-modalverb",
    level: "A2",
    title: "Modalverb",
    description: "kan, skal, vil, må, bør",
  },
  {
    id: "a2-adjektiv",
    level: "A2",
    title: "Adjektivbøying",
    description: "en stor bil / et stort hus / den store bilen",
  },
  {
    id: "a2-possessiv",
    level: "A2",
    title: "Possessiver",
    description: "min, din, hans, hennes, vår, deres",
  },
  {
    id: "a2-at-setning",
    level: "A2",
    title: "Leddsetning med «at»",
    description: "Jeg tror at … / Hun sier at …",
  },
  {
    id: "a2-komparativ",
    level: "A2",
    title: "Komparativ og superlativ",
    description: "større, størst / bedre, best",
  },
  {
    id: "a2-preposisjoner",
    level: "A2",
    title: "Preposisjoner i hverdagen",
    description: "hos, mellom, over, under, om, ved",
  },
  {
    id: "a2-bestemt-form",
    level: "A2",
    title: "Bestemt form av substantiv",
    description: "bilen, huset, møtet, barna",
  },
  {
    id: "a2-objektsform",
    level: "A2",
    title: "Objektform av pronomen",
    description: "meg, deg, ham, henne, oss, dem",
  },
  {
    id: "a2-ordfolje-v2",
    level: "A2",
    title: "Ordfølge i spørsmål og svar",
    description: "Inversjon i spørsmål og etter tidsuttrykk",
  },
  {
    id: "a2-futurum",
    level: "A2",
    title: "Framtid med skal / kommer til å",
    description: "Jeg skal jobbe i morgen",
  },
  {
    id: "a2-mengdeord",
    level: "A2",
    title: "Mengdeord",
    description: "mange, mye, noen, alle, ingen",
  },
  // ——— B1 ———
  {
    id: "b1-leddsetning",
    level: "B1",
    title: "Leddsetninger",
    description: "fordi, hvis, når, selv om, mens, før, etter at",
  },
  {
    id: "b1-ordfolje-ledd",
    level: "B1",
    title: "Ordfølge i leddsetning",
    description: "… fordi jeg ikke kan komme i dag",
  },
  {
    id: "b1-passiv",
    level: "B1",
    title: "Passiv",
    description: "bli + partisipp og enkel -s-passiv",
  },
  {
    id: "b1-relativ",
    level: "B1",
    title: "Relativsetninger",
    description: "som, der – personen som jobber her",
  },
  {
    id: "b1-bestemt-form",
    level: "B1",
    title: "Bestemt form og genitiv",
    description: "bilen, huset, kollegene / Annas jobb",
  },
  {
    id: "b1-tidsuttrykk",
    level: "B1",
    title: "Tidsuttrykk og verb",
    description: "i går, siden, allerede, nettopp, ennå",
  },
  {
    id: "b1-indirekte",
    level: "B1",
    title: "Indirekte tale",
    description: "Han sa at han skulle komme",
  },
  {
    id: "b1-preposisjoner",
    level: "B1",
    title: "Faste preposisjonsuttrykk",
    description: "interessert i, redd for, avhengig av",
  },
  {
    id: "b1-pluskvamperfektum",
    level: "B1",
    title: "Pluskvamperfektum",
    description: "hadde jobbet, hadde sett, hadde vært",
  },
  {
    id: "b1-refleksiv",
    level: "B1",
    title: "Refleksive verb",
    description: "å føle seg, å interessere seg, å haste seg",
  },
  {
    id: "b1-partikkelverb",
    level: "B1",
    title: "Partikkelverb",
    description: "stå opp, finne ut, komme fram, gi opp",
  },
  {
    id: "b1-kondisjonalis",
    level: "B1",
    title: "Kondisjonalis (ville / skulle)",
    description: "Jeg ville gjerne … / Hvis jeg hadde tid, …",
  },
  {
    id: "b1-substantivering",
    level: "B1",
    title: "Sammensatte substantiv",
    description: "arbeidsplass, lønnsslipp, barnehageplass",
  },
  // ——— B2 ———
  {
    id: "b2-komplekse-setninger",
    level: "B2",
    title: "Komplekse setninger",
    description: "Varierte hoved- og leddsetninger uten misforståelser",
  },
  {
    id: "b2-setningsvariasjon",
    level: "B2",
    title: "Setningsvariasjon",
    description: "Variere setningstyper for klar og nyansert framstilling",
  },
  {
    id: "b2-passiv-avansert",
    level: "B2",
    title: "Passiv i formelle tekster",
    description: "Det ble bestemt at … / Søknaden behandles …",
  },
  {
    id: "b2-nominalisering",
    level: "B2",
    title: "Nominalisering",
    description: "å bestemme → beslutningen; å søke → søknaden",
  },
  {
    id: "b2-konnektorer",
    level: "B2",
    title: "Tekstbinding og konnektorer",
    description: "derfor, imidlertid, derimot, dessuten, likevel",
  },
  {
    id: "b2-modus",
    level: "B2",
    title: "Modale nyanser",
    description: "kan, bør, må, får, synes å – grader av sikkerhet",
  },
  {
    id: "b2-ordfolje-avansert",
    level: "B2",
    title: "Avansert ordfølge",
    description: "Leddsetning, inversjon og fokusplassering",
  },
  {
    id: "b2-preposisjoner-faste",
    level: "B2",
    title: "Faste uttrykk med preposisjon",
    description: "i henhold til, med hensyn til, på grunn av",
  },
  {
    id: "b2-indirekte-sporsmal",
    level: "B2",
    title: "Indirekte spørsmål",
    description: "Jeg lurer på om … / Kan du fortelle hvor …",
  },
  {
    id: "b2-partisipp",
    level: "B2",
    title: "Partisippkonstruksjoner",
    description: "skrevet søknad, gjennomført kurs, mottatt svar",
  },
  {
    id: "b2-stilniva",
    level: "B2",
    title: "Formelt vs. uformelt språk",
    description: "Tilpasse grammatikk og ordvalg til mottaker",
  },
  {
    id: "b2-argumentasjon",
    level: "B2",
    title: "Argumenterende setningsbygging",
    description: "På den ene siden … på den andre siden …",
  },
  {
    id: "b2-samsvar",
    level: "B2",
    title: "Kongruens og samsvar",
    description: "Subjekt–verbal, adjektiv–substantiv i komplekse setninger",
  },
];

export function getGrammarTopicsForLevel(level: CEFRLevel): GrammarTopic[] {
  return GRAMMAR_TOPICS.filter((t) => t.level === level);
}

export function findGrammarTopicById(id: string): GrammarTopic | undefined {
  return GRAMMAR_TOPICS.find((t) => t.id === id);
}

export function findGrammarTopicByTitle(
  title: string,
  level?: CEFRLevel,
): GrammarTopic | undefined {
  return GRAMMAR_TOPICS.find(
    (t) =>
      t.title.toLowerCase() === title.toLowerCase() &&
      (!level || t.level === level),
  );
}
