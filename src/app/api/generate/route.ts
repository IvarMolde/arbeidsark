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

export async function POST(request: Request) {
  try {
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

    const body: unknown = await request.json();
    const parsed = generateRequestSchema.parse(body);

    if (!DOMAINS.some((d) => d.id === parsed.domainId)) {
      return NextResponse.json(
        { error: "Ugyldig domene." },
        { status: 400 },
      );
    }

    if (parsed.documentKind !== "prove") {
      const validTypeIds = new Set<string>(TASK_TYPES.map((t) => t.id));
      if (
        parsed.taskTypeIds.some((id) => !validTypeIds.has(id as TaskTypeId))
      ) {
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

    const worksheet = await generateWorksheet(parsed);
    return NextResponse.json({ worksheet });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Ugyldige valg. Sjekk skjemaet og prøv igjen." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Kunne ikke generere arbeidsark.";

    if (message.includes("API-nøkkel")) {
      return NextResponse.json({ error: message }, { status: 500 });
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

    if (message.includes("404") || message.toLowerCase().includes("no longer available")) {
      return NextResponse.json(
        {
          error:
            "Valgt Gemini-modell er ikke tilgjengelig for denne nøkkelen. Sett GEMINI_MODEL=gemini-flash-latest i .env.local og prøv igjen.",
        },
        { status: 502 },
      );
    }

    console.error("Generate failed:", message);
    return NextResponse.json(
      {
        error:
          "Kunne ikke generere arbeidsark akkurat nå. Prøv igjen om litt.",
      },
      { status: 500 },
    );
  }
}
