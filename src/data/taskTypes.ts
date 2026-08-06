export type TaskTypeId =
  | "lesetekst"
  | "setningsstruktur"
  | "rekkefolge"
  | "synonym-antonym"
  | "manglende-ord"
  | "finn-feilen"
  | "riktig-pastand"
  | "feil-pastand"
  | "ordforrad"
  | "skriveoppgave"
  | "velg-riktig-svar"
  | "koble-sammen";

export type TaskType = {
  id: TaskTypeId;
  title: string;
  description: string;
  /** Om typen typisk bruker avkrysning i stedet for skrivestreker */
  interaction: "write" | "checkbox" | "order" | "table" | "mixed";
};

export const TASK_TYPES: TaskType[] = [
  {
    id: "lesetekst",
    title: "Lesetekst med spørsmål",
    description: "Kort tekst tilpasset nivået med forståelsesspørsmål a.–e.",
    interaction: "mixed",
  },
  {
    id: "setningsstruktur",
    title: "Setning i riktig struktur",
    description: "Sett ordene i riktig rekkefølge / lag korrekt setning.",
    interaction: "write",
  },
  {
    id: "rekkefolge",
    title: "Hendelser i riktig rekkefølge",
    description: "Nummerer eller sorter hendelser i riktig rekkefølge.",
    interaction: "order",
  },
  {
    id: "synonym-antonym",
    title: "Synonym / antonym",
    description: "Finn synonym eller antonym til gitte ord.",
    interaction: "write",
  },
  {
    id: "manglende-ord",
    title: "Skriv inn ordet som mangler",
    description: "Fyll inn manglende ord i setninger eller tekst.",
    interaction: "write",
  },
  {
    id: "finn-feilen",
    title: "Finn feilen i setningene",
    description: "Finn og rett språkfeil i setninger.",
    interaction: "write",
  },
  {
    id: "riktig-pastand",
    title: "Kryss av for riktig påstand",
    description: "Velg hvilke påstander som er riktige.",
    interaction: "checkbox",
  },
  {
    id: "feil-pastand",
    title: "Kryss av for feil påstand",
    description: "Velg hvilke påstander som er feil.",
    interaction: "checkbox",
  },
  {
    id: "ordforrad",
    title: "Ordforråd",
    description: "Koble ord og betydning, eller forklar ord i kontekst.",
    interaction: "table",
  },
  {
    id: "skriveoppgave",
    title: "Skriveoppgave",
    description: "Skriv korte svar, meldinger eller en enkel tekst.",
    interaction: "write",
  },
  {
    id: "velg-riktig-svar",
    title: "Velg riktig svar",
    description: "Flervalgsoppgaver der eleven krysser av ett riktig alternativ.",
    interaction: "checkbox",
  },
  {
    id: "koble-sammen",
    title: "Koble sammen",
    description: "Koble setningsdeler, spørsmål–svar eller ord–betydning.",
    interaction: "table",
  },
];
