"use client";

import { useState } from "react";
import type { SubTask, Worksheet } from "@/lib/schemas";
import { calculateMaxScore } from "@/lib/schemas";
import type { CEFRLevel } from "@/data/levels";
import {
  getGrammarTopicsForLevel,
  findGrammarTopicById,
} from "@/data/grammarTopics";
import {
  SPACING_OPTIONS,
  type SpacingSize,
  createEmptyReadingText,
  createEmptyTask,
  moveItem,
  recalculateProveScores,
  spacingToCss,
} from "@/lib/worksheetEdit";
import {
  displayedMatchAnswers,
  isMatchTask,
  isOrderNumbering,
  matchLetterForIndex,
  ORDER_NUMBERS,
  normalizeInteractiveTasks,
  shuffledPermutation,
} from "@/lib/taskNormalize";

type Props = {
  worksheet: Worksheet;
  onChange: (worksheet: Worksheet) => void;
  level: CEFRLevel;
  domainId: string;
  grammarTopicIds?: string[];
  onNaturalizeError?: (message: string) => void;
};

function updateWorksheet(
  worksheet: Worksheet,
  updater: (w: Worksheet) => Worksheet,
): Worksheet {
  return recalculateProveScores(updater(worksheet));
}

function SubTaskEditor({
  subTask,
  onChange,
}: {
  subTask: SubTask;
  onChange: (next: SubTask) => void;
}) {
  const lines = subTask.lines ?? 0;
  const isCheckbox = subTask.interaction === "checkbox";
  const isWrite = subTask.interaction === "write" || !subTask.interaction;
  const showOrderNumbers = isOrderNumbering(subTask);

  return (
    <div className="editor-subtask">
      <div className="editor-subtask-head">
        <span className="editor-label">{subTask.label}.</span>
        <input
          className="editor-input"
          aria-label={`Tekst for deloppgave ${subTask.label}`}
          value={subTask.prompt}
          onChange={(e) => onChange({ ...subTask, prompt: e.target.value })}
        />
      </div>

      <div className="editor-subtask-tools" role="group" aria-label="Verktøy for deloppgave">
        <label>
          Type
          <select
            value={subTask.interaction}
            onChange={(e) => {
              const interaction = e.target.value as SubTask["interaction"];
              if (interaction === "checkbox") {
                onChange({
                  ...subTask,
                  interaction,
                  lines: 0,
                  options:
                    subTask.options?.length
                      ? subTask.options
                      : ["Påstand 1", "Påstand 2"],
                });
              } else if (interaction === "write") {
                onChange({
                  ...subTask,
                  interaction,
                  lines: subTask.lines && subTask.lines > 0 ? subTask.lines : 2,
                });
              } else {
                onChange({ ...subTask, interaction });
              }
            }}
          >
            <option value="write">Svarlinjer</option>
            <option value="checkbox">Avkrysning</option>
            <option value="order">Rekkefølge</option>
            <option value="table">Tabell</option>
            <option value="match">Koble sammen</option>
          </select>
        </label>

        {isWrite && (
          <>
            <button
              type="button"
              className="btn-chip"
              onClick={() =>
                onChange({ ...subTask, interaction: "write", lines: lines + 1 })
              }
              disabled={lines >= 8}
            >
              + Svarlinje
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={() =>
                onChange({
                  ...subTask,
                  interaction: "write",
                  lines: Math.max(0, lines - 1),
                })
              }
              disabled={lines <= 0}
            >
              − Svarlinje
            </button>
            <button
              type="button"
              className="btn-chip"
              onClick={() => onChange({ ...subTask, lines: 0 })}
            >
              Fjern alle linjer
            </button>
          </>
        )}

        {isCheckbox && !showOrderNumbers && (
          <button
            type="button"
            className="btn-chip"
            onClick={() =>
              onChange({
                ...subTask,
                interaction: "checkbox",
                options: [...(subTask.options ?? []), "Ny påstand"],
              })
            }
          >
            + Påstand
          </button>
        )}
      </div>

      {isWrite && lines > 0 && (
        <div className="editor-lines" aria-hidden="true">
          {Array.from({ length: lines }).map((_, i) => (
            <div className="write-line" key={i} />
          ))}
        </div>
      )}

      {isCheckbox && !showOrderNumbers && (
        <div className="editor-options">
          {(subTask.options ?? []).map((opt, i) => (
            <div className="editor-option-row" key={i}>
              <span className="checkbox-fake" aria-hidden="true">
                <span />
              </span>
              <input
                className="editor-input"
                value={opt}
                aria-label={`Påstand ${i + 1}`}
                onChange={(e) => {
                  const options = [...(subTask.options ?? [])];
                  options[i] = e.target.value;
                  onChange({ ...subTask, options });
                }}
              />
              <button
                type="button"
                className="btn-chip danger"
                aria-label={`Fjern påstand ${i + 1}`}
                onClick={() => {
                  const options = (subTask.options ?? []).filter(
                    (_, idx) => idx !== i,
                  );
                  onChange({ ...subTask, options });
                }}
              >
                Fjern
              </button>
            </div>
          ))}
        </div>
      )}

      {showOrderNumbers && subTask.interaction === "checkbox" && (
        <div className="order-number-row" aria-label="Velg rekkefølge 1 til 5">
          {ORDER_NUMBERS.map((n) => (
            <span className="order-number-choice" key={n}>
              <span className="checkbox-fake" aria-hidden="true">
                <span />
              </span>
              {n}
            </span>
          ))}
        </div>
      )}

      {subTask.interaction === "order" && (
        <div className="editor-options">
          {(subTask.options ?? ["Hendelse 1", "Hendelse 2"]).map((opt, i) => (
            <div key={i}>
              <div className="editor-option-row">
                <span className="editor-label">{i + 1}.</span>
                <input
                  className="editor-input"
                  value={opt}
                  onChange={(e) => {
                    const options = [...(subTask.options ?? [])];
                    options[i] = e.target.value;
                    onChange({ ...subTask, options });
                  }}
                />
              </div>
              <div className="order-number-row" aria-label={`Rekkefølge for hendelse ${i + 1}`}>
                {ORDER_NUMBERS.map((n) => (
                  <span className="order-number-choice" key={n}>
                    <span className="checkbox-fake" aria-hidden="true">
                      <span />
                    </span>
                    {n}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchTaskEditor({
  task,
  onChange,
}: {
  task: Worksheet["tasks"][number];
  onChange: (next: Worksheet["tasks"][number]) => void;
}) {
  const answers = displayedMatchAnswers(task);
  const fasit = task.subTasks
    .map(
      (st, i) =>
        `${st.label} → ${matchLetterForIndex(task.matchAnswerOrder, i, task.subTasks.length)}`,
    )
    .join(", ");

  return (
    <div className="match-editor">
      <p className="step-help">
        Elevene ser først utsagnene, deretter svarene i blandet rekkefølge. De
        skriver bokstaven (A, B, C …) på linjen. Fasit for læreren: {fasit}.
      </p>
      <div className="match-section">
        <h3 className="match-heading">Utsagn</h3>
        {task.subTasks.map((st, i) => (
          <div className="editor-option-row match-statement" key={st.label}>
            <span className="editor-label">{st.label}.</span>
            <input
              className="editor-input"
              aria-label={`Utsagn ${st.label}`}
              value={st.prompt}
              onChange={(e) => {
                const subTasks = [...task.subTasks];
                subTasks[i] = { ...subTasks[i], prompt: e.target.value };
                onChange({ ...task, subTasks });
              }}
            />
            <span className="match-blank" aria-hidden="true" />
          </div>
        ))}
      </div>
      <div className="match-section">
        <div className="editor-block-toolbar">
          <h3 className="match-heading">Svar (blandet rekkefølge)</h3>
          <button
            type="button"
            className="btn-chip"
            onClick={() =>
              onChange({
                ...task,
                matchAnswerOrder: shuffledPermutation(task.subTasks.length),
              })
            }
          >
            Bland svarene på nytt
          </button>
        </div>
        {answers.map((item) => (
          <div className="editor-option-row" key={`${item.letter}-${item.subTaskIndex}`}>
            <span className="editor-label">{item.letter}.</span>
            <input
              className="editor-input"
              aria-label={`Svar ${item.letter}`}
              value={item.text}
              onChange={(e) => {
                const subTasks = [...task.subTasks];
                subTasks[item.subTaskIndex] = {
                  ...subTasks[item.subTaskIndex],
                  answer: e.target.value,
                };
                onChange({ ...task, subTasks });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorksheetEditor({
  worksheet,
  onChange,
  level,
  domainId,
  grammarTopicIds = [],
  onNaturalizeError,
}: Props) {
  const [naturalizing, setNaturalizing] = useState(false);
  const [replacingKey, setReplacingKey] = useState<string | null>(null);
  const isProve = worksheet.meta.documentKind === "prove";
  const maxScore = calculateMaxScore(worksheet);

  const set = (updater: (w: Worksheet) => Worksheet) => {
    onChange(updateWorksheet(worksheet, updater));
  };

  const replaceItem = async (
    target: "task" | "reading",
    index: number,
  ) => {
    const key = `${target}-${index}`;
    setReplacingKey(key);
    onNaturalizeError?.("");
    try {
      const activeGrammarIds =
        worksheet.meta.grammarTopicIds?.length
          ? worksheet.meta.grammarTopicIds
          : grammarTopicIds;
      const res = await fetch("/api/replace-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worksheet,
          target,
          index,
          level,
          domainId,
          grammarTopicIds: activeGrammarIds,
        }),
      });
      const data = (await res.json()) as {
        worksheet?: Worksheet;
        error?: string;
      };
      if (!res.ok || !data.worksheet) {
        throw new Error(data.error || "Kunne ikke bytte oppgave.");
      }
      onChange(normalizeInteractiveTasks(recalculateProveScores(data.worksheet)));
    } catch (err) {
      onNaturalizeError?.(
        err instanceof Error ? err.message : "Kunne ikke bytte oppgave.",
      );
    } finally {
      setReplacingKey(null);
    }
  };

  const levelGrammarTopics = getGrammarTopicsForLevel(level);
  const activeGrammarIds = worksheet.meta.grammarTopicIds ?? grammarTopicIds;
  const activeGrammarTopics = activeGrammarIds
    .map((id) => findGrammarTopicById(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const addGrammarTopic = (id: string) => {
    if (!id) return;
    if (activeGrammarIds.includes(id) || activeGrammarIds.length >= 3) return;
    const topic = findGrammarTopicById(id);
    if (!topic) return;
    set((w) => ({
      ...w,
      meta: {
        ...w.meta,
        grammarTopicIds: [...activeGrammarIds, id],
        grammarTopics: [...(w.meta.grammarTopics ?? []), topic.title],
      },
    }));
  };

  const removeGrammarTopic = (id: string) => {
    const topic = findGrammarTopicById(id);
    set((w) => ({
      ...w,
      meta: {
        ...w.meta,
        grammarTopicIds: (w.meta.grammarTopicIds ?? []).filter((x) => x !== id),
        grammarTopics: (w.meta.grammarTopics ?? []).filter(
          (title) => title !== topic?.title,
        ),
      },
    }));
  };

  const naturalize = async () => {
    setNaturalizing(true);
    onNaturalizeError?.("");
    try {
      const res = await fetch("/api/naturalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worksheet }),
      });
      const data = (await res.json()) as {
        worksheet?: Worksheet;
        error?: string;
      };
      if (!res.ok || !data.worksheet) {
        throw new Error(data.error || "Kunne ikke forbedre teksten.");
      }
      onChange(recalculateProveScores(data.worksheet));
    } catch (err) {
      onNaturalizeError?.(
        err instanceof Error ? err.message : "Kunne ikke forbedre teksten.",
      );
    } finally {
      setNaturalizing(false);
    }
  };

  return (
    <section className="editor" aria-labelledby="editor-title">
      <div className="editor-toolbar">
        <div>
          <h2 className="step-title" id="editor-title">
            Rediger forhåndsvisning
          </h2>
          <p className="step-help">
            Endre tekst, mellomrom, svarlinjer og rekkefølge før du laster ned
            Word.
          </p>
        </div>
        <div className="editor-toolbar-actions">
          <button
            type="button"
            className="btn btn-ai"
            onClick={naturalize}
            disabled={naturalizing}
          >
            {naturalizing
              ? "Forbedrer språk…"
              : "Gjør språket mer naturlig (KI)"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              set((w) => ({
                ...w,
                tasks: [...w.tasks, createEmptyTask(isProve)],
              }))
            }
          >
            + Ny oppgave
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              set((w) => ({
                ...w,
                readingTexts: [
                  ...w.readingTexts,
                  createEmptyReadingText(isProve),
                ],
              }))
            }
          >
            + Ny lesetekst
          </button>
        </div>
      </div>

      <div className="editor-paper">
        <header className="editor-meta">
          <p className="editor-doc-kind">
            {isProve ? "Prøve" : "Øvingsark"}
          </p>
          <label className="editor-field">
            <span>Tittel</span>
            <input
              className="editor-input title"
              value={worksheet.meta.title}
              onChange={(e) =>
                set((w) => ({
                  ...w,
                  meta: { ...w.meta, title: e.target.value },
                }))
              }
            />
          </label>
          <p>
            {worksheet.meta.level} · {worksheet.meta.domain}
          </p>
          {isProve && (
            <p className="editor-score-note">
              Alle riktige svar gir 1 poeng. Maks poeng: {maxScore}.
            </p>
          )}

          <div className="editor-grammar-panel">
            <details>
              <summary>
                Grammatikkfokus
                {activeGrammarTopics.length > 0
                  ? ` (${activeGrammarTopics.map((g) => g.title).join(", ")})`
                  : ""}
              </summary>
              <p className="step-help">
                Rediger grammatikktemaer for nivå {level}. Brukes ved «Bytt
                oppgave».
              </p>
            <div className="field">
              <label htmlFor="editor-grammar-select">
                Legg til grammatikktema
              </label>
              <select
                id="editor-grammar-select"
                value=""
                disabled={activeGrammarIds.length >= 3}
                onChange={(e) => addGrammarTopic(e.target.value)}
              >
                <option value="">
                  {activeGrammarIds.length >= 3
                    ? "Maks 3 grammatikktemaer"
                    : "Velg et grammatikktema…"}
                </option>
                {levelGrammarTopics
                  .filter((g) => !activeGrammarIds.includes(g.id))
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} — {g.description}
                    </option>
                  ))}
              </select>
            </div>
            {activeGrammarTopics.length > 0 ? (
              <ul className="selected-goals" aria-label="Grammatikk i arket">
                {activeGrammarTopics.map((g) => (
                  <li key={g.id}>
                    <span>
                      <small>grammatikk</small> {g.title}: {g.description}
                    </span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeGrammarTopic(g.id)}
                      aria-label={`Fjern ${g.title}`}
                    >
                      Fjern
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="step-help">
                Ingen grammatikktemaer valgt. Legg til for mer treffsikre
                grammatikkoppgaver.
              </p>
            )}
            </details>
          </div>
        </header>

        {worksheet.readingTexts.map((rt, index) => (
          <article
            key={`reading-${index}`}
            className="editor-block"
            style={{ marginBottom: spacingToCss(rt.spacingAfter) }}
          >
            <div className="editor-block-toolbar">
              <strong>Lesetekst {index + 1}</strong>
              <div className="editor-block-actions">
                <label>
                  Mellomrom
                  <select
                    value={rt.spacingAfter ?? "normal"}
                    onChange={(e) =>
                      set((w) => {
                        const readingTexts = [...w.readingTexts];
                        readingTexts[index] = {
                          ...readingTexts[index],
                          spacingAfter: e.target.value as SpacingSize,
                        };
                        return { ...w, readingTexts };
                      })
                    }
                  >
                    {SPACING_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="btn-chip"
                  disabled={replacingKey === `reading-${index}`}
                  onClick={() => replaceItem("reading", index)}
                >
                  {replacingKey === `reading-${index}`
                    ? "Bytter…"
                    : "Bytt oppgave"}
                </button>
                <button
                  type="button"
                  className="btn-chip"
                  disabled={index === 0}
                  onClick={() =>
                    set((w) => ({
                      ...w,
                      readingTexts: moveItem(w.readingTexts, index, index - 1),
                    }))
                  }
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-chip"
                  disabled={index === worksheet.readingTexts.length - 1}
                  onClick={() =>
                    set((w) => ({
                      ...w,
                      readingTexts: moveItem(w.readingTexts, index, index + 1),
                    }))
                  }
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn-chip danger"
                  onClick={() =>
                    set((w) => ({
                      ...w,
                      readingTexts: w.readingTexts.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Fjern
                </button>
              </div>
            </div>

            <label className="editor-field">
              <span>Overskrift</span>
              <input
                className="editor-input"
                value={rt.title}
                onChange={(e) =>
                  set((w) => {
                    const readingTexts = [...w.readingTexts];
                    readingTexts[index] = {
                      ...readingTexts[index],
                      title: e.target.value,
                    };
                    return { ...w, readingTexts };
                  })
                }
              />
            </label>
            <label className="editor-field">
              <span>Instruks</span>
              <input
                className="editor-input"
                value={rt.instruction}
                onChange={(e) =>
                  set((w) => {
                    const readingTexts = [...w.readingTexts];
                    readingTexts[index] = {
                      ...readingTexts[index],
                      instruction: e.target.value,
                    };
                    return { ...w, readingTexts };
                  })
                }
              />
            </label>
            <label className="editor-field">
              <span>Lesetekst</span>
              <textarea
                className="editor-textarea"
                rows={5}
                value={rt.text}
                onChange={(e) =>
                  set((w) => {
                    const readingTexts = [...w.readingTexts];
                    readingTexts[index] = {
                      ...readingTexts[index],
                      text: e.target.value,
                    };
                    return { ...w, readingTexts };
                  })
                }
              />
            </label>

            {rt.subTasks.map((st, stIndex) => (
              <SubTaskEditor
                key={st.label + stIndex}
                subTask={st}
                onChange={(next) =>
                  set((w) => {
                    const readingTexts = [...w.readingTexts];
                    const subTasks = [...readingTexts[index].subTasks];
                    subTasks[stIndex] = next;
                    readingTexts[index] = { ...readingTexts[index], subTasks };
                    return { ...w, readingTexts };
                  })
                }
              />
            ))}
          </article>
        ))}

        {worksheet.tasks.map((task, index) => (
          <article
            key={`task-${index}`}
            className="editor-block"
            style={{ marginBottom: spacingToCss(task.spacingAfter) }}
          >
            <div className="editor-block-toolbar">
              <strong>
                Oppgave {index + 1}
              </strong>
              <div className="editor-block-actions">
                <label>
                  Mellomrom
                  <select
                    value={task.spacingAfter ?? "normal"}
                    onChange={(e) =>
                      set((w) => {
                        const tasks = [...w.tasks];
                        tasks[index] = {
                          ...tasks[index],
                          spacingAfter: e.target.value as SpacingSize,
                        };
                        return { ...w, tasks };
                      })
                    }
                  >
                    {SPACING_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="btn-chip"
                  disabled={replacingKey === `task-${index}`}
                  onClick={() => replaceItem("task", index)}
                >
                  {replacingKey === `task-${index}`
                    ? "Bytter…"
                    : "Bytt oppgave"}
                </button>
                <button
                  type="button"
                  className="btn-chip"
                  disabled={index === 0}
                  onClick={() =>
                    set((w) => ({
                      ...w,
                      tasks: moveItem(w.tasks, index, index - 1),
                    }))
                  }
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-chip"
                  disabled={index === worksheet.tasks.length - 1}
                  onClick={() =>
                    set((w) => ({
                      ...w,
                      tasks: moveItem(w.tasks, index, index + 1),
                    }))
                  }
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn-chip danger"
                  onClick={() =>
                    set((w) => ({
                      ...w,
                      tasks: w.tasks.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Fjern
                </button>
              </div>
            </div>

            <label className="editor-field">
              <span>Overskrift</span>
              <input
                className="editor-input"
                value={task.title}
                onChange={(e) =>
                  set((w) => {
                    const tasks = [...w.tasks];
                    tasks[index] = { ...tasks[index], title: e.target.value };
                    return { ...w, tasks };
                  })
                }
              />
            </label>
            <label className="editor-field">
              <span>Instruks</span>
              <input
                className="editor-input"
                value={task.instruction}
                onChange={(e) =>
                  set((w) => {
                    const tasks = [...w.tasks];
                    tasks[index] = {
                      ...tasks[index],
                      instruction: e.target.value,
                    };
                    return { ...w, tasks };
                  })
                }
              />
            </label>
            <label className="editor-field">
              <span>Intro / kontekst (valgfritt)</span>
              <textarea
                className="editor-textarea"
                rows={3}
                value={task.intro ?? ""}
                onChange={(e) =>
                  set((w) => {
                    const tasks = [...w.tasks];
                    tasks[index] = { ...tasks[index], intro: e.target.value };
                    return { ...w, tasks };
                  })
                }
              />
            </label>

            {isMatchTask(task) ? (
              <MatchTaskEditor
                task={task}
                onChange={(next) =>
                  set((w) => {
                    const tasks = [...w.tasks];
                    tasks[index] = next;
                    return { ...w, tasks };
                  })
                }
              />
            ) : (
              task.subTasks.map((st, stIndex) => (
                <SubTaskEditor
                  key={st.label + stIndex}
                  subTask={st}
                  onChange={(next) =>
                    set((w) => {
                      const tasks = [...w.tasks];
                      const subTasks = [...tasks[index].subTasks];
                      subTasks[stIndex] = next;
                      tasks[index] = { ...tasks[index], subTasks };
                      return { ...w, tasks };
                    })
                  }
                />
              ))
            )}
          </article>
        ))}

        {worksheet.readingTexts.length === 0 && worksheet.tasks.length === 0 && (
          <p className="step-help">
            Ingen oppgaver igjen. Legg til en ny oppgave eller lesetekst.
          </p>
        )}
      </div>
    </section>
  );
}
