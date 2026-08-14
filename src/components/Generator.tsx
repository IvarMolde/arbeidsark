"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { LEVELS, type CEFRLevel } from "@/data/levels";
import { DOMAINS } from "@/data/domains";
import { TASK_TYPES, type TaskTypeId } from "@/data/taskTypes";
import { getKompetansemalForLevel } from "@/data/kompetansemal";
import { getGrammarTopicsForLevel } from "@/data/grammarTopics";
import type { Worksheet } from "@/lib/schemas";
import { buildWorksheetDocx, downloadBlob } from "@/lib/docx";
import { normalizeInteractiveTasks } from "@/lib/taskNormalize";
import WorksheetEditor from "@/components/WorksheetEditor";

type DocumentKind = "ovingsark" | "prove";

function LevelCarousel({
  level,
  onChange,
}: {
  level: CEFRLevel;
  onChange: (level: CEFRLevel) => void;
}) {
  const index = LEVELS.findIndex((l) => l.id === level);
  const current = LEVELS[index];

  const go = (delta: number) => {
    const next = (index + delta + LEVELS.length) % LEVELS.length;
    onChange(LEVELS[next].id);
  };

  return (
    <div className="carousel" role="group" aria-label="Velg norsknivå">
      <button
        type="button"
        className="carousel-nav"
        aria-label="Forrige nivå"
        onClick={() => go(-1)}
      >
        ‹
      </button>
      <div className="carousel-stage" aria-live="polite">
        <p className="carousel-level">{current.label}</p>
        <p className="carousel-desc">{current.description}</p>
        <div className="level-dots">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              className="level-dot"
              aria-label={`Velg nivå ${l.id}`}
              aria-current={l.id === level ? "true" : undefined}
              onClick={() => onChange(l.id)}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        className="carousel-nav"
        aria-label="Neste nivå"
        onClick={() => go(1)}
      >
        ›
      </button>
    </div>
  );
}

export default function Generator() {
  const [documentKind, setDocumentKind] = useState<DocumentKind>("ovingsark");
  const [level, setLevel] = useState<CEFRLevel>("A1");
  const [domainId, setDomainId] = useState(DOMAINS[0].id);
  const [taskTypeIds, setTaskTypeIds] = useState<TaskTypeId[]>([
    "lesetekst",
    "manglende-ord",
  ]);
  const [kompetansemalIds, setKompetansemalIds] = useState<string[]>([]);
  const [grammarTopicIds, setGrammarTopicIds] = useState<string[]>([]);
  const [readingTextCount, setReadingTextCount] = useState(1);
  const [taskCount, setTaskCount] = useState(4);
  const [proveTaskCount, setProveTaskCount] = useState(6);
  const [proveReadingCount, setProveReadingCount] = useState(1);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [showResult, setShowResult] = useState(false);

  const isProve = documentKind === "prove";
  const goals = useMemo(() => getKompetansemalForLevel(level), [level]);
  const grammarTopics = useMemo(
    () => getGrammarTopicsForLevel(level),
    [level],
  );
  const domain = DOMAINS.find((d) => d.id === domainId);
  const selectedTypes = TASK_TYPES.filter((t) => taskTypeIds.includes(t.id));
  const selectedGoals = goals.filter((g) => kompetansemalIds.includes(g.id));
  const selectedGrammar = grammarTopics.filter((g) =>
    grammarTopicIds.includes(g.id),
  );

  const proveMaxScore = proveTaskCount * 5;

  const canGenerate = isProve
    ? kompetansemalIds.length >= 1 &&
      kompetansemalIds.length <= 3 &&
      proveTaskCount >= 1 &&
      !loading
    : taskTypeIds.length > 0 &&
      kompetansemalIds.length >= 1 &&
      kompetansemalIds.length <= 3 &&
      readingTextCount + taskCount >= 1 &&
      !loading;

  const onLevelChange = (next: CEFRLevel) => {
    setLevel(next);
    setKompetansemalIds([]);
    setGrammarTopicIds([]);
    setWorksheet(null);
    setShowResult(false);
  };

  const toggleTaskType = (id: TaskTypeId) => {
    setTaskTypeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleGoal = (id: string) => {
    setKompetansemalIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const toggleGrammar = (id: string) => {
    setGrammarTopicIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    setWorksheet(null);
    try {
      const payload = isProve
        ? {
            documentKind: "prove" as const,
            level,
            domainId,
            taskTypeIds: [],
            kompetansemalIds,
            grammarTopicIds,
            readingTextCount: Math.min(proveReadingCount, proveTaskCount),
            taskCount: proveTaskCount,
            includeAnswerKey,
            title: title.trim() || undefined,
          }
        : {
            documentKind: "ovingsark" as const,
            level,
            domainId,
            taskTypeIds,
            kompetansemalIds,
            grammarTopicIds,
            readingTextCount,
            taskCount,
            includeAnswerKey,
            title: title.trim() || undefined,
          };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        worksheet?: Worksheet;
        error?: string;
      };
      if (!res.ok || !data.worksheet) {
        throw new Error(data.error || "Generering feilet.");
      }
      setWorksheet(normalizeInteractiveTasks(data.worksheet));
      setShowResult(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Noe gikk galt. Prøv igjen.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!worksheet) return;
    const blob = await buildWorksheetDocx(worksheet);
    const prefix =
      worksheet.meta.documentKind === "prove" ? "prove" : "arbeidsark";
    const safeName = worksheet.meta.title
      .toLowerCase()
      .replace(/[^a-z0-9æøå]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    downloadBlob(blob, `${prefix}-${safeName || "norsk"}.docx`);
  };

  useLayoutEffect(() => {
    if (!showResult) {
      document.body.classList.remove("result-open");
      return;
    }
    document.body.classList.add("result-open");
    window.scrollTo(0, 0);
    document.getElementById("result-title")?.focus();
    return () => document.body.classList.remove("result-open");
  }, [showResult]);

  return (
    <>
      {loading && (
        <div className="generate-overlay" role="status" aria-live="polite">
          <p className="generate-overlay-title">Lager arbeidsarket</p>
          <p>Dette kan ta litt tid. Arket vises øverst på siden når det er klart.</p>
        </div>
      )}
      {showResult && worksheet ? (
        <div className="result-layout">
          <div className="result-bar panel">
            <div>
              <h2 className="step-title" id="result-title" tabIndex={-1}>
                {isProve ? "Rediger prøven" : "Rediger arbeidsarket"}
              </h2>
              <p className="step-help">
                Arket vises øverst. Gjør endringer her, og last ned Word når det
                ser riktig ut.
              </p>
            </div>
            <div className="result-bar-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowResult(false);
                  window.scrollTo({ top: 0, behavior: "auto" });
                }}
              >
                Tilbake til valgene
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownload}
              >
                Last ned Word (.docx)
              </button>
            </div>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="panel editor-panel">
            <WorksheetEditor
              worksheet={worksheet}
              onChange={setWorksheet}
              level={level}
              domainId={domainId}
              grammarTopicIds={grammarTopicIds}
              onNaturalizeError={(message) => {
                if (message) setError(message);
                else setError(null);
              }}
            />
          </div>
        </div>
      ) : (
      <div className="layout">
        <div>
          <section className="panel" aria-labelledby="step-kind">
            <h2 className="step-title" id="step-kind">
              1. Hva vil du lage?
            </h2>
            <p className="step-help">
              Velg øvingsark eller prøve for samme nivå, tema og kompetansemål.
            </p>
            <div
              className="mode-toggle"
              role="radiogroup"
              aria-label="Dokumenttype"
            >
              <label className={`mode-choice${documentKind === "ovingsark" ? " active" : ""}`}>
                <input
                  type="radio"
                  name="documentKind"
                  checked={documentKind === "ovingsark"}
                  onChange={() => {
                    setDocumentKind("ovingsark");
                    setWorksheet(null);
                    setShowResult(false);
                  }}
                />
                <span>
                  <strong>Øvingsark</strong>
                  <span>Trening med valgte oppgavetyper</span>
                </span>
              </label>
              <label className={`mode-choice${documentKind === "prove" ? " active" : ""}`}>
                <input
                  type="radio"
                  name="documentKind"
                  checked={documentKind === "prove"}
                  onChange={() => {
                    setDocumentKind("prove");
                    setWorksheet(null);
                    setShowResult(false);
                  }}
                />
                <span>
                  <strong>Prøve</strong>
                  <span>Automatisk varierte oppgaver med poeng</span>
                </span>
              </label>
            </div>
          </section>

          <section className="panel" aria-labelledby="step-level">
            <h2 className="step-title" id="step-level">
              2. Norsknivå
            </h2>
            <p className="step-help">
              Bruk pilene eller prikkene for å velge nivå A1, A2, B1 eller B2.
            </p>
            <LevelCarousel level={level} onChange={onLevelChange} />
          </section>

          <section className="panel" aria-labelledby="step-domain">
            <h2 className="step-title" id="step-domain">
              3. Domene
            </h2>
            <p className="step-help">
              Velg ett tema {isProve ? "for prøven" : "for arbeidsarket"}.
            </p>
            <div className="domain-grid" role="radiogroup" aria-label="Domene">
              {DOMAINS.map((d) => (
                <label className="choice" key={d.id}>
                  <input
                    type="radio"
                    name="domain"
                    value={d.id}
                    checked={domainId === d.id}
                    onChange={() => setDomainId(d.id)}
                  />
                  <span>
                    <strong>{d.title}</strong>
                    <span>{d.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          {!isProve && (
            <section className="panel" aria-labelledby="step-types">
              <h2 className="step-title" id="step-types">
                4. Oppgavetyper
              </h2>
              <p className="step-help">
                Huk av én eller flere typer for variasjon i arket.
              </p>
              <div className="task-grid">
                {TASK_TYPES.map((t) => (
                  <label className="choice" key={t.id}>
                    <input
                      type="checkbox"
                      checked={taskTypeIds.includes(t.id)}
                      onChange={() => toggleTaskType(t.id)}
                    />
                    <span>
                      <strong>{t.title}</strong>
                      <span>{t.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {isProve && (
            <section className="panel" aria-labelledby="step-types-prove">
              <h2 className="step-title" id="step-types-prove">
                4. Oppgavetyper
              </h2>
              <p className="step-help">
                På prøven varieres oppgavetypene automatisk (lesetekst,
                grammatikk, synonym/antonym, rekkefølge, rett/feil m.m.).
              </p>
              <ul className="auto-types">
                {TASK_TYPES.map((t) => (
                  <li key={t.id}>{t.title}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="panel" aria-labelledby="step-goals">
            <h2 className="step-title" id="step-goals">
              5. Kompetansemål
            </h2>
            <p className="step-help">
              Velg 1–3 mål for nivå {level} via rullegardinmenyen.{" "}
              {kompetansemalIds.length}/3 valgt.
            </p>
            <div className="field">
              <label htmlFor="goal-select">Legg til kompetansemål</label>
              <select
                id="goal-select"
                value=""
                disabled={kompetansemalIds.length >= 3}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) toggleGoal(id);
                }}
              >
                <option value="">
                  {kompetansemalIds.length >= 3
                    ? "Maks 3 mål valgt"
                    : "Velg et kompetansemål…"}
                </option>
                {goals
                  .filter((g) => !kompetansemalIds.includes(g.id))
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      [{g.skill}] {g.text.slice(0, 110)}
                      {g.text.length > 110 ? "…" : ""}
                    </option>
                  ))}
              </select>
            </div>
            {selectedGoals.length > 0 && (
              <ul className="selected-goals" aria-label="Valgte kompetansemål">
                {selectedGoals.map((g) => (
                  <li key={g.id}>
                    <span>
                      <small>{g.skill}</small> {g.text}
                    </span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => toggleGoal(g.id)}
                      aria-label={`Fjern kompetansemål: ${g.text.slice(0, 40)}`}
                    >
                      Fjern
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel" aria-labelledby="step-grammar">
            <h2 className="step-title" id="step-grammar">
              6. Grammatikk (valgfritt)
            </h2>
            <p className="step-help">
              Velg opptil 3 grammatikktemaer for nivå {level}. Oppgavene
              tilpasses da disse temaene. {grammarTopicIds.length}/3 valgt.
            </p>
            <div className="field">
              <label htmlFor="grammar-select">Legg til grammatikktema</label>
              <select
                id="grammar-select"
                value=""
                disabled={grammarTopicIds.length >= 3}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) toggleGrammar(id);
                }}
              >
                <option value="">
                  {grammarTopicIds.length >= 3
                    ? "Maks 3 grammatikktemaer valgt"
                    : "Velg et grammatikktema…"}
                </option>
                {grammarTopics
                  .filter((g) => !grammarTopicIds.includes(g.id))
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} — {g.description}
                    </option>
                  ))}
              </select>
            </div>
            {selectedGrammar.length > 0 && (
              <ul className="selected-goals" aria-label="Valgte grammatikktemaer">
                {selectedGrammar.map((g) => (
                  <li key={g.id}>
                    <span>
                      <small>grammatikk</small> {g.title}: {g.description}
                    </span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => toggleGrammar(g.id)}
                      aria-label={`Fjern grammatikktema: ${g.title}`}
                    >
                      Fjern
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel" aria-labelledby="step-scope">
            <h2 className="step-title" id="step-scope">
              7. Omfang og fasit
            </h2>
            {isProve ? (
              <>
                <p className="step-help">
                  Velg antall oppgaver på prøven. Hver oppgave har deloppgaver
                  a.–e. Alle riktige svar gir 1 poeng (totalt 5 poeng per
                  oppgave).
                </p>
                <div className="scope-row">
                  <div className="field">
                    <label htmlFor="proveTaskCount">
                      Antall oppgaver (1–20)
                    </label>
                    <input
                      id="proveTaskCount"
                      type="number"
                      min={1}
                      max={20}
                      value={proveTaskCount}
                      onChange={(e) =>
                        setProveTaskCount(
                          Math.min(
                            20,
                            Math.max(1, Number(e.target.value) || 1),
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="proveReadingCount">
                      Herav lesetekster (0–{Math.min(10, proveTaskCount)})
                    </label>
                    <input
                      id="proveReadingCount"
                      type="number"
                      min={0}
                      max={Math.min(10, proveTaskCount)}
                      value={proveReadingCount}
                      onChange={(e) =>
                        setProveReadingCount(
                          Math.min(
                            Math.min(10, proveTaskCount),
                            Math.max(0, Number(e.target.value) || 0),
                          ),
                        )
                      }
                    />
                  </div>
                </div>
                <p className="step-help">
                  Maks poeng på prøven: <strong>{proveMaxScore}</strong>
                </p>
              </>
            ) : (
              <>
                <p className="step-help">
                  Lesetekster og øvrige oppgaver legges i samme dokument. Hver
                  oppgave får deloppgaver a.–e.
                </p>
                <div className="scope-row">
                  <div className="field">
                    <label htmlFor="readingCount">
                      Antall lesetekster (0–10)
                    </label>
                    <input
                      id="readingCount"
                      type="number"
                      min={0}
                      max={10}
                      value={readingTextCount}
                      onChange={(e) =>
                        setReadingTextCount(
                          Math.min(
                            10,
                            Math.max(0, Number(e.target.value) || 0),
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="taskCount">
                      Antall øvrige oppgaver (0–20)
                    </label>
                    <input
                      id="taskCount"
                      type="number"
                      min={0}
                      max={20}
                      value={taskCount}
                      onChange={(e) =>
                        setTaskCount(
                          Math.min(
                            20,
                            Math.max(0, Number(e.target.value) || 0),
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              </>
            )}
            <div className="field">
              <label htmlFor="title">Tittel (valgfritt)</label>
              <input
                id="title"
                type="text"
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isProve
                    ? "F.eks. Prøve – Mat og handel – A1"
                    : "F.eks. Mat og handel – A1"
                }
              />
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(e) => setIncludeAnswerKey(e.target.checked)}
              />
              Ta med fasit bakerst i dokumentet
            </label>
          </section>
        </div>

        <aside className="panel summary" aria-labelledby="summary-title">
          <h2 id="summary-title">Oversikt før generering</h2>
          <dl>
            <dt>Type</dt>
            <dd>{isProve ? "Prøve" : "Øvingsark"}</dd>
            <dt>Nivå</dt>
            <dd>{level}</dd>
            <dt>Domene</dt>
            <dd>{domain?.title}</dd>
            <dt>Oppgavetyper</dt>
            <dd>
              {isProve ? (
                "Automatisk variasjon av alle typer"
              ) : selectedTypes.length === 0 ? (
                "Ingen valgt"
              ) : (
                <ul>
                  {selectedTypes.map((t) => (
                    <li key={t.id}>{t.title}</li>
                  ))}
                </ul>
              )}
            </dd>
            <dt>Kompetansemål</dt>
            <dd>
              {selectedGoals.length === 0 ? (
                "Velg 1–3 mål"
              ) : (
                <ul>
                  {selectedGoals.map((g) => (
                    <li key={g.id}>
                      [{g.skill}] {g.text.slice(0, 90)}
                      {g.text.length > 90 ? "…" : ""}
                    </li>
                  ))}
                </ul>
              )}
            </dd>
            <dt>Grammatikk</dt>
            <dd>
              {selectedGrammar.length === 0 ? (
                "Ingen valgt"
              ) : (
                <ul>
                  {selectedGrammar.map((g) => (
                    <li key={g.id}>{g.title}</li>
                  ))}
                </ul>
              )}
            </dd>
            <dt>Omfang</dt>
            <dd>
              {isProve ? (
                <>
                  {proveTaskCount} oppgaver
                  {proveReadingCount > 0
                    ? ` (herav ${proveReadingCount} lesetekst${proveReadingCount === 1 ? "" : "er"})`
                    : ""}
                </>
              ) : (
                <>
                  {readingTextCount} lesetekst
                  {readingTextCount === 1 ? "" : "er"}, {taskCount} øvrig
                  {taskCount === 1 ? " oppgave" : "e oppgaver"}
                </>
              )}
            </dd>
            {isProve && (
              <>
                <dt>Poeng</dt>
                <dd>Alle riktige svar gir 1 poeng · maks {proveMaxScore}</dd>
              </>
            )}
            <dt>Fasit</dt>
            <dd>{includeAnswerKey ? "Ja" : "Nei"}</dd>
            <dt>Tittel</dt>
            <dd>{title.trim() || "Genereres automatisk"}</dd>
          </dl>

          <div className="actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              {loading
                ? "Genererer…"
                : isProve
                  ? "Generer prøve"
                  : "Generer arbeidsark"}
            </button>
            {worksheet && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => {
                  setShowResult(true);
                  window.scrollTo({ top: 0, behavior: "auto" });
                }}
              >
                Vis siste arbeidsark
              </button>
            )}
          </div>

          {loading && (
            <p className="status" role="status" aria-live="polite">
              Lager unike oppgaver med AI. Dette kan ta litt tid…
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {!canGenerate && !loading && (
            <p className="status">
              {isProve
                ? "Fullfør valgene: 1–3 kompetansemål og minst én oppgave."
                : "Fullfør valgene: minst én oppgavetype, 1–3 kompetansemål, og minst én lesetekst eller oppgave."}
            </p>
          )}
        </aside>
      </div>
      )}
    </>
  );
}
