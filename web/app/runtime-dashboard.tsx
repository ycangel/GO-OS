"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Actor = { displayName: string; email: string } | null;

type Mission = {
  id: number;
  slug: string;
  title: string;
  purpose: string;
  owner: string;
  status: string;
  authoritySummary: string;
  successSignal: string;
  nextDecision: string;
  confidence: number;
  updatedAt: string;
};

type Evidence = {
  id: number;
  missionId: number | null;
  missionTitle: string | null;
  title: string;
  observation: string;
  source: string;
  freshness: string;
  reliability: string;
  createdBy: string;
  createdAt: string;
};

type Exception = {
  id: number;
  missionId: number | null;
  missionTitle: string | null;
  title: string;
  context: string;
  severity: string;
  requiredDecision: string;
  accountableOwner: string;
  status: string;
  createdAt: string;
};

type Evolution = {
  id: number;
  title: string;
  triggerEvidence: string;
  proposedChange: string;
  sponsor: string;
  status: string;
  reversible: boolean;
  createdAt: string;
};

type Capability = {
  id: number;
  name: string;
  maturity: string;
  evidenceCount: number;
  lastLearnedAt: string;
};

type RuntimeState = {
  missions: Mission[];
  evidence: Evidence[];
  exceptions: Exception[];
  evolutions: Evolution[];
  capabilities: Capability[];
};

const emptyState: RuntimeState = {
  missions: [],
  evidence: [],
  exceptions: [],
  evolutions: [],
  capabilities: [],
};

const views = ["Pulse", "Missions", "Evidence", "Evolution"] as const;
type View = (typeof views)[number];

function formatDate(value: string) {
  const date = new Date(value.replace(" ", "T") + (value.includes("Z") ? "" : "Z"));
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RuntimeDashboard({ actor }: { actor: Actor }) {
  const [data, setData] = useState<RuntimeState>(emptyState);
  const [view, setView] = useState<View>("Pulse");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composer, setComposer] = useState<"evidence" | "exception" | "evolution" | null>(null);
  const [saving, setSaving] = useState(false);

  const openExceptions = useMemo(
    () => data.exceptions.filter((item) => item.status === "open"),
    [data.exceptions],
  );

  async function loadRuntime() {
    try {
      const response = await fetch("/api/runtime", { cache: "no-store" });
      const payload = (await response.json()) as RuntimeState & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Runtime unavailable");
      setData(payload);
      setError(null);
    } catch (runtimeError) {
      setError(runtimeError instanceof Error ? runtimeError.message : "Runtime unavailable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRuntime();
  }, []);

  function beginCompose(kind: "evidence" | "exception" | "evolution") {
    if (!actor) {
      window.location.href = `/signin-with-chatgpt?return_to=${encodeURIComponent("/")}`;
      return;
    }
    setComposer(kind);
  }

  async function submitComposer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!composer) return;
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    setSaving(true);
    try {
      const response = await fetch(`/api/${composer === "evolution" ? "evolutions" : composer}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (response.status === 401) {
        window.location.href = `/signin-with-chatgpt?return_to=${encodeURIComponent("/")}`;
        return;
      }
      if (!response.ok) throw new Error(result.error ?? "Unable to record change");
      setComposer(null);
      await loadRuntime();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to record change");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="GO Society home">
          <span className="brand-mark">GO<span>/</span></span>
          <span>
            <strong>GO Society</strong>
            <small>Living on GO OS</small>
          </span>
        </a>

        <nav className="view-switcher" aria-label="Runtime views">
          {views.map((item) => (
            <button
              className={view === item ? "active" : ""}
              key={item}
              onClick={() => setView(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="actor">
          <span className="runtime-dot" aria-hidden="true" />
          <span className="runtime-label">Runtime live</span>
          {actor ? (
            <span className="avatar" title={actor.email}>{initials(actor.displayName)}</span>
          ) : (
            <a href="/signin-with-chatgpt?return_to=%2F">Join runtime</a>
          )}
        </div>
      </header>

      <div className="body-grid" id="top">
        <aside className="rail">
          <section>
            <p className="eyebrow">Constitution</p>
            <p className="rail-statement">
              Human sovereignty.<br />Machine agency.<br />Reality decides.
            </p>
          </section>

          <section className="rail-block">
            <p className="eyebrow">Organization</p>
            <dl className="rail-list">
              <div><dt>Vision</dt><dd>Reinvent Organizations</dd></div>
              <div><dt>Mission</dt><dd>Enable organizations to evolve themselves</dd></div>
              <div><dt>Form</dt><dd>Human–Agent Cell</dd></div>
              <div><dt>Arbiter</dt><dd>Reality</dd></div>
            </dl>
          </section>

          <section className="rail-block source-card">
            <span className="source-icon">&lt;/&gt;</span>
            <div>
              <strong>Open source runtime</strong>
              <a href="https://github.com/ycangel/GO-OS" target="_blank" rel="noreferrer">
                ycangel/GO-OS ↗
              </a>
            </div>
          </section>
        </aside>

        <section className="workspace">
          <div className="brief">
            <div>
              <p className="eyebrow">Sovereign brief · 001</p>
              <h1>A self-evolving organization<br />for self-evolving organizations.</h1>
              <p className="brief-copy">
                GO Society is the organization behind GO OS—and its first living reference
                implementation. Every mission, exception and learning here becomes evidence
                for the operating system itself.
              </p>
            </div>
            <div className="brief-state">
              <span>Current state</span>
              <strong>FORMING</strong>
              <small>Public Alpha · Cycle 01</small>
            </div>
          </div>

          <div className="control-strip">
            <div><span>Human authority</span><strong>Purpose · irreversible commitments · final responsibility</strong></div>
            <div><span>Machine authority</span><strong>Plan · act · observe · propose change</strong></div>
            <button type="button" onClick={() => beginCompose("evidence")}>+ Record evidence</button>
          </div>

          {error && (
            <div className="runtime-error" role="alert">
              <strong>Runtime signal lost.</strong> {error}
              <button type="button" onClick={() => void loadRuntime()}>Retry</button>
            </div>
          )}

          {view === "Pulse" && (
            <PulseView
              data={data}
              loading={loading}
              openExceptions={openExceptions}
              onCompose={beginCompose}
              onView={setView}
            />
          )}
          {view === "Missions" && <MissionsView missions={data.missions} loading={loading} />}
          {view === "Evidence" && (
            <EvidenceView evidence={data.evidence} loading={loading} onCompose={() => beginCompose("evidence")} />
          )}
          {view === "Evolution" && (
            <EvolutionView evolutions={data.evolutions} capabilities={data.capabilities} loading={loading} onCompose={() => beginCompose("evolution")} />
          )}
        </section>
      </div>

      {composer && (
        <Composer
          kind={composer}
          missions={data.missions}
          saving={saving}
          onClose={() => setComposer(null)}
          onSubmit={submitComposer}
        />
      )}
    </main>
  );
}

function PulseView({
  data,
  loading,
  openExceptions,
  onCompose,
  onView,
}: {
  data: RuntimeState;
  loading: boolean;
  openExceptions: Exception[];
  onCompose: (kind: "evidence" | "exception" | "evolution") => void;
  onView: (view: View) => void;
}) {
  return (
    <div className="view-stack">
      <div className="metrics">
        <Metric label="Active missions" value={loading ? "—" : String(data.missions.filter((m) => m.status !== "complete").length).padStart(2, "0")} note="running within authority" />
        <Metric label="Human interventions" value={loading ? "—" : String(openExceptions.length).padStart(2, "0")} note="attention required" alert={openExceptions.length > 0} />
        <Metric label="Evidence records" value={loading ? "—" : String(data.evidence.length).padStart(2, "0")} note="reality observations" />
        <Metric label="Reusable capabilities" value={loading ? "—" : String(data.capabilities.length).padStart(2, "0")} note="compounding memory" />
      </div>

      <div className="two-column">
        <section className="panel mission-panel">
          <PanelHeader eyebrow="Mission cockpit" title="What the organization is becoming" action="All missions" onAction={() => onView("Missions")} />
          <div className="mission-list">
            {loading ? <Skeleton rows={3} /> : data.missions.slice(0, 3).map((mission, index) => (
              <article className="mission-row" key={mission.id}>
                <div className="mission-index">0{index + 1}</div>
                <div className="mission-main">
                  <div className="mission-title-line">
                    <h3>{mission.title}</h3>
                    <span className={`status ${mission.status}`}>{mission.status}</span>
                  </div>
                  <p>{mission.purpose}</p>
                  <div className="mission-meta"><span>OWNER</span>{mission.owner}<span>NEXT</span>{mission.nextDecision}</div>
                </div>
                <div className="confidence"><strong>{mission.confidence}%</strong><span>confidence</span></div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel intervention-panel">
          <PanelHeader eyebrow="Intervention center" title="Only what requires a human" action="Raise exception" onAction={() => onCompose("exception")} />
          {loading ? <Skeleton rows={2} /> : openExceptions.length ? (
            <div className="exception-list">
              {openExceptions.slice(0, 3).map((item) => (
                <article className="exception-card" key={item.id}>
                  <div className="exception-top"><span className={`severity ${item.severity}`}>{item.severity}</span><span>{item.missionTitle ?? "Organization"}</span></div>
                  <h3>{item.title}</h3>
                  <p>{item.requiredDecision}</p>
                  <div><span>ACCOUNTABLE</span><strong>{item.accountableOwner}</strong></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="quiet-state"><span>✓</span><strong>Trusted silence</strong><p>No decision currently requires human attention.</p></div>
          )}
        </section>
      </div>

      <section className="panel evidence-band">
        <PanelHeader eyebrow="Reality trace" title="Latest evidence changing the organization" action="Evidence ledger" onAction={() => onView("Evidence")} />
        <div className="evidence-grid">
          {loading ? <Skeleton rows={2} /> : data.evidence.slice(0, 4).map((item) => (
            <article key={item.id}>
              <div><span>{item.reliability} reliability</span><time>{formatDate(item.createdAt)}</time></div>
              <h3>{item.title}</h3>
              <p>{item.observation}</p>
              <small>{item.source} · {item.createdBy}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function MissionsView({ missions, loading }: { missions: Mission[]; loading: boolean }) {
  return (
    <section className="panel full-panel">
      <PanelHeader eyebrow="Mission cockpit" title="Purpose compiled into accountable action" />
      {loading ? <Skeleton rows={3} /> : <div className="mission-cards">
        {missions.map((mission, index) => (
          <article key={mission.id}>
            <div className="card-number">M-{String(index + 1).padStart(3, "0")}</div>
            <div className="mission-title-line"><h2>{mission.title}</h2><span className={`status ${mission.status}`}>{mission.status}</span></div>
            <p>{mission.purpose}</p>
            <dl>
              <div><dt>Named owner</dt><dd>{mission.owner}</dd></div>
              <div><dt>Authority boundary</dt><dd>{mission.authoritySummary}</dd></div>
              <div><dt>Reality signal</dt><dd>{mission.successSignal}</dd></div>
              <div><dt>Next sovereign decision</dt><dd>{mission.nextDecision}</dd></div>
            </dl>
            <div className="confidence-bar"><span style={{ width: `${mission.confidence}%` }} /><small>{mission.confidence}% confidence</small></div>
          </article>
        ))}
      </div>}
    </section>
  );
}

function EvidenceView({ evidence, loading, onCompose }: { evidence: Evidence[]; loading: boolean; onCompose: () => void }) {
  return (
    <section className="panel full-panel">
      <PanelHeader eyebrow="Evidence ledger" title="Reality is the runtime" action="Record evidence" onAction={onCompose} />
      {loading ? <Skeleton rows={4} /> : <div className="ledger">
        {evidence.map((item) => (
          <article key={item.id}>
            <div className="ledger-date"><strong>{formatDate(item.createdAt)}</strong><span>{item.freshness}</span></div>
            <div><h3>{item.title}</h3><p>{item.observation}</p><small>{item.missionTitle ?? "Organization-wide"}</small></div>
            <div className="ledger-source"><span>{item.reliability}</span><strong>{item.source}</strong><small>by {item.createdBy}</small></div>
          </article>
        ))}
      </div>}
    </section>
  );
}

function EvolutionView({ evolutions, capabilities, loading, onCompose }: { evolutions: Evolution[]; capabilities: Capability[]; loading: boolean; onCompose: () => void }) {
  return (
    <div className="two-column evolution-layout">
      <section className="panel">
        <PanelHeader eyebrow="Evolution missions" title="How the organization rewrites itself" action="Propose change" onAction={onCompose} />
        {loading ? <Skeleton rows={3} /> : <div className="evolution-list">
          {evolutions.map((item) => (
            <article key={item.id}>
              <div><span className={`status ${item.status}`}>{item.status}</span><small>{item.reversible ? "reversible" : "irreversible"}</small></div>
              <h3>{item.title}</h3>
              <p>{item.proposedChange}</p>
              <dl><dt>Trigger</dt><dd>{item.triggerEvidence}</dd><dt>Sponsor</dt><dd>{item.sponsor}</dd></dl>
            </article>
          ))}
        </div>}
      </section>
      <section className="panel capability-panel">
        <PanelHeader eyebrow="Capability network" title="What GO Society has learned to do" />
        {loading ? <Skeleton rows={4} /> : capabilities.map((item) => (
          <article key={item.id}>
            <span>{item.name}</span><strong>{item.maturity}</strong><small>{item.evidenceCount} evidence links</small>
          </article>
        ))}
      </section>
    </div>
  );
}

function Composer({ kind, missions, saving, onClose, onSubmit }: { kind: "evidence" | "exception" | "evolution"; missions: Mission[]; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const copy = {
    evidence: { eyebrow: "Reality trace", title: "Record new evidence", submit: "Commit evidence" },
    exception: { eyebrow: "Authority boundary", title: "Raise an exception", submit: "Escalate to owner" },
    evolution: { eyebrow: "Organizational rewrite", title: "Propose an evolution", submit: "Create evolution mission" },
  }[kind];

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="composer" role="dialog" aria-modal="true" aria-labelledby="composer-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close">×</button>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="composer-title">{copy.title}</h2>
        <form onSubmit={onSubmit}>
          {kind !== "evolution" && (
            <label>Mission<select name="missionId" required defaultValue=""><option value="" disabled>Select mission</option>{missions.map((mission) => <option value={mission.id} key={mission.id}>{mission.title}</option>)}</select></label>
          )}
          <label>Title<input name="title" required maxLength={140} placeholder={kind === "exception" ? "What crossed the operating boundary?" : "What changed?"} /></label>
          {kind === "evidence" && <><label>Observation<textarea name="observation" required rows={4} placeholder="State the observation, not the conclusion." /></label><div className="field-grid"><label>Source<input name="source" required placeholder="Repository, interview, telemetry…" /></label><label>Reliability<select name="reliability" defaultValue="medium"><option>high</option><option>medium</option><option>low</option></select></label></div></>}
          {kind === "exception" && <><label>Context<textarea name="context" required rows={3} placeholder="What happened, and which assumption or boundary no longer holds?" /></label><label>Required human decision<textarea name="requiredDecision" required rows={3} placeholder="What exactly must a named human decide?" /></label><div className="field-grid"><label>Accountable owner<input name="accountableOwner" required placeholder="Named human" /></label><label>Severity<select name="severity" defaultValue="medium"><option>critical</option><option>high</option><option>medium</option><option>low</option></select></label></div></>}
          {kind === "evolution" && <><label>Evidence trigger<textarea name="triggerEvidence" required rows={3} placeholder="What evidence makes the current organization insufficient?" /></label><label>Proposed organizational change<textarea name="proposedChange" required rows={4} placeholder="What should change in structure, capability, rule or memory?" /></label><label>Sponsor<input name="sponsor" required placeholder="Named human responsible for the proposal" /></label><label className="checkbox"><input type="checkbox" name="reversible" defaultChecked /><span>This change is reversible and has an exit path.</span></label></>}
          <button className="primary-action" type="submit" disabled={saving}>{saving ? "Recording…" : copy.submit}</button>
        </form>
      </section>
    </div>
  );
}

function Metric({ label, value, note, alert = false }: { label: string; value: string; note: string; alert?: boolean }) {
  return <article className={`metric ${alert ? "metric-alert" : ""}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function PanelHeader({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <header className="panel-header"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action && <button type="button" onClick={onAction}>{action} →</button>}</header>;
}

function Skeleton({ rows }: { rows: number }) {
  return <div className="skeleton" aria-label="Loading runtime data">{Array.from({ length: rows }, (_, index) => <span key={index} />)}</div>;
}
