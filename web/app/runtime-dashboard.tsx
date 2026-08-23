"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Viewer = {
  displayName: string;
  role: string;
  canWrite: boolean;
  canInvite: boolean;
} | null;

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

type PublicCase = {
  id: number;
  missionId: number | null;
  missionTitle: string | null;
  title: string;
  summary: string;
  organizationProfile: string;
  sourceRoleClass: string;
  stage: string;
  consentScope: string;
  reidentificationRisk: string;
  privacyStatus: string;
  publishedAt: string | null;
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

type FieldRecord = {
  id: number;
  missionId: number;
  missionTitle: string | null;
  organizationAlias: string;
  sourceKind: string;
  roleClass: string;
  privateNotes: string;
  stage: string;
  consentScope: string;
  privacyStatus: string;
  createdAt: string;
};

type TeamMember = {
  id: number;
  displayName: string;
  publicAlias: string;
  namePublic: boolean;
  role: string;
  status: string;
  missionId: number | null;
  missionTitle: string | null;
  canRecord: boolean | null;
  canReview: boolean | null;
  canPublish: boolean | null;
};

type RuntimeState = {
  missions: Mission[];
  evidence: PublicCase[];
  exceptions: Exception[];
  evolutions: Evolution[];
  capabilities: Capability[];
  fieldRecords: FieldRecord[];
  team: TeamMember[];
  privacyMode: string;
};

const emptyState: RuntimeState = {
  missions: [],
  evidence: [],
  exceptions: [],
  evolutions: [],
  capabilities: [],
  fieldRecords: [],
  team: [],
  privacyMode: "public_deidentified",
};

type View = "Pulse" | "Missions" | "Evidence" | "Evolution" | "Private intake";
type ComposerKind = "fieldRecord" | "exception" | "evolution" | "member";

function formatDate(value: string | null) {
  if (!value) return "Pending";
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

export default function RuntimeDashboard({ viewer: initialViewer }: { viewer: Viewer }) {
  const [viewer, setViewer] = useState<Viewer>(initialViewer);
  const [data, setData] = useState<RuntimeState>(emptyState);
  const [view, setView] = useState<View>("Pulse");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composer, setComposer] = useState<ComposerKind | null>(null);
  const [saving, setSaving] = useState(false);
  const canWrite = Boolean(viewer?.canWrite);

  const views: View[] = viewer?.canWrite
    ? ["Pulse", "Missions", "Evidence", "Evolution", "Private intake"]
    : ["Pulse", "Missions", "Evidence", "Evolution"];

  const openExceptions = useMemo(
    () => data.exceptions.filter((item) => item.status === "open"),
    [data.exceptions],
  );

  const loadRuntime = useCallback(async () => {
    try {
      const endpoint = canWrite ? "/api/member/runtime" : "/api/runtime";
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = (await response.json()) as RuntimeState & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Runtime unavailable");
      setData({ ...emptyState, ...payload });
      setError(null);
    } catch (runtimeError) {
      setError(runtimeError instanceof Error ? runtimeError.message : "Runtime unavailable");
    } finally {
      setLoading(false);
    }
  }, [canWrite]);

  useEffect(() => {
    if (!initialViewer) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/session", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) return;
          const payload = (await response.json()) as { viewer: Viewer };
          setViewer(payload.viewer);
        })
        .catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialViewer]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRuntime(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRuntime]);

  function beginCompose(kind: ComposerKind) {
    if (!viewer) {
      window.location.href = `/signin-with-chatgpt?return_to=${encodeURIComponent("/")}`;
      return;
    }
    if (!viewer.canWrite) {
      setError("Your account has public read access but is not an approved GO Society member.");
      return;
    }
    if (kind === "member" && !viewer.canInvite) {
      setError("Only the accountable owner can add mission partners.");
      return;
    }
    setComposer(kind);
  }

  async function submitComposer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!composer) return;
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const endpoint = {
      fieldRecord: "field-records",
      exception: "exception",
      evolution: "evolutions",
      member: "members",
    }[composer];

    setSaving(true);
    try {
      const response = await fetch(`/api/${endpoint}`, {
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
      if (composer === "fieldRecord" || composer === "member") {
        setView("Private intake");
      }
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
            <small>Reference instance · v0.5</small>
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
          <span className="privacy-dot" aria-hidden="true" />
          <span className="runtime-label">Public read · de-identified</span>
          {viewer ? (
            <>
              <span className="actor-mode">{viewer.canWrite ? viewer.role : "read-only"}</span>
              <span className="avatar" title={viewer.role}>{initials(viewer.displayName)}</span>
            </>
          ) : (
            <a href="/signin-with-chatgpt?return_to=%2F">Member sign in</a>
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

          <section className="rail-block privacy-link">
            <span className="privacy-icon">◌</span>
            <div>
              <strong>Privacy boundary</strong>
              <a href="/privacy">Read publication policy →</a>
            </div>
          </section>

          <section className="rail-block source-card">
            <span className="source-icon">&lt;/&gt;</span>
            <div>
              <strong>Open-source project</strong>
              <a href="https://github.com/ycangel/GO-OS" target="_blank" rel="noreferrer">
                ycangel/GO-OS ↗
              </a>
              <a href="https://github.com/ycangel/GO-OS/blob/main/docs/INDEX.md" target="_blank" rel="noreferrer">
                v0.5 docs ↗
              </a>
              <a href="https://github.com/ycangel/GO-OS/blob/main/docs/EVALUATION_AND_RED_TEAM_v0.5.0.md" target="_blank" rel="noreferrer">
                Evaluation &amp; red team ↗
              </a>
              <small>Foundation Release / 奠基版本 is a software milestone, not a legal entity.</small>
            </div>
          </section>
        </aside>

        <section className="workspace">
          <div className="brief">
            <div>
              <p className="eyebrow">Sovereign brief · 001</p>
              <h1>A self-evolving organization<br />for self-evolving organizations.</h1>
              <p className="brief-copy">
                GO Society is GO OS&apos;s first self-application reference instance. This
                alpha surface persists selected runtime objects; CognitiveEvent,
                Deliberation, Learning and CognitiveVersion remain incomplete as one
                durable end-to-end loop. Public evidence here is a deliberately separate,
                human-approved artifact derived from private records.
              </p>
            </div>
            <div className="brief-state">
              <span>Current state</span>
              <strong>FORMING</strong>
              <small>Privacy-safe Alpha · Cycle 02</small>
            </div>
          </div>

          <div className="control-strip">
            <div><span>Human authority</span><strong>Purpose · privacy · publication · final responsibility</strong></div>
            <div><span>Machine authority</span><strong>Structure · scan · synthesize · propose</strong></div>
            {viewer?.canWrite ? (
              <button type="button" onClick={() => beginCompose("fieldRecord")}>+ Private field record</button>
            ) : (
              <a className="strip-link" href="/privacy">How evidence becomes public →</a>
            )}
          </div>

          <PrivacyBoundary />

          {error && (
            <div className="runtime-error" role="alert">
              <strong>Runtime signal.</strong> {error}
              <button type="button" onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          {view === "Pulse" && (
            <PulseView
              data={data}
              loading={loading}
              openExceptions={openExceptions}
              isMember={Boolean(viewer?.canWrite)}
              onCompose={beginCompose}
              onView={setView}
            />
          )}
          {view === "Missions" && <MissionsView missions={data.missions} loading={loading} />}
          {view === "Evidence" && (
            <EvidenceView
              evidence={data.evidence}
              loading={loading}
              isMember={Boolean(viewer?.canWrite)}
              onCompose={() => beginCompose("fieldRecord")}
            />
          )}
          {view === "Evolution" && (
            <EvolutionView
              evolutions={data.evolutions}
              capabilities={data.capabilities}
              loading={loading}
              canPropose={Boolean(viewer?.canInvite)}
              onCompose={() => beginCompose("evolution")}
            />
          )}
          {view === "Private intake" && viewer?.canWrite && (
            <IntakeView
              records={data.fieldRecords}
              team={data.team}
              loading={loading}
              canInvite={viewer.canInvite}
              onRecord={() => beginCompose("fieldRecord")}
              onInvite={() => beginCompose("member")}
            />
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

function PrivacyBoundary() {
  const steps = [
    ["01", "Private intake"],
    ["02", "De-identification"],
    ["03", "Consent + risk review"],
    ["04", "Named human approval"],
    ["05", "Public evidence"],
  ];
  return (
    <section className="privacy-boundary" aria-label="Evidence privacy boundary">
      <div className="privacy-copy">
        <span>Evidence privacy invariant</span>
        <strong>Raw identity never crosses the public boundary.</strong>
      </div>
      <ol>
        {steps.map(([number, label]) => (
          <li key={number}><span>{number}</span>{label}</li>
        ))}
      </ol>
    </section>
  );
}

function PulseView({
  data,
  loading,
  openExceptions,
  isMember,
  onCompose,
  onView,
}: {
  data: RuntimeState;
  loading: boolean;
  openExceptions: Exception[];
  isMember: boolean;
  onCompose: (kind: ComposerKind) => void;
  onView: (view: View) => void;
}) {
  return (
    <div className="view-stack">
      <div className="metrics">
        <Metric label="Active missions" value={loading ? "—" : String(data.missions.filter((m) => m.status !== "complete").length).padStart(2, "0")} note="running within authority" />
        <Metric label="Human interventions" value={loading ? "—" : isMember ? String(openExceptions.length).padStart(2, "0") : "—"} note={isMember ? "private attention queue" : "private by design"} alert={isMember && openExceptions.length > 0} />
        <Metric label="Published evidence" value={loading ? "—" : String(data.evidence.length).padStart(2, "0")} note="de-identified + approved" />
        <Metric label="Reusable capabilities" value={loading ? "—" : String(data.capabilities.length).padStart(2, "0")} note="compounding memory" />
      </div>

      <div className="two-column">
        <section className="panel mission-panel">
          <PanelHeader eyebrow="Mission cockpit" title="What the organization is becoming" action="All missions" onAction={() => onView("Missions")} />
          <div className="mission-list">
            {loading ? <Skeleton rows={3} /> : data.missions.slice(0, 4).map((mission, index) => (
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
          <PanelHeader
            eyebrow="Intervention center"
            title={isMember ? "Only what requires a human" : "Private operational layer"}
            action={isMember ? "Raise exception" : undefined}
            onAction={() => onCompose("exception")}
          />
          {loading ? <Skeleton rows={2} /> : isMember && openExceptions.length ? (
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
            <div className="quiet-state">
              <span>{isMember ? "✓" : "◌"}</span>
              <strong>{isMember ? "Trusted silence" : "Not part of the public payload"}</strong>
              <p>{isMember ? "No decision currently requires human attention." : "Raw exceptions, names and internal context remain inside the authorized member runtime."}</p>
            </div>
          )}
        </section>
      </div>

      <section className="panel evidence-band">
        <PanelHeader eyebrow="Published reality trace" title="Evidence cleared for public learning" action="Published ledger" onAction={() => onView("Evidence")} />
        {loading ? <Skeleton rows={2} /> : data.evidence.length ? (
          <div className="evidence-grid">
            {data.evidence.slice(0, 4).map((item) => (
              <article key={item.id}>
                <div><span>{item.stage}</span><time>{formatDate(item.publishedAt)}</time></div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <small>{item.sourceRoleClass} · {item.organizationProfile}</small>
                <div className="privacy-tags"><span>De-identified</span><span>Human reviewed</span></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-ledger"><strong>No enterprise case has crossed the publication gate.</strong><p>Silence is safer than publishing an unreviewed signal.</p></div>
        )}
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
              <div><dt>Public owner label</dt><dd>{mission.owner}</dd></div>
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

function EvidenceView({ evidence, loading, isMember, onCompose }: { evidence: PublicCase[]; loading: boolean; isMember: boolean; onCompose: () => void }) {
  return (
    <section className="panel full-panel">
      <PanelHeader eyebrow="Published evidence ledger" title="De-identified, consent-scoped, human-approved" action={isMember ? "Private intake" : undefined} onAction={onCompose} />
      <div className="ledger-notice">
        The public <code>/api/runtime</code> payload contains no raw interview notes,
        personal names, company names, contact details, recordings or private quotations.
        The authenticated member API has a separate private-data boundary.
      </div>
      {loading ? <Skeleton rows={4} /> : evidence.length ? <div className="ledger">
        {evidence.map((item) => (
          <article key={item.id}>
            <div className="ledger-date"><strong>{formatDate(item.publishedAt)}</strong><span>{item.stage}</span></div>
            <div><h3>{item.title}</h3><p>{item.summary}</p><small>{item.missionTitle ?? "Organization-wide"}</small></div>
            <div className="ledger-source">
              <span>{item.reidentificationRisk} re-ID risk</span>
              <strong>{item.sourceRoleClass}</strong>
              <small>{item.organizationProfile}</small>
              <div className="privacy-tags"><span>Anonymous consent</span><span>Human approved</span></div>
            </div>
          </article>
        ))}
      </div> : <div className="empty-ledger"><strong>No public case yet.</strong><p>A Signal is not a case. Publication waits for de-identification, consent review and named human approval.</p></div>}
    </section>
  );
}

function EvolutionView({ evolutions, capabilities, loading, canPropose, onCompose }: { evolutions: Evolution[]; capabilities: Capability[]; loading: boolean; canPropose: boolean; onCompose: () => void }) {
  return (
    <div className="two-column evolution-layout">
      <section className="panel">
        <PanelHeader eyebrow="Evolution missions" title="How the organization rewrites itself" action={canPropose ? "Propose change" : undefined} onAction={onCompose} />
        {loading ? <Skeleton rows={3} /> : evolutions.length ? <div className="evolution-list">
          {evolutions.map((item) => (
            <article key={item.id}>
              <div><span className={`status ${item.status}`}>{item.status}</span><small>{item.reversible ? "reversible" : "irreversible"}</small></div>
              <h3>{item.title}</h3>
              <p>{item.proposedChange}</p>
              <dl><dt>Trigger</dt><dd>{item.triggerEvidence}</dd><dt>Sponsor</dt><dd>{item.sponsor}</dd></dl>
            </article>
          ))}
        </div> : <div className="empty-ledger compact"><strong>Evolution deliberation is private until approved.</strong><p>Public transparency never overrides participant confidentiality.</p></div>}
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

function IntakeView({ records, team, loading, canInvite, onRecord, onInvite }: { records: FieldRecord[]; team: TeamMember[]; loading: boolean; canInvite: boolean; onRecord: () => void; onInvite: () => void }) {
  return (
    <div className="view-stack">
      <section className="private-banner">
        <div><span>Authorized members only</span><strong>Private enterprise reality intake</strong></div>
        <p>Use aliases. Do not store contact details, exact company names, recordings or unnecessary identity clues.</p>
      </section>
      <div className="two-column intake-layout">
        <section className="panel">
          <PanelHeader eyebrow="Private field records" title="Signals that have not been published" action="Record signal" onAction={onRecord} />
          {loading ? <Skeleton rows={3} /> : records.length ? <div className="field-records">
            {records.map((record) => (
              <article key={record.id}>
                <div className="field-record-top">
                  <span className="status private">{record.privacyStatus.replaceAll("_", " ")}</span>
                  <time>{formatDate(record.createdAt)}</time>
                </div>
                <h3>{record.organizationAlias} · {record.roleClass}</h3>
                <p>{record.privateNotes}</p>
                <dl>
                  <dt>Mission</dt><dd>{record.missionTitle ?? "Unknown"}</dd>
                  <dt>Source class</dt><dd>{record.sourceKind.replaceAll("_", " ")}</dd>
                  <dt>Evidence stage</dt><dd>{record.stage}</dd>
                  <dt>Consent</dt><dd>{record.consentScope.replaceAll("_", " ")}</dd>
                </dl>
              </article>
            ))}
          </div> : <div className="empty-ledger compact"><strong>No private field signal yet.</strong><p>Start with a bounded conversation and record only what GO OS needs to learn.</p></div>}
        </section>

        <section className="panel gate-panel">
          <PanelHeader eyebrow="Publication gate" title="Agent assists. A named human decides." />
          <ol>
            <li><span>01</span><div><strong>Minimize</strong><p>Remove names, contacts, exact organizations and unnecessary context.</p></div></li>
            <li><span>02</span><div><strong>De-identify</strong><p>Generalize role, sector, place, time, scale and distinctive combinations.</p></div></li>
            <li><span>03</span><div><strong>Check consent</strong><p>Anonymous analysis and anonymous publication are separate permissions.</p></div></li>
            <li><span>04</span><div><strong>Test re-identification</strong><p>If identity can still be inferred, the record stays private.</p></div></li>
            <li><span>05</span><div><strong>Human approval</strong><p>Only an authorized, named human can publish the separate public artifact.</p></div></li>
          </ol>
        </section>
      </div>

      <section className="panel">
        <PanelHeader eyebrow="Mission team" title="Least privilege by mission" action={canInvite ? "Add mission partner" : undefined} onAction={onInvite} />
        <div className="team-grid">
          {team.map((member) => (
            <article key={`${member.id}-${member.missionId ?? "org"}`}>
              <div><strong>{member.displayName}</strong><span className={`status ${member.status}`}>{member.status}</span></div>
              <p>{member.publicAlias}</p>
              <small>{member.missionTitle ?? "Organization-wide"}</small>
              <div className="permission-row">
                <span className={member.canRecord ? "granted" : ""}>Record</span>
                <span className={member.canReview ? "granted" : ""}>Review</span>
                <span className={member.canPublish ? "granted" : ""}>Publish</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Composer({ kind, missions, saving, onClose, onSubmit }: { kind: ComposerKind; missions: Mission[]; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const copy = {
    fieldRecord: { eyebrow: "Private reality trace", title: "Save a private field record", submit: "Save private record" },
    exception: { eyebrow: "Authority boundary", title: "Raise a private exception", submit: "Escalate to owner" },
    evolution: { eyebrow: "Organizational rewrite", title: "Propose a private evolution", submit: "Create evolution proposal" },
    member: { eyebrow: "Mission membership", title: "Add a mission partner", submit: "Create private invitation" },
  }[kind];
  const m004 = missions.find((mission) => mission.slug === "enterprise-reality-loop");

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="composer" role="dialog" aria-modal="true" aria-labelledby="composer-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close">×</button>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="composer-title">{copy.title}</h2>
        <form onSubmit={onSubmit}>
          {(kind === "fieldRecord" || kind === "exception" || kind === "member") && (
            <label>Mission<select name="missionId" required defaultValue={kind === "member" && m004 ? String(m004.id) : ""}><option value="" disabled>Select mission</option>{missions.map((mission) => <option value={mission.id} key={mission.id}>{mission.title}</option>)}</select></label>
          )}
          {kind === "fieldRecord" && <>
            <div className="form-privacy-note"><strong>Private does not mean collect everything.</strong><span>Use an alias and keep follow-up contact information outside this runtime.</span></div>
            <div className="field-grid">
              <label>Organization alias<input name="organizationAlias" required maxLength={80} placeholder="Org A · never the legal name" /></label>
              <label>Source class<select name="sourceKind" defaultValue="enterprise_decision_maker"><option value="enterprise_decision_maker">Enterprise decision-maker</option><option value="management_consultant">Management consultant</option><option value="other_practitioner">Other practitioner</option></select></label>
            </div>
            <label>Role category<input name="roleClass" required maxLength={100} placeholder="Manufacturing executive · not a name or exact title" /></label>
            <label>Private observation<textarea name="privateNotes" required rows={5} maxLength={6000} placeholder="Record the observation and context. Remove emails, phone numbers, URLs, names and exact company identifiers." /></label>
            <div className="field-grid">
              <label>Evidence stage<select name="stage" defaultValue="signal"><option value="signal">Signal</option><option value="probe">Probe</option></select></label>
              <label>Consent scope<select name="consentScope" defaultValue="internal_only"><option value="internal_only">Internal only</option><option value="anonymous_analysis">Anonymous analysis</option><option value="anonymous_publication">Anonymous publication</option></select></label>
            </div>
            <label className="checkbox"><input type="checkbox" name="dataMinimized" required /><span>I removed direct identifiers and collected only what this mission needs.</span></label>
          </>}
          {kind === "exception" && <>
            <label>Title<input name="title" required maxLength={140} placeholder="What crossed the operating boundary?" /></label>
            <label>Private context<textarea name="context" required rows={3} maxLength={4000} placeholder="What happened, and which boundary no longer holds?" /></label>
            <label>Required human decision<textarea name="requiredDecision" required rows={3} maxLength={2000} placeholder="What exactly must a named human decide?" /></label>
            <div className="field-grid"><label>Accountable owner<input name="accountableOwner" required maxLength={100} placeholder="Named human" /></label><label>Severity<select name="severity" defaultValue="medium"><option>critical</option><option>high</option><option>medium</option><option>low</option></select></label></div>
          </>}
          {kind === "evolution" && <>
            <label>Title<input name="title" required maxLength={140} placeholder="What should evolve?" /></label>
            <label>Private evidence trigger<textarea name="triggerEvidence" required rows={3} maxLength={3000} placeholder="What evidence makes the current organization insufficient?" /></label>
            <label>Proposed organizational change<textarea name="proposedChange" required rows={4} maxLength={4000} placeholder="What should change in structure, capability, rule or memory?" /></label>
            <label>Sponsor<input name="sponsor" required maxLength={100} placeholder="Named human responsible for the proposal" /></label>
            <label className="checkbox"><input type="checkbox" name="reversible" defaultChecked /><span>This change is reversible and has an exit path.</span></label>
          </>}
          {kind === "member" && <>
            <div className="form-privacy-note"><strong>The email is private authorization data.</strong><span>It is stored only in the member layer and is never returned by the public API.</span></div>
            <label>ChatGPT login email<input name="email" type="email" required autoComplete="off" placeholder="Exact email the partner uses to sign in" /></label>
            <label>Internal display name<input name="displayName" required maxLength={80} placeholder="思思" /></label>
            <label className="checkbox"><input type="checkbox" name="publicNameConsent" /><span>The member has explicitly consented to display this name publicly. Leave unchecked by default.</span></label>
            <div className="permission-preview"><span>Granted</span><strong>Record on selected mission</strong><span>Not granted</span><strong>Review · Publish · Other mission access</strong></div>
          </>}
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
