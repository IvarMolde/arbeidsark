import { NextResponse } from "next/server";
import { generateRequestSchema } from "@/lib/schemas";
import { generateWorksheet } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rateLimit";
import type { TaskTypeId } from "@/data/taskTypes";
import { DOMAINS } from "@/data/domains";
import { TASK_TYPES } from "@/data/taskTypes";
import { getKompetansemalForLevel } from "@/data/kompetansemal";
import { getGrammarTopicsForLevel } from "@/data/grammarTopics";
import { ZodError } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

function isZodError(error: unknown): error is ZodError {
  return (
    error instanceof ZodError ||
    (typeof error === "object" &&
      error !== null &&
      (error as { name?: string }).name === "ZodError")
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "For mange forespørsler. Prøv igjen om litt." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ugyldig forespørsel. Prøv å laste siden på nytt." },
      { status: 400 },
    );
  }

  let parsed;
  try {
    parsed = generateRequestSchema.parse(body);
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json(
        { error: "Ugyldige valg. Sjekk skjemaet og prøv igjen." },
        { status: 400 },
      );
    }
    throw error;
  }

  if (!DOMAINS.some((d) => d.id === parsed.domainId)) {
    return NextResponse.json({ error: "Ugyldig domene." }, { status: 400 });
  }

  if (parsed.documentKind !== "prove") {
    const validTypeIds = new Set<string>(TASK_TYPES.map((t) => t.id));
    if (parsed.taskTypeIds.some((id) => !validTypeIds.has(id as TaskTypeId))) {
      return NextResponse.json(
        { error: "Ugyldig oppgavetype." },
        { status: 400 },
      );
    }
  }

  const allowedGoals = new Set(
    getKompetansemalForLevel(parsed.level).map((m) => m.id),
  );
  if (parsed.kompetansemalIds.some((id) => !allowedGoals.has(id))) {
    return NextResponse.json(
      { error: "Kompetansemål må tilhøre valgt nivå." },
      { status: 400 },
    );
  }

  if (parsed.grammarTopicIds?.length) {
    const allowedGrammar = new Set(
      getGrammarTopicsForLevel(parsed.level).map((t) => t.id),
    );
    if (parsed.grammarTopicIds.some((id) => !allowedGrammar.has(id))) {
      return NextResponse.json(
        { error: "Grammatikktema må tilhøre valgt nivå." },
        { status: 400 },
      );
    }
  }

  try {
    const worksheet = await generateWorksheet(parsed);
    return NextResponse.json({ worksheet });
  } catch (error) {
    const message = errorMessage(error);
    console.error("Generate failed:", message);

    if (isZodError(error) || message.includes("Fant ikke gyldig JSON")) {
      return NextResponse.json(
        {
          error:
            "KI-svaret kunne ikke leses. Prøv å generere på nytt.",
        },
        { status: 502 },
      );
    }

    if (message.includes("API-nøkkel") || /api[_ -]?key/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "Gemini API-nøkkel mangler eller er ugyldig. Sjekk GEMINI_API_KEY i .env.local (lokalt) eller i Vercel (produksjon).",
        },
        { status: 500 },
      );
    }

    if (
      message.includes("429") ||
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("rate-limit") ||
      message.toLowerCase().includes("too many requests")
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini-kvoten er brukt opp for denne modellen/nøkkelen. Vent litt, bytt modell i .env.local (GEMINI_MODEL), eller sjekk plan/faktura i Google AI Studio.",
        },
        { status: 429 },
      );
    }

    if (
      message.includes("404") ||
      message.toLowerCase().includes("no longer available")
    ) {
      return NextResponse.json(
        {
          error:
            "Valgt Gemini-modell er ikke tilgjengelig for denne nøkkelen. Sett GEMINI_MODEL=gemini-flash-latest i .env.local og prøv igjen.",
        },
        { status: 502 },
      );
    }

    if (
      message.toLowerCase().includes("blocked") ||
      message.toLowerCase().includes("safety")
    ) {
      return NextResponse.json(
        {
          error:
            "Forespørselen ble stoppet av sikkerhetsfilteret. Prøv et annet tema eller generer på nytt.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Kunne ikke generere arbeidsark akkurat nå. Prøv igjen om litt.",
      },
      { status: 500 },
    );
  }
}
