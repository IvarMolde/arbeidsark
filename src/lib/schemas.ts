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

const subTaskSchema = z.object({
  label: z.enum(["a", "b", "c", "d", "e"]),
  prompt: z.string(),
  interaction: z.enum(["write", "checkbox", "order", "table"]),
  options: z.array(z.string()).optional(),
  lines: z.number().int().min(0).max(8).optional(),
  tableHeaders: z.array(z.string()).optional(),
  tableRows: z.number().int().min(1).max(8).optional(),
  answer: z.string().optional(),
  points: z.number().int().min(0).max(1).optional(),
});

const readingTextSchema = z.object({
  title: z.string(),
  text: z.string(),
  instruction: z.string(),
  spacingAfter: z.enum(["compact", "normal", "loose", "xlarge"]).optional(),
  subTasks: z.array(subTaskSchema).min(1).max(5),
});

const taskSchema = z.object({
  title: z.string(),
  typeId: z.string(),
  instruction: z.string(),
  intro: z.string().optional(),
  points: z.number().int().min(0).optional(),
  spacingAfter: z.enum(["compact", "normal", "loose", "xlarge"]).optional(),
  subTasks: z.array(subTaskSchema).min(1).max(5),
});

export const worksheetSchema = z.object({
  meta: z.object({
    title: z.string(),
    level: z.enum(["A1", "A2", "B1", "B2"]),
    domain: z.string(),
    kompetansemal: z.array(z.string()),
    grammarTopics: z.array(z.string()).optional(),
    grammarTopicIds: z.array(z.string()).optional(),
    documentKind: z.enum(["ovingsark", "prove"]).optional(),
    pointsPerAnswer: z.number().int().min(0).max(1).optional(),
    maxScore: z.number().int().min(0).optional(),
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
              label: z.enum(["a", "b", "c", "d", "e"]),
              answer: z.string(),
            }),
          ),
        }),
      ),
      tasks: z.array(
        z.object({
          title: z.string(),
          answers: z.array(
            z.object({
              label: z.enum(["a", "b", "c", "d", "e"]),
              answer: z.string(),
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
