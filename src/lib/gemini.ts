import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerateRequest, ReplaceTaskRequest } from "@/lib/schemas";
import {
  calculateMaxScore,
  worksheetSchema,
  type Worksheet,
} from "@/lib/schemas";
import { DOMAINS } from "@/data/domains";
import { TASK_TYPES } from "@/data/taskTypes";
import { KOMPETANSEMAL } from "@/data/kompetansemal";
import { GRAMMAR_TOPICS } from "@/data/grammarTopics";
import { z, ZodError } from "zod";
import { normalizeInteractiveTasks } from "@/lib/taskNormalize";

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Fant ikke gyldig JSON i AI-svaret.");
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as unknown;
  } catch {
    throw new Error("Fant ikke gyldig JSON i AI-svaret.");
  }
}

function readingCount(input: GenerateRequest): number {
  if (input.documentKind === "prove") {
    return Math.min(input.readingTextCount, Math.max(0, input.taskCount));
  }
  if (input.readingTextCount > 0) return input.readingTextCount;
  if (input.taskTypeIds.includes("lesetekst")) return 1;
  return 0;
}

function resolveTaskTypes(input: GenerateRequest) {
  if (input.documentKind === "prove") {
    // Automatisk variasjon på tvers av alle oppgavetyper
    return TASK_TYPES;
  }
  return TASK_TYPES.filter((t) => input.taskTypeIds.includes(t.id));
}

function buildPrompt(input: GenerateRequest): string {
  const domain = DOMAINS.find((d) => d.id === input.domainId);
  const taskTypes = resolveTaskTypes(input);
  const goals = KOMPETANSEMAL.filter((m) =>
    input.kompetansemalIds.includes(m.id),
  );
  const grammarTopics = GRAMMAR_TOPICS.filter((t) =>
    (input.grammarTopicIds ?? []).includes(t.id),
  );
  const nonReadingTypes = taskTypes.filter((t) => t.id !== "lesetekst");
  const isProve = input.documentKind === "prove";
  const texts = isProve
    ? Math.min(
        input.readingTextCount,
        Math.floor(input.taskCount / 2),
      ) // valgfrie lesetekster innen prøven
    : readingCount(input);
  const otherTasks = isProve
    ? Math.max(0, input.taskCount - texts)
    : input.taskCount;
  const maxScore = (texts + otherTasks) * 5;

  const kindLabel = isProve ? "prøve" : "øvingsarbeidsark";

  return `Du er en erfaren lærer i norsk for voksne innvandrere (voksenopplæring) i Norge.
Lag en komplett ${kindLabel} på perfekt, naturlig bokmål.
Vær pedagogisk, tydelig og respektfull. Tilpass språk og vanskelighet strengt til CEFR-nivå ${input.level}.

KRAV:
- Bruk kun bokmål.
- Hver oppgave skal ha nøyaktig 5 deloppgaver merket a, b, c, d, e.
- Varier oppgavetypene tydelig mellom oppgavene (ikke samme type flere ganger på rad hvis det unngås).
- Lag UNIKT innhold hver gang (nye situasjoner, navn, tall og kontekster).
- Oppgavene skal være relevante for domenet og kompetansemålene.
- Oppgaveinstruksjoner skal være korte og tydelige for elever på nivå ${input.level}.
- For write-oppgaver: sett "interaction":"write" og "lines" (1–4).
- For rett/feil eller kryss påstand: sett "interaction":"checkbox" og "options" med påstander.
- For rekkefølge: se egne regler under. Ikke list hendelsene i den rekkefølgen de skjedde.
- For koble-sammen: se egne regler under. ALDRI skriv fasit i parentes etter utsagnet.
- For ordforråd/tabell: sett "interaction":"table", "tableHeaders" og "tableRows".
- Ikke bruk markdown. Svar med KUN gyldig JSON (ingen tekst utenfor JSON).
${
  isProve
    ? `- Dette er en PRØVE (ikke øving). Formuleringer skal være egnet til vurdering.
- Sett meta.pointsPerAnswer = 1 og meta.maxScore = ${maxScore}.
- Sett meta.documentKind = "prove".
- IKKE skriv poeng på hver deloppgave eller i hver oppgaveinstruks.
- Poengreglene står bare én gang øverst i dokumentet (vi legger dem til selv).`
    : `- Dette er et ØVINGSark. Sett meta.documentKind = "ovingsark".`
}

META:
- Dokumenttype: ${kindLabel}
- Nivå: ${input.level}
- Domene: ${domain?.title ?? input.domainId} (${domain?.description ?? ""})
${
  domain?.focusTopics?.length
    ? `- Fokustemaer innen domenet (bruk flere av disse i oppgavene):\n${domain.focusTopics.map((t) => `  • ${t}`).join("\n")}`
    : ""
}
- Oppgavetyper å variere mellom: ${taskTypes.map((t) => `${t.title}: ${t.description}`).join(" | ")}
- Kompetansemål (1–3):
${goals.map((g) => `- [${g.skill}] ${g.text}`).join("\n")}
${
  grammarTopics.length
    ? `- Grammatikkfokus (må prege flere oppgaver på en PEDAGOGISK og KORREKT måte):\n${grammarTopics.map((g) => `  • ${g.title}: ${g.description}`).join("\n")}
- Grammatikkoppgaver skal være svært korrekte, tydelige og egnet for voksne elever på nivå ${input.level}.
- Gi korte, klare instrukser. Unngå tvetydige fasitsvar. Eksemplene skal være naturlige i norsk hverdag.`
    : ""
}
- Antall lesetekster: ${texts}
- Antall øvrige oppgaver: ${otherTasks}
${isProve ? `- Totalt antall poeng (maks): ${maxScore}` : ""}
- Ta med fasit: ${input.includeAnswerKey ? "ja" : "nei"}
- Ønsket tittel: ${input.title?.trim() || `(lag en passende tittel for ${kindLabel})`}
${
  domain?.focusTopics?.length
    ? `\nVIKTIG FOR DETTE DOMENET (${domain.title}):\nLag oppgaver som speiler realistiske situasjoner innen: ${domain.description}. Bruk flere av fokustemaene over. Hold deg til norsk kontekst og hverdag for voksne innvandrere.`
    : ""
}

JSON-FORMAT (følg nøyaktig):
{
  "meta": {
    "title": "string",
    "level": "${input.level}",
    "domain": "${domain?.title ?? input.domainId}",
    "kompetansemal": ["kort formulering av hvert valgte mål"],
    "grammarTopics": ${
      grammarTopics.length
        ? JSON.stringify(grammarTopics.map((g) => g.title))
        : "[]"
    },
    "grammarTopicIds": ${
      grammarTopics.length
        ? JSON.stringify(grammarTopics.map((g) => g.id))
        : "[]"
    },
    "documentKind": "${isProve ? "prove" : "ovingsark"}"${
      isProve
        ? `,
    "pointsPerAnswer": 1,
    "maxScore": ${maxScore}`
        : ""
    }
  },
  "readingTexts": [
    {
      "title": "string",
      "text": "lesetekst tilpasset nivået",
      "instruction": "Les teksten. Svar på spørsmålene.",
      "subTasks": [
        {
          "label": "a",
          "prompt": "spørsmål eller oppgave",
          "interaction": "write",
          "lines": 2,
          "answer": "fasitsvar"
        }
      ]
    }
  ],
  "tasks": [
    {
      "title": "Oppgavetittel",
      "typeId": "${nonReadingTypes[0]?.id ?? "manglende-ord"}",
      "instruction": "tydelig instruks",
      "intro": "valgfri kort kontekst eller ordliste",
      "subTasks": [
        {
          "label": "a",
          "prompt": "...",
          "interaction": "write",
          "lines": 1,
          "answer": "..."
        }
      ]
    }
  ],
  "answerKey": {
    "readingTexts": [{"title":"...","answers":[{"label":"a","answer":"..."}]}],
    "tasks": [{"title":"...","answers":[{"label":"a","answer":"..."}]}]
  }
}

REGLER FOR ANTALL:
- readingTexts skal ha nøyaktig ${texts} elementer.
- tasks skal ha nøyaktig ${otherTasks} elementer.
- Hver subTasks-array skal ha nøyaktig 5 elementer med label a, b, c, d, e.
- typeId for tasks må være en av: ${
    nonReadingTypes.map((t) => t.id).join(", ") ||
    "manglende-ord, setningsstruktur, synonym-antonym, finn-feilen, riktig-pastand, feil-pastand, rekkefolge, ordforrad, skriveoppgave"
  }
- Varier typeId mellom oppgavene.
- Hvis fasit ikke skal med: utelat feltet answerKey helt, og utelat "answer" på subTasks.
- Hvis fasit skal med: fyll answerKey komplett, og legg "answer" på hver subTask.

SPESIELLE OPPGAVETYPER (viktig):
- rekkefolge: Hver deloppgave a–e er ÉN setning/hendelse. Setningene MÅ stå i BLANDET rekkefølge, ALDRI kronologisk. interaction="write", lines=1. answer = tallet 1–5 for når det skjer (1 = først). Ikke skriv tallet eller fasit i prompt-teksten.
- koble-sammen: Hver deloppgave er ett utsagn eller spørsmål. prompt = KUN utsagnet, uten fasit og uten parentes. answer = svaret som hører til (egen tekst). interaction="match". FORBUDT: "Hvor bor du? (Jeg bor i Molde)". Vi viser svarene i en egen, blandet liste.`;
}

/** Fjerner poengtekst fra oppgaveinstrukser – poeng står bare øverst. */
function stripInlinePointsWording(text: string): string {
  return text
    .replace(
      /\s*\(?\s*hver riktig(?:e)? (?:besvarelse|svar) gir 1 poeng\.?\s*\)?/gi,
      "",
    )
    .replace(/\s*\(?\s*alle riktige svar gir 1 poeng\.?\s*\)?/gi, "")
    .replace(/\s*\(\s*\d+\s*poeng\s*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.!?])/g, "$1")
    .trim();
}

function normalizeWorksheet(
  worksheet: Worksheet,
  input: GenerateRequest,
): Worksheet {
  const kind = input.documentKind ?? "ovingsark";
  const grammarTitles = GRAMMAR_TOPICS.filter((t) =>
    (input.grammarTopicIds ?? []).includes(t.id),
  ).map((t) => t.title);
  const grammarIds = input.grammarTopicIds ?? [];

  const withMeta: Worksheet = {
    ...worksheet,
    meta: {
      ...worksheet.meta,
      documentKind: worksheet.meta.documentKind ?? kind,
      grammarTopics:
        worksheet.meta.grammarTopics?.length
          ? worksheet.meta.grammarTopics
          : grammarTitles,
      grammarTopicIds:
        worksheet.meta.grammarTopicIds?.length
          ? worksheet.meta.grammarTopicIds
          : grammarIds,
    },
  };

  const withTasks = normalizeInteractiveTasks(withMeta);

  if (kind !== "prove") {
    return withTasks;
  }

  const maxScore = calculateMaxScore(withTasks);
  return {
    ...withTasks,
    meta: {
      ...withTasks.meta,
      documentKind: "prove",
      pointsPerAnswer: 1,
      maxScore,
    },
    readingTexts: withTasks.readingTexts.map((rt) => ({
      ...rt,
      instruction: stripInlinePointsWording(rt.instruction),
      subTasks: rt.subTasks.map((st) => ({ ...st, points: 1 })),
    })),
    tasks: withTasks.tasks.map((task) => ({
      ...task,
      instruction: stripInlinePointsWording(task.instruction),
      points: task.subTasks.length,
      subTasks: task.subTasks.map((st) => ({ ...st, points: 1 })),
    })),
  };
}

export async function generateWorksheet(
  input: GenerateRequest,
): Promise<Worksheet> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Gemini API-nøkkel mangler. Legg GEMINI_API_KEY i .env.local.",
    );
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.9,
      responseMimeType: "application/json",
    },
  });

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await model.generateContent(buildPrompt(input));
      const text = result.response.text();
      const parsed = extractJson(text);
      const worksheet = normalizeWorksheet(worksheetSchema.parse(parsed), input);

      if (!input.includeAnswerKey) {
        return {
          meta: worksheet.meta,
          readingTexts: worksheet.readingTexts,
          tasks: worksheet.tasks,
        };
      }

      return worksheet;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        error instanceof ZodError ||
        (typeof error === "object" &&
          error !== null &&
          (error as { name?: string }).name === "ZodError") ||
        message.includes("JSON") ||
        message.includes("Fant ikke gyldig") ||
        message.includes("503") ||
        message.toLowerCase().includes("overloaded");
      if (!retryable || attempt === 1) {
        throw error;
      }
    }
  }

  throw lastError;
}

const replacedTaskSchema = z.object({
  task: worksheetSchema.shape.tasks.element.optional(),
  readingText: worksheetSchema.shape.readingTexts.element.optional(),
  answerKeyEntry: z
    .object({
      title: z.string(),
      answers: z.array(
        z.object({
          label: z.enum(["a", "b", "c", "d", "e"]),
          answer: z.string(),
        }),
      ),
    })
    .optional(),
});

export async function replaceWorksheetItem(
  input: ReplaceTaskRequest,
): Promise<Worksheet> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Gemini API-nøkkel mangler. Legg GEMINI_API_KEY i .env.local.",
    );
  }

  const domain = DOMAINS.find((d) => d.id === input.domainId);
  const isProve = input.worksheet.meta.documentKind === "prove";
  const grammarTopics = GRAMMAR_TOPICS.filter((t) =>
    (input.grammarTopicIds ?? []).includes(t.id),
  );
  const nonReadingTypes = TASK_TYPES.filter((t) => t.id !== "lesetekst");

  const current =
    input.target === "task"
      ? input.worksheet.tasks[input.index]
      : input.worksheet.readingTexts[input.index];

  if (!current) {
    throw new Error("Ugyldig oppgaveindeks.");
  }

  const prompt = `Du er en erfaren lærer i norsk for voksne innvandrere.
Lag ÉN ny ${input.target === "reading" ? "lesetekst med 5 deloppgaver a–e" : "oppgave med 5 deloppgaver a–e"} på perfekt bokmål.
Den skal erstatte en eksister oppgave læreren ikke er fornøyd med.

KRAV:
- Nivå: ${input.level}
- Domene: ${domain?.title ?? input.domainId} (${domain?.description ?? ""})
${domain?.focusTopics?.length ? `- Fokustemaer: ${domain.focusTopics.join("; ")}` : ""}
${grammarTopics.length ? `- Grammatikkfokus: ${grammarTopics.map((g) => `${g.title} (${g.description})`).join("; ")}
- Oppgaven skal være svært korrekt og pedagogisk for voksne elever på nivå ${input.level}.` : ""}
- Lag UNIKT innhold – ikke lik den gamle oppgaven.
- Hver oppgave/lesetekst skal ha nøyaktig 5 deloppgaver a–e.
- typeId for vanlig oppgave må være en av: ${nonReadingTypes.map((t) => t.id).join(", ")}
${isProve ? "- Ikke skriv poeng på hver deloppgave. Poeng står bare øverst i dokumentet." : ""}
- Hvis typeId er rekkefolge: setningene a–e MÅ stå i blandet rekkefølge. answer = tallet 1–5 (1 = først). Ikke list hendelsene kronologisk.
- Hvis typeId er koble-sammen: prompt er KUN utsagnet. answer er svaret. interaction="match". ALDRI fasit i parentes.
- Svar med KUN gyldig JSON.

GAMMEL OPPGAVE (skal IKKE kopieres):
${JSON.stringify(current)}

JSON-FORMAT:
${
  input.target === "reading"
    ? `{
  "readingText": {
    "title": "...",
    "text": "...",
    "instruction": "...",
    "spacingAfter": "normal",
    "subTasks": [{"label":"a","prompt":"...","interaction":"write","lines":2${isProve ? ',"points":1' : ""},"answer":"..."}]
  },
  "answerKeyEntry": {"title":"...","answers":[{"label":"a","answer":"..."}]}
}`
    : `{
  "task": {
    "title": "...",
    "typeId": "manglende-ord",
    "instruction": "...",
    "intro": "",
    "spacingAfter": "normal",
    ${isProve ? '"points": 5,' : ""}
    "subTasks": [{"label":"a","prompt":"...","interaction":"write","lines":2${isProve ? ',"points":1' : ""},"answer":"..."}]
  },
  "answerKeyEntry": {"title":"...","answers":[{"label":"a","answer":"..."}]}
}`
}`;

  const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.95,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  const parsed = replacedTaskSchema.parse(extractJson(result.response.text()));

  const next: Worksheet = {
    ...input.worksheet,
    readingTexts: [...input.worksheet.readingTexts],
    tasks: [...input.worksheet.tasks],
    answerKey: input.worksheet.answerKey
      ? {
          readingTexts: [...input.worksheet.answerKey.readingTexts],
          tasks: [...input.worksheet.answerKey.tasks],
        }
      : undefined,
  };

  if (input.target === "task") {
    if (!parsed.task) throw new Error("AI returnerte ikke en ny oppgave.");
    const task = {
      ...parsed.task,
      spacingAfter:
        parsed.task.spacingAfter ??
        input.worksheet.tasks[input.index]?.spacingAfter ??
        "normal",
      points: isProve ? parsed.task.subTasks.length : parsed.task.points,
      subTasks: parsed.task.subTasks.map((st) => ({
        ...st,
        points: isProve ? 1 : st.points,
      })),
    };
    next.tasks[input.index] = task;
    if (next.answerKey && parsed.answerKeyEntry) {
      if (next.answerKey.tasks[input.index]) {
        next.answerKey.tasks[input.index] = parsed.answerKeyEntry;
      } else {
        next.answerKey.tasks.push(parsed.answerKeyEntry);
      }
    }
  } else {
    if (!parsed.readingText) {
      throw new Error("AI returnerte ikke en ny lesetekst.");
    }
    const readingText = {
      ...parsed.readingText,
      spacingAfter:
        parsed.readingText.spacingAfter ??
        input.worksheet.readingTexts[input.index]?.spacingAfter ??
        "normal",
      subTasks: parsed.readingText.subTasks.map((st) => ({
        ...st,
        points: isProve ? 1 : st.points,
      })),
    };
    next.readingTexts[input.index] = readingText;
    if (next.answerKey && parsed.answerKeyEntry) {
      if (next.answerKey.readingTexts[input.index]) {
        next.answerKey.readingTexts[input.index] = parsed.answerKeyEntry;
      } else {
        next.answerKey.readingTexts.push(parsed.answerKeyEntry);
      }
    }
  }

  if (isProve) {
    next.meta = {
      ...next.meta,
      maxScore: calculateMaxScore(next),
      pointsPerAnswer: 1,
    };
  }

  return normalizeInteractiveTasks(next);
}

