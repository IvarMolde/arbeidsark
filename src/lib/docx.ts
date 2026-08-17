import {
  AlignmentType,
  BorderStyle,
  CheckBox,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import {
  calculateMaxScore,
  type SubTask,
  type Worksheet,
} from "@/lib/schemas";
import { spacingToTwip } from "@/lib/worksheetEdit";
import {
  displayedMatchAnswers,
  isMatchTask,
  isOrderNumbering,
  ORDER_NUMBERS,
} from "@/lib/taskNormalize";

const FONT = "Arial";

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: 28, // 14 pt
        bold: true,
      }),
    ],
  });
}

function subHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: 28,
        bold: true,
      }),
    ],
  });
}

function body(text: string, bold = false): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: 24, // 12 pt
        bold,
      }),
    ],
  });
}

function boldInstruction(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: 24,
        bold: true,
      }),
    ],
  });
}

function writingLines(count: number): Paragraph[] {
  return Array.from({ length: count }, () =>
    new Paragraph({
      spacing: { after: 60 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "666666", space: 8 },
      },
      children: [new TextRun({ text: " ", font: FONT, size: 24 })],
    }),
  );
}

function orderNumberParagraph(): Paragraph {
  const children: (CheckBox | TextRun)[] = [];
  for (const n of ORDER_NUMBERS) {
    children.push(new CheckBox({ checked: false }));
    children.push(
      new TextRun({ text: ` ${n}    `, font: FONT, size: 24 }),
    );
  }
  return new Paragraph({
    spacing: { before: 40, after: 80 },
    children,
  });
}

function checkboxParagraph(label: string, optionText: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new CheckBox({ checked: false }),
      new TextRun({ text: `  ${label} ${optionText}`, font: FONT, size: 24 }),
    ],
  });
}

function subTaskBlocks(subTask: SubTask): (Paragraph | Table)[] {
  const labelPrefix = `${subTask.label}.`;
  const blocks: (Paragraph | Table)[] = [
    new Paragraph({
      spacing: { before: 100, after: 60 },
      children: [
        new TextRun({
          text: `${labelPrefix} ${subTask.prompt}`,
          font: FONT,
          size: 24,
          bold: true,
        }),
      ],
    }),
  ];

  if (isOrderNumbering(subTask) && subTask.interaction === "checkbox") {
    blocks.push(orderNumberParagraph());
  } else if (subTask.interaction === "checkbox" && subTask.options?.length) {
    for (const option of subTask.options) {
      blocks.push(checkboxParagraph("", option));
    }
  } else if (subTask.interaction === "order" && subTask.options?.length) {
    for (const option of subTask.options) {
      blocks.push(body(option));
      blocks.push(orderNumberParagraph());
    }
  } else if (subTask.interaction === "table") {
    const headers = subTask.tableHeaders?.length
      ? subTask.tableHeaders
      : ["Ord", "Betydning / svar"];
    const rows = subTask.tableRows ?? 3;
    const tableRows = [
      new TableRow({
        children: headers.map(
          (h) =>
            new TableCell({
              width: { size: Math.floor(9000 / headers.length), type: WidthType.DXA },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: h, font: FONT, size: 24, bold: true }),
                  ],
                }),
              ],
            }),
        ),
      }),
      ...Array.from({ length: rows }, () =>
        new TableRow({
          children: headers.map(
            () =>
              new TableCell({
                width: {
                  size: Math.floor(9000 / headers.length),
                  type: WidthType.DXA,
                },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: " ", font: FONT, size: 24 })],
                  }),
                ],
              }),
          ),
        }),
      ),
    ];
    blocks.push(
      new Table({
        width: { size: 9000, type: WidthType.DXA },
        rows: tableRows,
      }),
    );
  } else if (subTask.interaction === "write" || !subTask.interaction) {
    const lineCount = subTask.lines ?? 2;
    if (lineCount > 0) {
      blocks.push(...writingLines(lineCount));
    }
  }

  return blocks;
}

function matchTaskBlocks(
  task: Worksheet["tasks"][number],
): (Paragraph | Table)[] {
  const blocks: (Paragraph | Table)[] = [
    body("Utsagn:", true),
  ];

  for (const st of task.subTasks) {
    blocks.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({
            text: `${st.label}. ${st.prompt}`,
            font: FONT,
            size: 24,
          }),
        ],
      }),
    );
    blocks.push(...writingLines(1));
  }

  blocks.push(body(" "));
  blocks.push(body("Svar:", true));
  for (const item of displayedMatchAnswers(task)) {
    blocks.push(body(`${item.letter}. ${item.text}`));
  }
  return blocks;
}

function pageBreak(): Paragraph {
  return new Paragraph({
    children: [],
    pageBreakBefore: true,
  });
}

export async function buildWorksheetDocx(worksheet: Worksheet): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];
  const isProve = worksheet.meta.documentKind === "prove";
  const maxScore = calculateMaxScore(worksheet);
  const docLabel = isProve ? "Prøve" : "Arbeidsark";

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: docLabel,
          font: FONT,
          size: 28,
          bold: true,
        }),
      ],
    }),
  );

  children.push(heading(worksheet.meta.title));
  children.push(body(`Nivå: ${worksheet.meta.level}`));
  children.push(body(`Tema: ${worksheet.meta.domain}`));
  children.push(body("Navn: ________________________________"));
  children.push(body("Dato: ________________________________"));
  if (isProve) {
    children.push(
      body(
        "Alle riktige svar gir 1 poeng.",
        true,
      ),
    );
    children.push(body(`Maks poeng: ${maxScore}`));
    children.push(body(`Poeng sum: ________ / ${maxScore}`));
  }
  children.push(body(" "));
  children.push(body("Kompetansemål:", true));
  for (const goal of worksheet.meta.kompetansemal) {
    children.push(body(`• ${goal}`));
  }

  worksheet.readingTexts.forEach((rt, index) => {
    children.push(subHeading(`Lesetekst ${index + 1}: ${rt.title}`));
    children.push(boldInstruction(rt.instruction));
    for (const paragraph of rt.text.split(/\n+/)) {
      if (paragraph.trim()) children.push(body(paragraph.trim()));
    }
    children.push(body(" "));
    children.push(body("Oppgaver:", true));
    for (const st of rt.subTasks) {
      children.push(...subTaskBlocks(st));
    }
    children.push(
      new Paragraph({
        spacing: { after: spacingToTwip(rt.spacingAfter) },
        children: [],
      }),
    );
  });

  worksheet.tasks.forEach((task, index) => {
    children.push(subHeading(`Oppgave ${index + 1}: ${task.title}`));
    children.push(boldInstruction(task.instruction));
    if (task.intro) {
      for (const paragraph of task.intro.split(/\n+/)) {
        if (paragraph.trim()) children.push(body(paragraph.trim()));
      }
    }
    if (isMatchTask(task)) {
      children.push(...matchTaskBlocks(task));
    } else {
      for (const st of task.subTasks) {
        children.push(...subTaskBlocks(st));
      }
    }
    children.push(
      new Paragraph({
        spacing: { after: spacingToTwip(task.spacingAfter) },
        children: [],
      }),
    );
  });

  if (worksheet.answerKey) {
    children.push(pageBreak());
    children.push(heading("Fasit"));
    children.push(
      body("Til læreren – kan fjernes før utdeling til elevene.", true),
    );
    if (isProve) {
      children.push(body(`Maks poeng: ${maxScore}`));
    }

    worksheet.answerKey.readingTexts.forEach((rt) => {
      children.push(subHeading(`Lesetekst: ${rt.title}`));
      for (const a of rt.answers) {
        children.push(body(`${a.label}. ${a.answer}`));
      }
    });

    worksheet.answerKey.tasks.forEach((task) => {
      children.push(subHeading(`Oppgave: ${task.title}`));
      for (const a of task.answers) {
        children.push(body(`${a.label}. ${a.answer}`));
      }
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134,
              right: 1134,
              bottom: 1134,
              left: 1134,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
