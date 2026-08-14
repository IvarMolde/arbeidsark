import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ZodError, z } from "zod";
import { worksheetSchema } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  worksheet: worksheetSchema,
});

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Fant ikke gyldig JSON i AI-svaret.");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API-nøkkel mangler. Legg GEMINI_API_KEY i .env.local.",
        },
        { status: 500 },
      );
    }

    const parsed = bodySchema.parse(await request.json());
    const worksheet = parsed.worksheet;

    const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    const prompt = `Du er en erfaren lærer i norsk for voksne innvandrere.
Din oppgave er å omskrive oppgavetekster slik at de blir mer naturlige, varme og pedagogiske for voksne elever.

BEHOLD:
- Samme JSON-struktur og alle feltnavn
- Samme antall readingTexts, tasks og subTasks
- Samme label (a–e), interaction, lines, options, tableHeaders, tableRows, points, spacingAfter, typeId, answer/fasit, matchAnswerOrder
- Samme nivå (${worksheet.meta.level}) og tema (${worksheet.meta.domain})
- meta.documentKind, maxScore, pointsPerAnswer
- For koble-sammen: behold utsagn uten fasit i parentes. Ikke flytt svar inn i prompt-teksten.
- For rekkefølge: ikke sorter setningene i kronologisk rekkefølge.

FORBEDRE:
- Tittel, instruksjoner, intro, lesetekster og prompt-tekster
- Mer naturlig bokmål, respektfull tone, tydelige og korte setninger
- Tilpasset voksne (hverdag, arbeid, familie) – ikke barnespråk
- Behold vanskelighetsgrad for nivå ${worksheet.meta.level}

Svar med KUN gyldig JSON for hele arbeidsarket.

ORIGINAL:
${JSON.stringify(worksheet)}`;

    const result = await model.generateContent(prompt);
    const improved = worksheetSchema.parse(extractJson(result.response.text()));

    // Bevar redigeringsfelt som spacing hvis AI dropper dem
    const merged = {
      ...improved,
      meta: { ...worksheet.meta, ...improved.meta },
      readingTexts: improved.readingTexts.map((rt, i) => ({
        ...rt,
        spacingAfter:
          rt.spacingAfter ?? worksheet.readingTexts[i]?.spacingAfter,
        subTasks: rt.subTasks.map((st, j) => ({
          ...st,
          interaction:
            st.interaction ??
            worksheet.readingTexts[i]?.subTasks[j]?.interaction ??
            "write",
          lines:
            st.lines ?? worksheet.readingTexts[i]?.subTasks[j]?.lines ?? 2,
          options: st.options ?? worksheet.readingTexts[i]?.subTasks[j]?.options,
          answer: st.answer ?? worksheet.readingTexts[i]?.subTasks[j]?.answer,
          points: st.points ?? worksheet.readingTexts[i]?.subTasks[j]?.points,
        })),
      })),
      tasks: improved.tasks.map((task, i) => ({
        ...task,
        spacingAfter: task.spacingAfter ?? worksheet.tasks[i]?.spacingAfter,
        typeId: task.typeId || worksheet.tasks[i]?.typeId || "skriveoppgave",
        matchAnswerOrder:
          task.matchAnswerOrder ?? worksheet.tasks[i]?.matchAnswerOrder,
        subTasks: task.subTasks.map((st, j) => ({
          ...st,
          interaction:
            st.interaction ??
            worksheet.tasks[i]?.subTasks[j]?.interaction ??
            "write",
          lines: st.lines ?? worksheet.tasks[i]?.subTasks[j]?.lines ?? 2,
          options: st.options ?? worksheet.tasks[i]?.subTasks[j]?.options,
          answer: st.answer ?? worksheet.tasks[i]?.subTasks[j]?.answer,
          points: st.points ?? worksheet.tasks[i]?.subTasks[j]?.points,
        })),
      })),
      answerKey: improved.answerKey ?? worksheet.answerKey,
    };

    return NextResponse.json({
      worksheet: worksheetSchema.parse(merged),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Kunne ikke forbedre teksten. Prøv igjen." },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Ukjent feil";
    console.error("Naturalize failed:", message);
    return NextResponse.json(
      { error: "Kunne ikke forbedre teksten akkurat nå. Prøv igjen." },
      { status: 500 },
    );
  }
}
