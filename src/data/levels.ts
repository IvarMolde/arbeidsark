export type CEFRLevel = "A1" | "A2" | "B1" | "B2";

export const LEVELS: { id: CEFRLevel; label: string; description: string }[] = [
  {
    id: "A1",
    label: "A1",
    description: "Basisbruker – svært enkle, kjente dagligdagse emner",
  },
  {
    id: "A2",
    label: "A2",
    description: "Basisbruker – enkle emner knyttet til egen person og nærmiljø",
  },
  {
    id: "B1",
    label: "B1",
    description: "Selvstendig bruker – sammenhengende språk om kjente emner",
  },
  {
    id: "B2",
    label: "B2",
    description:
      "Selvstendig bruker – klart, nyansert språk om allmenne og faglige emner",
  },
];
