import FileComments from "../../components/FileComments";
import { headers } from "next/headers";

type Upload = {
  name: string;
  url: string;
  size: number | null;
  uploadedAt: string | null;
  contentType: string | null;
  kind?: "regular" | "chunked";
  downloadUrl?: string;
  fileId?: string;
};

type PreviewKind = "image" | "video" | "audio" | "pdf" | "text" | "none";

async function fetchFile(name: string): Promise<Upload | null> {
  const host = headers().get("host");
  const protocol = host && host.startsWith("localhost") ? "http" : "https";
  const base =
    (host ? `${protocol}://${host}` : null) ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const res = await fetch(`${base}/api/archive?name=${encodeURIComponent(name)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const body = await res.json();
  const file = (body.files as Upload[] | undefined)?.[0];
  return file ?? null;
}

function detectPreviewKind(file: Upload): PreviewKind {
  if (file.kind === "chunked") return "none";
  const ct = file.contentType?.toLowerCase() || "";
  const name = file.name.toLowerCase();
  if (ct.startsWith("image/")) return "image";
  if (ct.startsWith("video/")) return "video";
  if (ct.startsWith("audio/")) return "audio";
  if (ct === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    ct.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".log") ||
    name.endsWith(".md") ||
    name.endsWith(".json")
  ) {
    return "text";
  }
  return "none";
}

async function maybeLoadText(url: string, file: Upload): Promise<string | null> {
  const maxBytes = 150_000; // ~150 KB for inline preview to avoid huge loads
  if (file.size && file.size > maxBytes) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
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

  const previewKind = detectPreviewKind(file);
  const textContent = previewKind === "text" ? await maybeLoadText(file.url, file) : null;
  const storageKey = `comments:${file.name}`;
  const downloadHref = file.kind === "chunked" && file.downloadUrl ? file.downloadUrl : file.url;

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
                  {file.kind === "chunked" ? " • chunked upload" : ""}
                </p>
              </div>
              <a className="btn btn--ghost" href={downloadHref} target="_blank" rel="noreferrer">
                Open original
              </a>
            </div>

            {previewKind === "image" && (
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
            {previewKind === "video" && (
              <div style={{ marginBottom: "12px" }}>
                <video
                  controls
                  src={file.url}
                  style={{ width: "100%", borderRadius: "12px", border: "1px solid var(--border)" }}
                />
              </div>
            )}
            {previewKind === "audio" && (
              <div style={{ marginBottom: "12px" }}>
                <audio controls src={file.url} style={{ width: "100%" }} />
              </div>
            )}
            {previewKind === "pdf" && (
              <div
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  marginBottom: "12px",
                  background: "rgba(255,255,255,0.02)"
                }}
              >
                <object data={file.url} type="application/pdf" width="100%" height="480">
                  <a className="btn btn--ghost" href={file.url} target="_blank" rel="noreferrer">
                    Open PDF
                  </a>
                </object>
              </div>
            )}
            {previewKind === "text" && (
              <div
                className="card"
                style={{
                  background: "var(--panel-2)",
                  border: "1px solid var(--border)",
                  marginBottom: "12px",
                  overflow: "auto"
                }}
              >
                <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontFamily: "monospace", color: "var(--text)" }}>
                  {textContent ?? "Preview unavailable (file too large or blocked)."}
                </pre>
              </div>
            )}

            <div className="stack" style={{ marginTop: "10px" }}>
              <code style={{ background: "rgba(255,255,255,0.04)", padding: "8px", borderRadius: "10px" }}>
                {downloadHref}
              </code>
              <a className="btn btn--primary" href={downloadHref} target="_blank" rel="noreferrer">
                View / download
              </a>
            </div>
            {file.uploadedAt && <p className="muted">Uploaded: {new Date(file.uploadedAt).toLocaleString()}</p>}
            {file.kind === "chunked" && (
              <p className="muted">This file is chunked; download streams and stitches automatically.</p>
            )}
          </div>
        </section>

        <section className="section">
          <FileComments storageKey={storageKey} />
        </section>
      </div>
    </main>
  );
}
