import type { SubTask, Worksheet } from "@/lib/schemas";

export type SpacingSize = "compact" | "normal" | "loose" | "xlarge";

export const SPACING_OPTIONS: { id: SpacingSize; label: string; rem: number }[] =
  [
    { id: "compact", label: "Kompakt", rem: 0.75 },
    { id: "normal", label: "Normal", rem: 1.5 },
    { id: "loose", label: "Luftig", rem: 2.5 },
    { id: "xlarge", label: "Ekstra stor", rem: 4 },
  ];

export function spacingToTwip(spacing: SpacingSize | undefined): number {
  switch (spacing) {
    case "compact":
      return 120;
    case "loose":
      return 480;
    case "xlarge":
      return 720;
    case "normal":
    default:
      return 280;
  }
}

export function spacingToCss(spacing: SpacingSize | undefined): string {
  const found = SPACING_OPTIONS.find((s) => s.id === (spacing ?? "normal"));
  return `${found?.rem ?? 1.5}rem`;
}

const LABELS = ["a", "b", "c", "d", "e"] as const;

export function createEmptySubTasks(points = false): SubTask[] {
  return LABELS.map((label) => ({
    label,
    prompt: `Ny deloppgave ${label}.`,
    interaction: "write" as const,
    lines: 2,
    ...(points ? { points: 1 as const } : {}),
  }));
}

export function createEmptyTask(
  isProve: boolean,
): Worksheet["tasks"][number] {
  return {
    title: "Ny oppgave",
    typeId: "skriveoppgave",
    instruction: "Skriv svarene under.",
    intro: "",
    spacingAfter: "normal",
    points: isProve ? 5 : undefined,
    subTasks: createEmptySubTasks(isProve),
  };
}

export function createEmptyReadingText(
  isProve: boolean,
): Worksheet["readingTexts"][number] {
  return {
    title: "Ny lesetekst",
    text: "Skriv inn leseteksten her.",
    instruction: isProve
      ? "Les teksten. Svar på spørsmålene. Hver riktig besvarelse gir 1 poeng."
      : "Les teksten. Svar på spørsmålene.",
    spacingAfter: "normal",
    subTasks: createEmptySubTasks(isProve),
  };
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function recalculateProveScores(worksheet: Worksheet): Worksheet {
  if (worksheet.meta.documentKind !== "prove") return worksheet;
  const maxScore =
    worksheet.readingTexts.reduce((s, rt) => s + rt.subTasks.length, 0) +
    worksheet.tasks.reduce((s, t) => s + t.subTasks.length, 0);

  return {
    ...worksheet,
    meta: {
      ...worksheet.meta,
      pointsPerAnswer: 1,
      maxScore,
    },
    readingTexts: worksheet.readingTexts.map((rt) => ({
      ...rt,
      subTasks: rt.subTasks.map((st) => ({ ...st, points: 1 })),
    })),
    tasks: worksheet.tasks.map((task) => ({
      ...task,
      points: task.subTasks.length,
      subTasks: task.subTasks.map((st) => ({ ...st, points: 1 })),
    })),
  };
}
