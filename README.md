# Arbeidsark

Generator for arbeidsark i norsk for voksenopplæring (nivå A1–B1).  
Basert på *Læreplan i norsk for voksne innvandrere* (HK-dir).

Læreren velger nivå, domene, oppgavetyper og kompetansemål. Gemini lager unike oppgaver. Resultatet kan forhåndsvises og lastes ned som Word (.docx).

## Kom i gang

1. Installer avhengigheter:

```bash
npm install
```

2. Kopier miljøfilen og legg inn Gemini-nøkkelen din:

```bash
copy .env.example .env.local
```

Åpne `.env.local` og sett:

```
GEMINI_API_KEY=din_hemmelige_nøkkel
```

Hent nøkkel fra [Google AI Studio](https://aistudio.google.com/apikey).  
**Aldri** commit `.env.local` eller del nøkkelen.

3. Start utviklingsserveren:

```bash
npm run dev
```

4. Åpne [http://localhost:3000](http://localhost:3000).

## Sikkerhet

- API-nøkkelen brukes kun på serversiden (`/api/generate`).
- Klienten sender aldri nøkkelen.
- `.env*`-filer er ignorert av git.

## Teknisk

- Next.js (App Router) + TypeScript
- Zod-validering
- Google Gemini for generering
- `docx` for Word-eksport
- UU-mål: WCAG 2.2 AA i generator-UI
