import ArchiveUploader from "./components/ArchiveUploader";
import UploadsList from "./components/UploadsList";

const policies = [
  {
    name: "Blob share links",
    detail: "Uploads become public URLs on Vercel Blob. Drop, copy, share.",
    badge: "Public",
    meta: "Fast edge delivery"
  },
  {
    name: "Dev fallback",
    detail: "No Blob token locally? Files stash into ./archives for testing.",
    badge: "Local",
    meta: "Safe in dev"
  },
  {
    name: "Copy-friendly",
    detail: "Instantly copy the returned link to send anywhere.",
    badge: "Simple",
    meta: "No-frills UX"
  }
];

export default function Home() {
  return (
    <main>
      <div className="page">
        <section className="hero">
          <div>
            <span className="hero__meta">Upload once, share anywhere • Vercel friendly</span>
            <h1 className="hero__title">Upload a file and share it with the world in one go.</h1>
            <p className="hero__lead">
              Push anything—images, logs, zips—and get back a public link. Hosted on Vercel Blob in
              prod; saved locally in dev.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#uploader">
                Start sharing
                <span className="btn__badge">public</span>
              </a>
              <a
                className="btn btn--ghost"
                href="https://vercel.com/docs/storage/vercel-blob"
                target="_blank"
                rel="noreferrer"
              >
                See Blob docs
                <span className="btn__badge">blob</span>
              </a>
            </div>
            <div className="stack" style={{ marginTop: "18px" }}>
              <span className="pill pill--accent">Blob on Vercel</span>
              <span className="pill pill--warm">Local stash in dev</span>
              <span className="pill">Copy links fast</span>
            </div>
          </div>

          <aside className="hero__aside">
            <div className="panel">
              <div className="panel__title">
                <span className="pill pill--accent">How it works</span>
                Public links
              </div>
              <p className="panel__meta">
                Deploy on Vercel and set <code>BLOB_READ_WRITE_TOKEN</code>. Uploads drop into Blob and
                return a URL you can share.
              </p>
            </div>
            <div className="panel">
              <div className="panel__title">
                <span className="pill">Dev mode</span>
                Local stash
              </div>
              <p className="panel__meta">
                Running locally? Files save to <code>archives/</code> so you can test without cloud
                creds.
              </p>
            </div>
          </aside>
        </section>

        <section className="section" id="uploader">
          <ArchiveUploader />
        </section>

        <section className="section" id="uploads-list">
          <UploadsList />
        </section>


        <section className="section">
          <div className="section__header">
            <div>
              <p className="section__title">Why this works</p>
              <p className="muted">Blob in prod for public links, local fallback for tinkering.</p>
            </div>
            <div className="pill pill--accent">No frills</div>
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

        <footer className="footer">
          <div>
            <strong>Upload. Copy. Share.</strong>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Vercel Blob in production, local stash in dev. No extra ceremony.
            </p>
          </div>
          <div className="stack">
            <a className="pill" href="https://vercel.com/docs/storage/vercel-blob" target="_blank" rel="noreferrer">
              Blob docs
            </a>
            <a className="pill pill--accent" href="#uploader">
              Start uploading
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
