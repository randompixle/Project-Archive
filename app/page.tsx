import ArchiveUploader from "./components/ArchiveUploader";

const archiveStreams = [
  {
    name: "Edge functions & middleware",
    size: "1.2 TB",
    retainedUntil: "2025-06-01",
    status: "Healthy",
    tags: ["edge", "pci-ready"]
  },
  {
    name: "Preview deployments",
    size: "380 GB",
    retainedUntil: "2024-12-15",
    status: "Retention update",
    tags: ["audited", "team-shared"]
  },
  {
    name: "Production logs",
    size: "2.4 TB",
    retainedUntil: "2026-01-10",
    status: "Healthy",
    tags: ["cold-storage", "observability"]
  }
];

const policies = [
  {
    name: "Lifecycle lanes",
    detail: "Move previews to cold storage after 14 days; auto-restore on redeploy.",
    badge: "Auto",
    meta: "Attached to 18 projects"
  },
  {
    name: "Compliance snapshots",
    detail: "Write-once snapshots for regulated regions with checksum evidence.",
    badge: "Audit",
    meta: "SOC2 | ISO 27001"
  },
  {
    name: "Seamless restores",
    detail: "Warm restores back to Vercel in minutes with branch-aware sync.",
    badge: "Fast",
    meta: "Average restore: 3m 14s"
  }
];

const actions = [
  {
    title: "Archive window widened",
    when: "5 minutes ago",
    body: "Retention on preview deployments increased from 30 → 45 days."
  },
  {
    title: "Integrity checks completed",
    when: "1 hour ago",
    body: "412GB of production logs verified with SHA-512 and stored in dual region."
  },
  {
    title: "Restore rehearsal finished",
    when: "Yesterday",
    body: "Cold archive reheated into `main` project for quarterly DR test."
  }
];

const coverage = [
  { label: "Vercel projects connected", value: "24" },
  { label: "Assets under policy", value: "3.9 TB" },
  { label: "Automations live", value: "12" }
];

const storageOptions = [
  {
    name: "Vercel Blob",
    summary: "Edge-first object storage for uploads, builds, and evidence bundles.",
    docs: "https://vercel.com/docs/storage/vercel-blob",
    extras: ["@vercel/blob", "put/list", "Access control & cache headers"]
  },
  {
    name: "Vercel KV (Redis)",
    summary: "Redis-backed KV for sessions, rate limits, and metadata on archives.",
    docs: "https://vercel.com/docs/storage/vercel-kv",
    extras: ["@vercel/kv", "get/set/ttl", "Dashboard-issued tokens"]
  },
  {
    name: "Vercel Postgres",
    summary: "Serverless Postgres (Neon) for durable audit trails and reports.",
    docs: "https://vercel.com/docs/storage/vercel-postgres",
    extras: ["@vercel/postgres", "SQL + pooling", "Region-aware"]
  },
  {
    name: "Edge Config",
    summary: "Globally replicated config for feature flags and storage routing.",
    docs: "https://vercel.com/docs/storage/edge-config",
    extras: ["@vercel/edge-config", "get(key)", "<15ms edge reads"]
  }
];

export default function Home() {
  return (
    <main>
      <div className="page">
        <section className="hero">
          <div>
            <span className="hero__meta">Stash now, fetch later • Vercel friendly</span>
            <h1 className="hero__title">
              Keep the drops you care about, without the enterprise suit.
            </h1>
            <p className="hero__lead">
              Upload files you want to keep handy. On Vercel we drop them into Blob; locally we stash
              them in <code>archives/</code>. No fancy ops—just a quick vault for your bits.
            </p>
            <div className="hero__actions">
              <button className="btn btn--primary">
                Open stash console
                <span className="btn__badge">ready</span>
              </button>
              <button className="btn btn--ghost">
                View Vercel storage
                <span className="btn__badge">blob</span>
              </button>
            </div>
            <div className="stack" style={{ marginTop: "18px" }}>
              <span className="pill pill--accent">Blob on Vercel</span>
              <span className="pill pill--warm">Local stash in dev</span>
              <span className="pill">Quick restores</span>
            </div>
          </div>

          <aside className="hero__aside">
            <div className="panel">
              <div className="panel__title">
                <span className="pill pill--accent">Live</span>
                Archive health
              </div>
              <p className="panel__meta">
                Current posture across connected Vercel projects.
              </p>
              <div className="list">
                {coverage.map((item) => (
                  <div className="list__item" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel__title">
                <span className="pill">Recent checks</span>
              </div>
              <div className="timeline">
                {actions.slice(0, 2).map((action) => (
                  <div className="timeline__entry" key={action.title}>
                    <strong>{action.title}</strong>
                    <p className="panel__meta">
                      {action.body} • {action.when}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="section">
          <div className="section__header">
            <div>
              <p className="section__title">Archive control lanes</p>
              <p className="muted">
                Mix lifecycle policies, compliance snapshots, and restores tailored
                for Vercel pipelines.
              </p>
            </div>
            <a className="pill pill--accent" href="#">
              Configure policy
            </a>
          </div>

          <div className="grid grid--three">
            {policies.map((policy) => (
              <div className="card card--glow" key={policy.name}>
                <div className="stack" style={{ marginBottom: "10px" }}>
                  <span className="badge">{policy.badge}</span>
                  <span className="muted">{policy.meta}</span>
                </div>
                <h3 className="card__title">{policy.name}</h3>
                <p className="card__meta">{policy.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__header">
            <div>
              <p className="section__title">Archive streams</p>
              <p className="muted">Everything tracked, hashed, and ready to restore.</p>
            </div>
            <div className="pill pill--warm">Integrity verified</div>
          </div>

          <div className="grid grid--two">
            {archiveStreams.map((stream) => {
              const statusClass =
                stream.status.toLowerCase().includes("update") || stream.status.toLowerCase().includes("warning")
                  ? "status status--warning"
                  : "status";

              return (
                <div className="card" key={stream.name}>
                  <div className="stack" style={{ marginBottom: "8px" }}>
                    <span className={statusClass}>{stream.status}</span>
                    <span className="badge">{stream.size}</span>
                  </div>
                  <h3 className="card__title">{stream.name}</h3>
                  <p className="card__meta">Retained until {stream.retainedUntil}</p>
                  <div className="stack">
                    {stream.tags.map((tag) => (
                      <span className="pill" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="section">
          <div className="section__header">
            <div>
              <p className="section__title">Activity & rehearsals</p>
              <p className="muted">
                Timelines stay attached to each Vercel project so compliance is easy.
              </p>
            </div>
            <a className="pill pill--accent" href="#">
              Export evidence
            </a>
          </div>

          <div className="card">
            <div className="timeline">
              {actions.map((action) => (
                <div className="timeline__entry" key={action.title}>
                  <strong>{action.title}</strong>
                  <p className="muted">
                    {action.body} • {action.when}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="card">
            <div className="section__header" style={{ marginBottom: "12px" }}>
              <div>
                <p className="section__title">Integrations & proof</p>
                <p className="muted">
                  Ship with confidence: Vercel deploy hooks, checksum trails, region
                  pinning, and granular restores.
                </p>
              </div>
              <div className="pill pill--warm">Vercel ready</div>
            </div>
            <div className="grid grid--two">
              <div>
                <div className="stack" style={{ marginBottom: "12px" }}>
                  <span className="pill">Deploy hook aware</span>
                  <span className="pill">Branch aware restores</span>
                </div>
                <p className="muted">
                  Archives subscribe to deployments, builds, logs, and assets through
                  deploy hooks so nothing slips past retention. Cold storage lanes
                  automatically thaw on redeploy for a specific branch or tag.
                </p>
              </div>
              <div>
                <div className="stack" style={{ marginBottom: "12px" }}>
                  <span className="pill pill--accent">Checksummed</span>
                  <span className="pill pill--warm">Region pinned</span>
                </div>
                <p className="muted">
                  Every artifact ships with SHA-512 evidence and dual-region copies for
                  resilience. Export the ledger when audits or handoffs are needed.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section__header">
            <div>
              <p className="section__title">Vercel storage lanes</p>
              <p className="muted">
                Choose the storage rail per workload: uploads to Blob, metadata to KV,
                evidence in Postgres, and instant flags via Edge Config.
              </p>
            </div>
            <div className="pill pill--accent">Docs & SDKs</div>
          </div>
          <div className="grid grid--two">
            {storageOptions.map((option) => (
              <div className="card" key={option.name}>
                <div className="stack" style={{ marginBottom: "8px" }}>
                  {option.extras.map((tag) => (
                    <span className="pill" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="card__title">{option.name}</h3>
                <p className="card__meta">{option.summary}</p>
                <a className="btn btn--ghost" href={option.docs} target="_blank" rel="noreferrer">
                  View docs
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <ArchiveUploader />
        </section>

        <footer className="footer">
          <div>
            <strong>Archive, rehearse, restore.</strong>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Pair this site with the upcoming Vercel documentation to keep teams
              shipping while archives stay compliant.
            </p>
          </div>
          <div className="stack">
            <a className="pill" href="#">
              Get notified
            </a>
            <a className="pill pill--accent" href="#">
              Connect Vercel org
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
