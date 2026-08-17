import type { SubTask, Worksheet } from "@/lib/schemas";

const LABELS = ["a", "b", "c", "d", "e"] as const;
export const ORDER_NUMBERS = ["1", "2", "3", "4", "5"] as const;
export const MATCH_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

export function isOrderNumbering(subTask: SubTask): boolean {
  if (subTask.interaction === "order") return true;
  const options = subTask.options ?? [];
  return (
    subTask.interaction === "checkbox" &&
    options.length >= 2 &&
    options.every((opt) => /^[1-5]$/.test(opt.trim()))
  );
}

export function shuffleCopy<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Permutasjon som ikke er identitet når length >= 2. */
export function shuffledPermutation(length: number): number[] {
  const ids = Array.from({ length }, (_, i) => i);
  if (length < 2) return ids;
  let perm = shuffleCopy(ids);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!perm.every((value, index) => value === index)) return perm;
    perm = shuffleCopy(ids);
  }
  [perm[0], perm[1]] = [perm[1], perm[0]];
  return perm;
}

export function isMatchTask(task: {
  typeId: string;
  subTasks: SubTask[];
}): boolean {
  return (
    task.typeId === "koble-sammen" ||
    (task.subTasks.length > 0 &&
      task.subTasks.every((st) => st.interaction === "match"))
  );
}

export function matchLetterForIndex(
  matchAnswerOrder: number[] | undefined,
  subTaskIndex: number,
  count: number,
): string {
  const order =
    matchAnswerOrder?.length === count
      ? matchAnswerOrder
      : Array.from({ length: count }, (_, i) => i);
  const letterIndex = order.indexOf(subTaskIndex);
  if (letterIndex < 0) return MATCH_LETTERS[subTaskIndex] ?? String(subTaskIndex + 1);
  return MATCH_LETTERS[letterIndex] ?? String(letterIndex + 1);
}

export function displayedMatchAnswers(task: Worksheet["tasks"][number]): {
  letter: string;
  text: string;
  subTaskIndex: number;
}[] {
  const n = task.subTasks.length;
  const order =
    task.matchAnswerOrder?.length === n
      ? task.matchAnswerOrder
      : Array.from({ length: n }, (_, i) => i);
  return order.map((subTaskIndex, i) => ({
    letter: MATCH_LETTERS[i] ?? String(i + 1),
    text: task.subTasks[subTaskIndex]?.answer ?? "",
    subTaskIndex,
  }));
}

export function formatMatchAnswer(
  task: Worksheet["tasks"][number],
  subTask: SubTask,
  index: number,
): string {
  const letter = matchLetterForIndex(
    task.matchAnswerOrder,
    index,
    task.subTasks.length,
  );
  const text = subTask.answer?.trim();
  return text ? `${letter} – ${text}` : letter;
}

function parseOrderNumbers(
  answer: string | undefined,
  count: number,
): number[] | null {
  if (!answer) return null;
  const nums = answer
    .match(/\d+/g)
    ?.map(Number)
    .filter((n) => n >= 1 && n <= count);
  if (!nums?.length) return null;
  if (nums.length === count || nums.length === 1) return nums;
  return null;
}

function isIdentityOrder(nums: number[]): boolean {
  return nums.every((n, i) => n === i + 1);
}

export function stripAnswerParenthetical(prompt: string): {
  prompt: string;
  extracted?: string;
} {
  const trimmed = prompt.trim();
  const match = trimmed.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (!match) return { prompt: trimmed };
  return { prompt: match[1].trim(), extracted: match[2].trim() };
}

function shuffleOrderSubTask(subTask: SubTask): SubTask {
  const options = subTask.options ?? [];
  if (options.length < 2) return subTask;

  const oldOptions = [...options];
  const count = oldOptions.length;
  const oldNums = parseOrderNumbers(subTask.answer, count) ?? oldOptions.map((_, i) => i + 1);

  if (!isIdentityOrder(oldNums)) {
    return subTask;
  }

  const perm = shuffledPermutation(count);
  const newOptions = perm.map((oldIndex) => oldOptions[oldIndex]);
  const answer = oldOptions
    .map((item) => newOptions.indexOf(item) + 1)
    .join("–");

  return { ...subTask, options: newOptions, answer };
}

function looksLikeChronologicalEvents(task: Worksheet["tasks"][number]): boolean {
  if (task.typeId !== "rekkefolge") return false;
  if (
    task.subTasks.some(
      (st) => st.interaction === "order" && (st.options?.length ?? 0) >= 2,
    )
  ) {
    return false;
  }

  const numbers = task.subTasks.map((st) => {
    const parsed = parseOrderNumbers(st.answer, task.subTasks.length);
    return parsed?.[0] ?? null;
  });
  const sequential = numbers.every((n, i) => n === i + 1);
  const allMissing = numbers.every((n) => n === null);
  return sequential || allMissing;
}

function shuffleRekkefolgeSubtasks(
  task: Worksheet["tasks"][number],
): Worksheet["tasks"][number] {
  const n = task.subTasks.length;
  const perm = shuffledPermutation(n);
  const subTasks = perm.map((oldIndex, newIndex) => {
    const st = task.subTasks[oldIndex];
    const stripped = stripAnswerParenthetical(st.prompt);
    const chronologicalNumber =
      parseOrderNumbers(st.answer, n)?.[0] ?? oldIndex + 1;
    return {
      ...st,
      label: LABELS[newIndex] ?? st.label,
      interaction: "checkbox" as const,
      options: [...ORDER_NUMBERS],
      lines: 0,
      prompt: stripped.prompt,
      answer: String(chronologicalNumber),
    };
  });

  return {
    ...task,
    instruction: /kryss|tallet|rekkefølge/i.test(task.instruction)
      ? task.instruction
      : "Les setningene. De står i tilfeldig rekkefølge. Kryss av tallet 1–5 for når det skjer (1 = først).",
    subTasks,
  };
}

function convertRekkefolgeToNumberCheckboxes(
  task: Worksheet["tasks"][number],
): Worksheet["tasks"][number] {
  return {
    ...task,
    instruction: /kryss|tallet|rekkefølge/i.test(task.instruction)
      ? task.instruction
      : "Les setningene. De står i tilfeldig rekkefølge. Kryss av tallet 1–5 for når det skjer (1 = først).",
    subTasks: task.subTasks.map((st) => ({
      ...st,
      interaction: "checkbox" as const,
      options: [...ORDER_NUMBERS],
      lines: 0,
      prompt: stripAnswerParenthetical(st.prompt).prompt,
      answer: String(
        parseOrderNumbers(st.answer, task.subTasks.length)?.[0] ??
          st.answer ??
          "",
      ),
    })),
  };
}

function normalizeOrderTask(
  task: Worksheet["tasks"][number],
): Worksheet["tasks"][number] {
  const orderWithOptions = task.subTasks.find(
    (st) => st.interaction === "order" && (st.options?.length ?? 0) >= 2,
  );

  if (task.typeId === "rekkefolge" && orderWithOptions?.options?.length) {
    const options = orderWithOptions.options;
    const nums =
      parseOrderNumbers(orderWithOptions.answer, options.length) ??
      options.map((_, i) => i + 1);
    const items = options.map((prompt, i) => ({
      prompt: stripAnswerParenthetical(prompt).prompt,
      answer: nums[i] ?? i + 1,
    }));
    const exploded: Worksheet["tasks"][number] = {
      ...task,
      subTasks: items.map((item, i) => ({
        label: LABELS[i] ?? String(i + 1),
        prompt: item.prompt,
        interaction: "checkbox" as const,
        options: [...ORDER_NUMBERS],
        lines: 0,
        answer: String(item.answer),
      })),
    };
    if (looksLikeChronologicalEvents(exploded)) {
      return shuffleRekkefolgeSubtasks(exploded);
    }
    return convertRekkefolgeToNumberCheckboxes(exploded);
  }

  let next: Worksheet["tasks"][number] = {
    ...task,
    subTasks: task.subTasks.map((st) =>
      st.interaction === "order" && (st.options?.length ?? 0) >= 2
        ? shuffleOrderSubTask(st)
        : st,
    ),
  };
  if (task.typeId !== "rekkefolge") {
    return next;
  }
  if (looksLikeChronologicalEvents(next)) {
    return shuffleRekkefolgeSubtasks(next);
  }
  return convertRekkefolgeToNumberCheckboxes(next);
}

function normalizeMatchTask(
  task: Worksheet["tasks"][number],
): Worksheet["tasks"][number] {
  const subTasks = task.subTasks.map((st) => {
    const stripped = stripAnswerParenthetical(st.prompt);
    let prompt = stripped.prompt;
    const answer = (st.answer?.trim() || stripped.extracted || "").trim();

    if (answer && prompt.includes(`(${answer})`)) {
      prompt = prompt.replace(`(${answer})`, "").replace(/\s{2,}/g, " ").trim();
    }

    return {
      ...st,
      interaction: "match" as const,
      prompt,
      answer,
      lines: 1,
      options: undefined,
      tableHeaders: undefined,
      tableRows: undefined,
    };
  });

  const n = subTasks.length;
  const order = task.matchAnswerOrder;
  const valid =
    Array.isArray(order) &&
    order.length === n &&
    new Set(order).size === n &&
    order.every((i) => i >= 0 && i < n);
  const identity = Boolean(valid && order?.every((value, index) => value === index));

  const instruction = /bokstav/i.test(task.instruction)
    ? task.instruction
    : "Les utsagnene. Finn svaret som passer. Skriv bokstaven (A, B, C …) på linjen ved utsagnet.";

  return {
    ...task,
    typeId: "koble-sammen",
    instruction,
    subTasks,
    matchAnswerOrder: !valid || identity ? shuffledPermutation(n) : order,
  };
}

export function formatTaskAnswer(
  task: Worksheet["tasks"][number],
  subTask: SubTask,
  index: number,
): string {
  if (isMatchTask(task)) {
    return formatMatchAnswer(task, subTask, index);
  }
  return subTask.answer?.trim() ?? "";
}

export function refreshAnswerKey(worksheet: Worksheet): Worksheet {
  if (!worksheet.answerKey) return worksheet;
  return {
    ...worksheet,
    answerKey: {
      readingTexts: worksheet.readingTexts.map((rt) => ({
        title: rt.title,
        answers: rt.subTasks.map((st) => ({
          label: st.label,
          answer: st.answer ?? "",
        })),
      })),
      tasks: worksheet.tasks.map((task) => ({
        title: task.title,
        answers: task.subTasks.map((st, j) => ({
          label: st.label,
          answer: formatTaskAnswer(task, st, j),
        })),
      })),
    },
  };
}

export function normalizeInteractiveTasks(worksheet: Worksheet): Worksheet {
  const tasks = worksheet.tasks.map((task) => {
    let next = task;
    if (isMatchTask(next)) {
      next = normalizeMatchTask(next);
    }
    if (
      next.typeId === "rekkefolge" ||
      next.subTasks.some((st) => st.interaction === "order")
    ) {
      next = normalizeOrderTask(next);
    }
    return next;
  });

  const readingTexts = worksheet.readingTexts.map((rt) => ({
    ...rt,
    subTasks: rt.subTasks.map((st) =>
      st.interaction === "order" && (st.options?.length ?? 0) >= 2
        ? shuffleOrderSubTask(st)
        : st,
    ),
  }));

  return refreshAnswerKey({ ...worksheet, tasks, readingTexts });
}
