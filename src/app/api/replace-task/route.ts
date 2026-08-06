import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { replaceTaskRequestSchema } from "@/lib/schemas";
import { replaceWorksheetItem } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rateLimit";
import { DOMAINS } from "@/data/domains";
import { getGrammarTopicsForLevel } from "@/data/grammarTopics";

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

    const parsed = replaceTaskRequestSchema.parse(await request.json());

    if (!DOMAINS.some((d) => d.id === parsed.domainId)) {
      return NextResponse.json({ error: "Ugyldig domene." }, { status: 400 });
    }

    if (parsed.grammarTopicIds?.length) {
      const allowed = new Set(
        getGrammarTopicsForLevel(parsed.level).map((t) => t.id),
      );
      if (parsed.grammarTopicIds.some((id) => !allowed.has(id))) {
        return NextResponse.json(
          { error: "Grammatikktema må tilhøre valgt nivå." },
          { status: 400 },
        );
      }
    }

    const maxIndex =
      parsed.target === "task"
        ? parsed.worksheet.tasks.length - 1
        : parsed.worksheet.readingTexts.length - 1;
    if (parsed.index > maxIndex) {
      return NextResponse.json(
        { error: "Ugyldig oppgaveindeks." },
        { status: 400 },
      );
    }

    const worksheet = await replaceWorksheetItem(parsed);
    return NextResponse.json({ worksheet });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Ugyldige data. Kunne ikke bytte oppgave." },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Ukjent feil";
    if (message.includes("API-nøkkel")) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    if (
      message.includes("429") ||
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("too many requests")
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini-kvoten er brukt opp. Vent litt eller bytt modell i .env.local.",
        },
        { status: 429 },
      );
    }

    console.error("Replace task failed:", message);
    return NextResponse.json(
      { error: "Kunne ikke bytte oppgave akkurat nå. Prøv igjen." },
      { status: 500 },
    );
  }
}
