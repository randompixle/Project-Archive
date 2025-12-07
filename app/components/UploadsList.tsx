"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Upload = {
  name: string;
  url: string;
  size: number | null;
  uploadedAt: string | null;
  contentType: string | null;
};

export default function UploadsList() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/archive");
        const body = await res.json();
        if (!res.ok) {
          throw new Error(body.error || "Unable to load uploads");
        }
        setUploads(body.files || []);
        setSource(body.source || "");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load uploads");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped = useMemo(() => uploads, [uploads]);

  const formatSize = (bytes: number | null) => {
    if (bytes === null || bytes === undefined) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  const iconFor = (item: Upload) => {
    const name = item.name.toLowerCase();
    if (name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return "🖼️";
    if (name.match(/\.(zip|tar|gz|rar)$/)) return "🗂️";
    if (name.match(/\.(txt|log|md)$/)) return "📄";
    if (name.match(/\.(mp4|mov|webm)$/)) return "🎞️";
    return "📁";
  };

  if (loading) {
    return (
      <div className="card">
        <p className="muted">Loading uploads…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p className="muted">Could not load uploads: {error}</p>
      </div>
    );
  }

  if (!grouped.length) {
    return (
      <div className="card">
        <p className="muted">No uploads yet. Drop a file to see it here.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="section__header">
        <div>
          <p className="section__title">Recent uploads</p>
          <p className="muted">
            {source === "vercel-blob"
              ? "Listed from Vercel Blob."
              : source === "local"
              ? "Listed from local archives/ (dev)."
              : "Uploads found."}
          </p>
        </div>
        <span className="pill">{source || "uploads"}</span>
      </div>

      <div className="grid grid--two">
        {grouped.map((item) => (
          <div className="card" key={item.url} style={{ background: "var(--panel-2)" }}>
            <div className="stack" style={{ alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "22px" }}>{iconFor(item)}</span>
              <strong>
                <Link href={`/files/${encodeURIComponent(item.name)}`}>{item.name}</Link>
              </strong>
              <span className="muted">{formatSize(item.size)}</span>
            </div>
            {item.contentType?.startsWith("image/") && (
              <div
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  marginBottom: "10px"
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.name}
                  style={{ width: "100%", display: "block", maxHeight: "220px", objectFit: "cover" }}
                />
              </div>
            )}
            <div className="stack">
              <code style={{ background: "rgba(255,255,255,0.04)", padding: "6px", borderRadius: "8px" }}>
                {item.url}
              </code>
              <Link className="btn btn--ghost" href={`/files/${encodeURIComponent(item.name)}`}>
                Open details
              </Link>
            </div>
            {item.uploadedAt && <p className="muted">Uploaded: {new Date(item.uploadedAt).toLocaleString()}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
