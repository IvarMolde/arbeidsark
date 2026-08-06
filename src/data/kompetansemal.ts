import type { CEFRLevel } from "./levels";

export type Skill = "lese" | "skrive";

export type Kompetansemal = {
  id: string;
  level: CEFRLevel;
  skill: Skill;
  text: string;
};

/** Kompetansemål for lesing og skriving A1–B1 (Læreplan i norsk for voksne innvandrere, HK-dir). */
export const KOMPETANSEMAL: Kompetansemal[] = [
  // A1 lese
  {
    id: "a1-lese-1",
    level: "A1",
    skill: "lese",
    text: "gjenkjenne kjente navn, kjente ord og svært enkle fraser i enkle autentiske tekster, for eksempel skilt, oppslag, informasjonstavler, nettsider, tabeller og reklamer",
  },
  {
    id: "a1-lese-2",
    level: "A1",
    skill: "lese",
    text: "lese og forstå svært enkle setninger i korte, enkle meldinger og beskjeder",
  },
  {
    id: "a1-lese-3",
    level: "A1",
    skill: "lese",
    text: "lese og forstå korte, illustrerte instruksjoner som er svært enkelt formulert",
  },
  {
    id: "a1-lese-4",
    level: "A1",
    skill: "lese",
    text: "få et inntrykk av innhold som er formidlet i et enkelt språk i svært enkle autentiske informative tekster, spesielt dersom det er støtte i illustrasjoner",
  },
  {
    id: "a1-lese-5",
    level: "A1",
    skill: "lese",
    text: "lese og forstå svært enkle, tilrettelagte informative og skjønnlitterære tekster, spesielt dersom det er støtte i illustrasjoner",
  },
  {
    id: "a1-lese-6",
    level: "A1",
    skill: "lese",
    text: "bruke noen enkle lesestrategier, som å utlede betydningen av konkrete, dagligdagse ord ut fra en svært enkel kontekst eller med bakgrunn i likheter med andre språk deltakeren kjenner",
  },
  // A1 skrive
  {
    id: "a1-skrive-1",
    level: "A1",
    skill: "skrive",
    text: "skrive svært enkelt om seg selv og nære forhold, slik som hvor en bor, hva en gjør, og hva en liker og ikke liker",
  },
  {
    id: "a1-skrive-2",
    level: "A1",
    skill: "skrive",
    text: "beskrive personer, steder og gjenstander på en svært enkel måte",
  },
  {
    id: "a1-skrive-3",
    level: "A1",
    skill: "skrive",
    text: "skrive og svare på svært enkle meldinger om konkrete, kjente emner og personlige behov",
  },
  {
    id: "a1-skrive-4",
    level: "A1",
    skill: "skrive",
    text: "skrive og kommentere innlegg på en svært enkel måte i digital kommunikasjon",
  },
  {
    id: "a1-skrive-5",
    level: "A1",
    skill: "skrive",
    text: "fylle inn noen personlige opplysninger i svært enkle skjemaer, for eksempel på nettsteder og i apper",
  },
  {
    id: "a1-skrive-6",
    level: "A1",
    skill: "skrive",
    text: "bruke tall i for eksempel dato, klokkeslett, mengde og pris i skriftlige tekster",
  },
  {
    id: "a1-skrive-7",
    level: "A1",
    skill: "skrive",
    text: "videreformidle innhold i bilder og svært enkle, tilrettelagte tekster",
  },
  // A2 lese
  {
    id: "a2-lese-1",
    level: "A2",
    skill: "lese",
    text: "søke etter, finne og forstå spesifikk, forutsigbar informasjon i enkle, autentiske tekster, for eksempel nettsider, brosjyrer, annonser, skilt og oppslag",
  },
  {
    id: "a2-lese-2",
    level: "A2",
    skill: "lese",
    text: "lese og forstå enkle meldinger, brev, e-poster og innlegg på sosiale medier",
  },
  {
    id: "a2-lese-3",
    level: "A2",
    skill: "lese",
    text: "lese og forstå korte instruksjoner som er enkelt formulert og gjerne illustrert",
  },
  {
    id: "a2-lese-4",
    level: "A2",
    skill: "lese",
    text: "lese og forstå hovedpunkter i korte, enkle nyhetsmeldinger og enkle, tilrettelagte faglige tekster",
  },
  {
    id: "a2-lese-5",
    level: "A2",
    skill: "lese",
    text: "lese og forstå hovedtrekk i enkle, sammensatte tekster som inneholder svært enkle diagrammer og tabeller",
  },
  {
    id: "a2-lese-6",
    level: "A2",
    skill: "lese",
    text: "lese og forstå svært enkle skjønnlitterære tekster",
  },
  {
    id: "a2-lese-7",
    level: "A2",
    skill: "lese",
    text: "bruke noen enkle lesestrategier, som å utlede betydningen av konkrete, dagligdagse ord ut fra en enkel kontekst",
  },
  // A2 skrive
  {
    id: "a2-skrive-1",
    level: "A2",
    skill: "skrive",
    text: "skrive enkelt om egen bakgrunn, opplevelser, interesser og framtidsplaner",
  },
  {
    id: "a2-skrive-2",
    level: "A2",
    skill: "skrive",
    text: "notere noen stikkord fra for eksempel et møte eller en enkel presentasjon om et kjent emne",
  },
  {
    id: "a2-skrive-3",
    level: "A2",
    skill: "skrive",
    text: "beskrive personer, steder og aktiviteter på en enkel måte",
  },
  {
    id: "a2-skrive-4",
    level: "A2",
    skill: "skrive",
    text: "skrive og svare enkelt på meldinger, invitasjoner, forslag og gratulasjoner, samt skrive og kommentere innlegg i digital kommunikasjon på en enkel måte",
  },
  {
    id: "a2-skrive-5",
    level: "A2",
    skill: "skrive",
    text: "skrive korte og enkle e-poster og personlige brev",
  },
  {
    id: "a2-skrive-6",
    level: "A2",
    skill: "skrive",
    text: "fylle inn opplysninger i de vanligste skjemaene en møter i dagliglivet, for eksempel i digitale tjenester som netthandel, banktjenester, påmeldinger og bestillinger",
  },
  {
    id: "a2-skrive-7",
    level: "A2",
    skill: "skrive",
    text: "presentere egen kompetanse i en enkel CV og i et digitalt skjema",
  },
  {
    id: "a2-skrive-8",
    level: "A2",
    skill: "skrive",
    text: "uttrykke egne meninger om emner av personlig interesse på en enkel måte",
  },
  {
    id: "a2-skrive-9",
    level: "A2",
    skill: "skrive",
    text: "videreformidle innholdet i bilder og enkle tekster",
  },
  // B1 lese
  {
    id: "b1-lese-1",
    level: "B1",
    skill: "lese",
    text: "søke etter, finne og forstå relevant informasjon i ulike hverdagslige informative tekster, for eksempel korte offentlige brev og dokumenter, nettsider og brosjyrer",
  },
  {
    id: "b1-lese-2",
    level: "B1",
    skill: "lese",
    text: "lese og forstå hverdagslige tekster som brev, e-poster og innlegg på sosiale medier",
  },
  {
    id: "b1-lese-3",
    level: "B1",
    skill: "lese",
    text: "lese og forstå klare og greie instruksjoner",
  },
  {
    id: "b1-lese-4",
    level: "B1",
    skill: "lese",
    text: "lese og forstå hovedpoeng i enkle nyhetsartikler og relativt enkle tekster innen eget fag- og interessefelt og vurdere tekstens relevans",
  },
  {
    id: "b1-lese-5",
    level: "B1",
    skill: "lese",
    text: "lese og forstå hovedtrekk i sammensatte tekster som inneholder enkle grafiske framstillinger, for eksempel diagrammer",
  },
  {
    id: "b1-lese-6",
    level: "B1",
    skill: "lese",
    text: "lese og forstå enkle skjønnlitterære tekster",
  },
  {
    id: "b1-lese-7",
    level: "B1",
    skill: "lese",
    text: "bruke lesestrategier som å forstå ord ut fra konteksten når temaet er kjent, og å gjette seg til betydningen av ord ut fra de ulike delene ordet er bygd opp av",
  },
  // B1 skrive
  {
    id: "b1-skrive-1",
    level: "B1",
    skill: "skrive",
    text: "skrive enkle sammenhengende tekster om erfaringer, opplevelser, interesseområder, ambisjoner og framtidsplaner som inneholder en del detaljerte beskrivelser",
  },
  {
    id: "b1-skrive-2",
    level: "B1",
    skill: "skrive",
    text: "notere hovedpunkter fra et møte eller en faglig presentasjon om et kjent emne, formidlet med et relativt enkelt språk",
  },
  {
    id: "b1-skrive-3",
    level: "B1",
    skill: "skrive",
    text: "skrive korte rapporter knyttet til egen opplærings- og arbeidssituasjon",
  },
  {
    id: "b1-skrive-4",
    level: "B1",
    skill: "skrive",
    text: "beskrive personer, steder, hendelser og opplevelser på en detaljert måte",
  },
  {
    id: "b1-skrive-5",
    level: "B1",
    skill: "skrive",
    text: "skrive og kommentere personlige innlegg og delta i diskusjoner om kjente emner i digital kommunikasjon",
  },
  {
    id: "b1-skrive-6",
    level: "B1",
    skill: "skrive",
    text: "skrive enkle, formelle e-poster og brev, for eksempel i forbindelse med en jobbsøknad",
  },
  {
    id: "b1-skrive-7",
    level: "B1",
    skill: "skrive",
    text: "skrive inn opplysninger i ulike typer skjemaer i digitale tjenester en møter i dagliglivet",
  },
  {
    id: "b1-skrive-8",
    level: "B1",
    skill: "skrive",
    text: "uttrykke og kort begrunne meninger i enkle sammenhengende tekster",
  },
  {
    id: "b1-skrive-9",
    level: "B1",
    skill: "skrive",
    text: "gjengi innholdet i enkle skjønnlitterære tekster",
  },
  {
    id: "b1-skrive-10",
    level: "B1",
    skill: "skrive",
    text: "sammenfatte og videreformidle relevant informasjon fra klart formulerte tekster om kjente emner",
  },
  {
    id: "b1-skrive-11",
    level: "B1",
    skill: "skrive",
    text: "bruke strategier for å kompensere for mangler i ordforrådet, for eksempel ved å omformulere",
  },
  {
    id: "b1-skrive-12",
    level: "B1",
    skill: "skrive",
    text: "bruke ulike skrivestrategier, for eksempel for å framheve det man mener er viktigst i en tekst",
  },
  // B2 lese
  {
    id: "b2-lese-1",
    level: "B2",
    skill: "lese",
    text: "lese og forstå det vesentligste innholdet i informasjonsutveksling, for eksempel i formelle brev, e-poster og sosiale medier",
  },
  {
    id: "b2-lese-2",
    level: "B2",
    skill: "lese",
    text: "lese og forstå komplekse instruksjoner og bruksanvisninger knyttet til eget fagfelt",
  },
  {
    id: "b2-lese-3",
    level: "B2",
    skill: "lese",
    text: "følge argumentasjonsrekker i ulike tekster om samfunnsaktuelle temaer og fra eget fagfelt",
  },
  {
    id: "b2-lese-4",
    level: "B2",
    skill: "lese",
    text: "lese og forstå sammensatte tekster som inneholder grafiske framstillinger, for eksempel ulike typer diagrammer",
  },
  {
    id: "b2-lese-5",
    level: "B2",
    skill: "lese",
    text: "lese og forstå et utvalg av skjønnlitterære tekster",
  },
  {
    id: "b2-lese-6",
    level: "B2",
    skill: "lese",
    text: "skumlese lange og komplekse tekster og vurdere relevansen av innholdet",
  },
  {
    id: "b2-lese-7",
    level: "B2",
    skill: "lese",
    text: "bruke hensiktsmessige søketeknikker og lesemåter for å finne relevant informasjon fra ulike nettsteder",
  },
  // B2 skrive
  {
    id: "b2-skrive-1",
    level: "B2",
    skill: "skrive",
    text: "skrive klare og detaljerte redegjørende tekster",
  },
  {
    id: "b2-skrive-2",
    level: "B2",
    skill: "skrive",
    text: "bearbeide, sammenfatte og videreformidle på en pålitelig måte hovedinnholdet i komplekse tekster om emner knyttet til eget fag- og interessefelt",
  },
  {
    id: "b2-skrive-3",
    level: "B2",
    skill: "skrive",
    text: "skrive rapporter og referater knyttet til eget fag- og interessefelt",
  },
  {
    id: "b2-skrive-4",
    level: "B2",
    skill: "skrive",
    text: "beskrive hendelser, opplevelser og følelser på en klar, detaljert og nyansert måte",
  },
  {
    id: "b2-skrive-5",
    level: "B2",
    skill: "skrive",
    text: "skrive detaljerte beskjeder, e-poster og brev tilpasset mottaker og formål",
  },
  {
    id: "b2-skrive-6",
    level: "B2",
    skill: "skrive",
    text: "skrive tekster der en utvikler et argument, gir grunner for eller imot et bestemt synspunkt og drøfter fordelene og ulempene ved ulike alternativer",
  },
  {
    id: "b2-skrive-7",
    level: "B2",
    skill: "skrive",
    text: "skrive og bearbeide klare og detaljerte tekster tilpasset situasjon og formål",
  },
];

export function getKompetansemalForLevel(level: CEFRLevel): Kompetansemal[] {
  return KOMPETANSEMAL.filter((m) => m.level === level);
}
