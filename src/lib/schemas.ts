import { z } from "zod";

export const generateRequestSchema = z
  .object({
    documentKind: z.enum(["ovingsark", "prove"]).default("ovingsark"),
    level: z.enum(["A1", "A2", "B1", "B2"]),
    domainId: z.string().min(1),
    taskTypeIds: z.array(z.string()).default([]),
    kompetansemalIds: z.array(z.string()).min(1).max(3),
    grammarTopicIds: z.array(z.string()).max(3).default([]),
    readingTextCount: z.number().int().min(0).max(10).default(0),
    taskCount: z.number().int().min(0).max(20).default(0),
    includeAnswerKey: z.boolean(),
    title: z.string().max(120).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.documentKind === "prove") {
      if (data.taskCount < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Velg minst én oppgave på prøven.",
          path: ["taskCount"],
        });
      }
      return;
    }

    if (data.taskTypeIds.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Velg minst én oppgavetype.",
        path: ["taskTypeIds"],
      });
    }

    if (data.readingTextCount + data.taskCount < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Velg minst én lesetekst eller én oppgave.",
        path: ["taskCount"],
      });
    }
  });

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

const LABELS = ["a", "b", "c", "d", "e"] as const;
const INTERACTIONS = ["write", "checkbox", "order", "table", "match"] as const;

const labelSchema = z.preprocess((value) => {
  const letter = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-e]/g, "")
    .slice(0, 1);
  return letter || undefined;
}, z.enum(LABELS));

const interactionSchema = z.preprocess((value) => {
  const raw = String(value ?? "write").toLowerCase();
  if (raw === "matching" || raw === "koble" || raw === "koble-sammen") {
    return "match";
  }
  if ((INTERACTIONS as readonly string[]).includes(raw)) return raw;
  return "write";
}, z.enum(INTERACTIONS));

const spacingSchema = z.preprocess((value) => {
  const raw = String(value ?? "normal").toLowerCase();
  if (["compact", "normal", "loose", "xlarge"].includes(raw)) return raw;
  return "normal";
}, z.enum(["compact", "normal", "loose", "xlarge"]));

function clampOptionalInt(min: number, max: number) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return undefined;
    const n = Number(value);
    if (!Number.isFinite(n)) return undefined;
    return Math.round(Math.min(max, Math.max(min, n)));
  }, z.number().int().min(min).max(max).optional());
}

const subTaskSchema = z.object({
  label: labelSchema,
  prompt: z.preprocess((value) => String(value ?? ""), z.string()),
  interaction: interactionSchema,
  options: z.array(z.string()).optional(),
  lines: clampOptionalInt(0, 8),
  tableHeaders: z.array(z.string()).optional(),
  tableRows: clampOptionalInt(1, 8),
  answer: z.preprocess(
    (value) => (value == null ? undefined : String(value)),
    z.string().optional(),
  ),
  points: clampOptionalInt(0, 1),
});

const subTasksSchema = z.preprocess((value) => {
  if (!Array.isArray(value)) return value;
  return value.slice(0, 5).map((item, index) => ({
    ...(item && typeof item === "object" ? item : { prompt: String(item ?? "") }),
    label: LABELS[index],
  }));
}, z.array(subTaskSchema).min(1).max(5));

const readingTextSchema = z.object({
  title: z.string(),
  text: z.string(),
  instruction: z.string(),
  spacingAfter: spacingSchema.optional(),
  subTasks: subTasksSchema,
});

const taskSchema = z.object({
  title: z.string(),
  typeId: z.string(),
  instruction: z.string(),
  intro: z.string().optional(),
  points: clampOptionalInt(0, 100),
  spacingAfter: spacingSchema.optional(),
  /** Visningsrekkefølge for svarene i koble-sammen (indeks inn i subTasks). */
  matchAnswerOrder: z.array(z.coerce.number().int().min(0).max(20)).optional(),
  subTasks: subTasksSchema,
});

export const worksheetSchema = z.object({
  meta: z.object({
    title: z.string(),
    level: z.preprocess(
      (value) => String(value ?? "").toUpperCase(),
      z.enum(["A1", "A2", "B1", "B2"]),
    ),
    domain: z.string(),
    kompetansemal: z.array(
      z.preprocess((value) => {
        if (typeof value === "string") return value;
        if (value && typeof value === "object" && "text" in value) {
          return String((value as { text: unknown }).text);
        }
        return String(value ?? "");
      }, z.string()),
    ),
    grammarTopics: z.array(z.string()).optional(),
    grammarTopicIds: z.array(z.string()).optional(),
    documentKind: z.preprocess((value) => {
      const raw = String(value ?? "").toLowerCase();
      if (raw === "prove" || raw === "ovingsark") return raw;
      return undefined;
    }, z.enum(["ovingsark", "prove"]).optional()),
    pointsPerAnswer: clampOptionalInt(0, 1),
    maxScore: clampOptionalInt(0, 500),
  }),
  readingTexts: z.array(readingTextSchema),
  tasks: z.array(taskSchema),
  answerKey: z
    .object({
      readingTexts: z.array(
        z.object({
          title: z.string(),
          answers: z.array(
            z.object({
              label: labelSchema,
              answer: z.preprocess((value) => String(value ?? ""), z.string()),
            }),
          ),
        }),
      ),
      tasks: z.array(
        z.object({
          title: z.string(),
          answers: z.array(
            z.object({
              label: labelSchema,
              answer: z.preprocess((value) => String(value ?? ""), z.string()),
            }),
          ),
        }),
      ),
    })
    .optional(),
});

export const replaceTaskRequestSchema = z.object({
  worksheet: worksheetSchema,
  target: z.enum(["task", "reading"]),
  index: z.number().int().min(0),
  level: z.enum(["A1", "A2", "B1", "B2"]),
  domainId: z.string().min(1),
  grammarTopicIds: z.array(z.string()).max(3).optional(),
});

export type ReplaceTaskRequest = z.infer<typeof replaceTaskRequestSchema>;
export type Worksheet = z.infer<typeof worksheetSchema>;
export type SubTask = z.infer<typeof subTaskSchema>;

export function calculateMaxScore(worksheet: Worksheet): number {
  if (typeof worksheet.meta.maxScore === "number") {
    return worksheet.meta.maxScore;
  }
  const fromReading = worksheet.readingTexts.reduce(
    (sum, rt) => sum + rt.subTasks.length,
    0,
  );
  const fromTasks = worksheet.tasks.reduce(
    (sum, task) => sum + task.subTasks.length,
    0,
  );
  return fromReading + fromTasks;
}
