export type Domain = {
  id: string;
  title: string;
  description: string;
  /** Valgfrie stikkord som styrer AI-generering */
  focusTopics?: string[];
};

export const DOMAINS: Domain[] = [
  {
    id: "meg-selv-familie",
    title: "Meg selv og familien",
    description: "Personlige opplysninger, familie, nære relasjoner",
  },
  {
    id: "bolig-nabolag",
    title: "Bolig og nabolag",
    description: "Hjem, adresse, naboer, nærmiljø",
  },
  {
    id: "mat-handel",
    title: "Mat og handel",
    description: "Butikk, matvarer, priser, handlelister",
  },
  {
    id: "helse-kropp",
    title: "Helse og kropp",
    description: "Lege, apotek, symptomer, sunne vaner",
  },
  {
    id: "arbeidsliv",
    title: "Arbeidsliv",
    description:
      "Vanlige temaer i norsk arbeidsliv: jobb, kolleger, arbeidsdag, rettigheter og trygghet på arbeidsplassen",
    focusTopics: [
      "arbeidskontrakt og arbeidstid",
      "lønnsslipp, skatt og feriepenger",
      "pauser, lunsj og overtidsarbeid",
      "kolleger, leder og samarbeid",
      "møter, beskjeder og e-post på jobb",
      "arbeidsoppgaver og vaktliste",
      "sykmelding, egenmelding og fravær",
      "HMS, verneombud og sikkerhet",
      "arbeidsmiljø og likebehandling",
      "permisjon, ferie og helligdager",
      "fagforening og arbeidsrettigheter",
      "praktiske situasjoner på arbeidsplassen i Norge",
    ],
  },
  {
    id: "skole-opplaering",
    title: "Skole og opplæring",
    description: "Kurs, timeplan, lærere, læringsmål",
  },
  {
    id: "fritid-hobby",
    title: "Fritid og hobby",
    description: "Fritidsaktiviteter, hobbyer, interesser",
  },
  {
    id: "transport-reise",
    title: "Transport og reise",
    description: "Buss, bil, billett, reiseruter",
  },
  {
    id: "okonomi-bank",
    title: "Økonomi og bank",
    description: "Lønn, budsjett, bankkort, regninger",
  },
  {
    id: "offentlige-tjenester",
    title: "Offentlige tjenester",
    description: "NAV, kommune, skattekort, offentlige brev",
  },
  {
    id: "digitale-tjenester",
    title: "Digitale tjenester",
    description: "Apper, e-post, netthandel, digital ID",
  },
  {
    id: "barn-barnehage-skole",
    title: "Barn og barnehage/skole",
    description: "Barnas hverdag, møter, meldinger fra skolen",
  },
  {
    id: "vaer-arstider",
    title: "Vær og årstider",
    description: "Vær, klær, årstider, planlegging",
  },
  {
    id: "kultur-tradisjoner",
    title: "Kultur og tradisjoner",
    description: "Høytider, skikker, kulturtilbud",
  },
  {
    id: "demokrati-medborgerskap",
    title: "Demokrati og medborgerskap",
    description: "Stemmerett, lokalsamfunn, deltakelse",
  },
  {
    id: "miljo-barekraft",
    title: "Miljø og bærekraft",
    description: "Kildesortering, gjenbruk, miljøvalg",
  },
  {
    id: "nyheter-samfunn",
    title: "Nyheter og samfunn",
    description: "Enkle nyheter, samfunnsaktuelt, media",
  },
  {
    id: "jobbsoking-cv",
    title: "Jobbsøking og CV",
    description: "CV, søknad, jobbintervju, kompetanse",
  },
  {
    id: "trygghet-beredskap",
    title: "Trygghet og beredskap",
    description: "Nødnummer, sikkerhet, enkle råd",
  },
  {
    id: "sosialt-liv-nettverk",
    title: "Sosialt liv og nettverk",
    description: "Venner, invitasjoner, sosiale medier",
  },
  {
    id: "velferdssamfunnet",
    title: "Velferdssamfunnet",
    description:
      "Viktige temaer i den norske velferdsstaten: rettigheter, tjenester og samfunnsstøtte",
    focusTopics: [
      "NAV og økonomiske ytelser",
      "helsetjenester og fastlege",
      "barnehage, skole og utdanning",
      "foreldrepermisjon og barnetrygd",
      "sykepenger, uføretrygd og arbeidsavklaring",
      "boligstøtte og kommunale tjenester",
      "pensjon og eldreomsorg",
      "skatt, fellesskap og omfordeling",
      "arbeidsrettigheter og sosial trygghet",
      "likebehandling og inkludering",
      "hvordan man søker hjelp i velferdssystemet",
      "offentlige brev og digitale tjenester (ID-porten)",
    ],
  },
];
