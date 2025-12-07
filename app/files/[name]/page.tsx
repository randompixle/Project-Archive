import FileComments from "../../components/FileComments";

type Upload = {
  name: string;
  url: string;
  size: number | null;
  uploadedAt: string | null;
  contentType: string | null;
};

async function fetchFile(name: string): Promise<Upload | null> {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const res = await fetch(`${base}/api/archive?name=${encodeURIComponent(name)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const body = await res.json();
  const file = (body.files as Upload[] | undefined)?.[0];
  return file ?? null;
}

export default async function FilePage({ params }: { params: { name: string } }) {
  const decodedName = decodeURIComponent(params.name);
  const file = await fetchFile(decodedName);

  if (!file) {
    return (
      <main>
        <div className="page">
          <div className="card">
            <p className="section__title">File not found</p>
            <p className="muted">We couldn&apos;t find that upload. It may have been removed.</p>
          </div>
        </div>
      </main>
    );
  }

  const isImage = file.contentType?.startsWith("image/");
  const storageKey = `comments:${file.name}`;

  return (
    <main>
      <div className="page">
        <section className="section">
          <div className="card">
            <div className="section__header">
              <div>
                <p className="section__title">{file.name}</p>
                <p className="muted">
                  {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "Size unknown"} •{" "}
                  {file.contentType ?? "unknown type"}
                </p>
              </div>
              <a className="btn btn--ghost" href={file.url} target="_blank" rel="noreferrer">
                Open original
              </a>
            </div>

            {isImage && (
              <div
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  marginBottom: "12px"
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.url}
                  alt={file.name}
                  style={{ width: "100%", maxHeight: "420px", objectFit: "contain", display: "block" }}
                />
              </div>
            )}

            <div className="stack" style={{ marginTop: "10px" }}>
              <code style={{ background: "rgba(255,255,255,0.04)", padding: "8px", borderRadius: "10px" }}>
                {file.url}
              </code>
              <a className="btn btn--primary" href={file.url} target="_blank" rel="noreferrer">
                View / download
              </a>
            </div>
            {file.uploadedAt && <p className="muted">Uploaded: {new Date(file.uploadedAt).toLocaleString()}</p>}
          </div>
        </section>

        <section className="section">
          <FileComments storageKey={storageKey} />
        </section>
      </div>
    </main>
  );
}
